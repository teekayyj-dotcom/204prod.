from pydantic import BaseModel

class Category(BaseModel):
    name: str
    slug: str
    description: str | None = None
    type: str = "format"

class CategoryDetail(Category):
    pass

