# Document Processing Backend API

A modern Node.js backend API for processing PDF contracts and Excel/CSV data files through MuleSoft IDP APIs.

## Features

- 🔐 JWT-based authentication with role-based access control
- 📁 File upload and processing (PDF, Excel, CSV)
- 🤖 MuleSoft API integration for document processing
- 📊 Comprehensive activity and API logging
- 🔔 Real-time notifications
- 👥 User management (admin)
- 📈 Analytics and statistics
- 🗄️ PostgreSQL database with Prisma ORM

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **File Processing**: Multer

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/document_processing
JWT_SECRET=your-secret-key
MULESOFT_API_BASE_URL=https://api.mulesoft.example.com
# ... other variables
```

4. Run database migrations:
```bash
npm run prisma:generate
npx prisma migrate dev
```

5. Seed the database:
```bash
npm run seed
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `PUT /api/users/password` - Change password
- `GET /api/users/activity` - Get activity logs

### File Uploads
- `POST /api/uploads` - Upload file
- `GET /api/uploads` - Get user uploads
- `DELETE /api/uploads/:id` - Delete upload

### Analysis
- `POST /api/analysis/start` - Start processing
- `GET /api/analysis` - Get analysis history
- `GET /api/analysis/:id` - Get analysis details
- `DELETE /api/analysis/:id` - Delete analysis (admin)
- `GET /api/analysis/statistics` - Get statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Admin (Requires admin role)
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/activity-logs` - Get activity logs
- `GET /api/admin/api-logs` - Get API logs

### System
- `GET /api/system/menu` - Get user menu
- `GET /api/system/settings` - Get public settings
- `GET /api/health` - Health check

## Database Schema

The database includes tables for:
- Users and authentication
- User profiles and roles
- Activity and API logging
- File uploads
- Contract and data analysis
- Notifications
- Menu items and permissions
- System settings

## Default Users

After seeding the database:

**Admin User**
- Email: `admin@demo.com`
- Password: `Admin@123`

**Regular User**
- Email: `user@demo.com`
- Password: `User@123`

## MuleSoft Integration

The backend integrates with MuleSoft APIs for:

1. **Contract Processing** (`POST /process/document`)
   - Extracts terms and products from PDF contracts
   - Returns structured JSON data

2. **Data Analysis** (`POST /analyze/data`)
   - Analyzes Excel/CSV data
   - Returns markdown analysis and data table

All API calls are logged with full request/response details.

## Activity Logging

Every user action is logged including:
- Authentication events
- File uploads and processing
- Profile updates
- Admin actions
- API calls to MuleSoft

## Deployment

### Heroku

1. Create Heroku app:
```bash
heroku create your-app-name
```

2. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:mini
```

3. Set environment variables:
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set MULESOFT_API_BASE_URL=your-mulesoft-url
```

4. Deploy:
```bash
git push heroku main
```

5. Run migrations and seed:
```bash
heroku run npm run prisma:migrate
heroku run npm run seed
```

## License

MIT


