from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password, make_password
from pymongo import MongoClient
from django.http import JsonResponse
from bson import ObjectId
from datetime import datetime, timedelta
import jwt
import logging
from django.views.decorators.csrf import csrf_exempt
import os
from django.core.files.storage import FileSystemStorage
import pandas as pd
import numpy as np
import chardet
from scipy.stats import zscore
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import string
from django.core.mail import send_mail
from django.conf import settings


# MongoDB connection
client = MongoClient("mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/")
db = client["kutty_tableau"]
users_collection = db["users"]
data_profiling_collection = db["Data Profile"]
otp_collection = db["otp_verification"]


# Logger setup
logger = logging.getLogger(__name__)

# JWT Secret and Algorithm
JWT_SECRET = "django-insecure-%1l2^d$2q8xuwtmv-z=_!&529loppvl)ikcs0&ef=safzcn=uw"  # Replace later with .env variable
JWT_ALGORITHM = "HS256"

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

#jwt token
def generate_tokens(user_id):
    """
    Generate JWT token for the given user.
    """
    access_payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=1),  # Token expiration: 1 hour
        "iat": datetime.utcnow(),
    }

    token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"jwt": token}

#otp
def send_otp_email(email, otp):
    sender_email = "kuttytableau@gmail.com"
    sender_password = "qpwiuskxjnwpvsyv"
    subject = "Your OTP Verification Code"
    body = f"Your OTP code is {otp}. It is valid for 5 minutes."

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()
    except Exception as e:
        raise Exception(f"Failed to send email: {e}")
    

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    try:
        data = request.data
        email = data.get("email")
        otp = int(data.get("otp"))  # Ensure OTP is treated as string

        # Find OTP record in the database
        record = otp_collection.find_one({"email": email, "otp": otp})
        
        # Debugging: Log the found record
        print("Record found:", record)
        
        if not record:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        # Check if OTP is expired
        if datetime.utcnow() > record["expires_at"]:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        # Delete the OTP record after successful verification
        otp_collection.delete_one({"_id": record["_id"]})
        
        # Hash the password and create the user
        hashed_password = make_password(data.get("password"))
        users_collection.insert_one({
            "name": data.get("name"),
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })

        return Response({"message": "User registered successfully"}, status=201)

    except Exception as e:
        print("Error occurred during OTP verification:", str(e))
        return Response({"error": "Something went wrong. Please try again later."}, status=500)

#login
@api_view(["OPTIONS", "POST"])
@permission_classes([AllowAny])
def user_login(request):
    if request.method == "OPTIONS":
        # Handle preflight requests
        response = JsonResponse({"message": "Preflight successful"})
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    """
    Handles user login.
    """
    try:
        data = request.data
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            logger.warning("Login failed: Missing email or password")
            return Response({"error": "Email and password are required"}, status=400)

        user = users_collection.find_one({"email": email})
        if not user or not check_password(password, user["password"]):
            logger.warning("Login failed: Invalid email or password")
            return Response({"error": "Invalid email or password"}, status=401)

        user_id = str(user["_id"])
        tokens = generate_tokens(user_id)

        response = Response({
            "message": "Login successful",
            "user_id": user_id,
            "name": user["name"],
            "email": user["email"],
        }, status=200)

        response.set_cookie(
        key="jwt",
        value=tokens["jwt"],
        httponly=True,
        samesite="Lax",  # Use 'None' with HTTPS
        secure=False,    # Set to True in production with HTTPS
        max_age=1 * 60 * 60  # 1 hour expiration
)

        logger.info(f"Login successful for user: {email}")
        return response

    except Exception as e:
        logger.error(f"Error during login: {e}")
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([AllowAny])
def user_signup(request):
    try:
        data = request.data
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            logger.warning("Signup failed: Missing required fields")
            return Response({"error": "Name, email, and password are required"}, status=400)

        # Check if email already exists
        if users_collection.find_one({"email": email}):
            logger.warning(f"Signup failed: Email {email} already exists")
            return Response({"error": "Email already exists"}, status=400)

        # Generate and send OTP
        otp = int(random.randint(100000, 999999))
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        send_otp_email(email, otp)  # Ensure send_email_otp function works as expected

        # Save OTP in database
        otp_data = {
            "email": email,
            "otp": otp,
            "timestamp": datetime.utcnow(),
            "expires_at": expires_at,
        }
        otp_collection.insert_one(otp_data)

        logger.info(f"OTP sent successfully to {email}")
        return Response({"message": "OTP sent successfully"}, status=201)

    except Exception as e:
        logger.error(f"Error during signup: {e}")
        return Response({"error": "Something went wrong. Please try again later."}, status=500)


#forgot password
def generate_reset_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=20))

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    try:
        email = request.data.get('email')

        # Check if the email exists in the system
        user = users_collection.find_one({"email": email})
        if not user:
            return Response({"error": "Email not found"}, status=400)

        # Generate reset token and store it
        reset_token = generate_reset_token()

        # Store token in the database with expiration time (e.g., 1 hour)
        expiration_time = datetime.utcnow() + timedelta(hours=1)
        users_collection.update_one(
            {"email": email},
            {"$set": {"password_reset_token": reset_token, "password_reset_expires": expiration_time}}
        )

        # Send the reset token via email (you can customize the email content)
        send_mail(
            'Password Reset Request',
            f'Use this token to reset your password: {reset_token}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )

        return Response({"message": "Password reset link sent to your email"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    try:
        email = request.data.get('email')
        token = request.data.get('token')
        new_password = request.data.get('password')

        # Find the user by email and validate token
        user = users_collection.find_one({"email": email})
        if not user or user.get('password_reset_token') != token:
            return Response({"error": "Invalid token"}, status=400)

        # Check if token is expired
        if datetime.utcnow() > user.get('password_reset_expires'):
            return Response({"error": "Token has expired"}, status=400)

        # Hash the new password
        hashed_password = make_password(new_password)

        # Update the user's password and clear the reset token
        users_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password, "password_reset_token": None, "password_reset_expires": None}}
        )

        return Response({"message": "Password reset successful"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

#app
@api_view(["GET"])
def user_dashboard(request, user_id):
    """
    Retrieve user-specific data based on user ID.
    """
    try:
        # Fetch user data by user_id from MongoDB
        user = users_collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
        if not user:
            return Response({"error": "User not found"}, status=404)

        # Convert ObjectId to string
        user["_id"] = str(user["_id"])

        return Response({"data": user}, status=200)

    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        return Response({"error": "Something went wrong. Please try again later."}, status=500)


@csrf_exempt
def upload_and_process_data(request):
    """
    Handles file uploads, processes data, and stores profiling results in MongoDB.
    """
    if request.method == 'POST' and request.FILES.get('dataset'):
        try:
            # Extract the file and user ID from the request
            dataset = request.FILES['dataset']
            user_id = request.POST.get('user_id')

            if not user_id:
                return JsonResponse({"error": "user_id is required."}, status=400)

            # Generate a unique upload ID
            upload_id = str(ObjectId())

            # Process the uploaded file
            file_name = dataset.name
            file_content = dataset.read()  # Read file content
            profiling_results = process_dataset(file_content, file_name)

            if "error" in profiling_results:
                return JsonResponse({"error": profiling_results["error"]}, status=400)

            # Save results to MongoDB
            data_entry = {
                "upload_id": upload_id,
                "user_id": user_id,
                "filename": file_name,
                "results": profiling_results,
            }
            data_profiling_collection.insert_one(data_entry)

            return JsonResponse(
                {
                    "message": "File processed and saved successfully.",
                    "upload_id": upload_id,
                    "results": profiling_results,
                },
                status=201,
            )
        except Exception as e:
            logger.error(f"Error processing file upload: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "No file uploaded or invalid request method."}, status=400)
    
def detect_encoding(file_content):
    result = chardet.detect(file_content)
    return result['encoding']

def process_dataset(file_content, file_name):
    try:
        if file_name.endswith('.csv'):
            # Detect encoding
            encoding = detect_encoding(file_content)
            df = pd.read_csv(pd.io.common.BytesIO(file_content), encoding=encoding)
        elif file_name.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(pd.io.common.BytesIO(file_content))
        else:
            return {"error": "Unsupported file format."}

        # Clean column names
        df.columns = df.columns.str.strip()

        # Data Overview
        data_overview = {
            "columns": list(df.columns),
            "row_count": len(df),
            "data_types": df.dtypes.astype(str).to_dict(),
        }

        # Statistical Summary
        summary = df.describe(include="all").fillna('null').to_dict()

        # Handle datetime columns separately
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        if not datetime_cols.empty:
            datetime_summary = {
                col: {
                    "min": str(df[col].min()),
                    "max": str(df[col].max()),
                    "unique": df[col].nunique(),
                }
                for col in datetime_cols
            }
        else:
            datetime_summary = {}

        # Data Relationships (correlations)
        numeric_cols = df.select_dtypes(include=np.number)
        correlations = (
            numeric_cols.corr().fillna('null').to_dict() if not numeric_cols.empty else {}
        )

        # Data Quality Metrics
        duplicates = len(df[df.duplicated()])
        null_values = df.isnull().sum().to_dict()
        outliers = {
            col: df[(zscore(df[col].dropna()) > 3)].shape[0] if col in numeric_cols else 0
            for col in df.columns
        }

        data_quality = {
            "duplicates": duplicates,
            "null_values": null_values,
            "outliers": outliers,
        }

        # Data Preview
        data_preview = df.head(5).to_dict(orient='records')

        # Generate profiling results
        profiling_results = {
            "data_overview": data_overview,
            "summary": summary,
            "datetime_summary": datetime_summary,
            "relationships": correlations,
            "data_quality": data_quality,
            "data_preview": data_preview,
        }

        return profiling_results
    except Exception as e:
        logger.error(f"Error processing dataset: {str(e)}")
        return {"error": f"Error processing file: {str(e)}"}

@csrf_exempt
def get_visualization_data(request, upload_id):
    """
    Fetch visualization data for the given upload_id.
    """
    if request.method == 'GET':
        try:
            # Find the data in MongoDB by upload_id
            data_entry = data_profiling_collection.find_one({"upload_id": upload_id})
            if not data_entry:
                return JsonResponse({"error": "Data not found for the given upload_id."}, status=404)

            # Prepare data for response
            results = data_entry["results"]
            response_data = {
                "data_overview": results.get("data_overview", {}),
                "summary": results.get("summary", {}),
                "datetime_summary": results.get("datetime_summary", {}),
                "relationships": results.get("relationships", {}),
                "data_quality": results.get("data_quality", {}),
                "data_preview": results.get("data_preview", []),
            }

            return JsonResponse({"message": "Data fetched successfully.", "data": response_data}, status=200)
        except Exception as e:
            logger.error(f"Error fetching visualization data: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=400)
