import re

with open("backend/app/modules/projects/repository.py", "r") as f:
    content = f.read()

old_credits_map = '        credits=[f"{c.role}: {c.name}" for c in p.credits] if getattr(p, "credits", None) else [],'

new_credits_map = """        credits=[f"{c.role}: {c.name}" for c in p.credits] if getattr(p, "credits", None) else [],
        structured_credits=[{"role": c.role, "name": c.name, "crew_id": c.crew_id} for c in p.credits] if getattr(p, "credits", None) else [],"""

content = content.replace(old_credits_map, new_credits_map)

with open("backend/app/modules/projects/repository.py", "w") as f:
    f.write(content)

print("Updated repository.py")
