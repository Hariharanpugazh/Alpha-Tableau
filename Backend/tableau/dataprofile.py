# import os
# import pandas as pd
# from django.http import JsonResponse
# from django.core.files.storage import FileSystemStorage
# from django.views.decorators.csrf import csrf_exempt
# from pymongo import MongoClient
# from ydata_profiling import ProfileReport
# from bson import ObjectId
# import chardet
# from datetime import datetime

# # MongoDB connection
# client = MongoClient("mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/")
# db = client["kutty_tableau"]
# data_profiling_collection = db["data_profiling"]

# UPLOAD_DIR = "uploads"  # Directory to temporarily save uploaded files

# # Ensure the upload directory exists
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# def detect_encoding(file_path):
#     with open(file_path, 'rb') as f:
#         result = chardet.detect(f.read(10000))  # Read a sample of the file
#         return result['encoding']
    
# @csrf_exempt
# def upload_file(request):
#     if request.method == 'POST' and 'dataset' in request.FILES:
#         try:
#             dataset = request.FILES['dataset']
#             fs = FileSystemStorage(location=UPLOAD_DIR)
#             file_path = fs.save(dataset.name, dataset)
#             file_full_path = os.path.join(UPLOAD_DIR, file_path)

#             # Detect encoding
#             encoding = detect_encoding(file_full_path)

#             # Load the file into a DataFrame
#             df = pd.read_csv(file_full_path, encoding=encoding)

#             # Profiling logic (or other processing)
#             profiling_results = {
#                 "columns": list(df.columns),
#                 "row_count": len(df),
#                 "summary": df.describe(include='all').to_dict()
#             }

#             # Save results to MongoDB (optional)
#             data_entry = {
#                 "filename": dataset.name,
#                 "results": profiling_results
#             }
#             data_profiling_collection.insert_one(data_entry)

#             # Remove the uploaded file after processing
#             os.remove(file_full_path)

#             return JsonResponse({"message": "File processed and saved successfully.", "results": profiling_results}, status=201)

#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=500)
#     else:
#         return JsonResponse({"error": "No file uploaded."}, status=400)


# def process_dataset(file_path):
#     """
#     Processes the dataset and generates profiling results.
#     """
#     try:
#         # Load the file into a DataFrame
#         if file_path.endswith('.csv'):
#             df = pd.read_csv(file_path, encoding='utf-8')
#         elif file_path.endswith('.xls') or file_path.endswith('.xlsx'):
#             df = pd.read_excel(file_path, engine='openpyxl')
#         else:
#             raise ValueError("Unsupported file format. Only CSV and Excel are supported.")

#         # Generate an enhanced profiling report using ydata-profiling
#         profile = ProfileReport(df, title="Enhanced Data Profiling Report", explorative=True)

#         # Convert the profiling report to JSON
#         profiling_results = profile.to_dict()

#         return profiling_results
#     except Exception as e:
#         return {"error": f"Error processing file: {str(e)}"}


# @csrf_exempt
# def get_profiling_results(request):
#     """
#     Fetches profiling results from MongoDB.
#     """
#     if request.method == "GET":
#         try:
#             # Fetch all profiling results
#             results = list(data_profiling_collection.find({}, {"_id": 0}))
#             return JsonResponse({"data": results}, status=200)
#         except Exception as e:
#             return JsonResponse({"error": f"Error fetching profiling results: {str(e)}"}, status=500)
