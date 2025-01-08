from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/tableau/', include('tableau.urls')),  # Includes app-level URLs
]

