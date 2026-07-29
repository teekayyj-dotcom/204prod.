import re
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
# Expecting the JSON file to be in the backend directory
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'system-204prod-93a59085020c.json')

def extract_folder_id(url: str) -> str:
    """Extracts the Google Drive folder ID from various formats of URLs."""
    # Match id= parameter
    match = re.search(r'id=([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    
    # Match folders/ parameter
    match = re.search(r'folders/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    
    return url # Return as-is, maybe they pasted the ID directly

def get_drive_service():
    """Returns an authenticated Google Drive API service."""
    creds = None
    if os.path.exists(SERVICE_ACCOUNT_FILE):
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    
    if not creds:
        raise Exception(f"Service account file not found at {SERVICE_ACCOUNT_FILE}")
        
    service = build('drive', 'v3', credentials=creds)
    return service

def fetch_folder_images(folder_id: str):
    """Fetches all image files from a specific Google Drive folder."""
    service = get_drive_service()
    
    query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
    
    # We need thumbnailLink and webContentUrl
    fields = "nextPageToken, files(id, name, thumbnailLink, webContentUrl, mimeType)"
    
    results = service.files().list(
        q=query,
        pageSize=500,
        fields=fields
    ).execute()
    
    items = results.get('files', [])
    return items
