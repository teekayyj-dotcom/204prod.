import re

with open("backend/app/modules/projects/models.py", "r") as f:
    content = f.read()

old_credit = r"""    name: Mapped\[str\] = mapped_column\(String\(160\), nullable=False\)
    sort_order: Mapped\[int\] = mapped_column\(Integer, nullable=False, default=0\)

    project: Mapped\[Project\] = relationship\("Project", back_populates="credits"\)"""

new_credit = """    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    crew_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="credits")"""

# Wait, let's use a simpler regex
content = content.replace(
    "sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)",
    "sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)\n    crew_id: Mapped[int | None] = mapped_column(Integer, nullable=True)"
)

with open("backend/app/modules/projects/models.py", "w") as f:
    f.write(content)

print("Updated models.py")
