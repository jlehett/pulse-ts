# Arena Infrastructure

Terraform configuration for the Pulse Arena demo's AWS infrastructure.

## Architecture

- **S3 + CloudFront** — Static frontend hosting with HTTPS and CDN
- **API Gateway WebSocket** — WebSocket endpoint for lobby signaling
- **Lambda** — Signaling server (lobby management + WebRTC relay)
- **DynamoDB** — Lobby and connection state (pay-per-request, near-zero cost)

## Prerequisites

1. [Terraform CLI](https://developer.hashicorp.com/terraform/install) >= 1.5
2. AWS CLI configured with credentials (`aws configure`)
3. An AWS account (free tier covers most of this stack)
4. Node.js and npm (for building the frontend)

## Setup

```bash
cd demos/arena/infra

# Initialize Terraform (downloads providers)
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply
```

## Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region for all resources |
| `project_name` | `pulse-arena` | Prefix for resource naming |
| `environment` | `prod` | Deployment environment |

Override via CLI or a `.tfvars` file (not committed):

```bash
terraform apply -var="aws_region=eu-west-1"
```

## Outputs

After `terraform apply`, these values are printed:

- `cloudfront_distribution_domain` — Frontend URL
- `cloudfront_distribution_id` — Needed for cache invalidation
- `s3_bucket_name` — Upload build artifacts here
- `websocket_api_endpoint` — Signaling server WebSocket URL
- `dynamodb_table_name` — Lobby state table

## Deploying the Frontend

### Quick deploy (recommended)

```bash
cd demos/arena/infra
./deploy.sh
```

The script reads Terraform outputs, builds the frontend with the signaling
URL injected, uploads to S3, and invalidates the CloudFront cache.

### Manual deploy

```bash
# 1. Get the signaling endpoint from Terraform
cd demos/arena/infra
WS_URL=$(terraform output -raw websocket_api_endpoint)

# 2. Build with the signaling URL injected
cd ..
VITE_SIGNALING_URL="$WS_URL" npm run build

# 3. Upload to S3
S3_BUCKET=$(terraform -chdir=infra output -raw s3_bucket_name)
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

# 4. Invalidate CloudFront cache
CF_ID=$(terraform -chdir=infra output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*"

# 5. Access the site
terraform -chdir=infra output cloudfront_distribution_domain
```

The site will be available at `https://<cloudfront_distribution_domain>`.

## Teardown

```bash
cd demos/arena/infra
terraform destroy
```

## Security Notes

- No secrets are stored in Terraform files — use `terraform.tfvars` (gitignored) for sensitive overrides
- S3 bucket is private; CloudFront accesses it via Origin Access Control (OAC)
- Lambda has least-privilege IAM: DynamoDB read/write + API Gateway connection management
- DynamoDB tables use TTL to auto-expire stale lobbies and connections
- `.tfstate`, `.tfvars`, and `.terraform/` are gitignored
