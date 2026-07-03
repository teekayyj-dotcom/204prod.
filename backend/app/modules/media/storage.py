import abc
import os
import uuid
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

class BaseStorageProvider(abc.ABC):
    @abc.abstractmethod
    def upload_file(self, file_content: bytes, filename: str, mime_type: str, custom_key: str | None = None) -> str:
        """Uploads file content to storage and returns the public URL."""
        pass

    @abc.abstractmethod
    def delete_file(self, file_url: str) -> bool:
        """Deletes file from storage. Returns True if deleted, False otherwise."""
        pass

    @abc.abstractmethod
    def generate_presigned_put(self, object_name: str, content_type: str, max_size: int = 5242880):
        """Generates a presigned PUT URL and fields for direct upload."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file_content: bytes, filename: str, mime_type: str, custom_key: str | None = None) -> str:
        if custom_key:
            unique_filename = custom_key.replace("/", "_")
        else:
            ext = os.path.splitext(filename)[1]
            unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        return f"/uploads/{unique_filename}"

    def delete_file(self, file_url: str) -> bool:
        filename = file_url.split("/")[-1]
        file_path = os.path.join(self.upload_dir, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    def generate_presigned_put(self, object_name: str, content_type: str, max_size: int = 5242880):
        # Local storage doesn't support presigned URLs, this is a placeholder
        raise NotImplementedError("Local storage does not support presigned URLs")


class R2StorageProvider(BaseStorageProvider):
    def __init__(self):
        self.s3_client = boto3.client(
            service_name="s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",  # Cloudflare R2 requires region to be 'auto' or unspecified
        )
        self.bucket_name = settings.r2_bucket_name
        self.public_url = settings.r2_public_url.rstrip("/") if settings.r2_public_url else settings.r2_endpoint_url

    def upload_file(self, file_content: bytes, filename: str, mime_type: str, custom_key: str | None = None) -> str:
        if custom_key:
            key = custom_key
        else:
            ext = os.path.splitext(filename)[1]
            key = f"{uuid.uuid4()}{ext}"
        
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=file_content,
            ContentType=mime_type,
        )
        
        if settings.r2_public_url:
            return f"{self.public_url}/{key}"
        return f"{self.public_url}/{self.bucket_name}/{key}"

    def delete_file(self, file_url: str) -> bool:
        try:
            # Strip public url prefix
            prefix = self.public_url.rstrip("/")
            if file_url.startswith(prefix):
                key = file_url[len(prefix):].lstrip("/")
            else:
                from urllib.parse import urlparse
                parsed = urlparse(file_url)
                key = parsed.path.lstrip("/")
            
            # If key starts with bucket name, strip it
            if key.startswith(f"{self.bucket_name}/"):
                key = key[len(self.bucket_name) + 1:]
                
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            print(f"R2 delete failed: {e}")
            return False

    def generate_presigned_put(self, object_name: str, content_type: str, max_size: int = 5242880):
        """
        Generate a presigned URL PUT request to upload a file
        Note: R2 does not support presigned POST, so we use PUT.
        """
        try:
            response = self.s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_name,
                    "ContentType": content_type,
                },
                ExpiresIn=3600,
            )
            
            return {
                "url": response,
                "fields": {} # No fields needed for PUT, keeping structure compatible
            }
        except ClientError as e:
            print(f"Error generating presigned put: {e}")
            return None


def get_storage_provider() -> BaseStorageProvider:
    provider_name = settings.storage_provider.lower()
    if provider_name == "r2":
        return R2StorageProvider()
    return LocalStorageProvider()

