# Quick Start Guide (For Demos)

This is a simplified setup for demos and development. No complex database permissions needed!

## 🚀 Fastest Way to Start

### Option 1: Local Development (No Docker)

```bash
# 1. Navigate to project
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp

# 2. Install everything
npm install

# 3. Setup backend (create .env first)
cd backend
cp .env.example .env

# Edit .env - you only need to set:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/document_processing
# JWT_SECRET=demo-secret-key-123
# (Keep other defaults)

# 4. Generate database and seed data
npm run setup:demo

# 5. Go back to root and start everything
cd ..
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

**Login with:**
- Admin: admin@demo.com / Admin@123
- User: user@demo.com / User@123

### Option 2: Docker (Easiest - Includes PostgreSQL)

```bash
# 1. Navigate to project
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp

# 2. Create .env (optional - works with defaults)
cp .env.example .env

# 3. Start everything
docker-compose up --build
```

Wait for "Server running on port 5000" message, then access at http://localhost:3000

**Login with:**
- Admin: admin@demo.com / Admin@123
- User: user@demo.com / User@123

**Stop:**
```bash
docker-compose down
```

## 🔧 If You Get Database Errors

### "Connection refused" or "Can't connect to database"

**For Local Development:**
1. Make sure PostgreSQL is running
2. Create the database:
   ```bash
   createdb document_processing
   ```
3. Try again: `cd backend && npm run setup:demo`

**For Docker:**
Just restart: `docker-compose down && docker-compose up`

### "Shadow database" or "Permission denied"

Don't worry! The new setup (`db push`) doesn't need shadow databases. Just use:

```bash
cd backend
npm run setup:demo
```

Instead of the old `prisma migrate dev` command.

## 📝 Environment Variables

### Minimal .env for Backend

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/document_processing
JWT_SECRET=demo-secret-key-change-in-production
SESSION_SECRET=demo-session-secret
PORT=5000
CORS_ORIGIN=http://localhost:3000

# MuleSoft API (optional for demo)
MULESOFT_API_BASE_URL=https://your-api.com
MULESOFT_API_USERNAME=
MULESOFT_API_PASSWORD=
```

### For Docker

No .env needed! It uses defaults. Optionally add MuleSoft credentials:

```env
MULESOFT_API_BASE_URL=https://your-api.com
MULESOFT_API_USERNAME=your-username
MULESOFT_API_PASSWORD=your-password
```

## 🎯 Common Commands

```bash
# Start development (both servers)
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Reset database (fresh start)
cd backend
npx prisma db push --force-reset
npm run seed

# View database
cd backend
npx prisma studio
```

## 🐛 Troubleshooting

### Port already in use

```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Can't install dependencies

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Frontend can't reach backend

Check `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### Database tables don't exist

```bash
cd backend
npm run setup:demo
```

## 🚢 Quick Deploy to Heroku

```bash
# Create app
heroku create my-demo-app

# Add database
heroku addons:create heroku-postgresql:mini

# Set config
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main

# Setup database
heroku run "cd backend && npx prisma db push && npm run seed"
```

Access at: https://my-demo-app.herokuapp.com

## 💡 Tips

- **Demo mode**: Don't worry about production best practices
- **Database**: Use SQLite for even simpler demos (see below)
- **MuleSoft**: App works without MuleSoft - processing just won't complete
- **Users**: Default users are created automatically

## 🎬 Using SQLite (Super Simple)

For the absolute simplest demo without PostgreSQL:

1. Edit `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. Update `backend/.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Run setup:
   ```bash
   cd backend
   npm run setup:demo
   ```

Done! No PostgreSQL needed.

---

**Need help?** Just run `npm run dev` and it should work! 🎉


