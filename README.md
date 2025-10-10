# Document Processing Web Application

A modern, full-stack web application for processing PDF contracts and Excel/CSV data files through MuleSoft IDP APIs with comprehensive analytics and user management.

## 🚀 Features

### Backend
- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin/User roles)
- **File Processing**: Upload and process PDF contracts and Excel/CSV data files
- **MuleSoft Integration**: Seamless integration with MuleSoft IDP APIs for document analysis
- **Activity Logging**: Comprehensive logging of all user actions and API calls
- **Notifications**: Real-time notification system
- **User Management**: Admin panel for managing users and viewing system logs
- **Database**: PostgreSQL with Prisma ORM

### Frontend
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Authentication**: Login/Register with session management and timeout warnings
- **Document Upload**: Drag-and-drop interface for PDF and Excel/CSV files
- **Results Display**: Beautiful presentation of analysis results with markdown rendering
- **Export Functionality**: Export analysis as PDF and data as Excel
- **Admin Dashboard**: User management and system monitoring
- **Notifications**: Real-time notification center with badge counts

## 📋 Tech Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Axios for API calls
- Winston for logging
- Multer for file uploads

### Frontend
- React 18+ with TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Axios
- react-markdown
- react-dropzone
- jsPDF & xlsx for exports
- Lucide React icons

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/document_processing
JWT_SECRET=your-super-secret-jwt-key
MULESOFT_API_BASE_URL=https://your-mulesoft-api.com
MULESOFT_API_USERNAME=your-username
MULESOFT_API_PASSWORD=your-password
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

5. Run database migrations:
```bash
npm run prisma:generate
npx prisma migrate dev
```

6. Seed the database with default users and menu items:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

Backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
VITE_API_URL=http://localhost:5000
```

5. Start the development server:
```bash
npm run dev
```

Frontend app will be available at `http://localhost:3000`

## 👥 Default Users

After running the seed script, you can login with:

**Admin User**
- Email: `admin@demo.com`
- Password: `Admin@123`
- Access: Full system access including user management

**Regular User**
- Email: `user@demo.com`
- Password: `User@123`
- Access: Document processing and personal data

## 📁 Project Structure

```
/webapp
├── /backend
│   ├── /prisma
│   │   └── schema.prisma          # Database schema
│   ├── /src
│   │   ├── /config                # Configuration files
│   │   ├── /controllers           # Request handlers
│   │   ├── /middleware            # Express middleware
│   │   ├── /routes                # API routes
│   │   ├── /services              # Business logic
│   │   ├── /types                 # TypeScript types
│   │   ├── /utils                 # Utility functions
│   │   └── server.ts              # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── /frontend
    ├── /src
    │   ├── /components            # React components
    │   │   ├── /common            # Reusable components
    │   │   ├── /layout            # Layout components
    │   │   └── /pages             # Page components
    │   ├── /context               # React context providers
    │   ├── /lib                   # API clients
    │   ├── /types                 # TypeScript types
    │   ├── /utils                 # Utility functions
    │   ├── App.tsx                # Main app component
    │   └── main.tsx               # Entry point
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## 🔑 Key Features & Workflows

### Document Processing Workflow

1. **Upload Files**
   - User uploads a PDF contract and Excel/CSV data file
   - Files are validated and stored as base64 in the database

2. **Processing**
   - Backend sends PDF to MuleSoft for contract analysis
   - Extracts terms and products from the contract
   - Sends data file to MuleSoft for analysis
   - Generates markdown analysis and data table

3. **Results**
   - User views comprehensive analysis results
   - Export analysis as PDF
   - Export data table as Excel
   - Save to analysis history

### User Management (Admin)

- View all users with search and filtering
- Enable/disable user accounts
- Reset user passwords
- View user activity logs
- Delete users (soft delete)

### Activity Logging

Every action is logged including:
- Authentication events (login, logout, session refresh)
- File uploads and processing
- Profile updates
- Admin actions
- API calls to MuleSoft

### Notifications

Real-time notifications for:
- Processing completion
- Processing errors
- System events
- Session expiration warnings

## 🔒 Security Features

- JWT-based authentication with token expiration
- Password hashing with bcrypt
- Role-based access control
- Session management with automatic cleanup
- CORS protection
- Input validation with Zod
- SQL injection protection with Prisma
- XSS protection

## 📊 Database Schema

The database includes tables for:
- **Users & Authentication**: users, roles, user_roles, sessions
- **Profiles**: user_profiles with avatar storage
- **Uploads**: Stores files as base64
- **Analysis**: contract_analysis, data_analysis, analysis_records
- **Logging**: activity_logs, api_logs
- **Notifications**: notifications table
- **Menu System**: menu_items, menu_permissions
- **System**: system_settings

## 🚀 Deployment

### Heroku Deployment

#### Backend

```bash
cd backend
heroku create your-app-name-api
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=your-secret
heroku config:set MULESOFT_API_BASE_URL=your-url
git subtree push --prefix backend heroku main
heroku run npm run prisma:migrate
heroku run npm run seed
```

#### Frontend

```bash
cd frontend
heroku create your-app-name
heroku config:set VITE_API_URL=https://your-app-name-api.herokuapp.com
git subtree push --prefix frontend heroku main
```

## 📝 API Documentation

### Main Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/uploads` - Upload file
- `POST /api/analysis/start` - Start processing
- `GET /api/analysis` - Get analysis history
- `GET /api/analysis/:id` - Get analysis details
- `GET /api/notifications` - Get notifications
- `GET /api/admin/users` - List users (admin)
- `GET /api/admin/activity-logs` - View activity logs (admin)

See `/backend/README.md` for complete API documentation.

## 🎨 Design Guidelines

- **Clean & Modern**: Minimal background coloring, abundant whitespace
- **No Browser Alerts**: Custom modal dialogs for all interactions
- **Responsive**: Optimized for desktop and tablet
- **Accessibility**: ARIA labels and semantic HTML
- **Professional**: Consistent styling and user experience

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team

## 🙏 Acknowledgments

- MuleSoft for IDP APIs
- The React and Node.js communities
- All open-source contributors

---

**Built with ❤️ using React, Node.js, and MuleSoft**

