# API Documentation

Base URL: `http://localhost:5001/api` (Development)
Production: `https://your-app.herokuapp.com/api`

## Authentication

All API endpoints (except `/auth/login` and `/auth/register`) require authentication via JWT token.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### POST /auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@demo.com",
  "password": "Admin@123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@demo.com",
    "firstName": "Admin",
    "lastName": "User",
    "roles": ["admin"]
  }
}
```

### POST /auth/logout
Invalidate current session.

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### GET /users/me
Get current user information with roles.

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "admin@demo.com",
    "firstName": "Admin",
    "lastName": "User",
    "roles": ["admin"],
    "defaultMenuItem": "/dashboard",
    "lastLogin": "2025-10-16T14:00:00Z"
  }
}
```

### GET /users/profile
Get current user's profile with additional details.

**Response:** `200 OK`
```json
{
  "profile": {
    "id": 1,
    "email": "admin@demo.com",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "bio": "System administrator",
    "avatarBase64": "base64_string",
    "roles": ["admin"],
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLogin": "2025-10-16T14:00:00Z"
  }
}
```

### PUT /users/profile
Update current user's profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Updated bio"
}
```

**Response:** `200 OK`
```json
{
  "profile": { /* updated profile */ }
}
```

### POST /users/avatar
Upload user avatar image.

**Request:** `multipart/form-data`
- Field: `avatar` (image file, max 5MB)

**Response:** `200 OK`
```json
{
  "message": "Avatar uploaded successfully",
  "avatarBase64": "base64_string"
}
```

### DELETE /users/avatar
Remove user avatar.

**Response:** `200 OK`
```json
{
  "message": "Avatar removed successfully"
}
```

### POST /users/change-password
Change current user's password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

### POST /users/request-permissions
Request permission upgrade (for viewer role).

**Response:** `200 OK`
```json
{
  "message": "Permission request sent to administrators"
}
```

### GET /users/search?q={searchTerm}
Search users (for sharing features).

**Query Parameters:**
- `q`: Search term (email, firstName, lastName)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 2,
      "email": "user@demo.com",
      "firstName": "User",
      "lastName": "Demo"
    }
  ]
}
```

---

## Document Processing Endpoints

### POST /uploads
Upload files (PDF contract and/or Excel/CSV data).

**Request:** `multipart/form-data`
- Field: `contract` (PDF file)
- Field: `data` (Excel/CSV file)
- Field: `jobId` (string, unique identifier)

**Response:** `200 OK`
```json
{
  "jobId": "job_abc123",
  "contractUpload": {
    "id": 1,
    "filename": "contract_abc123.pdf",
    "originalName": "contract.pdf"
  },
  "dataUpload": {
    "id": 2,
    "filename": "data_abc123.xlsx",
    "originalName": "data.xlsx"
  }
}
```

### POST /analysis/process-contract
Process contract through MuleSoft IDP.

**Request Body:**
```json
{
  "jobId": "job_abc123",
  "skipIfProcessed": false
}
```

**Response:** `200 OK`
```json
{
  "analysisRecordId": 1,
  "contractAnalysis": {
    "id": 1,
    "documentName": "Sample Contract",
    "status": "COMPLETED",
    "terms": ["Term 1", "Term 2"],
    "products": ["Product A", "Product B"],
    "mulesoftResponse": { /* full IDP response */ }
  }
}
```

### POST /analysis/analyze
Analyze processed document with AI.

**Request Body:**
```json
{
  "analysisRecordId": 1,
  "promptId": 5
}
```

**Response:** `200 OK`
```json
{
  "analysis": {
    "id": 1,
    "jsonData": { /* analysis results */ },
    "analysis_markdown": "# Analysis Report\n...",
    "createdAt": "2025-10-16T14:00:00Z"
  }
}
```

### GET /analysis?page=1&limit=20&search=keyword
Get user's analysis history.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term (optional)

**Response:** `200 OK`
```json
{
  "analyses": [
    {
      "id": 1,
      "jobId": "job_abc123",
      "status": "completed",
      "contractUpload": {
        "filename": "contract.pdf",
        "createdAt": "2025-10-16T14:00:00Z"
      },
      "dataUpload": {
        "filename": "data.xlsx"
      },
      "contractAnalysis": {
        "terms": ["Term 1", "Term 2"]
      },
      "createdAt": "2025-10-16T14:00:00Z",
      "sharedUsers": ["user@demo.com"]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### GET /analysis/:id
Get specific analysis details.

**Response:** `200 OK`
```json
{
  "analysis": {
    "id": 1,
    "jobId": "job_abc123",
    "status": "completed",
    "contractUpload": { /* upload details */ },
    "dataUpload": { /* upload details */ },
    "contractAnalysis": { /* IDP results */ },
    "dataAnalysis": { /* AI analysis */ },
    "user": {
      "id": 1,
      "email": "admin@demo.com",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

### DELETE /analysis/:id
Delete (soft delete) an analysis record.

**Response:** `200 OK`
```json
{
  "message": "Analysis deleted successfully"
}
```

### POST /analysis/:id/share
Share analysis with other users.

**Request Body:**
```json
{
  "userIds": [2, 3, 4]
}
```

**Response:** `200 OK`
```json
{
  "message": "Analysis shared successfully",
  "sharedWith": [2, 3, 4]
}
```

---

## Documents Library Endpoints

### GET /documents?page=1&limit=20&search=keyword&type=pdf
Get user's document library.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search filename
- `type`: Filter by type (pdf, xlsx, csv)

**Response:** `200 OK`
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "contract.pdf",
      "originalName": "contract.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "hasIdpProcessing": true,
      "createdAt": "2025-10-16T14:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

### GET /documents/:id/download
Download a document.

**Response:** `200 OK`
- Binary file data with appropriate Content-Type header

### DELETE /documents/:id
Delete a document.

**Response:** `200 OK`
```json
{
  "message": "Document deleted successfully"
}
```

---

## Prompts & Flows Endpoints

### GET /prompts?page=1&limit=20&search=keyword
Get user's prompts.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search prompt name/content

**Response:** `200 OK`
```json
{
  "prompts": [
    {
      "id": 1,
      "name": "Contract Analysis",
      "content": "Analyze the following contract...",
      "flowName": "contract-flow",
      "isDefault": true,
      "variables": [
        {
          "name": "contract",
          "isMandatory": true,
          "isFromFlow": true
        }
      ],
      "createdAt": "2025-10-16T14:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

### GET /prompts/:id
Get specific prompt details.

**Response:** `200 OK`
```json
{
  "prompt": {
    "id": 1,
    "name": "Contract Analysis",
    "content": "Analyze {{contract}} with {{variables}}",
    "flowName": "contract-flow",
    "isDefault": true,
    "variables": [ /* prompt variables */ ]
  }
}
```

### POST /prompts
Create a new prompt.

**Request Body:**
```json
{
  "name": "New Prompt",
  "content": "Analyze {{contract}}...",
  "flowName": "contract-flow",
  "variables": [
    {
      "name": "contract",
      "defaultValue": "",
      "isMandatory": true,
      "isFromFlow": true
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "prompt": { /* created prompt */ }
}
```

### PUT /prompts/:id
Update a prompt.

**Request Body:** Same as create

**Response:** `200 OK`
```json
{
  "prompt": { /* updated prompt */ }
}
```

### DELETE /prompts/:id
Delete a prompt.

**Response:** `200 OK`
```json
{
  "message": "Prompt deleted successfully"
}
```

### POST /prompts/:id/set-default
Set prompt as default (admin only).

**Response:** `200 OK`
```json
{
  "message": "Prompt set as default successfully"
}
```

### GET /flows
Get available MuleSoft flows.

**Response:** `200 OK`
```json
{
  "flows": [
    {
      "name": "contract-flow",
      "description": "Contract processing flow",
      "variables": [
        {
          "name": "contract",
          "type": "string",
          "required": true
        }
      ]
    }
  ]
}
```

---

## Admin Endpoints

### User Management

#### GET /admin/users?page=1&limit=20&search=keyword
Get all users (admin only).

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@demo.com",
      "firstName": "Admin",
      "lastName": "User",
      "roles": ["admin"],
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

#### POST /admin/users
Create a new user (admin only).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "New",
  "lastName": "User",
  "roleIds": [2],
  "defaultMenuItem": "/dashboard"
}
```

**Response:** `201 Created`
```json
{
  "user": { /* created user */ }
}
```

#### PUT /admin/users/:id
Update a user (admin only).

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "isActive": true,
  "roleIds": [2, 3]
}
```

**Response:** `200 OK`
```json
{
  "user": { /* updated user */ }
}
```

#### DELETE /admin/users/:id
Delete a user (admin only).

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

### Role Management

#### GET /roles
Get all roles with permissions (admin only).

**Response:** `200 OK`
```json
{
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "description": "Administrator role",
      "rolePermissions": [
        {
          "permission": {
            "id": 1,
            "name": "profile.view",
            "description": "View own profile",
            "category": "Profile"
          }
        }
      ],
      "_count": {
        "userRoles": 2
      }
    }
  ]
}
```

#### GET /roles/:id
Get specific role details.

**Response:** `200 OK`
```json
{
  "role": {
    "id": 1,
    "name": "admin",
    "description": "Administrator role",
    "rolePermissions": [ /* permissions */ ],
    "userRoles": [ /* assigned users */ ]
  }
}
```

#### POST /roles
Create a new role (admin only).

**Request Body:**
```json
{
  "name": "manager",
  "description": "Manager role"
}
```

**Response:** `201 Created`
```json
{
  "role": { /* created role */ }
}
```

#### PUT /roles/:id
Update a role (admin only).

**Request Body:**
```json
{
  "name": "manager",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "role": { /* updated role */ }
}
```

#### DELETE /roles/:id
Delete a role (admin only).

**Response:** `200 OK`
```json
{
  "message": "Role deleted successfully"
}
```

### Permission Management

#### GET /roles/permissions/all
Get all available permissions (admin only).

**Response:** `200 OK`
```json
{
  "permissions": [
    {
      "id": 1,
      "name": "profile.view",
      "description": "View own profile",
      "category": "Profile"
    }
  ]
}
```

#### GET /roles/permissions/by-category
Get permissions grouped by category (admin only).

**Response:** `200 OK`
```json
{
  "permissions": {
    "Profile": [
      {
        "id": 1,
        "name": "profile.view",
        "description": "View own profile"
      }
    ],
    "Documents": [ /* permissions */ ]
  }
}
```

#### GET /roles/:roleId/permissions
Get permissions for a specific role.

**Response:** `200 OK`
```json
{
  "permissions": [
    {
      "id": 1,
      "roleId": 1,
      "permissionId": 1,
      "permission": {
        "name": "profile.view",
        "description": "View own profile",
        "category": "Profile"
      }
    }
  ]
}
```

#### POST /roles/permissions/bulk-update
Update all permissions for a role (admin only).

**Request Body:**
```json
{
  "roleId": 1,
  "permissionIds": [1, 2, 3, 4, 5]
}
```

**Response:** `200 OK`
```json
{
  "permissions": [ /* updated permissions */ ],
  "message": "Role permissions updated successfully"
}
```

#### GET /roles/me/permissions
Get current user's permissions.

**Response:** `200 OK`
```json
{
  "permissions": [
    {
      "id": 1,
      "name": "profile.view",
      "description": "View own profile",
      "category": "Profile"
    }
  ]
}
```

### Menu Management

#### GET /menu
Get all menu items (admin only).

**Response:** `200 OK`
```json
{
  "menuItems": [
    {
      "id": 1,
      "title": "Dashboard",
      "icon": "Home",
      "route": "/dashboard",
      "isExternal": false,
      "parentId": null,
      "orderIndex": 1,
      "isActive": true,
      "permissions": [
        {
          "roleId": 1,
          "role": { "name": "admin" }
        }
      ],
      "children": []
    }
  ]
}
```

#### POST /menu
Create a menu item (admin only).

**Request Body:**
```json
{
  "title": "New Menu",
  "icon": "Star",
  "route": "/new-page",
  "isExternal": false,
  "parentId": null,
  "orderIndex": 10
}
```

**Response:** `201 Created`
```json
{
  "menuItem": { /* created menu item */ }
}
```

#### PUT /menu/:id
Update a menu item (admin only).

**Request Body:**
```json
{
  "title": "Updated Title",
  "isActive": true,
  "orderIndex": 5
}
```

**Response:** `200 OK`
```json
{
  "menuItem": { /* updated menu item */ }
}
```

#### DELETE /menu/:id
Delete a menu item (admin only).

**Response:** `200 OK`
```json
{
  "message": "Menu item deleted successfully"
}
```

#### POST /menu/assign
Assign menu item to role (admin only).

**Request Body:**
```json
{
  "menuItemId": 1,
  "roleId": 2
}
```

**Response:** `200 OK`
```json
{
  "menuPermission": {
    "id": 1,
    "menuItemId": 1,
    "roleId": 2,
    "menuItem": { /* menu item */ },
    "role": { /* role */ }
  }
}
```

#### POST /menu/remove
Remove menu item from role (admin only).

**Request Body:**
```json
{
  "menuItemId": 1,
  "roleId": 2
}
```

**Response:** `200 OK`
```json
{
  "message": "Menu item removed from role"
}
```

#### POST /menu/bulk-assign
Bulk assign menus to role (admin only).

**Request Body:**
```json
{
  "roleId": 2,
  "menuItemIds": [1, 2, 3, 4, 5]
}
```

**Response:** `200 OK`
```json
{
  "message": "Menus assigned successfully"
}
```

### Logs

#### GET /admin/logs/activity?page=1&limit=20&search=keyword
Get activity logs (admin only).

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search by action type or description
- `userId`: Filter by user ID
- `startDate`: Filter from date
- `endDate`: Filter to date

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": 1,
      "userId": 1,
      "actionType": "user.login",
      "actionDescription": "User logged in",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-10-16T14:00:00Z",
      "user": {
        "email": "admin@demo.com",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 20
}
```

#### GET /admin/logs/api?page=1&limit=20
Get API call logs (admin only).

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": 1,
      "userId": 1,
      "jobId": "job_abc123",
      "requestMethod": "POST",
      "requestUrl": "http://localhost:8081/analyze",
      "responseStatus": 200,
      "responseTime": 1500,
      "createdAt": "2025-10-16T14:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

---

## Notifications Endpoints

### GET /notifications?page=1&limit=20&unreadOnly=false
Get user's notifications.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `unreadOnly`: Show only unread (boolean)

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "Permission Request",
      "message": "User requested elevated permissions",
      "type": "info",
      "actionUrl": "/admin/users",
      "isRead": false,
      "createdAt": "2025-10-16T14:00:00Z"
    }
  ],
  "total": 25,
  "unreadCount": 5,
  "page": 1,
  "limit": 20
}
```

### PUT /notifications/:id/read
Mark notification as read.

**Response:** `200 OK`
```json
{
  "message": "Notification marked as read"
}
```

### POST /notifications/mark-all-read
Mark all notifications as read.

**Response:** `200 OK`
```json
{
  "message": "All notifications marked as read"
}
```

---

## System Endpoints

### GET /system/menu
Get menu items for current user based on roles.

**Response:** `200 OK`
```json
{
  "menu": [
    {
      "id": 1,
      "title": "Dashboard",
      "icon": "Home",
      "route": "/dashboard",
      "isExternal": false,
      "orderIndex": 1,
      "children": []
    }
  ]
}
```

### GET /settings
Get all system settings (admin only).

**Response:** `200 OK`
```json
{
  "settings": {
    "app_name": "Document Analyzer",
    "mulesoft_api_url": "http://localhost:8081",
    "show_demo_credentials": "true"
  }
}
```

### GET /settings/public
Get public system settings (unauthenticated).

**Response:** `200 OK`
```json
{
  "settings": {
    "app_name": "Document Analyzer",
    "show_demo_credentials": "true"
  }
}
```

### PUT /settings
Update system settings (admin only).

**Request Body:**
```json
{
  "settings": {
    "app_name": "My Custom Name",
    "mulesoft_api_url": "http://mulesoft:8081"
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Settings updated successfully"
}
```

---

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard statistics.

**Response:** `200 OK`
```json
{
  "totalDocuments": 150,
  "totalAnalyses": 75,
  "completedAnalyses": 60,
  "processingAnalyses": 5,
  "recentAnalyses": [
    {
      "id": 1,
      "status": "completed",
      "contractFile": "contract.pdf",
      "dataFile": "data.xlsx",
      "createdAt": "2025-10-16T14:00:00Z"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Rate Limiting

Currently not implemented, but can be added using `express-rate-limit` middleware.

## Pagination

All list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
- `total`: Total number of items
- `page`: Current page
- `limit`: Items per page

---

For more information, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [Development Guide](./DEVELOPMENT.md)

