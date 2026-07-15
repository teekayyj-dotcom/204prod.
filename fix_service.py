import re

with open("backend/app/modules/projects/service.py", "r") as f:
    content = f.read()

# Update update_project
old_update_credits = """    if project.credits is not None:
        from app.modules.projects.models import ProjectCredit
        # Delete existing credits
        db.query(ProjectCredit).filter(ProjectCredit.project_slug == existing_project.slug).delete()
        # Add new ones
        for i, cred_str in enumerate(project.credits):
            if ":" in cred_str:
                role, name = cred_str.split(":", 1)
                db_credit = ProjectCredit(
                    project_slug=existing_project.slug,
                    role=role.strip(),
                    name=name.strip(),
                    sort_order=i
                )
                db.add(db_credit)"""

new_update_credits = """    if project.structured_credits is not None:
        from app.modules.projects.models import ProjectCredit
        db.query(ProjectCredit).filter(ProjectCredit.project_slug == existing_project.slug).delete()
        for i, cred in enumerate(project.structured_credits):
            db_credit = ProjectCredit(
                project_slug=existing_project.slug,
                role=cred.role.strip(),
                name=cred.name.strip(),
                crew_id=cred.crew_id,
                sort_order=i
            )
            db.add(db_credit)
    elif project.credits is not None:
        from app.modules.projects.models import ProjectCredit
        # Delete existing credits
        db.query(ProjectCredit).filter(ProjectCredit.project_slug == existing_project.slug).delete()
        # Add new ones
        for i, cred_str in enumerate(project.credits):
            if ":" in cred_str:
                role, name = cred_str.split(":", 1)
                db_credit = ProjectCredit(
                    project_slug=existing_project.slug,
                    role=role.strip(),
                    name=name.strip(),
                    sort_order=i
                )
                db.add(db_credit)"""

content = content.replace(old_update_credits, new_update_credits)

with open("backend/app/modules/projects/service.py", "w") as f:
    f.write(content)

print("Updated service.py")
