from django.urls import path
from .views import *
from .dataprofile import *

urlpatterns = [
    path("register_user/", user_signup, name="register_user"),
    path("login_user/", user_login, name="login_user"),
    path("user_dashboard/<str:user_id>/", user_dashboard, name="user_dashboard"),
    # path("upload_data/", upload_file, name="upload_data"),
    # path("get_profiling_results/", get_profiling_results, name="get_profiling_results"),
    path('upload/', upload_and_process_data, name='upload_and_process_data'),
    path('visualize/<str:upload_id>/', get_visualization_data, name='get_visualization_data'),
    # path('delete/', delete_profiling_result, name='delete_profiling_result'),
]
