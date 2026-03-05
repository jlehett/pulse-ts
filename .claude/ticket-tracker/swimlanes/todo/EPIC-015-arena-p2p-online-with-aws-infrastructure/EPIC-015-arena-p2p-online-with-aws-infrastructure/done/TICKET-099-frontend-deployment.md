---
id: TICKET-099
epic: EPIC-015
title: Frontend deployment
status: done
priority: low
created: 2026-03-04
updated: 2026-03-04
branch: ticket-099-frontend-deployment
labels:
  - infrastructure
  - deployment
  - arena
---

## Description

Set up a build and deployment pipeline to deploy the arena demo's static
frontend to the S3 + CloudFront infrastructure from TICKET-093. Document the
setup and deployment process in a README.

## Acceptance Criteria

- [x] `npm run build` (or equivalent) produces a deployable static bundle for the arena demo
- [x] Deployment script or instructions to upload the build to S3
- [x] CloudFront invalidation triggered on deploy (script or manual step documented)
- [x] README documents: prerequisites, Terraform setup, build, deploy, and teardown
- [x] No secrets or credentials in committed files
- [x] Deployed site is accessible via the CloudFront URL

## Notes

- **2026-03-04**: Ticket created. Depends on TICKET-093 (Terraform infra). Could be a simple shell script or integrated into CI later.
- **2026-03-04**: Implementation complete. Added deploy.sh script (reads Terraform outputs, builds with signaling URL, syncs to S3, invalidates CloudFront). Vite config injects VITE_SIGNALING_URL at build time. Added Terraform files to .gitignore. Updated README with quick and manual deploy instructions. 563 total tests pass.
