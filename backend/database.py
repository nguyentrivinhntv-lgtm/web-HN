# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

import pymysql

# Use standard root/empty password for local testing if not provided
MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:@localhost:3306/future_db")

try:
    # Auto-create the database if it doesn't exist
    if "mysql" in MYSQL_URL:
        # Extract connection details
        import re
        match = re.search(r"mysql\+pymysql://(.*?):(.*?)@(.*?):(\d+)/(.*)", MYSQL_URL)
        if match:
            user, password, host, port, db_name = match.groups()
            conn = pymysql.connect(host=host, user=user, password=password, port=int(port))
            conn.cursor().execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            conn.close()

    engine = create_engine(MYSQL_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"Error connecting to database: {e}")
    # Fallback to sqlite for testing if MySQL fails
    engine = create_engine("sqlite:///./future.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
