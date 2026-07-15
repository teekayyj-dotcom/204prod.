import urllib.request
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import io

app = FastAPI()

@app.get("/cors-proxy")
def cors_proxy(url: str):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        content = response.read()
    return StreamingResponse(io.BytesIO(content), media_type="image/webp", headers={"Access-Control-Allow-Origin": "*"})
