from datetime import datetime
from pydantic import BaseModel


class MediaAsset(BaseModel):
    id: str
    kind: str
    url: str
    alt: str | None = None
    caption: str | None = None
    width: int | None = None
    height: int | None = None
    mime_type: str | None = None
    file_size: int | None = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
