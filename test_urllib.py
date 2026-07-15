import urllib.request
url = "https://pub-cb76d38f7e064360addb8a94ea474a91.r2.dev/l-l/l-l/behind the scenes/e38f9812-cce4-40d3-82bb-536751e060a0/main.webp"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        print("Success")
except Exception as e:
    print("Error:", e)
