variable "cloudflare_api_token" {
    type = string
    description = "Cloudflare API Token"
    sensitive = true
}

variable "do_token" {
    type = string
    description = "DigitalOcean Token"
    sensitive = true
}

variable "region" {
    type = string
    default = "nyc3"
}

variable "droplet_size" {
    type = string
    description = "DigitalOcean Droplet Size"
    default = "s-1vcpu-4gb"
}

variable "droplet_image" {
    type = string
    default = "ubuntu-22-04-x64"
}

variable "ssh_key_path" {
    type = string
    default = ""
}

variable "ssh_public_key" {
    type = string
    default = ""
}

variable "domain_name" {
    type = string
    default = "https://204prod.vn"
}

variable "cloudflare_zone_id" {
    type = string
    default = ""
}

variable "app_port" {
    type = number
    default = 8000
}