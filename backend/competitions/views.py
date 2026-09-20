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
        participants = Participant.objects.filter(is_active_participant=True).select_related('algorithm_assigned')
        
        entries = []
        for p in participants:
            # Best score for Medium problem
            medium_sub = Submission.objects.filter(
                participant=p, problem__difficulty='MEDIUM'
            ).order_by('-score', 'execution_time').first()
            medium_score = medium_sub.score if medium_sub else 0

            # Best score for Easy problem
            easy_sub = Submission.objects.filter(
                participant=p, problem__difficulty='EASY'
            ).order_by('-score', 'execution_time').first()
            easy_score = easy_sub.score if easy_sub else 0

            total_score = medium_score + easy_score

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

            entries.append({
                'participant_label': p.anonymous_label,
                'participant_name': p.name,
                'college': p.college or 'IEEE CS Member',
                'algorithm_name': p.algorithm_assigned.name if p.algorithm_assigned else 'Pending',
                'medium_score': medium_score,
                'easy_score': easy_score,
                'total_score': total_score,
                'total_execution_time': round(total_exec_time, 3),
                'last_accepted_submission_at': last_accepted_at,
            })

        # Sort leaderboard:
        # 1. Total Score (descending)
        # 2. Total Execution Time (ascending)
        # 3. Last accepted submission time (earlier is better)
        entries.sort(
            key=lambda x: (
                -x['total_score'],
                x['total_execution_time'],
                x['last_accepted_submission_at'].timestamp() if x['last_accepted_submission_at'] else 9999999999
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
            p.save(update_fields=['algorithm_assigned'])

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
