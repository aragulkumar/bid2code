"""
URL configuration for bit2code_core project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.static import serve
from django.conf import settings
import os

SPA_ROOT = os.path.join(settings.BASE_DIR, 'static_root')

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

def serve_spa(request, path=''):
    """Serve the React SPA index.html for all non-API routes."""
    index_file = os.path.join(SPA_ROOT, 'index.html')
    if os.path.exists(index_file):
        with open(index_file, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    return HttpResponse('<h1>Frontend not built yet. Run: npm run build</h1>', status=503)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('competitions.urls')),

    # Serve Vite build static assets directly from static_root
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': os.path.join(SPA_ROOT, 'assets')}),

    # Serve any other root-level static file (favicon, robots.txt, etc.)
    re_path(r'^(?P<path>(?!api/|admin/)[\w.\-]+\.\w+)$', serve, {'document_root': SPA_ROOT}),

    # Catch-all: serve React SPA for all other routes
    re_path(r'^.*$', serve_spa),
]
