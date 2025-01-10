from django.urls import path
from .views import *

urlpatterns = [
    path("register_user/", register_user, name="register_user"),
    path('login_user/', login_user, name='login_user'),
    path('upload/', upload_file, name='upload_file'),
    path('results/', get_profiling_results, name='get_profiling_results'),
    path('delete/', delete_profiling_result, name='delete_profiling_result'),
]
