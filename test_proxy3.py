import urllib.parse
import urllib.request
url = "https://pub-cb76d38f7e064360addb8a94ea474a91.r2.dev/l-l/l-l/behind the scenes/e38f9812-cce4-40d3-82bb-536751e060a0/main.webp"
try:
    safe_url = urllib.parse.quote(url, safe=":/?&=")
    print("Safe URL:", safe_url)
    req = urllib.request.Request(safe_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        print("Success:", response.status)
except Exception as e:
    print("Error:", e)
