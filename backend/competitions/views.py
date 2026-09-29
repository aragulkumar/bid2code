import random
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Max, Min, Sum, F, Q
from django.contrib.auth.models import User
from rest_framework import status, views, viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Participant, Algorithm, Auction, Bid,
    ParticipantAlgorithm, Problem, ParticipantProblem, Submission
)
from .serializers import (
    RegisterSerializer, ParticipantSerializer, AlgorithmSerializer,
    AuctionSerializer, BidSerializer, ProblemPublicSerializer,
    ProblemAdminSerializer, SubmissionSerializer, LeaderboardEntrySerializer
)
from judge_service.judge0_client import Judge0Client
from django.conf import settings

# ==========================================
# Authentication & Profile Views
# ==========================================

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            participant = serializer.save()
            refresh = RefreshToken.for_user(participant.user)
            return Response({
                "message": "Registration successful! 1000 auction points credited.",
                "participant": ParticipantSerializer(participant).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FirebaseSyncLoginView(views.APIView):
    """
    Seamlessly synchronizes a Firebase participant into the Django PostgreSQL database
    and issues an active JWT access & refresh token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        name = request.data.get('name', '') or request.data.get('full_name', '') or username
        phone = request.data.get('phone', '')
        college = request.data.get('college', '')
        department = request.data.get('department', '')
        year_of_study = request.data.get('year_of_study', '')
        anonymous_label = request.data.get('anonymous_label', '')

        if not username and not email:
            return Response({"error": "Username or email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Check if this is the Admin / Staff user
        if username.lower() == 'admin' or email.lower() == 'admin@bit2code.ieee.org':
            admin_user = User.objects.filter(username__iexact='admin').first()
            if not admin_user:
                admin_user = User.objects.create_superuser('admin', 'admin@bit2code.ieee.org', password or 'admin123')
            refresh = RefreshToken.for_user(admin_user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_staff": True,
                "username": "admin",
                "participant": None
            }, status=status.HTTP_200_OK)

        # 2. Find existing user by username or email
        user = None
        if username:
            user = User.objects.filter(username__iexact=username).first()
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        if not user:
            final_username = username or email.split('@')[0]
            base_username = final_username
            counter = 1
            while User.objects.filter(username__iexact=final_username).exists():
                final_username = f"{base_username}_{counter}"
                counter += 1

            user = User.objects.create_user(
                username=final_username,
                email=email,
                password=password if password else 'bit2code2026'
            )
        else:
            if password:
                user.set_password(password)
                user.save()

        # If this existing user is staff, do NOT create a participant
        if user.is_staff or user.is_superuser:
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_staff": True,
                "username": user.username,
                "participant": None
            }, status=status.HTTP_200_OK)

        # 3. Ensure Participant profile exists
        try:
            participant = user.participant_profile
        except (Participant.DoesNotExist, Exception):
            participant = None

        if not participant:
            # Check if requested anonymous_label is already taken by ANOTHER user
            label = anonymous_label
            if not label or Participant.objects.filter(anonymous_label=label).exists():
                # Find the next truly available label
                idx = 1
                while Participant.objects.filter(anonymous_label=f"P{idx:02d}").exists():
                    idx += 1
                label = f"P{idx:02d}"

            participant = Participant.objects.create(
                user=user,
                anonymous_label=label,
                name=name or user.username,
                email=email or user.email,
                phone=phone or '',
                college=college or '',
                department=department or '',
                year_of_study=year_of_study or '',
                balance=getattr(settings, 'STARTING_POINTS', 1000)
            )
        else:
            # Update existing participant info if new details are provided
            updated_fields = []
            if name and participant.name != name:
                participant.name = name
                updated_fields.append('name')
            if email and participant.email != email:
                participant.email = email
                updated_fields.append('email')
            if phone and participant.phone != phone:
                participant.phone = phone
                updated_fields.append('phone')
            if college and participant.college != college:
                participant.college = college
                updated_fields.append('college')
            if department and participant.department != department:
                participant.department = department
                updated_fields.append('department')
            if year_of_study and participant.year_of_study != year_of_study:
                participant.year_of_study = year_of_study
                updated_fields.append('year_of_study')
            if updated_fields:
                participant.save(update_fields=updated_fields)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "participant": ParticipantSerializer(participant).data
        }, status=status.HTTP_200_OK)


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            participant = request.user.participant_profile
            data = ParticipantSerializer(participant).data
            return Response(data)
        except Participant.DoesNotExist:
            return Response({
                "username": request.user.username,
                "is_staff": request.user.is_staff,
                "is_admin": request.user.is_superuser,
                "message": "Staff / Non-participant account"
            })


# ==========================================
# Algorithm & Auction Views
# ==========================================

class AlgorithmListView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        algorithms = Algorithm.objects.filter(is_active=True).order_by('order', 'id')
        serializer = AlgorithmSerializer(algorithms, many=True)
        return Response(serializer.data)


class ActiveAuctionView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Auto-check if active auction has expired and should be finalized
        active_auction = Auction.objects.filter(status='ACTIVE').order_by('-start_time').first()
        if active_auction:
            if active_auction.is_expired:
                # Close auction automatically if expired
                self._auto_close_auction(active_auction)
                # Re-fetch latest
                active_auction = Auction.objects.filter(id=active_auction.id).first()

        if not active_auction:
            # Get latest completed or pending auction
            active_auction = Auction.objects.all().order_by('-id').first()

        if not active_auction:
            return Response({"status": "NO_AUCTION", "message": "No auction currently scheduled."}, status=200)

        serializer = AuctionSerializer(active_auction)
        return Response(serializer.data)

    def _auto_close_auction(self, auction):
        with transaction.atomic():
            auction = Auction.objects.select_for_update().get(id=auction.id)
            if auction.status != 'ACTIVE':
                return
            
            auction.status = 'COMPLETED'
            # Find highest valid bid
            highest_bid = auction.bids.select_related('participant').order_by('-amount', 'created_at').first()
            if highest_bid:
                participant = highest_bid.participant
                # Verify participant does not already have an algorithm
                if not participant.has_algorithm and participant.balance >= highest_bid.amount:
                    highest_bid.is_winning = True
                    highest_bid.save(update_fields=['is_winning'])
                    
                    auction.winning_bid = highest_bid.amount
                    auction.winning_participant = participant
                    
                    # Deduct winning bid from balance
                    participant.balance -= highest_bid.amount
                    participant.algorithm_assigned = auction.algorithm
                    participant.save(update_fields=['balance', 'algorithm_assigned'])
                    
                    # Record assignment
                    ParticipantAlgorithm.objects.create(
                        participant=participant,
                        algorithm=auction.algorithm,
                        assignment_type='BID',
                        winning_bid=highest_bid.amount
                    )
                    
                    # Increment algorithm assigned slots
                    algo = auction.algorithm
                    algo.assigned_slots = F('assigned_slots') + 1
                    algo.save(update_fields=['assigned_slots'])

            auction.save()


class PlaceBidView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            participant = request.user.participant_profile
        except Participant.DoesNotExist:
            return Response({"error": "Only registered participants can place bids."}, status=status.HTTP_403_FORBIDDEN)

        auction_id = request.data.get('auction_id')
        try:
            amount = int(request.data.get('amount', 0))
        except (ValueError, TypeError):
            return Response({"error": "Invalid bid amount."}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({"error": "Bid amount must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                auction = Auction.objects.select_for_update().get(id=auction_id)
            except Auction.DoesNotExist:
                return Response({"error": "Auction not found."}, status=status.HTTP_404_NOT_FOUND)

            # 1. Auction must be active
            if auction.status != 'ACTIVE':
                return Response({"error": "Auction is not active."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Check if expired
            if auction.is_expired:
                auction.status = 'COMPLETED'
                auction.save()
                return Response({"error": "Auction time has expired."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Participant must not already have won an algorithm
            participant = Participant.objects.select_for_update().get(id=participant.id)
            if participant.has_algorithm:
                return Response({"error": "You have already secured an algorithm and are locked from bidding."}, status=status.HTTP_400_BAD_REQUEST)

            # 4. Participant must have enough points
            if participant.balance < amount:
                return Response({"error": f"Insufficient points. Your current balance is {participant.balance}."}, status=status.HTTP_400_BAD_REQUEST)

            # 5. Bid must be strictly greater than current highest bid
            if amount <= auction.current_highest_bid:
                return Response({"error": f"Bid must be strictly higher than current highest bid ({auction.current_highest_bid} pts)."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the valid bid
            bid = Bid.objects.create(
                auction=auction,
                participant=participant,
                amount=amount
            )

            # Update auction highest bid
            auction.current_highest_bid = amount
            auction.save(update_fields=['current_highest_bid'])

            return Response({
                "message": f"Bid of {amount} points placed successfully!",
                "bid": BidSerializer(bid).data,
                "current_highest_bid": amount
            }, status=status.HTTP_201_CREATED)


# ==========================================
# Coding Session & Problem Assignment
# ==========================================

class StartCodingSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            participant = request.user.participant_profile
        except Participant.DoesNotExist:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if not participant.has_algorithm:
            return Response({"error": "You cannot start coding until an algorithm is assigned."}, status=status.HTTP_400_BAD_REQUEST)

        if participant.coding_started_at:
            return Response({
                "message": "Coding session already in progress.",
                "coding_started_at": participant.coding_started_at,
                "coding_deadline": participant.coding_deadline,
                "remaining_seconds": participant.remaining_coding_seconds
            })

        duration = getattr(settings, 'CODING_DURATION_MINUTES', 40)
        success, msg = participant.start_coding_session(duration_minutes=duration)
        if not success:
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

        # Assign the 2 problems (1 Medium matching algorithm + 1 Random Easy)
        self._ensure_assigned_problems(participant)

        return Response({
            "message": "Coding timer started! You have 40 minutes.",
            "coding_started_at": participant.coding_started_at,
            "coding_deadline": participant.coding_deadline,
            "remaining_seconds": participant.remaining_coding_seconds
        })

    def _ensure_assigned_problems(self, participant):
        if ParticipantProblem.objects.filter(participant=participant).count() >= 2:
            return

        assigned_algo = participant.algorithm_assigned
        # 1. Medium problem matching algorithm
        medium_prob = Problem.objects.filter(
            algorithm=assigned_algo, difficulty='MEDIUM', is_active=True
        ).order_by('?').first()

        # Fallback to any Medium problem if none tied to algorithm
        if not medium_prob:
            medium_prob = Problem.objects.filter(difficulty='MEDIUM', is_active=True).order_by('?').first()

        # 2. Easy problem randomly from Easy bank
        easy_prob = Problem.objects.filter(
            difficulty='EASY', is_active=True
        ).order_by('?').first()

        if medium_prob and not ParticipantProblem.objects.filter(participant=participant, problem=medium_prob).exists():
            ParticipantProblem.objects.create(participant=participant, problem=medium_prob)

        if easy_prob and not ParticipantProblem.objects.filter(participant=participant, problem=easy_prob).exists():
            ParticipantProblem.objects.create(participant=participant, problem=easy_prob)


class AssignedProblemsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            participant = request.user.participant_profile
        except Participant.DoesNotExist:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if not participant.has_algorithm:
            return Response({"error": "No algorithm assigned yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure problems are assigned if coding started
        if participant.coding_started_at:
            StartCodingSessionView()._ensure_assigned_problems(participant)

        assigned_links = ParticipantProblem.objects.filter(participant=participant).select_related('problem', 'problem__algorithm')
        problems = [link.problem for link in assigned_links]
        
        # Sort so Medium is first, then Easy
        problems.sort(key=lambda p: 0 if p.difficulty == 'MEDIUM' else 1)

        serializer = ProblemPublicSerializer(problems, many=True)
        return Response({
            "participant": ParticipantSerializer(participant).data,
            "problems": serializer.data,
            "remaining_coding_seconds": participant.remaining_coding_seconds,
            "is_coding": participant.is_coding,
            "is_coding_finished": participant.is_coding_finished
        })


# ==========================================
# Code Submissions & Judging
# ==========================================

class SubmitCodeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            participant = request.user.participant_profile
        except Participant.DoesNotExist:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check deadline
        if not participant.coding_started_at:
            return Response({"error": "You must start your coding session before submitting code."}, status=status.HTTP_400_BAD_REQUEST)

        if participant.is_coding_finished:
            return Response({"error": "Coding session deadline has expired. Submissions are closed."}, status=status.HTTP_400_BAD_REQUEST)

        problem_id = request.data.get('problem_id')
        language = request.data.get('language', 'python').lower()
        source_code = request.data.get('source_code', '')

        if not source_code or not source_code.strip():
            return Response({"error": "Source code cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        if language not in ('python', 'cpp', 'java'):
            return Response({"error": "Language must be python, cpp, or java."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return Response({"error": "Problem not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure participant is assigned this problem
        if not ParticipantProblem.objects.filter(participant=participant, problem=problem).exists():
            return Response({"error": "This problem is not assigned to your session."}, status=status.HTTP_403_FORBIDDEN)

        # Combine sample + hidden test cases for final judging
        all_test_cases = []
        if problem.sample_test_cases:
            all_test_cases.extend(problem.sample_test_cases)
        if problem.hidden_test_cases:
            all_test_cases.extend(problem.hidden_test_cases)

        # Evaluate code using Judge0 / Sandbox
        judge_client = Judge0Client()
        eval_result = judge_client.evaluate_submission(
            language=language,
            source_code=source_code,
            test_cases=all_test_cases,
            time_limit=problem.time_limit,
            memory_limit=problem.memory_limit
        )

        submission = Submission.objects.create(
            participant=participant,
            problem=problem,
            language=language,
            source_code=source_code,
            status=eval_result.get('status', 'ACCEPTED'),
            score=eval_result.get('score', 0),
            passed_test_cases=eval_result.get('passed_test_cases', 0),
            total_test_cases=eval_result.get('total_test_cases', 0),
            execution_time=eval_result.get('execution_time', 0.0),
            memory_used=eval_result.get('memory_used', 0),
            stdout=eval_result.get('stdout', ''),
            stderr=eval_result.get('stderr', ''),
            compile_output=eval_result.get('compile_output', ''),
        )

        return Response({
            "message": "Submission evaluated successfully!",
            "submission": SubmissionSerializer(submission).data
        }, status=status.HTTP_201_CREATED)


class RunSampleCodeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            participant = request.user.participant_profile
        except Participant.DoesNotExist:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if participant.is_coding_finished:
            return Response({"error": "Coding session deadline has expired."}, status=status.HTTP_400_BAD_REQUEST)

        problem_id = request.data.get('problem_id')
        language = request.data.get('language', 'python').lower()
        source_code = request.data.get('source_code', '')
        custom_input = request.data.get('custom_input', None)

        if not source_code or not source_code.strip():
            return Response({"error": "Source code cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return Response({"error": "Problem not found."}, status=status.HTTP_404_NOT_FOUND)

        if custom_input is not None:
            test_cases = [{"input": custom_input, "output": ""}]
        else:
            test_cases = problem.sample_test_cases or []

        judge_client = Judge0Client()
        eval_result = judge_client.evaluate_submission(
            language=language,
            source_code=source_code,
            test_cases=test_cases,
            time_limit=problem.time_limit,
            memory_limit=problem.memory_limit
        )

        return Response({
            "verdict": eval_result.get('status'),
            "passed": eval_result.get('passed_test_cases'),
            "total": eval_result.get('total_test_cases'),
            "execution_time": eval_result.get('execution_time'),
            "stdout": eval_result.get('stdout'),
            "stderr": eval_result.get('stderr'),
            "compile_output": eval_result.get('compile_output'),
        })


class SubmissionHistoryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            participant = request.user.participant_profile
            submissions = Submission.objects.filter(participant=participant).order_by('-submitted_at')
            serializer = SubmissionSerializer(submissions, many=True)
            return Response(serializer.data)
        except Participant.DoesNotExist:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# Leaderboard View
# ==========================================

class LeaderboardView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        participants = Participant.objects.filter(is_active_participant=True).select_related(
            'algorithm_assigned', 'algorithm_assignment'
        )
        
        entries = []
        for p in participants:
            # Best score for Medium problem (0-100)
            medium_sub = Submission.objects.filter(
                participant=p, problem__difficulty='MEDIUM'
            ).order_by('-score', 'execution_time').first()
            medium_score = medium_sub.score if medium_sub else 0

            # Best score for Easy problem (0-100)
            easy_sub = Submission.objects.filter(
                participant=p, problem__difficulty='EASY'
            ).order_by('-score', 'execution_time').first()
            easy_score = easy_sub.score if easy_sub else 0

            coding_score = medium_score + easy_score

            # Check if participant won via auction or was assigned randomly
            assignment = getattr(p, 'algorithm_assignment', None)
            if assignment:
                assignment_type = assignment.assignment_type
            elif p.algorithm_assigned:
                assignment_type = 'BID'
            else:
                assignment_type = 'PENDING'

            # Event Rule: Remaining bidding points go as bonus ONLY if secured via auction bid!
            # Scale: 1000 bid points → max 10 bonus points. Formula: (balance / 1000) * 10
            # e.g. 500 remaining → 5 bonus, 1000 remaining → 10 bonus, 249 remaining → 2.49 bonus
            # Max total score = 200 (coding) + 10 (bonus) = 210
            if assignment_type == 'BID' and p.algorithm_assigned:
                bid_bonus = round((p.balance / 1000) * 10, 2)
            else:
                bid_bonus = 0

            total_score = round(coding_score + bid_bonus, 2)

            # Compute total execution time for best submissions
            total_exec_time = 0.0
            if medium_sub:
                total_exec_time += medium_sub.execution_time
            if easy_sub:
                total_exec_time += easy_sub.execution_time

            # Last accepted submission timestamp
            last_accepted = Submission.objects.filter(
                participant=p, status='ACCEPTED'
            ).order_by('-submitted_at').first()
            last_accepted_at = last_accepted.submitted_at if last_accepted else None

            # Total submissions made (all statuses) — fewer = cleaner solving
            total_submissions = Submission.objects.filter(participant=p).count()

            entries.append({
                'participant_label': p.anonymous_label,
                'participant_name': p.name,
                'college': p.college or 'IEEE CS Member',
                'algorithm_name': p.algorithm_assigned.name if p.algorithm_assigned else 'Pending',
                'assignment_type': assignment_type,
                'medium_score': medium_score,
                'easy_score': easy_score,
                'coding_score': coding_score,
                'bid_bonus': bid_bonus,
                'total_score': total_score,
                'total_execution_time': round(total_exec_time, 3),
                'submission_count': total_submissions,
                'last_accepted_submission_at': last_accepted_at,
            })

        # Ranking Rules:
        # Rank 1 — Total Score (desc): Medium + Easy + Bid Bonus
        # Rank 2 — Coding Completion Time (asc): shorter exec time wins
        #           (only applies if coding_score > 0 — prevents 0-code getting 0s advantage)
        # Rank 3 — Number of Submissions (asc): fewer submissions = cleaner solving
        # Rank 4 — Server-recorded completion timestamp (asc): earlier finish wins
        entries.sort(
            key=lambda x: (
                -x['total_score'],
                x['total_execution_time'] if x['coding_score'] > 0 else 9999999999.0,
                x['submission_count'] if x['coding_score'] > 0 else 9999999,
                x['last_accepted_submission_at'].timestamp() if x['last_accepted_submission_at'] else 9999999999.0,
                x['participant_label']
            )
        )

        # Assign ranks
        for idx, item in enumerate(entries, start=1):
            item['rank'] = idx

        serializer = LeaderboardEntrySerializer(entries, many=True)
        return Response(serializer.data)


# ==========================================
# Admin Control Panel Views
# ==========================================

class AdminOverviewView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_participants = Participant.objects.count()
        assigned_count = Participant.objects.filter(algorithm_assigned__isnull=False).count()
        waiting_count = Participant.objects.filter(algorithm_assigned__isnull=True).count()
        coding_count = Participant.objects.filter(coding_started_at__isnull=False, coding_deadline__gt=timezone.now()).count()
        total_submissions = Submission.objects.count()
        active_auction = Auction.objects.filter(status='ACTIVE').first()

        return Response({
            "total_participants": total_participants,
            "assigned_participants": assigned_count,
            "waiting_participants": waiting_count,
            "coding_participants": coding_count,
            "total_submissions": total_submissions,
            "current_auction": AuctionSerializer(active_auction).data if active_auction else None
        })


class AdminStartAuctionView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        algorithm_id = request.data.get('algorithm_id')
        duration_seconds = int(request.data.get('duration_seconds', 45))

        with transaction.atomic():
            # Close any currently active auctions
            active_auctions = Auction.objects.filter(status='ACTIVE')
            for a in active_auctions:
                a.status = 'COMPLETED'
                a.save()

            if algorithm_id:
                algorithm = Algorithm.objects.get(id=algorithm_id)
            else:
                # Pick next algorithm with remaining slots
                algorithm = Algorithm.objects.filter(is_active=True).annotate(
                    remaining=F('total_slots') - F('assigned_slots')
                ).filter(remaining__gt=0).order_by('order', 'id').first()

                if not algorithm:
                    algorithm = Algorithm.objects.filter(is_active=True).first()

            if not algorithm:
                return Response({"error": "No algorithm available to start auction."}, status=status.HTTP_400_BAD_REQUEST)

            now = timezone.now()
            cycle_num = Auction.objects.filter(algorithm=algorithm).count() + 1
            
            auction = Auction.objects.create(
                algorithm=algorithm,
                cycle_number=cycle_num,
                duration_seconds=duration_seconds,
                start_time=now,
                end_time=now + timedelta(seconds=duration_seconds),
                status='ACTIVE',
                current_highest_bid=0
            )

        return Response({
            "message": f"Auction for {algorithm.name} started ({duration_seconds}s)!",
            "auction": AuctionSerializer(auction).data
        }, status=status.HTTP_201_CREATED)


class AdminCloseAuctionView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        auction_id = request.data.get('auction_id')
        try:
            if auction_id:
                auction = Auction.objects.get(id=auction_id)
            else:
                auction = Auction.objects.filter(status='ACTIVE').first()
        except Auction.DoesNotExist:
            return Response({"error": "No active auction found."}, status=status.HTTP_404_NOT_FOUND)

        ActiveAuctionView()._auto_close_auction(auction)
        auction.refresh_from_db()

        return Response({
            "message": f"Auction #{auction.id} closed.",
            "auction": AuctionSerializer(auction).data
        })


class AdminRandomAssignRemainingView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    @transaction.atomic
    def post(self, request):
        unassigned_participants = list(Participant.objects.filter(algorithm_assigned__isnull=True))
        
        if not unassigned_participants:
            return Response({"message": "All participants already have an assigned algorithm.", "assigned_count": 0})

        # Find algorithms with remaining slots
        available_algorithms = list(Algorithm.objects.filter(is_active=True))

        if not available_algorithms:
            return Response({"error": "No active algorithms found in database."}, status=status.HTTP_400_BAD_REQUEST)

        assigned_results = []
        for p in unassigned_participants:
            # Prefer algorithms with slots remaining
            with_slots = [a for a in available_algorithms if a.remaining_slots > 0]
            chosen_algo = random.choice(with_slots if with_slots else available_algorithms)
            
            p.algorithm_assigned = chosen_algo
            p.balance = 0  # Random assignment competitors receive NO remaining bidding bonus
            p.save(update_fields=['algorithm_assigned', 'balance'])

            chosen_algo.assigned_slots += 1
            chosen_algo.save(update_fields=['assigned_slots'])

            # Record assignment
            ParticipantAlgorithm.objects.create(
                participant=p,
                algorithm=chosen_algo,
                assignment_type='RANDOM',
                winning_bid=0
            )

            assigned_results.append({
                "participant_id": p.id,
                "participant_label": p.anonymous_label,
                "algorithm": chosen_algo.name,
                "assignment_type": "RANDOM"
            })

        return Response({
            "message": f"Successfully randomly assigned algorithms to {len(assigned_results)} participants.",
            "assigned_count": len(assigned_results),
            "assignments": assigned_results
        })


class AdminParticipantsListView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        participants = Participant.objects.all().select_related('user', 'algorithm_assigned').order_by('id')
        serializer = ParticipantSerializer(participants, many=True)
        return Response(serializer.data)


class AdminSubmissionsListView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        submissions = Submission.objects.all().select_related('participant', 'problem').order_by('-submitted_at')[:100]
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class AdminResetEventView(views.APIView):
    """
    Completely resets all event state:
    - Clears all submissions
    - Clears all bids and auctions
    - Clears participant algorithm & problem assignments
    - Resets algorithm assigned_slots to 0
    - Restores all participant balances back to 1000 points
    - Clears all coding session deadlines and timers
    - Keeps participant registration accounts intact
    """
    permission_classes = [permissions.IsAdminUser]

    @transaction.atomic
    def post(self, request):
        Submission.objects.all().delete()
        Bid.objects.all().delete()
        Auction.objects.all().delete()
        ParticipantProblem.objects.all().delete()
        ParticipantAlgorithm.objects.all().delete()
        Algorithm.objects.all().update(assigned_slots=0, is_active=True)

        starting_points = getattr(settings, 'STARTING_POINTS', 1000)
        Participant.objects.all().update(
            balance=starting_points,
            algorithm_assigned=None,
            coding_started_at=None,
            coding_deadline=None,
            is_active_participant=True
        )

        return Response({
            "message": "Event reset successfully! All auctions, bids, submissions, and timer states have been reset. All participant balances restored to 1000 pts.",
            "starting_points": starting_points
        }, status=status.HTTP_200_OK)
