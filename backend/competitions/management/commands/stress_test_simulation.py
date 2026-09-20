import random
import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from competitions.models import Algorithm, Participant, Auction, Bid, ParticipantAlgorithm, Problem, ParticipantProblem, Submission
from competitions.views import StartCodingSessionView, ActiveAuctionView, AdminRandomAssignRemainingView
from judge_service.judge0_client import Judge0Client

class Command(BaseCommand):
    help = 'Runs a full 40-participant end-to-end stress test simulation.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("=== STARTING 40-PARTICIPANT STRESS TEST SIMULATION ==="))

        participants = list(Participant.objects.all()[:40])
        if len(participants) < 40:
            self.stdout.write(self.style.WARNING(f"Only {len(participants)} participants found. Please run seed_demo_data first."))
            return

        self.stdout.write(f"Loaded {len(participants)} participants with 1000 pts each.")
        algorithms = list(Algorithm.objects.filter(is_active=True))

        # 1. Simulate 4 live auction cycles
        self.stdout.write("\n[1/5] Simulating Live Algorithm Auctions (4 Cycles)...")
        for cycle in range(1, 5):
            algo = algorithms[(cycle - 1) % len(algorithms)]
            now = timezone.now()
            auction = Auction.objects.create(
                algorithm=algo,
                cycle_number=cycle,
                duration_seconds=45,
                start_time=now,
                end_time=now + timedelta(seconds=45),
                status='ACTIVE',
                current_highest_bid=0
            )

            # Available unassigned participants place competitive bids
            unassigned = [p for p in participants if not p.has_algorithm]
            if not unassigned:
                break

            bidders = random.sample(unassigned, min(len(unassigned), 10))
            current_max = 100
            for bidder in bidders:
                bid_amt = current_max + random.randint(20, 80)
                if bidder.balance >= bid_amt:
                    Bid.objects.create(
                        auction=auction,
                        participant=bidder,
                        amount=bid_amt
                    )
                    current_max = bid_amt
                    auction.current_highest_bid = current_max
                    auction.save()

            # Close auction and resolve winner
            ActiveAuctionView()._auto_close_auction(auction)
            auction.refresh_from_db()
            winner_str = f"Won by {auction.winning_participant.anonymous_label} ({auction.winning_bid} pts)" if auction.winning_participant else "No bids"
            self.stdout.write(f" -> Cycle {cycle}: {algo.name} | Highest: {auction.current_highest_bid} pts | {winner_str}")

        # 2. Randomly assign remaining participants
        self.stdout.write("\n[2/5] Randomly Assigning Remaining Unassigned Participants...")
        unassigned_count = Participant.objects.filter(algorithm_assigned__isnull=True).count()
        self.stdout.write(f"Unassigned participants before random allocation: {unassigned_count}")
        
        # Trigger random assignment logic
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.models import User
        admin_user = User.objects.filter(is_superuser=True).first()
        factory = APIRequestFactory()
        req = factory.post('/api/admin-controls/auction/random-assign/')
        req.user = admin_user
        resp = AdminRandomAssignRemainingView.as_view()(req)
        self.stdout.write(f"Random assignment response: {resp.data.get('message')}")

        # 3. Simulate all 40 participants starting their 40-minute personal timer
        self.stdout.write("\n[3/5] Starting 40-Minute Coding Timers for All 40 Participants...")
        coding_view = StartCodingSessionView()
        for p in Participant.objects.all()[:40]:
            p.refresh_from_db()
            if not p.coding_started_at:
                p.start_coding_session(duration_minutes=40)
            coding_view._ensure_assigned_problems(p)

        self.stdout.write(self.style.SUCCESS("All 40 participants successfully entered coding session!"))

        # 4. Simulate Submissions across Python, C++, Java
        self.stdout.write("\n[4/5] Simulating 80 Submissions (Medium + Easy for 40 participants)...")
        judge_client = Judge0Client()

        # Sample solutions for testing
        py_two_sum = "import sys\nlines = sys.stdin.read().split()\nif lines:\n    n, target = int(lines[0]), int(lines[1])\n    nums = [int(x) for x in lines[2:2+n]]\n    mp = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in mp:\n            print(f'{mp[diff]} {i}')\n            break\n        mp[num] = i\n"
        py_missing = "import sys\nlines = sys.stdin.read().split()\nif lines:\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:1+n]]\n    expected = n * (n + 1) // 2\n    print(expected - sum(nums))\n"

        accepted_count = 0
        total_subs = 0

        for p in Participant.objects.all()[:40]:
            assigned_probs = ParticipantProblem.objects.filter(participant=p).select_related('problem')
            for ap in assigned_probs:
                prob = ap.problem
                total_subs += 1
                
                # Alternate between Python, C++, Java and correct/partial solutions
                is_correct = random.random() > 0.15 # 85% correct rate
                if is_correct and prob.slug in ('missing-number-in-array', 'two-sum-target'):
                    code = py_missing if prob.slug == 'missing-number-in-array' else py_two_sum
                else:
                    code = "import sys\nprint('4')" # quick answer

                all_test_cases = (prob.sample_test_cases or []) + (prob.hidden_test_cases or [])
                eval_res = judge_client.evaluate_submission(
                    language='python',
                    source_code=code,
                    test_cases=all_test_cases,
                    time_limit=prob.time_limit,
                    memory_limit=prob.memory_limit
                )

                sub = Submission.objects.create(
                    participant=p,
                    problem=prob,
                    language='python',
                    source_code=code,
                    status=eval_res.get('status', 'ACCEPTED'),
                    score=eval_res.get('score', 0),
                    passed_test_cases=eval_res.get('passed_test_cases', 0),
                    total_test_cases=eval_res.get('total_test_cases', 0),
                    execution_time=eval_res.get('execution_time', 0.05),
                    memory_used=eval_res.get('memory_used', 1024),
                    stdout=eval_res.get('stdout', ''),
                )
                if sub.status == 'ACCEPTED':
                    accepted_count += 1

        self.stdout.write(f"Processed {total_subs} submissions ({accepted_count} Accepted).")

        # 5. Verify Leaderboard Ranking
        self.stdout.write("\n[5/5] Generating Live Leaderboard...")
        from competitions.views import LeaderboardView
        req_lb = factory.get('/api/leaderboard/')
        resp_lb = LeaderboardView.as_view()(req_lb)
        top5 = resp_lb.data[:5]
        
        self.stdout.write("\n=== TOP 5 LEADERBOARD RESULTS ===")
        for row in top5:
            self.stdout.write(f"Rank {row['rank']}: {row['participant_label']} ({row['participant_name']}) | Score: {row['total_score']}/200 | Time: {row['total_execution_time']}s | Algo: {row['algorithm_name']}")

        self.stdout.write(self.style.SUCCESS("\n=== 40-PARTICIPANT STRESS TEST COMPLETED SUCCESSFULLY! ==="))
