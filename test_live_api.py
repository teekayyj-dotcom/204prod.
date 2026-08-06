import urllib.request
import json
from collections import Counter

url = "https://204prod.vn/api/v1/media/folders?project_slug=milo-intro-video"
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"Total folders for milo-intro-video: {len(data)}")
        
        # Count root folders
        root_folders = [f for f in data if not f.get('parent_id')]
        print(f"Root folders: {len(root_folders)}")
        
        names = [f.get('name') for f in root_folders]
        counts = Counter(names)
        for name, count in counts.items():
            if count > 1:
                print(f"Duplicate root folder: '{name}' (Count: {count})")
except Exception as e:
    print(f"Error: {e}")
