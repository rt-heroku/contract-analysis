# Frontend Architecture Documentation

**Last Updated:** January 23, 2025, 7:15 AM

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Component Patterns](#component-patterns)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [API Communication](#api-communication)
8. [Common UI Components](#common-ui-components)
9. [Code Organization](#code-organization)

---

## Overview

The frontend is a **React 18** single-page application (SPA) built with **TypeScript** and **Vite**, styled with **Tailwind CSS**.

**Key Statistics:**
- **40+ Pages** (route components)
- **100+ Components** (reusable UI)
- **4 Context Providers** (global state)
- **2 Custom Hooks** (reusable logic)
- **30+ DB Explorer Components** (dedicated subsystem)
- **24+ Process Designer Components** (workflow builder)
- **20+ Craft.js Components** (page builder)

**Architecture Style:** Component-based with Context API for state management

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.6.2 | Type safety |
| **Vite** | 5.4.2 | Build tool & dev server |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS |
| **React Router** | 6.28.0 | Client-side routing |
| **Axios** | 1.7.7 | HTTP client |
| **Monaco Editor** | 4.6.0 | Code/SQL editor |
| **React Flow** | 11.11.4 | Visual flow diagrams |
| **Craft.js** | 0.2.8 | Drag-and-drop page builder |
| **react-markdown** | 9.0.1 | Markdown rendering |
| **remark-gfm** | 4.0.0 | GitHub-flavored markdown |
| **lucide-react** | Latest | Icon library |
| **html2pdf.js** | 0.10.2 | PDF generation |

---

## Folder Structure

```
frontend/src/
├── pages/                    # Route-level components (40+ files)
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── DatabaseExplorer.tsx  # Database IDE (large)
│   ├── ProcessDesigner.tsx   # Process builder
│   ├── PageBuilder.tsx       # Dynamic page builder
│   ├── Connectors.tsx
│   ├── Actions.tsx
│   ├── Processes.tsx
│   ├── admin/                # Admin pages (5 files)
│   │   ├── UserManagement.tsx
│   │   ├── RoleManagement.tsx
│   │   ├── Logs.tsx
│   │   ├── Settings.tsx
│   │   └── ApiLogs.tsx
│   └── ...
│
├── components/               # Reusable components
│   ├── common/               # Generic UI components (20+ files)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   ├── AlertDialog.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── MonacoEditor.tsx
│   │   ├── Tabs.tsx
│   │   └── ...
│   │
│   ├── layout/               # Layout components (3 files)
│   │   ├── MainLayout.tsx    # App shell
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   └── TopBar.tsx        # Header with user menu
│   │
│   ├── db-explorer/          # Database IDE components (30 files)
│   │   ├── DbTree.tsx        # Schema tree
│   │   ├── ResultsGrid.tsx   # Data grid
│   │   ├── QueryEditor.tsx   # SQL editor
│   │   ├── ObjectDetailsTabs.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── ERDViewer.tsx
│   │   ├── ExportDataDialog.tsx
│   │   ├── DeleteRowsDialog.tsx
│   │   ├── SQLFileLoaderDialog.tsx
│   │   ├── DataImportDialog.tsx
│   │   ├── ViewCodeDialog.tsx
│   │   ├── ModifyColumnDialog.tsx
│   │   ├── analysis/         # AI optimization (5 files)
│   │   │   ├── AnalysisButtons.tsx
│   │   │   ├── AnalysisResultModal.tsx
│   │   │   ├── LastAnalysisPanel.tsx
│   │   │   ├── RecommendationChecklist.tsx
│   │   │   └── index.ts
│   │   └── ...
│   │
│   ├── process-designer/     # Process builder components (24 files)
│   │   ├── ProcessCanvas.tsx
│   │   ├── NodePalette.tsx
│   │   ├── ActionNode.tsx
│   │   ├── ConfigPanel.tsx
│   │   ├── VariablePanel.tsx
│   │   ├── ExecutionPanel.tsx
│   │   └── ...
│   │
│   ├── craft/                # Page builder components (20 files)
│   │   ├── Container.tsx
│   │   ├── Text.tsx
│   │   ├── CraftButton.tsx
│   │   ├── CraftCard.tsx
│   │   ├── FormInput.tsx
│   │   ├── DataTable.tsx
│   │   ├── Tabs.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   │
│   ├── connectors/           # Connector management (2 files)
│   │   ├── ConnectorTypeSelectionModal.tsx
│   │   └── DatabaseConnectorConfigModal.tsx
│   │
│   ├── actions/              # Action management (1 file)
│   │   └── ConnectorActionModal.tsx
│   │
│   ├── idp/                  # IDP renderers (4 files)
│   │   ├── ContractRenderer.tsx
│   │   ├── InvoiceRenderer.tsx
│   │   ├── PurchaseOrderRenderer.tsx
│   │   └── GenericIDPRenderer.tsx
│   │
│   └── modals/               # Shared modals (2 files)
│       └── ...
│
├── context/                  # React Context providers (4 files)
│   ├── AuthContext.tsx       # Authentication state
│   ├── AppContext.tsx        # App-wide settings
│   ├── ThemeContext.tsx      # Theme management
│   └── ToastContext.tsx      # Toast notifications
│
├── hooks/                    # Custom hooks (2 files)
│   ├── usePermissions.ts     # Permission checking
│   └── useProcessData.ts     # Process data management
│
├── lib/                      # Core libraries (2 files)
│   ├── api.ts                # Axios instance & API client
│   └── auth.ts               # Auth utilities
│
├── utils/                    # Utility functions (5+ files)
│   ├── helpers.ts            # Common helpers
│   ├── validation.ts         # Data validation
│   ├── dataExport.ts         # Export utilities
│   ├── idpMerger.ts          # IDP data merging
│   └── ...
│
├── types/                    # TypeScript types
│   └── index.ts              # Shared type definitions
│
├── assets/                   # Static assets
│   └── images/
│
├── App.tsx                   # Root component
├── App.css                   # Global styles
├── main.tsx                  # Entry point
└── index.html                # HTML template
```

**Total Files:** 200+ components, pages, and utilities

---

## Component Patterns

### Pattern 1: Functional Components with Hooks

**Standard Pattern (90% of components):**

```typescript
// components/common/Button.tsx
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    outline: 'border-2 border-gray-300 hover:border-gray-400 text-gray-700',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};
```

**Characteristics:**
- ✅ Extends native HTML element props
- ✅ TypeScript interface for props
- ✅ Default prop values
- ✅ Tailwind CSS for styling
- ✅ Variant system for flexibility

---

### Pattern 2: Complex Page Components

**Example: DatabaseExplorer.tsx**

```typescript
// pages/DatabaseExplorer.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { DbTree } from '../components/db-explorer/DbTree';
import { QueryEditor } from '../components/db-explorer/QueryEditor';
import { ResultsGrid } from '../components/db-explorer/ResultsGrid';
import { ObjectDetailsTabs } from '../components/db-explorer/ObjectDetailsTabs';

export const DatabaseExplorer = () => {
  const [searchParams] = useSearchParams();
  const connectorId = parseInt(searchParams.get('connectorId') || '0');

  // State
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'query' | 'data' | 'details'>('query');

  // Load schemas on mount
  useEffect(() => {
    if (connectorId) {
      loadSchemas();
    }
  }, [connectorId]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/db-explorer/${connectorId}/schemas`);
      setSchemas(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schemas');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/db-explorer/${connectorId}/query`, {
        query,
        saveToHistory: true,
      });
      setQueryResults(response.data);
      setActiveTab('data');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (schemaName: string, tableName: string) => {
    setSelectedSchema(schemaName);
    setSelectedTable(tableName);
    setActiveTab('details');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Database Explorer</h1>
        <button onClick={loadSchemas} className="btn-secondary">
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Schema Tree */}
        <div className="w-64 bg-gray-50 border-r overflow-y-auto">
          <DbTree
            connectorId={connectorId}
            schemas={schemas}
            onTableSelect={handleTableSelect}
          />
        </div>

        {/* Main Area: Tabs */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white border-b px-4 flex space-x-4">
            <button
              className={`py-3 px-4 ${activeTab === 'query' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('query')}
            >
              Query Editor
            </button>
            <button
              className={`py-3 px-4 ${activeTab === 'data' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('data')}
            >
              Results
            </button>
            {selectedTable && (
              <button
                className={`py-3 px-4 ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('details')}
              >
                {selectedTable} Details
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'query' && (
              <QueryEditor
                onExecute={executeQuery}
                loading={loading}
                error={error}
              />
            )}
            {activeTab === 'data' && queryResults && (
              <ResultsGrid
                data={queryResults.rows}
                columns={queryResults.columns}
              />
            )}
            {activeTab === 'details' && selectedTable && (
              <ObjectDetailsTabs
                connectorId={connectorId}
                schemaName={selectedSchema!}
                tableName={selectedTable}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Characteristics:**
- ✅ Complex state management (multiple useState)
- ✅ Effects for data loading
- ✅ Nested components
- ✅ Tab-based UI
- ✅ Error handling

---

### Pattern 3: Modal Components

```typescript
// components/common/Modal.tsx
import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

## State Management

### Context Providers

#### 1. AuthContext (Authentication State)

```typescript
// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authLib } from '../lib/auth';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = authLib.getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      authLib.removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    authLib.setToken(response.data.token);
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      authLib.removeToken();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**Usage:**
```typescript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

#### 2. AppContext (Application Settings)

```typescript
// context/AppContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <AppContext.Provider value={{ sidebarOpen, setSidebarOpen, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

---

### Local State (useState)

**Pattern:** Most components manage their own state

```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState<DataType[]>([]);
const [error, setError] = useState<string | null>(null);
const [selectedId, setSelectedId] = useState<number | null>(null);
```

**No Redux/MobX:** System uses Context API + local state (sufficient for current complexity)

---

## Routing

### React Router Setup

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DatabaseExplorer from './pages/DatabaseExplorer';
import ProcessDesigner from './pages/ProcessDesigner';
import Connectors from './pages/Connectors';
// ... 30+ more imports

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/database-explorer" element={<DatabaseExplorer />} />
                      <Route path="/processes" element={<Processes />} />
                      <Route path="/processes/new" element={<ProcessDesigner />} />
                      <Route path="/processes/:id" element={<ProcessDesigner />} />
                      <Route path="/connectors" element={<Connectors />} />
                      <Route path="/actions" element={<Actions />} />
                      <Route path="/pages" element={<Pages />} />
                      <Route path="/pages/new" element={<PageBuilder />} />
                      {/* ... 30+ more routes */}
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**Route Protection:**
- `ProtectedRoute` component checks authentication
- Redirects to `/login` if not authenticated
- Shows loading state while checking auth

---

## API Communication

### Axios Instance

```typescript
// lib/api.ts
import axios from 'axios';
import { authLib } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  (config) => {
    const token = authLib.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authLib.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Call Pattern

```typescript
// In components
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await api.get('/endpoint');
    setData(response.data);
  } catch (err: any) {
    setError(err.response?.data?.error || 'Request failed');
  } finally {
    setLoading(false);
  }
};
```

---

## Common UI Components

### Design System Components

| Component | Purpose | Props | File |
|-----------|---------|-------|------|
| `Button` | Action buttons | variant, size, loading | common/Button.tsx |
| `Input` | Text input | type, placeholder, value, onChange | common/Input.tsx |
| `Card` | Content container | title, children | common/Card.tsx |
| `Modal` | Overlay dialogs | isOpen, onClose, title, size | common/Modal.tsx |
| `Loading` | Loading spinner | size, text | common/Loading.tsx |
| `Badge` | Status indicators | variant, text | common/Badge.tsx |
| `Tabs` | Tab navigation | tabs, activeTab, onChange | common/Tabs.tsx |
| `AlertDialog` | Styled alerts | type, title, message, isOpen | common/AlertDialog.tsx |
| `ConfirmDialog` | Confirmation prompts | isOpen, onConfirm, title, message | common/ConfirmDialog.tsx |
| `MonacoEditor` | Code/SQL editor | value, onChange, language | common/MonacoEditor.tsx |

### Tailwind CSS Usage

**Consistent Patterns:**
```css
/* Buttons */
.btn-primary: bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg
.btn-secondary: bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg

/* Cards */
.card: bg-white rounded-lg shadow-md p-6

/* Inputs */
.input: border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500

/* Layout */
.flex-1: Flexible content area
.overflow-hidden: Prevent scrollbar issues
.space-x-4 / space-y-4: Consistent spacing
```

---

## Code Organization

### Best Practices Observed ✅

1. **Component Co-location** - Related components grouped in folders
2. **TypeScript Interfaces** - Props typed for all components
3. **Consistent Naming** - PascalCase for components
4. **Reusable Hooks** - `usePermissions`, `useProcessData`
5. **Context Providers** - Clean separation of concerns
6. **Axios Interceptors** - Centralized auth handling

### Areas for Improvement ⚠️

1. **No Component Library** - All components custom-built
2. **Inconsistent Error Handling** - Mix of patterns
3. **No Loading States Strategy** - Each component implements own
4. **Large Page Components** - Some pages > 500 lines
5. **No Storybook** - No component documentation
6. **Limited Tests** - No visible test files

---

## Recommendations

### Short-Term
1. Extract common patterns into hooks
2. Standardize error handling
3. Create loading state component
4. Add PropTypes/TypeScript validation

### Medium-Term
1. Implement Storybook for component docs
2. Add unit tests (Vitest/Jest)
3. Consider UI library (shadcn/ui)
4. Optimize bundle size

### Long-Term
1. Migrate to Next.js for SSR
2. Implement proper state management (Zustand/Jotai)
3. Add E2E tests (Playwright)

---

**Document Status:** ✅ Complete  
**Next:** See `CONNECTOR_SYSTEM.md` for connector architecture

