import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Loading } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { 
  Server, 
  Database, 
  Settings, 
  Lock, 
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import api from '@/lib/api';

interface SystemInfo {
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    memory: any;
    cwd: string;
    env: string;
  };
  database: {
    status: string;
    url: string;
    userCount: number;
    roleCount: number;
    sessionCount: number;
  };
  environmentVariables: Record<string, string>;
  systemSettings: Array<{
    key: string;
    value: string;
    description: string;
    isSecret: boolean;
  }>;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string;
  };
  port: string | number;
}

export const SystemEnvironment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState('');
  const [revealedSections, setRevealedSections] = useState<Record<string, boolean>>({});
  const [revealedEnvVars, setRevealedEnvVars] = useState<Record<string, boolean>>({});
  const [revealedSettings, setRevealedSettings] = useState<Record<string, boolean>>({});

  const isAdmin = user?.roles?.some((role: any) => 
    role.name === 'admin' || role === 'admin'
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sysenv');
      setSystemInfo(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load system information');
      console.error('Error loading system info:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('✅') || status.toLowerCase().includes('connected')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (status.includes('❌') || status.toLowerCase().includes('error')) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const maskValue = (value: string, key?: string): string => {
    if (!value) return '(empty)';
    // Mask sensitive values
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'auth', 'credential', 'database_url'];
    const isSensitive = sensitiveKeys.some(k => key?.toLowerCase().includes(k));
    
    if (isSensitive) {
      return '••••••••••••••••';
    }
    return value;
  };

  const toggleReveal = (section: string) => {
    setRevealedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleEnvVar = (key: string) => {
    setRevealedEnvVars(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSetting = (key: string) => {
    setRevealedSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value: string, key: string, revealed: boolean, onToggle: () => void) => {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'auth', 'credential', 'database_url'];
    const isSensitive = sensitiveKeys.some(k => key.toLowerCase().includes(k));

    if (!isSensitive) {
      return <span className="font-mono text-sm">{value || '(empty)'}</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">
          {revealed ? value || '(empty)' : maskValue(value, key)}
        </span>
        {isAdmin && (
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={revealed ? 'Hide value' : 'Reveal value'}
          >
            {revealed ? (
              <EyeOff className="w-4 h-4 text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading System Information</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary-600" />
              System Environment
            </h1>
            <p className="text-gray-600 mt-2">Debug information for system configuration</p>
          </div>
        </div>
        <button
          onClick={loadSystemInfo}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            System Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Node Version</p>
              <p className="font-mono text-sm font-semibold">{systemInfo.systemInfo.nodeVersion}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Platform</p>
              <p className="font-mono text-sm font-semibold">{systemInfo.systemInfo.platform} ({systemInfo.systemInfo.arch})</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Environment</p>
              <p className="font-mono text-sm font-semibold">{systemInfo.systemInfo.env || 'development'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Uptime</p>
              <p className="font-mono text-sm font-semibold">{formatUptime(systemInfo.systemInfo.uptime)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Memory (Heap)</p>
              <p className="font-mono text-sm font-semibold">
                {formatMemory(systemInfo.systemInfo.memory.heapUsed)} / {formatMemory(systemInfo.systemInfo.memory.heapTotal)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Port</p>
              <p className="font-mono text-sm font-semibold">{systemInfo.port}</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Working Directory</p>
            <p className="font-mono text-xs break-all">{systemInfo.systemInfo.cwd}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Database
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(systemInfo.database.status)}
                <p className="text-sm text-gray-600">Status</p>
              </div>
              <p className="font-mono text-sm font-semibold">{systemInfo.database.status}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(systemInfo.database.url)}
                <p className="text-sm text-gray-600">Database URL</p>
              </div>
              <div className="font-semibold">
                {renderValue(systemInfo.database.url, 'database_url', revealedSections['database_url'], () => toggleReveal('database_url'))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-600" />
                <p className="text-sm text-gray-600">Users</p>
              </div>
              <p className="font-mono text-sm font-semibold">{systemInfo.database.userCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gray-600" />
                <p className="text-sm text-gray-600">Active Sessions</p>
              </div>
              <p className="font-mono text-sm font-semibold">{systemInfo.database.sessionCount}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              JWT Configuration
            </h2>
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(systemInfo.jwt.secret)}
                  <p className="text-sm text-gray-600">JWT Secret</p>
                </div>
                <div className="font-semibold">
                  {renderValue(systemInfo.jwt.secret, 'jwt_secret', revealedSections['jwt_secret'], () => toggleReveal('jwt_secret'))}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Expires In</p>
                <p className="font-mono text-sm font-semibold">{systemInfo.jwt.expiresIn}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-600" />
              CORS Configuration
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Allowed Origin</p>
              <p className="font-mono text-sm font-semibold break-all">{systemInfo.cors.origin}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Environment Variables
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 p-2">Variable</th>
                  <th className="text-left text-xs font-semibold text-gray-600 p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(systemInfo.environmentVariables).map(([key, value]) => (
                  <tr key={key} className="border-t border-gray-200">
                    <td className="p-2 font-mono text-xs text-gray-900 font-semibold">{key}</td>
                    <td className="p-2 text-xs text-gray-700 break-all">
                      {renderValue(value, key, revealedEnvVars[key], () => toggleEnvVar(key))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            System Settings (Database)
          </h2>
          {systemInfo.systemSettings.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 p-2">Key</th>
                    <th className="text-left text-xs font-semibold text-gray-600 p-2">Value</th>
                    <th className="text-left text-xs font-semibold text-gray-600 p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {systemInfo.systemSettings.map((setting) => (
                    <tr key={setting.key} className="border-t border-gray-200">
                      <td className="p-2 font-mono text-xs text-gray-900 font-semibold">{setting.key}</td>
                      <td className="p-2 text-xs text-gray-700 break-all">
                        {setting.isSecret ? (
                          renderValue(setting.value, setting.key, revealedSettings[setting.key], () => toggleSetting(setting.key))
                        ) : (
                          <span className="font-mono text-sm">{setting.value || '(empty)'}</span>
                        )}
                      </td>
                      <td className="p-2 text-xs text-gray-600">{setting.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No system settings found in database.</p>
          )}
        </div>
      </Card>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Limited Access</h3>
              <p className="text-sm text-blue-700 mt-1">
                Sensitive information is masked. Admin access required to reveal values.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Admin Access</h3>
              <p className="text-sm text-amber-700 mt-1">
                You have admin access. Click the eye icons to reveal sensitive values.
                Use this information responsibly and secure this endpoint in production.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
