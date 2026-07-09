import os
import re

frontend_src = "/Users/macbook/Documents/Documents - Teekayyj/204prod./frontend/src"

for root, _, files in os.walk(frontend_src):
    for f in files:
        if f.endswith(".tsx"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            
            orig_content = content
            
            # Replace array definition
            # Find arrays like ["All", "In Progress", "Review", "Planning", "Completed"]
            content = re.sub(
                r'\["All", "In Progress", "Review", "Planning", "Completed"\]',
                r'["All", "In Progress", "Review", "Planning", "Completed", "Other"]',
                content
            )
            content = re.sub(
                r'\["All", "Planning", "In Progress", "Review", "Completed"\]',
                r'["All", "Planning", "In Progress", "Review", "Completed", "Other"]',
                content
            )
            
            # Replace <option value="Completed">Completed</option> inside select
            if '<option value="Completed">Completed</option>' in content and not '<option value="Other">Other</option>' in content:
                content = content.replace(
                    '<option value="Completed">Completed</option>',
                    '<option value="Completed">Completed</option>\n                                            <option value="Other">Other</option>'
                )
            
            # Replace statusColors map
            # Find Planning: { bg: ..., text: ... },
            if re.search(r'(Planning:\s*\{\s*bg:\s*[^}]+\})', content):
                if 'Other:' not in content and 'Other :' not in content:
                    content = re.sub(
                        r'(Planning:\s*\{\s*bg:\s*[^}]+\}),?',
                        r'\1,\n    Other: { bg: "rgba(136,136,136,0.15)", text: "#888888" },',
                        content
                    )
            
            # For ClientProfilePage projectStatusColors
            if re.search(r'("Planning":\s*\{\s*bg:\s*[^}]+\})', content):
                if '"Other":' not in content:
                    content = re.sub(
                        r'("Planning":\s*\{\s*bg:\s*[^}]+\}),?',
                        r'\1,\n    "Other": { bg: "rgba(136,136,136,0.15)", text: "#888888" },',
                        content
                    )
                    
            if content != orig_content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(content)
                print("Updated", path)
