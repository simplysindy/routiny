# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**

- **Platform:** Vercel (automatic)
- **Build Command:** `next build`
- **Output Directory:** `.next` (automatic)
- **CDN/Edge:** Global Vercel CDN with edge caching

**Backend Deployment:**

- **Platform:** Vercel Serverless Functions (automatic)
- **Build Command:** `next build` (includes API routes)
- **Deployment Method:** Git-based deployment with automatic previews

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

## Environments

| Environment | Frontend URL                           | Backend URL                                | Purpose                |
| ----------- | -------------------------------------- | ------------------------------------------ | ---------------------- |
| Development | http://localhost:3000                  | http://localhost:3000/api                  | Local development      |
| Staging     | https://routiny-git-develop.vercel.app | https://routiny-git-develop.vercel.app/api | Pre-production testing |
| Production  | https://routiny.vercel.app             | https://routiny.vercel.app/api             | Live environment       |
