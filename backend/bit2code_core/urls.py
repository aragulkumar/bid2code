"""
URL configuration for bit2code_core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "BIT2CODE API",
        "version": "1.0.0",
        "event_date": "2026-09-29",
        "endpoints": {
            "auth": "/api/auth/",
            "auction": "/api/auction/",
            "problems": "/api/problems/",
            "submissions": "/api/submissions/",
            "leaderboard": "/api/leaderboard/",
            "admin_controls": "/api/admin-controls/",
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('competitions.urls')),
]
