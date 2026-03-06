# Arena Build: VITE_SIGNALING_URL Required for Online Play

**Paths:** `demos/arena/vite.config.ts`, `demos/arena/src/lobby.ts`, `infra/deploy.sh`

## Requirement

When building the arena demo for deployment, **always set `VITE_SIGNALING_URL`**:

```bash
VITE_SIGNALING_URL="wss://7ctlrdo7xa.execute-api.us-east-1.amazonaws.com/prod" npm run build -w demos/arena
```

## What Happens Without It

- `vite.config.ts` injects `window.__SIGNALING_URL__` via `define` — defaults to `undefined` if env var is missing
- `lobby.ts` falls back to `wss://<window.location.host>` (the CloudFront domain)
- CloudFront doesn't serve WebSocket connections → immediate close → "Connection to signaling server lost"
- **No build error or warning** — the failure is silent and only visible at runtime

## The Deploy Script Handles This

`infra/deploy.sh` reads the WebSocket endpoint from Terraform outputs and passes it as `VITE_SIGNALING_URL`. Always prefer using the deploy script for production deployments.

## Manual Deployment Checklist

If deploying manually (outside the deploy script):

1. Build: `VITE_SIGNALING_URL="wss://..." npm run build -w demos/arena`
2. Verify: `grep -o '7ctlrdo7xa' demos/arena/dist/assets/*.js` (should match)
3. Upload: `aws s3 sync demos/arena/dist/ s3://<bucket>/demos/arena/ --delete`
4. Invalidate: `aws cloudfront create-invalidation --distribution-id <id> --paths "/demos/arena/*"`
