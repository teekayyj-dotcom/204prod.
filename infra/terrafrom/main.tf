resource "digitalocean_droplet" "web_server" {
    zone_id = cloudflare_zone.main.id
    name = "www"
    value = digitalocean_droplet.web_server.ipv4_address
    type = "A"
    ttl = 300
    proxied = true
}

resource "cloudflare_r2_bucket" "image_storage" {
    account_id = cloudflare.account_id
    name = "image_storage"
}