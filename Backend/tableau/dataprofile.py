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

# MongoDB connection
client = MongoClient("mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/")
db = client["kutty_tableau"]
users_collection = db["users"]
data_profiling_collection = db["Data Profile"]


# Logger setup
logger = logging.getLogger(__name__)

# JWT Secret and Algorithm
JWT_SECRET = "django-insecure-%1l2^d$2q8xuwtmv-z=_!&529loppvl)ikcs0&ef=safzcn=uw"  # Replace later with .env variable
JWT_ALGORITHM = "HS256"

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
            "data_types": [{"Column": col, "Type": str(dtype)} for col, dtype in df.dtypes.items()],
        }

        # Statistical Summary
        summary = df.describe(include="all").fillna('null').transpose().reset_index()
        summary.columns = ["Column"] + list(summary.columns[1:])  # Ensure column headers are clear
        summary_table = summary.to_dict(orient="records")

        # Handle datetime columns separately
        datetime_cols = df.select_dtypes(include=['datetime64']).columns
        datetime_summary = [
            {
                "Column": col,
                "Min": str(df[col].min()),
                "Max": str(df[col].max()),
                "Unique Count": df[col].nunique(),
            }
            for col in datetime_cols
        ]

        # Data Relationships (correlations)
        numeric_cols = df.select_dtypes(include=np.number)
        if not numeric_cols.empty:
            correlations = (
                numeric_cols.corr()
                .reset_index()
                .melt(id_vars=["index"], var_name="Variable 2", value_name="Correlation")
                .rename(columns={"index": "Variable 1"})
                .to_dict(orient="records")
            )
        else:
            correlations = []

        # Data Quality Metrics
        duplicates = len(df[df.duplicated()])
        null_values = [{"Column": col, "Null Count": int(count)} for col, count in df.isnull().sum().items()]
        outliers = [
            {"Column": col, "Outlier Count": int(df[(zscore(df[col].dropna()) > 3)].shape[0])}
            for col in numeric_cols.columns
        ]

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
            "summary": summary_table,
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
