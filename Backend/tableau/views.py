from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pymongo
import json

# MongoDB connection settings
MONGODB_URI = "mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/"
MONGO_DB_NAME = "Tableau"

# Connect to MongoDB
client = pymongo.MongoClient(MONGODB_URI)
db = client[MONGO_DB_NAME]
user_info_collection = db["User_Info"]  # Collection name updated to User_Info

@csrf_exempt
def register_user(request):
    """
    Register a new user with name, email, and password.
    """
    if request.method == "POST":
        try:
            # Parse request data
            data = json.loads(request.body)
            name = data.get("name")
            email = data.get("email")
            password = data.get("password")

            # Validate inputs
            if not name or not email or not password:
                return JsonResponse({"error": "Name, Email, and Password are required."}, status=400)

            # Check if the user already exists
            existing_user = user_info_collection.find_one({"email": email})
            if existing_user:
                return JsonResponse({"error": "User with this email already exists."}, status=400)

            # Insert user data into MongoDB
            user_data = {
                "name": name,
                "email": email,
                "password": password  # Note: Password should be hashed in production
            }
            user_info_collection.insert_one(user_data)

            return JsonResponse({"message": "User registered successfully."}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def login_user(request):
    """
    Login a user by verifying email and password.
    """
    if request.method == "POST":
        try:
            # Parse request data
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            # Validate inputs
            if not email or not password:
                return JsonResponse({"error": "Email and Password are required."}, status=400)

            # Find user in MongoDB
            user = user_info_collection.find_one({"email": email})

            if not user or user["password"] != password:
                return JsonResponse({"error": "Invalid email or password."}, status=401)

            return JsonResponse({"message": "Login successful.", "name": user["name"]}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
