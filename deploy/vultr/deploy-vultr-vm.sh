#!/usr/bin/env bash
# ============================================================================
# AEGIS // VULTR — One-Command Public Demo & Backend Deployment on Vultr VM
# Supports standard CPU-only Ubuntu 22.04 / 24.04 Cloud Compute VMs (No GPU needed)
# ============================================================================
set -euo pipefail

echo "[1/5] Installing Docker Engine, Caddy HTTPS Reverse Proxy & Firewall..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw debian-keyring debian-archive-keyring apt-transport-https

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "[2/5] Enforcing Vultr Instance Metadata SSRF Firewall (169.254.169.254)..."
iptables -C DOCKER-USER -d 169.254.169.254/32 -j DROP 2>/dev/null || iptables -I DOCKER-USER -d 169.254.169.254/32 -j DROP

echo "[3/5] Building Hardened Non-Root Sandbox Runner Image..."
docker build -f deploy/vultr/Dockerfile.runner -t aegis-sandbox-runner:latest .

echo "[4/5] Launching Control Plane + Isolated Sandbox Worker Stack..."
# Bind Control Plane internally on 127.0.0.1:4000 behind Caddy HTTPS
sed -i 's/"80:4000"/"127.0.0.1:4000:4000"/' docker-compose.vultr.yml || true
sed -i '/"4000:4000"/d' docker-compose.vultr.yml || true
docker compose -f docker-compose.vultr.yml up -d --build

echo "[5/5] Configuring Public HTTPS Demo URL via Caddy..."
PUBLIC_IP=$(curl -4 -fsSL https://ifconfig.me || hostname -I | awk '{print $1}')
DEMO_DOMAIN="${PUBLIC_DOMAIN:-${PUBLIC_IP}.nip.io}"

cat <<EOF > /etc/caddy/Caddyfile
${DEMO_DOMAIN} {
    encode gzip
    reverse_proxy 127.0.0.1:4000 {
        flush_interval -1
    }
}
EOF

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl restart caddy

echo "============================================================================"
echo "AEGIS // VULTR Deployed Successfully!"
echo "Public HTTPS Demo URL: https://${DEMO_DOMAIN}"
echo "============================================================================"
