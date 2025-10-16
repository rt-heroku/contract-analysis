# Document Analyzer

A modern, full-stack web application for processing and analyzing PDF contracts and Excel/CSV data files using MuleSoft IDP (Intelligent Document Processing) APIs.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, User, Viewer)
- Fine-grained permissions system (39 permissions across 6 categories)
- User profile management with avatar upload
- Password change functionality

### 📄 Document Processing
- Upload PDF contracts and Excel/CSV data files
- Process documents through MuleSoft IDP
- Two-step processing flow:
  1. Document extraction (IDP)
  2. Analysis with AI/LLM integration
- Documents library for managing uploaded files
- Reprocess and re-analyze existing documents

### 📊 Analysis & Reporting
- View extracted document information
- View AI-generated analysis with markdown support
- Export reports to PDF
- Analysis history with search and filtering
- Share analyses with other users

### ✨ Prompts & Flows
- Create and manage analysis prompts with variable placeholders
- Link prompts to MuleSoft flows
- Drag-and-drop variables into markdown editor
- Import/export prompts as `.md` files
- Set default prompts

### 🛠️ Admin Features
- **User Management**: Create, edit, delete users and assign roles
- **Role Management**: Create roles and manage permissions
- **Menu Management**: CRUD menu items with drag-and-drop assignment to roles
- **System Logs**: View activity logs, API logs, and user sessions
- **System Settings**: Configure application settings and environment variables

### 🔔 Notifications
- Real-time in-app notifications
- Notification dropdown in top bar
- Full notifications page with search and filtering

### 📈 Dashboard
- Document processing statistics
- Analysis completion metrics
- Recent analyses overview

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Markdown**: react-markdown, @uiw/react-md-editor
- **Drag & Drop**: react-dnd
- **PDF Generation**: html2pdf.js
- **Icons**: lucide-react

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL (Heroku Postgres)
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **File Upload**: Multer
- **Logging**: Winston
- **HTTP Client**: Axios

### Deployment
- **Platform**: Heroku
- **Architecture**: Monorepo (single app deployment)
- **Database**: PostgreSQL with pgvector extension

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Heroku Postgres)
- MuleSoft API endpoint (for document processing)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd webapp
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

Create `.env` files in both `backend` and `frontend` directories:

**backend/.env:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
PORT=5001
NODE_ENV=development

# MuleSoft Configuration (optional, can be set in database)
MULESOFT_API_URL=http://localhost:8081
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5001
```

4. **Setup database**
```bash
cd backend
npx prisma generate
npx prisma db push

# Seed permissions and initial data
psql $DATABASE_URL -f seed-permissions.sql
```

5. **Run the application**

**Option A: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option B: Run concurrently**
```bash
# From root directory
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

### Default Credentials

**Admin:**
- Email: admin@demo.com
- Password: Admin@123

**User:**
- Email: user@demo.com
- Password: User@123

**Viewer:**
- Email: demo@mulesoft.com
- Password: Demo@123

## Project Structure

```
webapp/
├── frontend/                 # React frontend
│   ├── public/
│   │   ├── images/          # Static images
│   │   └── docs/            # Documentation
│   └── src/
│       ├── components/      # Reusable components
│       ├── pages/           # Page components
│       ├── hooks/           # Custom React hooks
│       ├── context/         # React Context providers
│       ├── lib/             # Utilities and helpers
│       └── App.tsx          # Main application
│
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── types.ts        # TypeScript types
│   └── prisma/
│       └── schema.prisma   # Database schema
│
└── docs/                    # Additional documentation
```

## User Roles & Permissions

### Admin
- Full access to all features
- User and role management
- Menu configuration
- System settings and logs
- All 39 permissions

### User
- Upload and process documents
- Create and manage analyses
- Create and edit prompts
- View flows
- Share analyses
- 17 permissions

### Viewer
- View documents (read-only)
- View analyses (read-only)
- View prompts (read-only)
- Download documents
- Edit own profile
- Change password
- Request permission upgrades
- 7 permissions

## Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System architecture and design
- [API Documentation](./API.md) - Backend API endpoints
- [Database Schema](./DATABASE.md) - Database structure and operations
- [Deployment Guide](./DEPLOYMENT.md) - How to deploy to production
- [Permissions System](./PERMISSIONS.md) - Role and permission management
- [Development Guide](./DEVELOPMENT.md) - Development setup and guidelines

## Support

For issues, questions, or feature requests, please contact:
- **Developer**: Rodrigo Torres
- **Email**: rodrigo.torres@salesforce.com

## License

Proprietary - Salesforce/MuleSoft

---

*Created by Rodrigo Torres • Powered by MuleSoft*

