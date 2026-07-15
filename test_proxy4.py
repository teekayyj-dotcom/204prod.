import urllib.parse
url = "https://pub-cb76d38f7e064360addb8a94ea474a91.r2.dev/l-l/l-l/behind%20the%20scenes/e38f9812-cce4-40d3-82bb-536751e060a0/main.webp"
safe_url = urllib.parse.quote(url, safe=":/?&=")
print("Safe URL:", safe_url)
