from pydantic import BaseModel
from datetime import datetime

class Category(BaseModel):
    name: str
    slug: str

class CategoryDetail(Category):
    created_at: datetime
    updated_at: datetime
