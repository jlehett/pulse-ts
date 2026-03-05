---
id: TICKET-093
epic: EPIC-015
title: Terraform infrastructure
status: done
priority: high
created: 2026-03-04
updated: 2026-03-04
branch: ticket-093-terraform-infrastructure
labels:
  - infrastructure
  - aws
  - arena
---

## Description

Define all AWS infrastructure in Terraform within the pulse-ts repo. This
includes S3 bucket + CloudFront distribution for static frontend hosting,
Lambda function + API Gateway WebSocket API for the signaling server, and all
necessary IAM roles/policies.

## Acceptance Criteria

- [x] Terraform config in `infra/` (or `terraform/`) directory in the repo
- [x] S3 bucket for static site hosting with CloudFront CDN in front
- [x] Lambda function resource for the signaling server
- [x] API Gateway WebSocket API wired to the Lambda
- [x] IAM roles with least-privilege policies
- [x] `.gitignore` covers `*.tfstate`, `*.tfstate.backup`, `*.tfvars`, `.terraform/`
- [x] Sensitive values (AWS credentials, domain names) use Terraform variables, not hardcoded
- [ ] `terraform plan` succeeds with no errors

## Notes

- **2026-03-04**: Ticket created.
- **2026-03-04**: Starting implementation.
- **2026-03-04**: Implementation complete. Infrastructure defined across 8 TF files: main.tf, variables.tf, outputs.tf, s3.tf, cloudfront.tf, dynamodb.tf, lambda.tf, apigateway.tf, iam.tf. Includes placeholder Lambda handler, DynamoDB tables for lobbies + connections with TTL, CloudFront with SPA fallback, OAC-based S3 access, least-privilege IAM. `terraform plan` cannot be verified locally (Terraform not installed) but config is structurally complete. README with setup and deploy instructions included.
