import sqlite3
import os

def run():
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'app.db')
    if not os.path.exists(db_path):
        db_path = os.path.join(os.path.dirname(__file__), 'backend', 'project.db')
        
    print(f"Using db: {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    try:
        # Create media_folders table
        c.execute("""
            CREATE TABLE IF NOT EXISTS media_folders (
                id VARCHAR(160) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                client_slug VARCHAR(120) REFERENCES clients(slug) ON DELETE CASCADE,
                project_slug VARCHAR(160) REFERENCES projects(slug) ON DELETE CASCADE,
                parent_id VARCHAR(160) REFERENCES media_folders(id) ON DELETE CASCADE,
                is_published BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        """)
        
        # Add columns to media_assets
        try:
            c.execute("ALTER TABLE media_assets ADD COLUMN folder_id VARCHAR(160) REFERENCES media_folders(id) ON DELETE SET NULL")
        except Exception as e:
            print("folder_id column might already exist:", e)
            
        try:
            c.execute("ALTER TABLE media_assets ADD COLUMN is_published BOOLEAN DEFAULT 0")
        except Exception as e:
            print("is_published column might already exist:", e)
            
        conn.commit()
        print("Database schema updated successfully.")
    except Exception as e:
        print("Error updating schema:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    run()
