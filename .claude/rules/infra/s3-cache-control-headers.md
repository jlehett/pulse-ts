---
paths:
  - "infra/deploy.sh"
---
# S3 Cache-Control Headers for CloudFront-Served HTML

## Problem

S3 does not add `Cache-Control` headers by default. When CloudFront serves an S3 object without `Cache-Control`, browsers use **heuristic caching** (typically ~10% of the `Last-Modified` age). This causes mobile browsers to aggressively cache HTML responses and serve stale content even after CloudFront invalidations.

## The Bug Pattern

1. CloudFront serves wrong HTML for a route (e.g., cache key collision)
2. Mobile browser caches the wrong response with heuristic TTL
3. CloudFront fix is deployed + invalidation runs
4. CloudFront now serves correct content
5. **Mobile browser still serves stale cached HTML** — it never revalidates because heuristic TTL hasn't expired
6. Cache-buster query strings (`?v=2`) work, but the bare URL remains broken

## Convention

All HTML files uploaded to S3 must include `Cache-Control: no-cache` metadata. This tells browsers to always revalidate with CloudFront before using a cached copy.

Hashed assets (JS, CSS with content hashes in filenames) use `Cache-Control: max-age=31536000, immutable` for optimal caching.

### deploy.sh Pattern

```bash
# Assets with content hashes: cache forever
aws s3 sync dist/ "s3://$BUCKET/path/" --delete \
  --exclude "*.html" \
  --cache-control "max-age=31536000, immutable"

# HTML: always revalidate
aws s3 sync dist/ "s3://$BUCKET/path/" \
  --exclude "*" --include "*.html" \
  --cache-control "no-cache"
```

## Why `no-cache` Not `no-store`

`no-cache` allows the browser to store the response but requires revalidation (conditional GET with `If-None-Match`/`If-Modified-Since`). This gives fast 304 responses when content hasn't changed. `no-store` would force a full download every time.
