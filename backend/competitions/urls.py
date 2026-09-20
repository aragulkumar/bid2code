from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, CurrentUserView, AlgorithmListView, ActiveAuctionView,
    PlaceBidView, StartCodingSessionView, AssignedProblemsView,
    SubmitCodeView, RunSampleCodeView, SubmissionHistoryView,
    LeaderboardView, AdminOverviewView, AdminStartAuctionView,
    AdminCloseAuctionView, AdminRandomAssignRemainingView,
    AdminParticipantsListView, AdminSubmissionsListView
)

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),

    # Algorithm & Auction Endpoints
    path('algorithms/', AlgorithmListView.as_view(), name='algorithm-list'),
    path('auction/active/', ActiveAuctionView.as_view(), name='auction-active'),
    path('auction/bid/', PlaceBidView.as_view(), name='auction-bid'),

    # Coding Session & Problem Assignment Endpoints
    path('coding/start/', StartCodingSessionView.as_view(), name='coding-start'),
    path('coding/problems/', AssignedProblemsView.as_view(), name='coding-problems'),

    # Submissions & Judging Endpoints
    path('submissions/submit/', SubmitCodeView.as_view(), name='submission-submit'),
    path('submissions/run-sample/', RunSampleCodeView.as_view(), name='submission-run-sample'),
    path('submissions/history/', SubmissionHistoryView.as_view(), name='submission-history'),

    # Live Leaderboard Endpoint
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),

    # Admin Control Panel Endpoints
    path('admin-controls/overview/', AdminOverviewView.as_view(), name='admin-overview'),
    path('admin-controls/auction/start/', AdminStartAuctionView.as_view(), name='admin-auction-start'),
    path('admin-controls/auction/close/', AdminCloseAuctionView.as_view(), name='admin-auction-close'),
    path('admin-controls/auction/random-assign/', AdminRandomAssignRemainingView.as_view(), name='admin-auction-random-assign'),
    path('admin-controls/participants/', AdminParticipantsListView.as_view(), name='admin-participants'),
    path('admin-controls/submissions/', AdminSubmissionsListView.as_view(), name='admin-submissions'),
]
