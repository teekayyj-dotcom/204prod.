from pydantic import BaseModel


class PaginationMeta(BaseModel):
    total: int
    page: int = 1
    page_size: int = 12
