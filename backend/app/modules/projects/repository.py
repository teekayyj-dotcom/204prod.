from app.modules.projects.schemas import ProjectDetail


PROJECTS: list[ProjectDetail] = [
    ProjectDetail(
        title="Midnight Textile",
        slug="midnight-textile",
        client="Mira Atelier",
        year=2025,
        format="fashion",
        featured=True,
        cover_image="/projects/midnight-textile/cover.jpg",
        summary="A tactile fashion film balancing sharp studio geometry with humid street atmosphere.",
        credits=["Direction: 204PROD", "DOP: Linh Tran", "Edit: Nhat Minh"],
        gallery=[
            "/projects/midnight-textile/frame-01.jpg",
            "/projects/midnight-textile/frame-02.jpg",
            "/projects/midnight-textile/frame-03.jpg",
        ],
    ),
    ProjectDetail(
        title="Neon Harvest",
        slug="neon-harvest",
        client="Field Theory",
        year=2024,
        format="brand-film",
        featured=True,
        cover_image="/projects/neon-harvest/cover.jpg",
        summary="A saturated campaign film built around movement, texture, and ritualized product framing.",
        credits=["Direction: 204PROD", "Production Design: Kha Nguyen"],
        gallery=[
            "/projects/neon-harvest/frame-01.jpg",
            "/projects/neon-harvest/frame-02.jpg",
        ],
    ),
]


def list_projects() -> list[ProjectDetail]:
    return PROJECTS


def get_project_by_slug(slug: str) -> ProjectDetail | None:
    return next((project for project in PROJECTS if project.slug == slug), None)
