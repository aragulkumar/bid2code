from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from competitions.models import Algorithm, Participant, Auction, Bid, ParticipantAlgorithm, Problem, ParticipantProblem, Submission
from competitions.views import ActiveAuctionView, StartCodingSessionView
from judge_service.judge0_client import Judge0Client

class CompetitionTestCase(TestCase):
    def setUp(self):
        # Create test algorithms
        self.algo_dp = Algorithm.objects.create(
            name="Dynamic Programming",
            slug="dynamic-programming",
            description="DP problems",
            difficulty="Medium",
            total_slots=5,
            order=1
        )
        self.algo_graph = Algorithm.objects.create(
            name="Graph",
            slug="graph",
            description="Graph problems",
            difficulty="Medium",
            total_slots=5,
            order=2
        )

        # Create test problems
        self.prob_dp = Problem.objects.create(
            title="Coin Change Test",
            slug="coin-change-test",
            difficulty="MEDIUM",
            algorithm=self.algo_dp,
            description="Test DP problem",
            sample_test_cases=[{"input": "3 5\n1 2 5", "output": "4"}],
            hidden_test_cases=[{"input": "1 10\n10", "output": "1"}]
        )
        self.prob_easy = Problem.objects.create(
            title="Two Sum Test",
            slug="two-sum-test",
            difficulty="EASY",
            algorithm=None,
            description="Test Easy problem",
            sample_test_cases=[{"input": "4 9\n2 7 11 15", "output": "0 1"}],
            hidden_test_cases=[{"input": "2 6\n3 3", "output": "0 1"}]
        )

        # Create test participants
        self.user1 = User.objects.create_user(username="test_p01", password="password123", email="p01@test.com")
        self.p1 = Participant.objects.create(
            user=self.user1,
            anonymous_label="P01",
            name="Alice Walker",
            email="p01@test.com",
            balance=1000
        )

        self.user2 = User.objects.create_user(username="test_p02", password="password123", email="p02@test.com")
        self.p2 = Participant.objects.create(
            user=self.user2,
            anonymous_label="P02",
            name="Bob Smith",
            email="p02@test.com",
            balance=1000
        )

    def test_participant_starts_with_1000_points(self):
        self.assertEqual(self.p1.balance, 1000)
        self.assertEqual(self.p2.balance, 1000)
        self.assertFalse(self.p1.has_algorithm)

    def test_auction_bidding_and_winner_resolution(self):
        now = timezone.now()
        auction = Auction.objects.create(
            algorithm=self.algo_dp,
            cycle_number=1,
            duration_seconds=45,
            start_time=now,
            end_time=now + timedelta(seconds=45),
            status='ACTIVE'
        )

        # Alice bids 250
        Bid.objects.create(auction=auction, participant=self.p1, amount=250)
        auction.current_highest_bid = 250
        auction.save()

        # Bob bids 400
        Bid.objects.create(auction=auction, participant=self.p2, amount=400)
        auction.current_highest_bid = 400
        auction.save()

        # Resolve auction
        ActiveAuctionView()._auto_close_auction(auction)
        auction.refresh_from_db()
        self.p1.refresh_from_db()
        self.p2.refresh_from_db()

        # Bob should win
        self.assertEqual(auction.status, 'COMPLETED')
        self.assertEqual(auction.winning_participant, self.p2)
        self.assertEqual(auction.winning_bid, 400)
        self.assertEqual(self.p2.balance, 600)  # 1000 - 400 = 600
        self.assertEqual(self.p1.balance, 1000) # Alice was not deducted!
        self.assertEqual(self.p2.algorithm_assigned, self.algo_dp)
        self.assertTrue(self.p2.has_algorithm)

    def test_coding_session_40_minute_timer(self):
        self.p2.algorithm_assigned = self.algo_dp
        self.p2.save()

        # Start session
        success, msg = self.p2.start_coding_session(duration_minutes=40)
        self.assertTrue(success)
        self.assertIsNotNone(self.p2.coding_started_at)
        self.assertIsNotNone(self.p2.coding_deadline)
        self.assertTrue(self.p2.is_coding)
        self.assertFalse(self.p2.is_coding_finished)
        self.assertGreater(self.p2.remaining_coding_seconds, 2300)

    def test_problem_assignment_medium_and_easy(self):
        self.p2.algorithm_assigned = self.algo_dp
        self.p2.save()

        coding_view = StartCodingSessionView()
        coding_view._ensure_assigned_problems(self.p2)

        assigned = ParticipantProblem.objects.filter(participant=self.p2)
        self.assertEqual(assigned.count(), 2)
        
        difficulties = [ap.problem.difficulty for ap in assigned]
        self.assertIn('MEDIUM', difficulties)
        self.assertIn('EASY', difficulties)

    def test_judge_sandbox_evaluation(self):
        judge = Judge0Client()
        code = "print('4')"
        res = judge.evaluate_submission(
            language='python',
            source_code=code,
            test_cases=[{"input": "3 5\n1 2 5", "output": "4"}]
        )
        self.assertEqual(res['status'], 'ACCEPTED')
        self.assertEqual(res['score'], 100)
        self.assertEqual(res['passed_test_cases'], 1)
