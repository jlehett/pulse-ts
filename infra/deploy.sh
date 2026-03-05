#!/usr/bin/env bash
# Deploy frontends to the shared S3 + CloudFront infrastructure.
#
# Usage:
#   cd infra
#   ./deploy.sh [arena|landing|all]
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Shared infra applied (terraform apply in infra/)
#   - Arena backend applied (terraform apply in demos/arena/infra/)
#   - Node.js + npm available

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$SCRIPT_DIR"

echo "==> Reading shared Terraform outputs..."
ARENA_BUCKET=$(terraform -chdir="$INFRA_DIR" output -raw arena_s3_bucket)
LANDING_BUCKET=$(terraform -chdir="$INFRA_DIR" output -raw landing_s3_bucket)
CF_DIST_ID=$(terraform -chdir="$INFRA_DIR" output -raw cloudfront_distribution_id)
DOMAIN=$(terraform -chdir="$INFRA_DIR" output -raw domain_name)

echo "    Arena bucket:   $ARENA_BUCKET"
echo "    Landing bucket: $LANDING_BUCKET"
echo "    CloudFront:     $CF_DIST_ID"
echo "    Domain:         $DOMAIN"

# Read arena backend outputs for the signaling WebSocket URL
ARENA_INFRA="$REPO_DIR/demos/arena/infra"
WS_ENDPOINT=$(terraform -chdir="$ARENA_INFRA" output -raw websocket_api_endpoint)
echo "    Signaling:      $WS_ENDPOINT"

TARGET="${1:-all}"

deploy_arena() {
    echo ""
    echo "==> Building arena demo..."
    cd "$REPO_DIR/demos/arena"
    VITE_SIGNALING_URL="$WS_ENDPOINT" npm run build

    echo "==> Uploading arena to S3..."
    aws s3 sync dist/ "s3://$ARENA_BUCKET" --delete
}

deploy_landing() {
    echo ""
    echo "==> Uploading landing page to S3..."
    aws s3 sync "$INFRA_DIR/landing/" "s3://$LANDING_BUCKET" --delete
}

case "$TARGET" in
    arena)
        deploy_arena
        ;;
    landing)
        deploy_landing
        ;;
    all)
        deploy_arena
        deploy_landing
        ;;
    *)
        echo "Usage: ./deploy.sh [arena|landing|all]"
        exit 1
        ;;
esac

echo ""
echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --output text > /dev/null

echo ""
echo "==> Deploy complete!"
echo "    https://$DOMAIN"
