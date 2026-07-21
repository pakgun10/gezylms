#!/usr/bin/env bash
set -euo pipefail

cd /home/pgun

# Ensure LMS vhost uses the same ACME webroot as existing subdomains.
sudo cp /home/pgun/gezylms/deploy/nginx-gezylms.conf /etc/nginx/sites-available/gezylms
sudo ln -sfn /etc/nginx/sites-available/gezylms /etc/nginx/sites-enabled/gezylms
sudo nginx -t
sudo systemctl reload nginx

# Re-issue the shared gezytech cert with LMS included.
/home/pgun/.acme.sh/acme.sh --issue --server letsencrypt --force --keylength ec-256 \
  -d aios.gezytech.web.id \
  -d chat.gezytech.web.id \
  -d platform.gezytech.web.id \
  -d lms.gezytech.web.id \
  -w /home/pgun/nginx-acme

/home/pgun/.acme.sh/acme.sh --install-cert --ecc \
  -d aios.gezytech.web.id \
  --key-file /home/pgun/nginx-ssl/gezytech.key \
  --fullchain-file /home/pgun/nginx-ssl/gezytech.crt

sudo nginx -t
sudo systemctl reload nginx

openssl x509 -in /home/pgun/nginx-ssl/gezytech.crt -noout -subject -dates -ext subjectAltName
curl -k -I --resolve lms.gezytech.web.id:443:127.0.0.1 https://lms.gezytech.web.id

echo "SSL origin certificate now includes lms.gezytech.web.id. Re-test via Cloudflare after 30-60 seconds."
