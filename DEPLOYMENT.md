# Deployment Guide

This guide covers deploying the Document Processing Application to Heroku and other platforms.

## Heroku Deployment

### Prerequisites

- Heroku CLI installed
- Git repository initialized
- Heroku account created

### Step 1: Deploy Backend API

```bash
cd backend

# Login to Heroku
heroku login

# Create new Heroku app for backend
heroku create your-app-name-api

# Add PostgreSQL database
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set MULESOFT_API_BASE_URL=https://your-mulesoft-api.com
heroku config:set MULESOFT_API_USERNAME=your-username
heroku config:set MULESOFT_API_PASSWORD=your-password
heroku config:set MAX_FILE_SIZE_PDF=10485760
heroku config:set MAX_FILE_SIZE_EXCEL=52428800

# Deploy backend
git subtree push --prefix backend heroku main

# Run database migrations
heroku run npm run prisma:migrate

# Seed the database
heroku run npm run seed

# View logs
heroku logs --tail
```

### Step 2: Deploy Frontend

```bash
cd frontend

# Create new Heroku app for frontend
heroku create your-app-name-frontend

# Set environment variables
heroku config:set VITE_API_URL=https://your-app-name-api.herokuapp.com

# Add Node.js buildpack
heroku buildpacks:set heroku/nodejs

# Deploy frontend
git subtree push --prefix frontend heroku main

# View logs
heroku logs --tail
```

### Step 3: Configure CORS

Update backend CORS_ORIGIN:
```bash
cd backend
heroku config:set CORS_ORIGIN=https://your-app-name-frontend.herokuapp.com
```

### Step 4: Set up Custom Domain (Optional)

```bash
# For backend
cd backend
heroku domains:add api.yourdomain.com

# For frontend
cd frontend
heroku domains:add www.yourdomain.com
```

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Auto-set by Heroku |
| JWT_SECRET | Secret key for JWT tokens | Random 32-char string |
| SESSION_SECRET | Secret for session management | Random 32-char string |
| NODE_ENV | Environment | production |
| PORT | Server port | Auto-set by Heroku |

### Backend Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MULESOFT_API_BASE_URL | MuleSoft API base URL | - |
| MULESOFT_API_USERNAME | MuleSoft API username | - |
| MULESOFT_API_PASSWORD | MuleSoft API password | - |
| MULESOFT_API_TIMEOUT | API timeout in ms | 30000 |
| MAX_FILE_SIZE_PDF | Max PDF file size | 10485760 (10MB) |
| MAX_FILE_SIZE_EXCEL | Max Excel file size | 52428800 (50MB) |
| JWT_EXPIRATION | JWT token expiration | 4h |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | https://your-api.herokuapp.com |

## Database Management

### View Database

```bash
heroku pg:psql --app your-app-name-api
```

### Backup Database

```bash
heroku pg:backups:capture --app your-app-name-api
heroku pg:backups:download --app your-app-name-api
```

### Restore Database

```bash
heroku pg:backups:restore BACKUP_URL DATABASE_URL --app your-app-name-api
```

### Run Migrations

```bash
heroku run npm run prisma:migrate --app your-app-name-api
```

### Re-seed Database

```bash
heroku run npm run seed --app your-app-name-api
```

## Monitoring

### View Logs

```bash
# Backend logs
heroku logs --tail --app your-app-name-api

# Frontend logs
heroku logs --tail --app your-app-name-frontend
```

### Monitor Performance

```bash
# View metrics
heroku ps --app your-app-name-api

# View dyno status
heroku ps:scale --app your-app-name-api
```

## Scaling

### Scale Backend

```bash
# Scale to multiple dynos
heroku ps:scale web=2 --app your-app-name-api

# Upgrade dyno type
heroku ps:type professional --app your-app-name-api
```

### Scale Database

```bash
# Upgrade database
heroku addons:upgrade heroku-postgresql:standard-0 --app your-app-name-api
```

## Troubleshooting

### Application Not Starting

1. Check logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Check dyno status: `heroku ps`
4. Restart application: `heroku restart`

### Database Connection Issues

1. Check DATABASE_URL: `heroku config:get DATABASE_URL`
2. Test connection: `heroku pg:info`
3. Check connection limit: `heroku pg:info | grep Connections`
4. Reset database: `heroku pg:reset DATABASE`

### CORS Errors

1. Verify CORS_ORIGIN matches frontend URL
2. Check frontend VITE_API_URL
3. Ensure both apps are on HTTPS

### File Upload Issues

1. Check MAX_FILE_SIZE settings
2. Verify Content-Type headers
3. Check request payload limits

## Alternative Deployment Options

### AWS

1. Use AWS Elastic Beanstalk for backend
2. Use AWS S3 + CloudFront for frontend
3. Use AWS RDS for PostgreSQL

### DigitalOcean

1. Use App Platform for both frontend and backend
2. Use Managed PostgreSQL database

### Docker Deployment

```bash
# Build Docker images
docker-compose build

# Push to registry
docker-compose push

# Deploy to your cloud provider
```

## Security Checklist

- [ ] All environment variables set securely
- [ ] JWT_SECRET is random and strong
- [ ] CORS_ORIGIN properly configured
- [ ] HTTPS enabled on both apps
- [ ] Database connection uses SSL
- [ ] File upload limits configured
- [ ] Rate limiting enabled
- [ ] Logging configured for monitoring
- [ ] Backup strategy in place
- [ ] Error handling doesn't expose sensitive data

## Maintenance

### Regular Tasks

1. **Daily**: Monitor error logs
2. **Weekly**: Check application metrics
3. **Monthly**: Review and update dependencies
4. **Quarterly**: Security audit and database optimization

### Updates

```bash
# Update backend dependencies
cd backend
npm update
git commit -am "Update dependencies"
git push heroku main

# Update frontend dependencies
cd frontend
npm update
git commit -am "Update dependencies"
git push heroku main
```

## Support

For deployment issues:
1. Check Heroku status: https://status.heroku.com
2. Review application logs
3. Contact development team
4. Submit issue on GitHub

---

**Note**: Replace `your-app-name` with your actual application name throughout this guide.


