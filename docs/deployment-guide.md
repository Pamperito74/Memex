# CirrusTranslate Deployment Guide

## Quick Reference

| Environment | Branch | URL | Auto-Deploy |
|-------------|--------|-----|-------------|
| Development | `develop` | https://dev.cirrustranslate.com | Yes |
| Staging | `staging` | https://staging.cirrustranslate.com | Yes |
| Production | `main` | https://cirrustranslate.com | Yes |

---

## Deploy to Staging (from develop)

### Method 1: Git Merge (Recommended)

```bash
# From CirrusTranslate directory
git fetch origin
git checkout staging
git merge origin/develop
git push origin staging
```

### Method 2: GitHub PR

1. Go to: https://github.com/Cirrus-Inc/CirrusTranslate
2. Create PR: `develop` → `staging`
3. Review and merge
4. DO auto-deploys on merge

### Method 3: Force Reset (Caution)

```bash
# WARNING: Overwrites staging history
git checkout staging
git reset --hard origin/develop
git push --force origin staging
```

---

## Deploy to Production (from staging)

```bash
git fetch origin
git checkout main
git merge origin/staging
git push origin main
```

---

## Verify Deployment

1. **Check DO App Platform**: https://cloud.digitalocean.com/apps
2. **Monitor build logs** for errors
3. **Test the URL** after deployment completes
4. **Check database migrations** ran successfully

---

## Rollback

```bash
# Find previous good commit
git log --oneline -10

# Reset to previous commit
git checkout staging  # or main
git reset --hard <commit-hash>
git push --force origin staging
```

---

## Environment Variables Checklist

Each environment needs:
- `DATABASE_URL` - Environment-specific database
- `NEXT_PUBLIC_API_URL` - API URL for that environment
- `JWT_SECRET` - Unique per environment
- `NEXT_PUBLIC_EDITOR_URL` - Editor URL
- Service URLs (Mirage, CLEAR, S3, etc.)

---

## Digital Ocean App Platform

**Apps:**
- CirrusTranslate API (NestJS)
- CirrusTranslate Web (Next.js)
- CirrusTranslate Editor (Next.js)

**Deploy Settings:**
- Auto-deploy: Enabled
- Branch triggers deployment automatically
- Build command and run command in app spec

---

*Last updated: December 2025*
