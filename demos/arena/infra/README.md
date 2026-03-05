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

## Setup

```bash
cd infra

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

```bash
# Build the arena demo
cd ../demos/arena
npm run build

# Upload to S3
aws s3 sync dist/ s3://$(terraform -chdir=../../infra output -raw s3_bucket_name) --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=../../infra output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## Teardown

```bash
terraform destroy
```

## Security Notes

- No secrets are stored in Terraform files — use `terraform.tfvars` (gitignored) for sensitive overrides
- S3 bucket is private; CloudFront accesses it via Origin Access Control (OAC)
- Lambda has least-privilege IAM: DynamoDB read/write + API Gateway connection management
- DynamoDB tables use TTL to auto-expire stale lobbies and connections
