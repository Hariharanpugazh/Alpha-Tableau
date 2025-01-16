from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from pymongo import MongoClient
from django.http import JsonResponse
from bson import ObjectId
import pandas as pd
import numpy as np
import chardet
from django.views.decorators.csrf import csrf_exempt
import logging

# MongoDB connection
client = MongoClient("mongodb+srv://ajaysihub:nrwULVWz8ysWBGK5@projects.dfhvc.mongodb.net/")
db = client["kutty_tableau"]
data_insights_collection = db["Data Insights"]

# Logger setup
logger = logging.getLogger(__name__)

@csrf_exempt
def upload_and_generate_insights(request):
    """
    Handles file uploads, generates insights, and stores them in MongoDB.
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
            file_content = dataset.read()
            insights_results = generate_insights(file_content, file_name)

            if "error" in insights_results:
                return JsonResponse({"error": insights_results["error"]}, status=400)

            # Save results to MongoDB
            data_entry = {
                "upload_id": upload_id,
                "user_id": user_id,
                "filename": file_name,
                "insights": insights_results,
            }
            data_insights_collection.insert_one(data_entry)

            return JsonResponse(
                {
                    "message": "File processed and insights generated successfully.",
                    "upload_id": upload_id,
                    "insights": insights_results,
                },
                status=201,
            )
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "No file uploaded or invalid request method."}, status=400)


def detect_encoding(file_content):
    result = chardet.detect(file_content)
    return result['encoding']


def generate_insights(file_content, file_name):
    try:
        if file_name.endswith('.csv'):
            encoding = detect_encoding(file_content)
            df = pd.read_csv(pd.io.common.BytesIO(file_content), encoding=encoding)
        elif file_name.endswith('.xls'):
            try:
                import xlrd  # Ensure xlrd is installed
                df = pd.read_excel(pd.io.common.BytesIO(file_content), engine='xlrd')
            except ImportError:
                return {"error": "Required library for .xls files not installed. Install xlrd."}
        elif file_name.endswith('.xlsx'):
            df = pd.read_excel(pd.io.common.BytesIO(file_content), engine='openpyxl')
        else:
            return {"error": "Unsupported file format."}

        # Basic Information
        row_count = int(len(df))
        column_count = int(len(df.columns))
        columns = list(df.columns)

        # Numeric Summary
        numeric_columns = df.select_dtypes(include=['number'])
        numeric_summary = numeric_columns.describe().to_dict()

        # Convert NumPy types to Python types
        numeric_summary = {k: {sub_k: float(sub_v) if isinstance(sub_v, (np.int64, np.float64)) else sub_v
                               for sub_k, sub_v in v.items()}
                           for k, v in numeric_summary.items()}

        # Frequent Values
        categorical_columns = df.select_dtypes(include=['object', 'category'])
        frequent_values = {}
        for col in categorical_columns:
            frequent_values[col] = {str(k): int(v) for k, v in df[col].value_counts().head(5).to_dict().items()}

        # Missing Values
        missing_values = {col: int(count) for col, count in df.isnull().sum().items()}

        # Correlations
        correlations = (numeric_columns.corr().to_dict() if not numeric_columns.empty else {})
        correlations = {k: {sub_k: float(sub_v) for sub_k, sub_v in v.items()}
                        for k, v in correlations.items()}

        # Outlier Detection
        outliers = {}
        for col in numeric_columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers[col] = int(((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))).sum())

        # Skewness and Kurtosis
        skewness = {col: float(value) for col, value in numeric_columns.skew().items()}
        kurtosis = {col: float(value) for col, value in numeric_columns.kurt().items()}

        # Data Preview
        data_preview = df.head(5).to_dict(orient='records')

        # Compile insights
        insights = {
            "basic_info": {
                "row_count": row_count,
                "column_count": column_count,
                "columns": columns,
            },
            "numeric_summary": numeric_summary,
            "frequent_values": frequent_values,
            "missing_values": missing_values,
            "correlations": correlations,
            "outliers": outliers,
            "skewness": skewness,
            "kurtosis": kurtosis,
            "data_preview": data_preview,
        }

        return insights

    except Exception as e:
        logger.error(f"Error processing insights: {str(e)}")
        return {"error": f"Error processing file: {str(e)}"}


@csrf_exempt
def get_insight_data(request, upload_id):
    """
    Fetch insight data for the given upload_id.
    """
    if request.method == 'GET':
        try:
            # Find the data in MongoDB by upload_id
            data_entry = data_insights_collection.find_one({"upload_id": upload_id})
            if not data_entry:
                return JsonResponse({"error": "Data not found for the given upload_id."}, status=404)

            # Prepare data for response
            insights = data_entry["insights"]
            return JsonResponse({"message": "Insights fetched successfully.", "data": insights}, status=200)
        except Exception as e:
            logger.error(f"Error fetching insight data: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=400)
