from django.urls import path
from .views import *
from .dataprofile import *
from .datainsights import *

urlpatterns = [
    path('verify_otp/', verify_otp, name='verify_otp'),
    path("register_user/", user_signup, name="register_user"),
    path("login_user/", user_login, name="login_user"),
    path('get_user_info/', get_user_info, name='get_user_info'),
    path("forgot_password/", forgot_password, name="forgot_password"),
    path("reset_password/", reset_password, name="reset_password"),
    path("user_dashboard/<str:user_id>/", user_dashboard, name="user_dashboard"),
    path('upload/', upload_and_process_data, name='upload_and_process_data'),
    path('visualize/<str:upload_id>/', get_visualization_data, name='get_visualization_data'),

    # API for data insights
    path('upload_and_generate_insights/', upload_and_generate_insights, name='upload_and_generate_insights'),
    path('get_insight_data/<upload_id>/', get_insight_data, name='get_insight_data'),
]
