from sqlalchemy import Column, Integer, String, Text
from database import Base

class FutureContent(Base):
    __tablename__ = "future_content"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(500), nullable=True)
    display_text = Column(Text, nullable=True)
    sparkle_color = Column(String(50), default="#FFD700") # For fun customization

class GalleryPhoto(Base):
    __tablename__ = "gallery_photos"

    id = Column(Integer, primary_key=True, index=True)
    src = Column(String(500), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(200), nullable=True) # Comma-separated tags
