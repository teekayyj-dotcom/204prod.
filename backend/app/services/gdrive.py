import os
import re
import json
import base64
import glob
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']


def extract_folder_id(url: str) -> str:
    """Extracts the Google Drive folder ID from various formats of URLs."""
    if not url:
        return ""
    url = url.strip()
    # Match id= parameter
    match = re.search(r'id=([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    
    # Match folders/ parameter
    match = re.search(r'folders/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    
    return url  # Return as-is, maybe they pasted the ID directly


def get_drive_service():
    """Returns an authenticated Google Drive API service."""
    creds = None

    # 1. Check environment variable for raw JSON string or base64 JSON
    for env_var in ["GDRIVE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON", "FIREBASE_SERVICE_ACCOUNT_JSON"]:
        val = os.getenv(env_var)
        if val and val.strip():
            val = val.strip()
            try:
                if not val.startswith("{"):
                    val = base64.b64decode(val).decode("utf-8")
                info = json.loads(val)
                creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
                if creds:
                    break
            except Exception as e:
                print(f"Warning: Failed to load credentials from {env_var}: {e}")

    # 2. Check environment variable pointing to a file path
    if not creds:
        for env_path_var in ["GDRIVE_SERVICE_ACCOUNT_FILE", "GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT_PATH"]:
            path = os.getenv(env_path_var)
            if path and os.path.exists(path):
                try:
                    creds = service_account.Credentials.from_service_account_file(path, scopes=SCOPES)
                    if creds:
                        break
                except Exception as e:
                    print(f"Warning: Failed to load credentials from {path}: {e}")

    # 3. Check standard search locations for credentials file
    if not creds:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/ or /app
        candidate_paths = [
            os.path.join(base_dir, "system-204prod-93a59085020c.json"),
            os.path.join(base_dir, "credentials.json"),
            os.path.join(base_dir, "firebase-service-account.json"),
            "/app/system-204prod-93a59085020c.json",
            "/app/credentials.json",
            "/app/firebase-service-account.json",
            "system-204prod-93a59085020c.json",
            "credentials.json",
        ]

        # Check any system-*.json file in base_dir or /app
        for f in glob.glob(os.path.join(base_dir, "system-*.json")):
            if f not in candidate_paths:
                candidate_paths.append(f)
        for f in glob.glob("/app/system-*.json"):
            if f not in candidate_paths:
                candidate_paths.append(f)

        for path in candidate_paths:
            if os.path.exists(path):
                try:
                    creds = service_account.Credentials.from_service_account_file(path, scopes=SCOPES)
                    if creds:
                        break
                except Exception as e:
                    print(f"Warning: Failed to load credentials from candidate {path}: {e}")

    if not creds:
        raise Exception(
            "Service account credentials not found. Please set GDRIVE_SERVICE_ACCOUNT_JSON in .env "
            "or mount system-204prod-93a59085020c.json into /app/system-204prod-93a59085020c.json."
        )

    service = build('drive', 'v3', credentials=creds)
    return service


def fetch_folder_images(folder_id: str):
    """Fetches all image files from a specific Google Drive folder."""
    service = get_drive_service()
    
    query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
    fields = "nextPageToken, files(id, name, thumbnailLink, webContentUrl, mimeType)"
    
    all_files = []
    page_token = None
    
    while True:
        results = service.files().list(
            q=query,
            pageSize=1000,
            fields=fields,
            pageToken=page_token,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True
        ).execute()
        
        items = results.get('files', [])
        all_files.extend(items)
        
        page_token = results.get('nextPageToken')
        if not page_token:
            break
            
    return all_files
