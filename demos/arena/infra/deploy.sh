#!/usr/bin/env bash
# Deploy the arena demo frontend to S3 + CloudFront.
#
# Usage:
#   cd demos/arena/infra
#   ./deploy.sh
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Terraform applied (terraform apply)
#   - Node.js + npm available

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ARENA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$SCRIPT_DIR"

echo "==> Reading Terraform outputs..."
S3_BUCKET=$(terraform -chdir="$INFRA_DIR" output -raw s3_bucket_name)
CF_DIST_ID=$(terraform -chdir="$INFRA_DIR" output -raw cloudfront_distribution_id)
WS_ENDPOINT=$(terraform -chdir="$INFRA_DIR" output -raw websocket_api_endpoint)

echo "    S3 bucket:    $S3_BUCKET"
echo "    CloudFront:   $CF_DIST_ID"
echo "    Signaling:    $WS_ENDPOINT"

echo "==> Building arena demo..."
cd "$ARENA_DIR"
VITE_SIGNALING_URL="$WS_ENDPOINT" npm run build

echo "==> Uploading to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --output text > /dev/null

CF_DOMAIN=$(terraform -chdir="$INFRA_DIR" output -raw cloudfront_distribution_domain)
echo ""
echo "==> Deploy complete!"
echo "    https://$CF_DOMAIN"
