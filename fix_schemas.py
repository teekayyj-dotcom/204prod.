import re

with open("backend/app/modules/projects/schemas.py", "r") as f:
    content = f.read()

# Add ProjectCreditDetail
credit_detail_class = """class ProjectCreditDetail(BaseModel):
    role: str
    name: str
    crew_id: int | None = None


class ProjectSummary(BaseModel):"""

content = content.replace("class ProjectSummary(BaseModel):", credit_detail_class)

# Update ProjectDetail
content = content.replace(
    "    credits: list[str]\n    gallery: list[GalleryImageDetail]",
    "    credits: list[str]\n    structured_credits: list[ProjectCreditDetail] | None = None\n    gallery: list[GalleryImageDetail]"
)

# Update ProjectUpdate
content = content.replace(
    "    credits: list[str] | None = None\n    gallery_media_ids: list[str] | None = None",
    "    credits: list[str] | None = None\n    structured_credits: list[ProjectCreditDetail] | None = None\n    gallery_media_ids: list[str] | None = None"
)

# Update ProjectCreate
content = content.replace(
    "    seo_description: str | None = None\n    video_url: str | None = None",
    "    seo_description: str | None = None\n    video_url: str | None = None\n    structured_credits: list[ProjectCreditDetail] | None = None\n"
)

with open("backend/app/modules/projects/schemas.py", "w") as f:
    f.write(content)

print("Updated schemas.py")
