import abc
import os
import uuid
from app.core.config import settings


class BaseStorageProvider(abc.ABC):
    @abc.abstractmethod
    def upload_file(self, file_content: bytes, filename: str, mime_type: str) -> str:
        """Uploads file content to storage and returns the public URL."""
        pass

    @abc.abstractmethod
    def delete_file(self, file_url: str) -> bool:
        """Deletes file from storage. Returns True if deleted, False otherwise."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        # Ensure uploads directory exists
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file_content: bytes, filename: str, mime_type: str) -> str:
        # Generate a unique filename using UUID to avoid duplicates
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        # Return URL
        return f"{settings.backend_url.rstrip('/')}/uploads/{unique_filename}"

    def delete_file(self, file_url: str) -> bool:
        # Extract filename from URL
        filename = file_url.split("/")[-1]
        file_path = os.path.join(self.upload_dir, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False


def get_storage_provider() -> BaseStorageProvider:
    provider_name = settings.storage_provider.lower()
    if provider_name == "local":
        return LocalStorageProvider()
    # Default to LocalStorageProvider for now
    return LocalStorageProvider()
