export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  defaultMenuItem?: string;
  roles: string[];
}

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  avatarBase64?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  stayLoggedIn?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Upload {
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadType: 'contract' | 'data';
  createdAt: string;
}

export interface ContractAnalysis {
  id: number;
  documentName: string;
  status: string;
  terms: string[];
  products: string[];
  processedAt: string;
}

export interface DataAnalysis {
  id: number;
  analysisMarkdown: string;
  dataTable: any[];
  processedAt: string;
}

export interface AnalysisRecord {
  id: number;
  userId: number;
  status: 'processing' | 'completed' | 'failed';
  contractUpload?: Upload;
  dataUpload?: Upload;
  contractAnalysis?: ContractAnalysis;
  dataAnalysis?: DataAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  title: string;
  icon?: string;
  route?: string;
  parentId?: number;
  orderIndex?: number;
  isActive?: boolean;
  children?: MenuItem[];
}

export interface ActivityLog {
  id: number;
  actionType: string;
  actionDescription: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


