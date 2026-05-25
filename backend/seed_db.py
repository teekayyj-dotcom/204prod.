import asyncio
from datetime import datetime, timezone

from sqlalchemy import text
from app.db.session import SessionLocal
from app.modules.categories.models import Category
from app.modules.projects.models import Client, Project, ProjectCredit, ProjectGalleryImage
from app.modules.media.models import MediaAsset
from app.modules.users.models import User


def seed_database():
    db = SessionLocal()
    try:
        # Clear existing data for simplicity in dev (optional, but requested to "replace all")
        db.execute(text("TRUNCATE TABLE project_gallery_images CASCADE"))
        db.execute(text("TRUNCATE TABLE project_credits CASCADE"))
        db.execute(text("TRUNCATE TABLE projects CASCADE"))
        db.execute(text("TRUNCATE TABLE clients CASCADE"))
        db.execute(text("TRUNCATE TABLE categories CASCADE"))
        db.execute(text("TRUNCATE TABLE media_assets CASCADE"))
        db.execute(text("TRUNCATE TABLE users CASCADE"))
        db.commit()

        # Seed Users (Crew Members)
        users = [
            User(id=1, username="sarah", email="sarah@204prod.com", password_hash="hash", role="Creative Director"),
            User(id=2, username="jake", email="jake@204prod.com", password_hash="hash", role="Motion Designer"),
            User(id=3, username="maya", email="maya@204prod.com", password_hash="hash", role="Product Designer"),
            User(id=4, username="noah", email="noah@204prod.com", password_hash="hash", role="Photographer", active=False),
        ]
        db.add_all(users)

        # Seed Categories
        categories = [
            Category(slug="branding", name="Branding"),
            Category(slug="web-design", name="Web Design"),
            Category(slug="motion", name="Motion"),
            Category(slug="marketing", name="Marketing"),
            Category(slug="ui-ux", name="UI/UX"),
            Category(slug="photography", name="Photography"),
        ]
        db.add_all(categories)

        # Seed Media
        def get_shot(idx):
            return f"https://images.unsplash.com/{idx}?auto=format&fit=crop&w=1200&q=80"

        media = [
            MediaAsset(id="media-1", kind="image", url=get_shot("photo-1516321318423-f06f85e504b3")),
            MediaAsset(id="media-2", kind="image", url=get_shot("photo-1518005020951-eccb494ad742")),
            MediaAsset(id="media-3", kind="image", url=get_shot("photo-1497366754035-f200968a6e72")),
            MediaAsset(id="media-4", kind="image", url=get_shot("photo-1524758631624-e2822e304c36")),
            MediaAsset(id="media-5", kind="image", url=get_shot("photo-1516321497487-e288fb19713f")),
            MediaAsset(id="media-6", kind="image", url=get_shot("photo-1492691527719-9d1e07e534b4")),
        ]
        db.add_all(media)

        # Seed Clients
        clients = [
            Client(slug="client-aurora", name="Aurora Labs", website="https://auroralabs.co"),
            Client(slug="client-slate", name="Slate House", website="https://slatehouse.studio"),
            Client(slug="client-pulse", name="Pulse Media", website="https://pulsemedia.io"),
            Client(slug="client-nova", name="Nova Goods", website="https://novagoods.com"),
        ]
        db.add_all(clients)

        # Seed Projects
        projects = [
            Project(
                slug="proj-aurora-rebrand",
                title="Aurora Platform Rebrand",
                client_slug="client-aurora",
                format_slug="branding",
                year=2026,
                featured=True,
                status="published",
                cover_media_id="media-1",
                summary="A tactile fashion film balancing sharp studio geometry with humid street atmosphere.",
                published_at=datetime.now(timezone.utc),
            ),
            Project(
                slug="proj-slate-site",
                title="Slate House Portfolio",
                client_slug="client-slate",
                format_slug="web-design",
                year=2026,
                featured=True,
                status="draft",
                cover_media_id="media-2",
                published_at=datetime.now(timezone.utc),
            ),
            Project(
                slug="proj-pulse-campaign",
                title="Pulse Summer Campaign",
                client_slug="client-pulse",
                format_slug="marketing",
                year=2026,
                featured=False,
                status="draft",
                cover_media_id="media-3",
                published_at=datetime.now(timezone.utc),
            ),
            Project(
                slug="proj-nova-ecom",
                title="Nova Goods Product Launch",
                client_slug="client-nova",
                format_slug="ui-ux",
                year=2026,
                featured=True,
                status="published",
                cover_media_id="media-4",
                published_at=datetime.now(timezone.utc),
            ),
            Project(
                slug="proj-aurora-motion",
                title="Aurora Motion Toolkit",
                client_slug="client-aurora",
                format_slug="motion",
                year=2026,
                featured=False,
                status="published",
                cover_media_id="media-5",
                published_at=datetime.now(timezone.utc),
            ),
            Project(
                slug="proj-slate-photo",
                title="Slate Editorial Shoot",
                client_slug="client-slate",
                format_slug="photography",
                year=2026,
                featured=False,
                status="published",
                cover_media_id="media-6",
                published_at=datetime.now(timezone.utc),
            ),
        ]
        db.add_all(projects)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
