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
otp_collection = db["otp_verification"]
data_profiling_collection = db["Data Profile"]
otp_collection = db["otp_verification"]


# Logger setup
logger = logging.getLogger(__name__)

# JWT Secret and Algorithm
JWT_SECRET = "django-insecure-%1l2^d$2q8xuwtmv-z=_!&529loppvl)ikcs0&ef=safzcn=uw"  # Replace later with .env variable
JWT_ALGORITHM = "HS256"

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

@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_info(request):
    """
    Fetch user information for the logged-in user.
    """
    try:
        # Get the JWT token from cookies
        token = request.COOKIES.get("jwt")
        if not token:
            return Response({"error": "Unauthorized"}, status=401)

        # Decode the token
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return Response({"error": "Token has expired"}, status=401)
        except jwt.InvalidTokenError:
            return Response({"error": "Invalid token"}, status=401)

        # Fetch the user data from MongoDB
        user_id = payload["user_id"]
        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            return Response({"error": "User not found"}, status=404)

        # Return user information
        return Response({
            "user_id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        }, status=200)

    except Exception as e:
        logger.error(f"Error fetching user info: {e}")
        return Response({"error": "Something went wrong"}, status=500)

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
