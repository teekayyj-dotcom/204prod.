import hashlib
import time
import urllib.request
import json

library_id = "694348"
api_key = "d4b28542-9e6d-41b8-a63034485f5b-d7c7-4e41"

# 1. Create Video
url = f"https://video.bunnycdn.com/library/{library_id}/videos"
data = json.dumps({"title": "test_direct_upload"}).encode("utf-8")
req = urllib.request.Request(url, data=data, method="POST")
req.add_header("AccessKey", api_key)
req.add_header("Content-Type", "application/json")
req.add_header("Accept", "application/json")

with urllib.request.urlopen(req) as response:
    res_data = json.loads(response.read().decode("utf-8"))
    video_id = res_data.get("guid")

print(f"VideoId: {video_id}")

# 2. Signature
expiration_time = int(time.time()) + 3600
string_to_sign = f"{library_id}{api_key}{expiration_time}{video_id}"
signature = hashlib.sha256(string_to_sign.encode("utf-8")).hexdigest()

print(f"Signature: {signature}")
print(f"Expiration: {expiration_time}")

# Try to upload a 1 byte file using signature
upload_url = f"https://video.bunnycdn.com/library/{library_id}/videos/{video_id}"
req2 = urllib.request.Request(upload_url, data=b"a", method="PUT")
req2.add_header("AuthorizationSignature", signature)
req2.add_header("AuthorizationExpire", str(expiration_time))
req2.add_header("LibraryId", library_id)
req2.add_header("VideoId", video_id)

try:
    with urllib.request.urlopen(req2) as response2:
        print("Upload success:", response2.read())
except Exception as e:
    print("Upload failed:", str(e))
