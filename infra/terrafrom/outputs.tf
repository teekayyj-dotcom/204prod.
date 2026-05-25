output "droplet_ip" {
    description = "IP address of the droplet"
    value = digitalocean_droplet.web_server.ipv4_address
}

output "r2_bucket_name" {
    description = "Name of the R2 bucket"
    value = cloudflare_r2_bucket.image_storage.name
}

output "cloudflare_zone_id" {
    description = "ID of the Cloudflare zone"
    value = cloudflare_zone.main.id
}
