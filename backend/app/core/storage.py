import uuid
import boto3
import requests
from fastapi import UploadFile, HTTPException
from app.core.config import settings

def get_s3_client():
    if not settings.r2_endpoint_url:
        return None
        
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )

async def upload_file_to_r2(file: UploadFile, folder: str = "messaging") -> str:
    s3_client = get_s3_client()
    if not s3_client:
        raise ValueError("R2 Storage is not configured in settings.")

    file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = f"{folder}/{uuid.uuid4().hex}.{file_extension}"

    file.file.seek(0)
    s3_client.upload_fileobj(
        file.file,
        settings.r2_bucket_name,
        unique_filename,
        ExtraArgs={"ContentType": file.content_type}
    )

    base_url = settings.r2_public_url.rstrip("/")
    return f"{base_url}/{unique_filename}"


async def upload_video_to_bunny(file: UploadFile) -> str:
    if not settings.bunny_stream_api_key or not settings.bunny_stream_library_id:
        raise ValueError("Bunny Stream is not configured.")

    library_id = settings.bunny_stream_library_id
    api_key = settings.bunny_stream_api_key
    
    # 1. Create Video Object
    create_url = f"https://video.bunnycdn.com/library/{library_id}/videos"
    headers = {
        "AccessKey": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    create_payload = {"title": file.filename}
    
    resp = requests.post(create_url, json=create_payload, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Failed to create video in Bunny Stream: {resp.text}")
        
    guid = resp.json().get("guid")
    if not guid:
        raise HTTPException(status_code=500, detail="Bunny Stream did not return a guid.")

    # 2. Upload Video Content
    upload_url = f"https://video.bunnycdn.com/library/{library_id}/videos/{guid}"
    upload_headers = {
        "AccessKey": api_key,
        "Content-Type": "application/octet-stream"
    }
    
    file.file.seek(0)
    upload_resp = requests.put(upload_url, headers=upload_headers, data=file.file)
    if upload_resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Failed to upload video data to Bunny Stream: {upload_resp.text}")
        
    # Return playback URL (assuming default Bunny Stream setup)
    bunny_cdn = settings.bunny_stream_cdn.rstrip("/")
    # typically https://{bunny_cdn}/{guid}/playlist.m3u8 but returning generic url for player
    return f"{bunny_cdn}/{guid}/playlist.m3u8"
