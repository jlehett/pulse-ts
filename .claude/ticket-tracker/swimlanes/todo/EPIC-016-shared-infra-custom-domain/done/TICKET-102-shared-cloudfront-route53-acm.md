---
id: TICKET-102
epic: EPIC-016
title: Shared CloudFront with Route 53 and ACM
status: done
branch: ticket-102-shared-cloudfront-route53-acm
priority: high
created: 2026-03-05
updated: 2026-03-05
labels:
  - infrastructure
---

## Description

Create a shared `infra/` directory at the repo root with Terraform config for:
Route 53 hosted zone for pulse-ts.com, ACM certificate with DNS validation,
shared CloudFront distribution with path-based routing, and per-app S3 buckets.
Migrate the arena demo from its dedicated CloudFront to `/demos/arena/` on the
shared distribution. Update Vite base path and deploy script accordingly.

## Acceptance Criteria

- [x] `infra/` directory at repo root with Terraform config
- [x] Route 53 hosted zone for pulse-ts.com
- [x] ACM certificate for pulse-ts.com with DNS validation
- [x] Shared CloudFront distribution with custom domain alias
- [x] Arena S3 bucket served at `/demos/arena/` path via cache behavior
- [x] Arena Vite config uses `base: '/demos/arena/'`
- [x] Deploy script updated to sync to correct S3 prefix/bucket
- [x] Landing page or redirect at root path `/`
- [x] Existing arena backend infra (Lambda, DDB, API GW, Kinesis) unchanged
- [x] All tests pass

## Notes

- **2026-03-05**: Implementation complete. Shared infra at `infra/` with Route 53, ACM, CloudFront (path-based routing), per-app S3 buckets, CloudFront Function for path rewriting, landing page, and deploy.sh supporting arena/landing/all targets.
