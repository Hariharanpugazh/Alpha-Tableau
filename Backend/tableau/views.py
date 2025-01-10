from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.hashers import make_password, check_password
from pymongo import MongoClient
from bson import ObjectId
import json


# MongoDB connection settings
MONGODB_URI = "mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/"
MONGO_DB_NAME = "kutty_tableau"

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[MONGO_DB_NAME]
users_collection  = db["users"]  # Collection name updated to User_Info

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