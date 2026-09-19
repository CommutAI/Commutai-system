# Deployment Guide

## Overview
This guide provides instructions for deploying the CommutAI monorepo applications to staging and production environments.

## Prerequisites

### Required Tools
- Node.js 18.x or higher
- npm 10.x or higher
- Git
- SSH access to deployment servers (if applicable)
- Deployment credentials (API keys, environment variables)

### Environment Variables
Each app requires the following environment variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Build Process

### 1. Build All Applications
```bash
# From monorepo root
npm run build
```

### 2. Build Individual Applications
```bash
# Conductor app
cd apps/conductor
npm run build

# Customer service app
cd apps/customer-service
npm run build

# Operator app
cd apps/operator
npm run build

# Sys-admin app
cd apps/sys-admin
npm run build

# Public dashboard
cd apps/public-dashboard
npm run build
```

## Deployment Options

### Option 1: Static Hosting (Vercel, Netlify, GitHub Pages)

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy each app separately
cd apps/conductor
vercel --prod

cd apps/customer-service
vercel --prod

cd apps/operator
vercel --prod

cd apps/sys-admin
vercel --prod

cd apps/public-dashboard
vercel --prod
```

#### Netlify Deployment
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy each app
cd apps/conductor
netlify deploy --prod --dir=build

cd apps/customer-service
netlify deploy --prod --dir=dist

cd apps/operator
netlify deploy --prod --dir=dist

cd apps/sys-admin
netlify deploy --prod --dir=dist

cd apps/public-dashboard
netlify deploy --prod --dir=dist
```

### Option 2: VPS/Cloud Server (AWS, DigitalOcean, etc.)

#### SSH Deployment
```bash
# Build locally
npm run build

# Copy files to server
scp -r apps/conductor/build user@server:/var/www/conductor
scp -r apps/customer-service/dist user@server:/var/www/customer-service
scp -r apps/operator/dist user@server:/var/www/operator
scp -r apps/sys-admin/dist user@server:/var/www/sys-admin
scp -r apps/public-dashboard/dist user@server:/var/www/public-dashboard
```

#### Docker Deployment
```dockerfile
# Dockerfile for each app
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and push Docker images
docker build -t commutai-conductor ./apps/conductor
docker build -t commutai-customer-service ./apps/customer-service
docker build -t commutai-operator ./apps/operator
docker build -t commutai-sys-admin ./apps/sys-admin
docker build -t commutai-public-dashboard ./apps/public-dashboard

# Push to registry
docker push your-registry/commutai-conductor
docker push your-registry/commutai-customer-service
docker push your-registry/commutai-operator
docker push your-registry/commutai-sys-admin
docker push your-registry/commutai-public-dashboard
```

### Option 3: CI/CD Deployment (GitHub Actions)

The CI/CD workflow is already configured in `.github/workflows/ci-cd.yml`. To enable automatic deployment:

1. **Add Secrets to GitHub Repository**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `STAGING_DEPLOY_KEY`: SSH key for staging server
     - `PRODUCTION_DEPLOY_KEY`: SSH key for production server
     - `VITE_SUPABASE_URL`: Supabase URL
     - `VITE_SUPABASE_ANON_KEY`: Supabase anon key
     - `VITE_SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

2. **Configure Deployment Script**
Update the CI/CD workflow with your deployment commands:

```yaml
- name: Deploy to staging
  env:
    DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
  run: |
    echo "$DEPLOY_KEY" > deploy_key
    chmod 600 deploy_key
    ssh -i deploy_key user@staging-server 'cd /var/www && git pull && npm run build'
    rm deploy_key
```

## Staging Environment

### Staging Configuration
- **URL**: staging.commutai.com
- **Environment**: Development/Staging
- **Database**: Staging Supabase instance
- **Purpose**: Testing before production deployment

### Deployment Steps
1. Merge changes to `develop` branch
2. CI/CD automatically builds and tests
3. Manual approval required for staging deployment
4. Deploy to staging server
5. Run smoke tests on staging
6. Notify team for testing

### Staging Checklist
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] Environment variables are configured
- [ ] Database migrations are applied
- [ ] Static assets are uploaded
- [ ] SSL certificate is valid
- [ ] DNS is configured correctly
- [ ] Smoke tests pass

## Production Environment

### Production Configuration
- **URL**: app.commutai.com
- **Environment**: Production
- **Database**: Production Supabase instance
- **Purpose**: Live application for users

### Deployment Steps
1. Create release branch from `develop`
2. Run full test suite
3. Perform final code review
4. Merge to `main` branch
5. CI/CD automatically builds and tests
6. Manual approval required for production deployment
7. Deploy to production server
8. Run smoke tests on production
9. Monitor for errors
10. Notify users of deployment

### Production Checklist
- [ ] All staging tests passed
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] SSL certificate valid
- [ ] DNS configured correctly
- [ ] Smoke tests pass

## Rollback Procedure

### Automatic Rollback
If deployment fails, CI/CD should automatically rollback to previous version.

### Manual Rollback
```bash
# SSH to server
ssh user@server

# Navigate to deployment directory
cd /var/www/app-name

# Restore previous version
git checkout HEAD~1
# Or restore from backup
cp -r /backups/app-name-YYYY-MM-DD/* .
```

## Monitoring

### Application Monitoring
- **Uptime**: Use UptimeRobot or similar
- **Error Tracking**: Sentry or similar
- **Performance**: Google Lighthouse, WebPageTest
- **Analytics**: Google Analytics or similar

### Log Monitoring
- **Application Logs**: CloudWatch, Loggly, or similar
- **Server Logs**: Nginx/Apache logs
- **Error Logs**: Separate error log file

### Alerts
- **Uptime below 99.9%**
- **Error rate above 1%**
- **Response time above 2 seconds**
- **Database connection failures**
- **Memory usage above 80%**

## Security Considerations

### SSL/TLS
- All applications must use HTTPS
- SSL certificates must be valid
- HSTS headers should be enabled

### Environment Variables
- Never commit environment variables to git
- Use secret management tools
- Rotate keys regularly

### Access Control
- Restrict server access to authorized personnel
- Use SSH keys instead of passwords
- Enable two-factor authentication

### Dependencies
- Regularly update dependencies
- Use `npm audit` to check for vulnerabilities
- Apply security patches promptly

## Troubleshooting

### Build Failures
```bash
# Clear cache
rm -rf node_modules
rm -rf .turbo
npm install

# Check Node version
node --version  # Should be 18.x or higher

# Check npm version
npm --version  # Should be 10.x or higher
```

### Deployment Failures
```bash
# Check build output
ls -la dist/  # or build/ for conductor

# Check environment variables
printenv | grep VITE_

# Test build locally
npm run build
npm run preview
```

### Runtime Errors
```bash
# Check browser console for errors
# Check server logs
tail -f /var/log/nginx/error.log

# Check application logs
tail -f /var/log/app-name/error.log
```

## Support

For deployment issues, contact:
- **DevOps Team**: devops@commutai.com
- **Infrastructure Team**: infra@commutai.com
- **Emergency**: oncall@commutai.com
