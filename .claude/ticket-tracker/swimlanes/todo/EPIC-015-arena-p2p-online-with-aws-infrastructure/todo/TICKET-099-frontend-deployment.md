---
id: TICKET-099
epic: EPIC-015
title: Frontend deployment
status: todo
priority: low
created: 2026-03-04
updated: 2026-03-04
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

- [ ] `npm run build` (or equivalent) produces a deployable static bundle for the arena demo
- [ ] Deployment script or instructions to upload the build to S3
- [ ] CloudFront invalidation triggered on deploy (script or manual step documented)
- [ ] README documents: prerequisites, Terraform setup, build, deploy, and teardown
- [ ] No secrets or credentials in committed files
- [ ] Deployed site is accessible via the CloudFront URL

## Notes

- **2026-03-04**: Ticket created. Depends on TICKET-093 (Terraform infra). Could be a simple shell script or integrated into CI later.
