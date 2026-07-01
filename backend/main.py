from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import os
import shutil

from database import engine, get_db, Base
from models import FutureContent

# Create tables
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Future Predictor API")

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContentResponse(BaseModel):
    id: int
    image_url: str
    display_text: str
    sparkle_color: str

    class Config:
        orm_mode = True

class ContentCreate(BaseModel):
    image_url: str
    display_text: str
    sparkle_color: str = "#FFD700"

@app.get("/api/content", response_model=List[ContentResponse])
def get_content(db: Session = Depends(get_db)):
    content = db.query(FutureContent).all()
    return content

@app.post("/api/admin/content", response_model=ContentResponse)
def create_content(content: ContentCreate, db: Session = Depends(get_db)):
    db_content = FutureContent(**content.dict())
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

class BulkContentCreate(BaseModel):
    images: List[str]
    display_text: str
    sparkle_color: str = "#FFD700"

@app.post("/api/admin/content/bulk")
def create_bulk_content(bulk: BulkContentCreate, db: Session = Depends(get_db)):
    # Delete old data
    db.query(FutureContent).delete()
    
    # Insert new data
    new_items = []
    for img_url in bulk.images:
        new_item = FutureContent(
            image_url=img_url,
            display_text=bulk.display_text,
            sparkle_color=bulk.sparkle_color
        )
        new_items.append(new_item)
        db.add(new_item)
        
    db.commit()
    return {"msg": f"Successfully updated {len(new_items)} images"}

@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...)):
    # Save the file to the uploads directory
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return relative URL, frontend will handle the domain
    return {"url": f"/uploads/{file.filename}"}

@app.post("/api/admin/content/setup_mock")
def setup_mock_data(db: Session = Depends(get_db)):
    """Convenience endpoint to insert some mock data if table is empty"""
    existing = db.query(FutureContent).first()
    if existing:
        return {"msg": "Data already exists"}
    
    mock_data = [
        FutureContent(
            image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80",
            display_text="Tương lai của bạn sẽ rực rỡ như một vì sao! ✨",
            sparkle_color="#FFD700"
        ),
        FutureContent(
            image_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80",
            display_text="Tiền bạc sẽ đến với bạn như nước mùa lũ! 💰",
            sparkle_color="#00FF00"
        ),
        FutureContent(
            image_url="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80",
            display_text="Tình yêu đẹp sẽ gõ cửa nhà bạn sớm thôi! ❤️",
            sparkle_color="#FF00FF"
        )
    ]
    db.bulk_save_objects(mock_data)
    db.commit()
    return {"msg": "Mock data created successfully"}
