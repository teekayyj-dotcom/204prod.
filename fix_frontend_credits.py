import re

with open("frontend/src/modules/admin/pages/ProjectDetailPage.tsx", "r") as f:
    content = f.read()

# Update API payload
old_payload = """                budget: data.budget,
                summary: data.description,
                credits: assignedCrew.map(c => `${c.role}: ${c.name}`),
                gallery_media_ids: ["""

new_payload = """                budget: data.budget,
                summary: data.description,
                credits: assignedCrew.map(c => `${c.role}: ${c.name}`),
                structured_credits: assignedCrew.map(c => ({ role: c.role, name: c.name, crew_id: c.crewId })),
                gallery_media_ids: ["""

content = content.replace(old_payload, new_payload)

# Update loading logic
old_load = """            const loadedCredits = projData.credits || [];
            if (loadedCredits.length > 0) {
                const parsedCrew = loadedCredits.map((credStr, idx) => {
                    const parts = credStr.split(":");
                    const role = parts[0]?.trim() || "";
                    const name = parts[1]?.trim() || "";
                    return { id: `cred-${idx}-${Date.now()}`, name, role };
                });
                setAssignedCrew(parsedCrew);"""

new_load = """            const loadedCredits = projData.structured_credits || projData.credits || [];
            if (loadedCredits.length > 0) {
                const parsedCrew = loadedCredits.map((cred, idx) => {
                    if (typeof cred === 'string') {
                        const parts = cred.split(":");
                        const role = parts[0]?.trim() || "";
                        const name = parts[1]?.trim() || "";
                        return { id: `cred-${idx}-${Date.now()}`, name, role };
                    } else {
                        return { id: `cred-${idx}-${Date.now()}`, name: cred.name, role: cred.role, crewId: cred.crew_id };
                    }
                });
                setAssignedCrew(parsedCrew);"""

content = content.replace(old_load, new_load)

# Update React key
old_key = """                                            <div key={c.name} className="flex items-start justify-between p-2 rounded-lg\""""
new_key = """                                            <div key={c.crewId ? `id-${c.crewId}` : c.name} className="flex items-start justify-between p-2 rounded-lg\""""
content = content.replace(old_key, new_key)

with open("frontend/src/modules/admin/pages/ProjectDetailPage.tsx", "w") as f:
    f.write(content)

print("Updated ProjectDetailPage.tsx")
