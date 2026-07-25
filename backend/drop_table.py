from app.db.session import engine
from sqlalchemy import text
with engine.begin() as conn:
    conn.execute(text('DROP TABLE IF EXISTS messaging_poll_votes'))
