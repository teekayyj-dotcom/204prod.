import os
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

# Path to the root specs directory
SPECS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../specs"))

class KanbanTask(BaseModel):
    id: str
    specId: str
    status: str
    description: str
    createdAt: str
    originalLine: int

class UpdateTaskRequest(BaseModel):
    taskId: str
    originalLine: int
    newStatus: str

@router.get("/tasks", response_model=List[KanbanTask])
def get_kanban_tasks():
    tasks = []
    if not os.path.exists(SPECS_DIR):
        return tasks

    for spec_name in os.listdir(SPECS_DIR):
        spec_path = os.path.join(SPECS_DIR, spec_name)
        if not os.path.isdir(spec_path):
            continue

        tasks_file = os.path.join(spec_path, "tasks.md")
        if not os.path.exists(tasks_file):
            continue

        try:
            stat = os.stat(tasks_file)
            # Use mtime or birthtime. On some OS birthtime might not be available
            created_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
            
            with open(tasks_file, "r", encoding="utf-8") as f:
                lines = f.readlines()

            for i, line in enumerate(lines):
                # Regex to match: - [ ] T001 Description...
                # Group 1: status (x, ' ', /)
                # Group 2: optional Task ID (e.g., T001)
                # Group 3: description
                match = re.match(r'^\s*-\s*\[([ xX\/])\]\s*(T\d+)?\s*(.*)$', line)
                if match:
                    raw_status = match.group(1).lower()
                    status = "todo"
                    if raw_status == 'x':
                        status = "done"
                    elif raw_status == '/':
                        status = "in-progress"

                    task_id = match.group(2) if match.group(2) else f"{spec_name}-L{i}"
                    description = match.group(3).strip()

                    tasks.append(KanbanTask(
                        id=f"{spec_name}::{task_id}",
                        specId=spec_name,
                        status=status,
                        description=description,
                        createdAt=created_at,
                        originalLine=i
                    ))
        except Exception as e:
            print(f"Error reading {tasks_file}: {e}")

    return tasks


@router.put("/tasks/{spec_id}/update")
def update_task_status(spec_id: str, req: UpdateTaskRequest):
    tasks_file = os.path.join(SPECS_DIR, spec_id, "tasks.md")
    
    if not os.path.exists(tasks_file):
        raise HTTPException(status_code=404, detail="tasks.md not found for this spec")

    try:
        with open(tasks_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        original_line = req.originalLine
        if original_line < 0 or original_line >= len(lines):
            raise HTTPException(status_code=400, detail="Invalid line number")

        line = lines[original_line]
        
        status_char = ' '
        if req.newStatus == 'done':
            status_char = 'x'
        elif req.newStatus == 'in-progress':
            status_char = '/'

        # Safe regex replace for the checkbox
        def replacer(m):
            return m.group(1) + status_char + m.group(2)

        updated_line = re.sub(r'^(\s*-\s*\[)[ xX\/](\])', replacer, line)
        lines[original_line] = updated_line

        with open(tasks_file, "w", encoding="utf-8") as f:
            f.writelines(lines)

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
