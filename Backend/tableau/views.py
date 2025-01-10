from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.hashers import make_password, check_password
from pymongo import MongoClient
from bson import ObjectId
import json
import os
from django.core.files.storage import FileSystemStorage
import pandas as pd


# MongoDB connection settings
MONGODB_URI = "mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/"
MONGO_DB_NAME = "kutty_tableau"

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[MONGO_DB_NAME]
users_collection  = db["users"]  # Collection name updated to User_Info
data_profiling_collection = db["DataProfiling"]

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

@api_view(['POST'])
def register_user(request):
    data = request.data
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return Response({'error': 'Name, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if the email already exists
    if users_collection.find_one({'email': email}):
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Hash the password
    hashed_password = make_password(password)

    # Create the user document
    user_document = {
        'name': name,
        'email': email,
        'password': hashed_password
    }

    # Insert the user document into the collection
    result = users_collection.insert_one(user_document)

    # Generate user_id using the ObjectId
    user_id = str(result.inserted_id)

    # Update the user document to include the user_id
    users_collection.update_one(
        {'_id': result.inserted_id},
        {'$set': {'user_id': user_id}}
    )

    return Response({'message': 'User registered successfully', 'user_id': user_id}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_user(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Find the user by email
    user = users_collection.find_one({'email': email})

    if user and check_password(password, user['password']):
        return Response({'message': 'Login successful', 'user_id': user['user_id']}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    
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
        df = pd.read_csv(file_path)
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
