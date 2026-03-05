---
id: EPIC-016
title: Shared infrastructure and custom domain
status: todo
created: 2026-03-05
updated: 2026-03-05
---

## Description

Set up shared AWS infrastructure for pulse-ts.com so multiple apps (arena demo,
future demos, docs) are served from a single domain with path-based routing.
Route 53 manages DNS, ACM provides the SSL certificate, and a shared CloudFront
distribution routes requests to per-app S3 buckets.

## Goal

All pulse-ts demos and documentation are accessible under pulse-ts.com with
clean URL paths (e.g., pulse-ts.com/demos/arena/, pulse-ts.com/docs/). Adding
a new app requires only a new S3 bucket and CloudFront cache behavior.

## Notes

- **2026-03-05**: Epic created. Domain pulse-ts.com registration in progress.
