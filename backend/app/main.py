from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import redis.asyncio as redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_pagination import add_pagination

from app.core.config import settings
from app.modules.auth.api import router as auth_router
from app.modules.categories.api import router as categories_router
from app.modules.contacts.api import router as contacts_router
from app.modules.media.api import router as media_router
from app.modules.projects.api import router as projects_router
from app.modules.users.api import router as users_router
from app.modules.crew.api import router as crew_router
from app.modules.hr.api import router as hr_router
from app.modules.finance.api import router as finance_router
from app.modules.notifications.api import router as notifications_router
from app.modules.messaging.api import router as messaging_router
from app.modules.kanban.api import router as kanban_router

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.modules.hr.service import seed_hr_data
from app.modules.finance.service import seed_finance_data
from app.core.firebase_admin_init import init_firebase_admin

import asyncio
from datetime import datetime, timedelta
from app.modules.hr.service import check_and_mark_absences
from app.modules.hr.attendance_scheduler import attendance_scheduler_loop

async def daily_absent_check():
    while True:
        now = datetime.now()
        target = now.replace(hour=23, minute=59, second=0, microsecond=0)
        if now >= target:
            target += timedelta(days=1)
        wait_seconds = (target - now).total_seconds()
        
        await asyncio.sleep(wait_seconds)
        
        # Check and mark absences at 23:59
        target_date_str = target.strftime("%Y-%m-%d")
        db = SessionLocal()
        try:
            check_and_mark_absences(db, target_date_str)
        except Exception as e:
            print("Failed to run daily absent check:", e)
        finally:
            db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto create tables if not present in dev
    init_db()
    
    # Initialize Firebase Admin SDK
    init_firebase_admin()
    
    # Initialize Redis Cache
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    redis_client = redis.from_url(redis_url)
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
    
    # Seed data
    db = SessionLocal()
    try:
        seed_hr_data(db)
        seed_finance_data(db)
        
        # Sync crew data to user table to ensure display names and avatars exist
        from app.modules.users.service import sync_users_from_crew
        sync_users_from_crew(db)
    finally:
        db.close()

    # Start cron tasks
    absent_task = asyncio.create_task(daily_absent_check())
    attendance_scheduler_task = asyncio.create_task(attendance_scheduler_loop(interval_seconds=30))

    yield

    # Cleanup cron tasks
    absent_task.cancel()
    attendance_scheduler_task.cancel()



app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{settings.api_v1_prefix}/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(projects_router, prefix=settings.api_v1_prefix)
app.include_router(media_router, prefix=settings.api_v1_prefix)
app.include_router(categories_router, prefix=settings.api_v1_prefix)
app.include_router(contacts_router, prefix=settings.api_v1_prefix)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(crew_router, prefix=settings.api_v1_prefix)
app.include_router(hr_router, prefix=settings.api_v1_prefix)
app.include_router(finance_router, prefix=settings.api_v1_prefix)
app.include_router(notifications_router, prefix=f"{settings.api_v1_prefix}/notifications")
app.include_router(messaging_router, prefix=settings.api_v1_prefix)
app.include_router(kanban_router, prefix=f"{settings.api_v1_prefix}/kanban")

from fastapi.staticfiles import StaticFiles
import os

# Mount static files for local uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Add pagination support
add_pagination(app)

