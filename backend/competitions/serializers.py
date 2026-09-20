from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import (
    Participant, Algorithm, Auction, Bid,
    ParticipantAlgorithm, Problem, ParticipantProblem, Submission
)
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff']


class ParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    algorithm_assigned_name = serializers.CharField(source='algorithm_assigned.name', read_only=True)
    remaining_coding_seconds = serializers.IntegerField(read_only=True)
    has_algorithm = serializers.BooleanField(read_only=True)
    is_coding = serializers.BooleanField(read_only=True)
    is_coding_finished = serializers.BooleanField(read_only=True)

    class Meta:
        model = Participant
        fields = [
            'id', 'username', 'anonymous_label', 'name', 'email', 'phone',
            'college', 'department', 'year_of_study', 'github_profile', 'linkedin_profile',
            'balance', 'algorithm_assigned', 'algorithm_assigned_name',
            'coding_started_at', 'coding_deadline', 'remaining_coding_seconds',
            'has_algorithm', 'is_coding', 'is_coding_finished', 'is_staff', 'created_at'
        ]
        read_only_fields = ['balance', 'anonymous_label', 'algorithm_assigned', 'coding_started_at', 'coding_deadline']


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    college = serializers.CharField(max_length=200)
    department = serializers.CharField(max_length=150)
    year_of_study = serializers.CharField(max_length=50)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    github_profile = serializers.CharField(max_length=255, required=False, allow_blank=True)
    linkedin_profile = serializers.CharField(max_length=255, required=False, allow_blank=True)
    agree_terms = serializers.BooleanField()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if not data.get('agree_terms'):
            raise serializers.ValidationError({"agree_terms": "You must agree to the BIT2CODE event rules."})
        if User.objects.filter(username__iexact=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        if User.objects.filter(email__iexact=data['email']).exists() or Participant.objects.filter(email__iexact=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Generate anonymous label like P01, P02...
        count = Participant.objects.count() + 1
        anon_label = f"P{count:02d}"

        participant = Participant.objects.create(
            user=user,
            anonymous_label=anon_label,
            name=validated_data['full_name'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            college=validated_data.get('college', ''),
            department=validated_data.get('department', ''),
            year_of_study=validated_data.get('year_of_study', ''),
            github_profile=validated_data.get('github_profile', ''),
            linkedin_profile=validated_data.get('linkedin_profile', ''),
            balance=getattr(settings, 'STARTING_POINTS', 1000)
        )
        return participant


class AlgorithmSerializer(serializers.ModelSerializer):
    remaining_slots = serializers.IntegerField(read_only=True)

    class Meta:
        model = Algorithm
        fields = [
            'id', 'name', 'slug', 'description', 'difficulty',
            'total_slots', 'assigned_slots', 'remaining_slots', 'order', 'is_active'
        ]


class BidSerializer(serializers.ModelSerializer):
    participant_label = serializers.CharField(source='participant.anonymous_label', read_only=True)

    class Meta:
        model = Bid
        fields = ['id', 'auction', 'participant', 'participant_label', 'amount', 'is_winning', 'created_at']
        read_only_fields = ['is_winning', 'created_at']


class AuctionSerializer(serializers.ModelSerializer):
    algorithm_details = AlgorithmSerializer(source='algorithm', read_only=True)
    winning_participant_label = serializers.CharField(source='winning_participant.anonymous_label', read_only=True)
    recent_bids = serializers.SerializerMethodField()
    remaining_seconds = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Auction
        fields = [
            'id', 'algorithm', 'algorithm_details', 'cycle_number', 'duration_seconds',
            'start_time', 'end_time', 'status', 'current_highest_bid', 'winning_bid',
            'winning_participant', 'winning_participant_label', 'recent_bids',
            'remaining_seconds', 'is_expired', 'created_at'
        ]

    def get_recent_bids(self, obj):
        # Return top 10 highest bids anonymously
        bids = obj.bids.select_related('participant').order_by('-amount', 'created_at')[:10]
        return [
            {
                'id': b.id,
                'participant_label': b.participant.anonymous_label,
                'amount': b.amount,
                'created_at': b.created_at
            }
            for b in bids
        ]


class ProblemPublicSerializer(serializers.ModelSerializer):
    algorithm_name = serializers.CharField(source='algorithm.name', read_only=True)

    class Meta:
        model = Problem
        fields = [
            'id', 'title', 'slug', 'difficulty', 'algorithm', 'algorithm_name',
            'description', 'input_format', 'output_format', 'constraints',
            'time_limit', 'memory_limit', 'sample_test_cases', 'order'
        ]


class ProblemAdminSerializer(serializers.ModelSerializer):
    algorithm_name = serializers.CharField(source='algorithm.name', read_only=True)

    class Meta:
        model = Problem
        fields = '__all__'


class SubmissionSerializer(serializers.ModelSerializer):
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    problem_difficulty = serializers.CharField(source='problem.difficulty', read_only=True)
    participant_label = serializers.CharField(source='participant.anonymous_label', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'participant', 'participant_label', 'problem', 'problem_title',
            'problem_difficulty', 'language', 'source_code', 'submitted_at',
            'status', 'score', 'passed_test_cases', 'total_test_cases',
            'execution_time', 'memory_used', 'compile_output', 'stderr', 'stdout'
        ]
        read_only_fields = [
            'status', 'score', 'passed_test_cases', 'total_test_cases',
            'execution_time', 'memory_used', 'compile_output', 'stderr', 'stdout', 'submitted_at'
        ]


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    participant_label = serializers.CharField()
    participant_name = serializers.CharField()
    college = serializers.CharField()
    algorithm_name = serializers.CharField(allow_null=True)
    medium_score = serializers.IntegerField()
    easy_score = serializers.IntegerField()
    total_score = serializers.IntegerField()
    total_execution_time = serializers.FloatField()
    last_accepted_submission_at = serializers.DateTimeField(allow_null=True)
