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
import json

# MongoDB connection
client = MongoClient("mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/")
db = client["kutty_tableau"]
users_collection = db["users"]
data_profiling_collection = db["DataProfiling"]

# Logger setup
logger = logging.getLogger(__name__)

# JWT Secret and Algorithm
JWT_SECRET = "django-insecure-%1l2^d$2q8xuwtmv-z=_!&529loppvl)ikcs0&ef=safzcn=uw"  # Replace later with .env variable
JWT_ALGORITHM = "HS256"

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    """
    Handles user registration.
    """
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

        # Save user in MongoDB
        hashed_password = make_password(password)
        user_data = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = users_collection.insert_one(user_data)
        user_id = str(result.inserted_id)

        logger.info(f"Signup successful for user: {email}")
        return Response({"message": "Signup successful", "user_id": user_id}, status=201)

    except Exception as e:
        logger.error(f"Error during signup: {e}")
        return Response({"error": "Something went wrong. Please try again later."}, status=500)

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
def upload_file(request):
    if request.method == 'POST' and request.FILES.get('dataset'):
        try:
            dataset = request.FILES['dataset']
            fs = FileSystemStorage(location=UPLOAD_DIR)
            file_path = fs.save(dataset.name, dataset)
            file_full_path = os.path.join(UPLOAD_DIR, file_path)

            # Process the uploaded file
            profiling_results = process_dataset(file_full_path)

            # Save results to MongoDB
            data_entry = {
                "filename": dataset.name,
                "results": profiling_results
            }
            data_profiling_collection.insert_one(data_entry)

            # Remove the uploaded file after processing
            os.remove(file_full_path)

            return JsonResponse({"message": "File processed and saved successfully.", "results": profiling_results}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "No file uploaded."}, status=400)


def process_dataset(file_path):
    # Example processing function (adjust as needed)
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):  # Check for excel file formats
            df = pd.read_excel(file_path)
        else:
            return json.dumps({"error": "Unsupported file format."})

        profiling_results = {
            "columns": list(df.columns),
            "row_count": len(df),
            "summary": df.describe(include='all').to_dict()
        }
        return profiling_results
    except Exception as e:
        return {"error": f"Error processing file: {str(e)}"}

@csrf_exempt
def get_profiling_results(request):
    if request.method == "GET":
        try:
            results = list(data_profiling_collection.find({}, {"_id": 0}))
            return JsonResponse({"data": results}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_profiling_result(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            filename = data.get("filename")

            if not filename:
                return JsonResponse({"error": "Filename is required."}, status=400)

            result = data_profiling_collection.delete_one({"filename": filename})

            if result.deleted_count == 0:
                return JsonResponse({"error": "No such file found."}, status=404)

            return JsonResponse({"message": "File profiling result deleted successfully."}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
