from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class Algorithm(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, default='Medium')
    total_slots = models.PositiveIntegerField(default=5)
    assigned_slots = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} ({self.assigned_slots}/{self.total_slots} slots)"

    @property
    def remaining_slots(self):
        return max(0, self.total_slots - self.assigned_slots)


class Participant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='participant_profile')
    anonymous_label = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    college = models.CharField(max_length=200, blank=True)
    department = models.CharField(max_length=150, blank=True)
    year_of_study = models.CharField(max_length=50, blank=True)
    github_profile = models.CharField(max_length=255, blank=True)
    linkedin_profile = models.CharField(max_length=255, blank=True)
    
    balance = models.PositiveIntegerField(default=1000)
    algorithm_assigned = models.ForeignKey(
        Algorithm, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_participants'
    )
    coding_started_at = models.DateTimeField(null=True, blank=True)
    coding_deadline = models.DateTimeField(null=True, blank=True)
    is_active_participant = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.anonymous_label}) - Balance: {self.balance}"

    @property
    def has_algorithm(self):
        return self.algorithm_assigned is not None

    @property
    def is_coding(self):
        if not self.coding_started_at or not self.coding_deadline:
            return False
        return timezone.now() < self.coding_deadline

    @property
    def is_coding_finished(self):
        if not self.coding_deadline:
            return False
        return timezone.now() >= self.coding_deadline

    @property
    def remaining_coding_seconds(self):
        if not self.coding_deadline:
            return 0
        now = timezone.now()
        if now >= self.coding_deadline:
            return 0
        return int((self.coding_deadline - now).total_seconds())

    def start_coding_session(self, duration_minutes=40):
        if self.coding_started_at:
            return False, "Coding session already started"
        if not self.has_algorithm:
            return False, "No algorithm assigned yet"
        now = timezone.now()
        self.coding_started_at = now
        self.coding_deadline = now + timedelta(minutes=duration_minutes)
        self.save(update_fields=['coding_started_at', 'coding_deadline'])
        return True, "Coding session started successfully"


class Auction(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    algorithm = models.ForeignKey(Algorithm, on_delete=models.CASCADE, related_name='auctions')
    cycle_number = models.PositiveIntegerField(default=1)
    duration_seconds = models.PositiveIntegerField(default=45)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    current_highest_bid = models.PositiveIntegerField(default=0)
    winning_bid = models.PositiveIntegerField(null=True, blank=True)
    winning_participant = models.ForeignKey(
        Participant, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_auctions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"Auction #{self.id}: {self.algorithm.name} (Cycle {self.cycle_number}) - [{self.status}]"

    @property
    def is_expired(self):
        if self.status != 'ACTIVE' or not self.end_time:
            return True
        return timezone.now() >= self.end_time

    @property
    def remaining_seconds(self):
        if self.status != 'ACTIVE' or not self.end_time:
            return 0
        now = timezone.now()
        if now >= self.end_time:
            return 0
        return max(0, int((self.end_time - now).total_seconds()))


class Bid(models.Model):
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name='bids')
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='bids')
    amount = models.PositiveIntegerField()
    is_winning = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-amount', 'created_at']

    def __str__(self):
        return f"{self.participant.anonymous_label} bid {self.amount} on {self.auction.algorithm.name}"


class ParticipantAlgorithm(models.Model):
    ASSIGNMENT_TYPES = (
        ('BID', 'Won via Auction Bid'),
        ('RANDOM', 'Assigned via Random Allocation'),
    )

    participant = models.OneToOneField(Participant, on_delete=models.CASCADE, related_name='algorithm_assignment')
    algorithm = models.ForeignKey(Algorithm, on_delete=models.CASCADE, related_name='participant_assignments')
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPES, default='BID')
    winning_bid = models.PositiveIntegerField(default=0)
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.participant.anonymous_label} -> {self.algorithm.name} ({self.assignment_type})"


class Problem(models.Model):
    DIFFICULTY_CHOICES = (
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='MEDIUM', db_index=True)
    algorithm = models.ForeignKey(
        Algorithm, on_delete=models.SET_NULL, null=True, blank=True, related_name='problems'
    )
    description = models.TextField(help_text="Detailed problem statement in Markdown")
    input_format = models.TextField(blank=True)
    output_format = models.TextField(blank=True)
    constraints = models.TextField(blank=True)
    time_limit = models.FloatField(default=2.0, help_text="Time limit in seconds")
    memory_limit = models.PositiveIntegerField(default=256000, help_text="Memory limit in KB")
    
    # Test cases stored as JSON lists
    # sample_test_cases: [{"input": "...", "output": "...", "explanation": "..."}]
    sample_test_cases = models.JSONField(default=list, blank=True)
    # hidden_test_cases: [{"input": "...", "output": "..."}]
    hidden_test_cases = models.JSONField(default=list, blank=True)
    
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['difficulty', 'order', 'title']

    def __str__(self):
        algo_str = f" [{self.algorithm.name}]" if self.algorithm else ""
        return f"{self.title} ({self.difficulty}){algo_str}"


class ParticipantProblem(models.Model):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='assigned_problems')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='participant_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('participant', 'problem')
        ordering = ['problem__difficulty', 'assigned_at']

    def __str__(self):
        return f"{self.participant.anonymous_label} assigned {self.problem.title}"


class Submission(models.Model):
    STATUS_CHOICES = (
        ('QUEUED', 'Queued'),
        ('RUNNING', 'Running'),
        ('ACCEPTED', 'Accepted'),
        ('WRONG_ANSWER', 'Wrong Answer'),
        ('TIME_LIMIT_EXCEEDED', 'Time Limit Exceeded'),
        ('COMPILATION_ERROR', 'Compilation Error'),
        ('RUNTIME_ERROR', 'Runtime Error (NZEC)'),
        ('MEMORY_LIMIT_EXCEEDED', 'Memory Limit Exceeded'),
        ('SERVER_ERROR', 'Internal Server Error'),
    )

    LANGUAGE_CHOICES = (
        ('python', 'Python 3'),
        ('cpp', 'C++ (GCC)'),
        ('java', 'Java (OpenJDK)'),
    )

    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='submissions')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='submissions')
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='python')
    source_code = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='QUEUED', db_index=True)
    score = models.PositiveIntegerField(default=0)
    passed_test_cases = models.PositiveIntegerField(default=0)
    total_test_cases = models.PositiveIntegerField(default=0)
    execution_time = models.FloatField(default=0.0)
    memory_used = models.PositiveIntegerField(default=0)
    
    judge0_token = models.CharField(max_length=100, blank=True)
    compile_output = models.TextField(blank=True)
    stderr = models.TextField(blank=True)
    stdout = models.TextField(blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Sub #{self.id}: {self.participant.anonymous_label} - {self.problem.title} [{self.status}] ({self.score}pts)"
