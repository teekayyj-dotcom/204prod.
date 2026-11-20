import os
import sys
import unittest
import uuid

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# Ensure backend path is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.db.base import Base, import_models
from app.modules.media.models import MediaAsset, MediaFolder
from app.modules.projects.models import Client, Project
from app.modules.categories.models import Category
from app.modules.media.service import finalize_media_asset, create_media_folder
from app.modules.media.schemas import MediaFolderCreate, VideoSaveRequest
from app.modules.media.api import save_video_to_db
from app.modules.projects.schemas import ProjectCreate
from app.modules.projects.service import create_project


class TestMediaForeignKeyGrounding(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import_models()
        # Enable SQLite foreign key enforcement
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )

        @event.listens_for(cls.engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()
        for slug, name in [("tvc", "TVC"), ("commercial", "Commercial")]:
            if not self.db.query(Category).filter(Category.slug == slug).first():
                self.db.add(Category(slug=slug, name=name, type="format"))
        self.db.commit()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_finalize_with_nonexistent_project_slug(self):
        """Finalize should not fail with foreign key error when project does not exist."""
        asset_id = str(uuid.uuid4())
        asset = finalize_media_asset(
            db=self.db,
            asset_id=asset_id,
            url=f"https://cdn.example.com/{asset_id}.jpg",
            thumbnail_url=None,
            mime_type="image/jpeg",
            file_size=1024,
            alt="Test Image",
            caption="Test Caption",
            client_slug=None,
            project_slug="non-existent-project-slug",
            folder="thumbnail"
        )
        self.assertIsNotNone(asset)
        self.assertEqual(asset.id, asset_id)
        # Foreign key must be sanitized to None to avoid foreign key failure
        self.assertIsNone(asset.project_slug)

    def test_finalize_with_nonexistent_client_slug(self):
        """Finalize should not fail with foreign key error when client does not exist."""
        asset_id = str(uuid.uuid4())
        asset = finalize_media_asset(
            db=self.db,
            asset_id=asset_id,
            url=f"https://cdn.example.com/{asset_id}.jpg",
            thumbnail_url=None,
            mime_type="image/jpeg",
            file_size=1024,
            client_slug="non-existent-client-slug",
            project_slug=None
        )
        self.assertIsNotNone(asset)
        self.assertIsNone(asset.client_slug)

    def test_finalize_with_empty_and_whitespace_slugs(self):
        """Finalize should sanitize empty or whitespace-only slugs to None."""
        asset_id = str(uuid.uuid4())
        asset = finalize_media_asset(
            db=self.db,
            asset_id=asset_id,
            url=f"https://cdn.example.com/{asset_id}.jpg",
            thumbnail_url=None,
            mime_type="image/jpeg",
            file_size=500,
            client_slug="   ",
            project_slug=""
        )
        self.assertIsNotNone(asset)
        self.assertIsNone(asset.client_slug)
        self.assertIsNone(asset.project_slug)

    def test_finalize_with_existing_project_and_client(self):
        """Finalize should keep project_slug and client_slug when they exist in DB."""
        client = Client(name="Grounding Client", slug="grounding-client")
        self.db.add(client)
        self.db.commit()

        project = Project(
            title="Grounding Project",
            slug="grounding-project",
            client_slug=client.slug,
            year=2026,
            format_slug="tvc"
        )
        self.db.add(project)
        self.db.commit()

        asset_id = str(uuid.uuid4())
        asset = finalize_media_asset(
            db=self.db,
            asset_id=asset_id,
            url=f"https://cdn.example.com/{asset_id}.jpg",
            thumbnail_url=None,
            mime_type="image/jpeg",
            file_size=2048,
            client_slug=client.slug,
            project_slug=project.slug,
            folder="thumbnail"
        )
        self.assertIsNotNone(asset)
        self.assertEqual(asset.client_slug, client.slug)
        self.assertEqual(asset.project_slug, project.slug)

    def test_create_project_auto_associates_preuploaded_media(self):
        """Pre-uploaded media assets should be linked to the project once project is created."""
        client = Client(name="Brand Alpha", slug="brand-alpha")
        self.db.add(client)
        self.db.commit()

        # Step 1: Upload thumbnail and video before project exists
        thumb_id = str(uuid.uuid4())
        thumb = finalize_media_asset(
            db=self.db,
            asset_id=thumb_id,
            url=f"https://cdn.example.com/{thumb_id}.webp",
            thumbnail_url=None,
            mime_type="image/webp",
            file_size=1200,
            client_slug=client.slug,
            project_slug=None,
            folder="thumbnail"
        )
        self.assertIsNone(thumb.project_slug)

        video_id = str(uuid.uuid4())
        video = finalize_media_asset(
            db=self.db,
            asset_id=video_id,
            url=f"https://video.example.com/{video_id}.mp4",
            thumbnail_url=None,
            mime_type="video/mp4",
            file_size=50000,
            client_slug=client.slug,
            project_slug=None,
            folder="final video"
        )
        self.assertIsNone(video.project_slug)

        # Step 2: Create project referencing cover_media_id and video_url
        new_proj_payload = ProjectCreate(
            title="Brand Alpha Launch",
            slug="brand-alpha-launch",
            client_slug=client.slug,
            year=2026,
            format_slug="commercial",
            cover_media_id=thumb_id,
            video_url=video.url
        )
        created_project = create_project(self.db, new_proj_payload)
        self.assertEqual(created_project.slug, "brand-alpha-launch")

        # Step 3: Verify the media assets were automatically associated with the project
        refreshed_thumb = self.db.query(MediaAsset).filter(MediaAsset.id == thumb_id).first()
        refreshed_video = self.db.query(MediaAsset).filter(MediaAsset.id == video_id).first()

        self.assertEqual(refreshed_thumb.project_slug, created_project.slug)
        self.assertEqual(refreshed_thumb.client_slug, client.slug)
        self.assertEqual(refreshed_video.project_slug, created_project.slug)
        self.assertEqual(refreshed_video.client_slug, client.slug)

    def test_save_video_to_db_with_nonexistent_project_slug(self):
        """save_video_to_db should handle non-existent project_slug safely."""
        req = VideoSaveRequest(
            video_id=f"bunny-video-{uuid.uuid4().hex[:6]}",
            title="Sample Video",
            client_slug=None,
            project_slug="non-existent-proj",
            folder="demo"
        )
        asset = save_video_to_db(req, self.db)
        self.assertIsNotNone(asset)
        self.assertIsNone(asset.project_slug)

    def test_create_media_folder_foreign_key_safety(self):
        """create_media_folder should handle non-existent slugs safely."""
        folder_create = MediaFolderCreate(
            name="Orphan Folder",
            client_slug="nonexistent-client",
            project_slug="nonexistent-project",
            parent_id="nonexistent-parent"
        )
        folder = create_media_folder(self.db, folder_create)
        self.assertIsNotNone(folder)
        self.assertIsNone(folder.client_slug)
        self.assertIsNone(folder.project_slug)
        self.assertIsNone(folder.parent_id)


if __name__ == "__main__":
    unittest.main()
