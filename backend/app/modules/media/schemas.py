from pydantic import BaseModel


class MediaAsset(BaseModel):
    id: str
    kind: str
    url: str
    alt: str
