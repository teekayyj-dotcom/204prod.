import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import engine
from sqlalchemy import text
with engine.begin() as conn:
    conn.execute(text('DROP TABLE IF EXISTS messaging_poll_votes'))
