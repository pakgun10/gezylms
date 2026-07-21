#!/usr/bin/env bash
set -euo pipefail

sudo cp /home/pgun/gezylms/deploy/nginx-gezylms.conf /etc/nginx/sites-available/gezylms
sudo ln -sfn /etc/nginx/sites-available/gezylms /etc/nginx/sites-enabled/gezylms
sudo nginx -t
sudo systemctl reload nginx

echo "GezyLMS Nginx enabled: https://lms.gezytech.web.id"
