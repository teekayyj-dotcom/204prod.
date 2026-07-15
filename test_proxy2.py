import urllib.request
url = "http://localhost:8000/api/v1/media/cors-proxy?url=https%3A%2F%2Fpub-cb76d38f7e064360addb8a94ea474a91.r2.dev%2Fl-l%2Fl-l%2Fbehind%2520the%2520scenes%2Fe38f9812-cce4-40d3-82bb-536751e060a0%2Fmain.webp"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        print("Success:", response.status)
except Exception as e:
    print("Error:", e)
