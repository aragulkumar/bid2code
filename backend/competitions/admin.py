from django.contrib import admin
from .models import (
    Participant, Algorithm, Auction, Bid,
    ParticipantAlgorithm, Problem, ParticipantProblem, Submission
)

@admin.register(Algorithm)
class AlgorithmAdmin(admin.ModelAdmin):
    list_display = ('name', 'difficulty', 'assigned_slots', 'total_slots', 'order', 'is_active')
    list_filter = ('difficulty', 'is_active')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('anonymous_label', 'name', 'email', 'balance', 'algorithm_assigned', 'coding_started_at', 'is_active_participant')
    list_filter = ('algorithm_assigned', 'is_active_participant')
    search_fields = ('name', 'email', 'anonymous_label', 'college')


@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ('id', 'algorithm', 'cycle_number', 'status', 'current_highest_bid', 'winning_participant', 'start_time', 'end_time')
    list_filter = ('status', 'algorithm')
    search_fields = ('algorithm__name', 'winning_participant__name', 'winning_participant__anonymous_label')


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ('auction', 'participant', 'amount', 'is_winning', 'created_at')
    list_filter = ('is_winning', 'auction')
    search_fields = ('participant__name', 'participant__anonymous_label')


@admin.register(ParticipantAlgorithm)
class ParticipantAlgorithmAdmin(admin.ModelAdmin):
    list_display = ('participant', 'algorithm', 'assignment_type', 'winning_bid', 'assigned_at')
    list_filter = ('assignment_type', 'algorithm')


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'algorithm', 'time_limit', 'memory_limit', 'is_active')
    list_filter = ('difficulty', 'algorithm', 'is_active')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}


@admin.register(ParticipantProblem)
class ParticipantProblemAdmin(admin.ModelAdmin):
    list_display = ('participant', 'problem', 'assigned_at')
    list_filter = ('problem__difficulty', 'problem__algorithm')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'participant', 'problem', 'language', 'status', 'score', 'execution_time', 'submitted_at')
    list_filter = ('status', 'language', 'problem__difficulty')
    search_fields = ('participant__name', 'participant__anonymous_label', 'problem__title')
