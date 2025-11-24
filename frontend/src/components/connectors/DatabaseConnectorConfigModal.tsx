import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import api from '@/lib/api';

interface DatabaseConnectorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingConnector?: any;
}

export const DatabaseConnectorConfigModal: React.FC<DatabaseConnectorConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingConnector,
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [entryMode, setEntryMode] = useState<'url' | 'manual'>('url');
  
  // Form data
  const [name, setName] = useState('');
  const [databaseType, setDatabaseType] = useState('postgresql');
  const [connectionUrl, setConnectionUrl] = useState('');
  const [urlParseError, setUrlParseError] = useState('');
  
  // Manual connection details
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(false);
  const [sslmode, setSslmode] = useState('prefer');
  
  // Advanced settings
  const [testQuery, setTestQuery] = useState('SELECT 1');
  const [connectTimeout, setConnectTimeout] = useState(10000);
  const [queryTimeout, setQueryTimeout] = useState(30000);
  const [applicationName, setApplicationName] = useState('DreamFields App');
  const [defaultSchema, setDefaultSchema] = useState('public');
  
  // Custom parameters
  const [customParams, setCustomParams] = useState<Array<{ key: string; value: string }>>([]);
  
  // Connection pool settings
  const [poolMin, setPoolMin] = useState(2);
  const [poolMax, setPoolMax] = useState(10);
  const [idleTimeout, setIdleTimeout] = useState(30000);
  const [connectionLifetime, setConnectionLifetime] = useState(3600000);
  
  // Test connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Load existing connector data
  useEffect(() => {
    if (editingConnector && isOpen) {
      setName(editingConnector.name || '');
      
      const config = editingConnector.config || {};
      
      // Try to reconstruct URL if possible
      if (config.host && config.port && config.database && config.user) {
        const url = `postgres://${config.user}:${config.password || ''}@${config.host}:${config.port}/${config.database}`;
        setConnectionUrl(url);
        setEntryMode('url');
      } else {
        setEntryMode('manual');
      }
      
      // Set manual fields
      setHost(config.host || '');
      setPort(config.port || 5432);
      setDatabase(config.database || '');
      setUser(config.user || '');
      setPassword(config.password || '');
      setSsl(config.ssl || false);
      setSslmode(config.sslmode || 'prefer');
      
      // Advanced
      setTestQuery(config.testQuery || 'SELECT 1');
      setConnectTimeout(config.connectTimeout || 10000);
      setQueryTimeout(config.queryTimeout || 30000);
      setApplicationName(config.applicationName || 'DreamFields App');
      setDefaultSchema(config.defaultSchema || 'public');
      
      // Custom params
      if (config.customParams) {
        setCustomParams(Object.entries(config.customParams).map(([key, value]) => ({ key, value: String(value) })));
      }
      
      // Pool settings
      setPoolMin(config.poolMin || 2);
      setPoolMax(config.poolMax || 10);
      setIdleTimeout(config.idleTimeout || 30000);
      setConnectionLifetime(config.connectionLifetime || 3600000);
    }
  }, [editingConnector, isOpen]);

  // Parse connection URL
  const parseConnectionUrl = () => {
    try {
      if (!connectionUrl.trim()) {
        setUrlParseError('');
        return;
      }

      const url = new URL(connectionUrl.replace(/^postgres:/, 'postgresql:'));
      
      if (!url.protocol.startsWith('postgres')) {
        setUrlParseError('Invalid PostgreSQL URL format');
        return;
      }

      setHost(url.hostname);
      setPort(parseInt(url.port) || 5432);
      setDatabase(url.pathname.slice(1));
      setUser(url.username);
      setPassword(url.password);
      
      // Parse query parameters
      const params = url.searchParams;
      if (params.has('sslmode')) {
        setSslmode(params.get('sslmode') || 'prefer');
        setSsl(params.get('sslmode') !== 'disable');
      }
      if (params.has('connect_timeout')) {
        setConnectTimeout(parseInt(params.get('connect_timeout')!) * 1000);
      }
      if (params.has('application_name')) {
        setApplicationName(params.get('application_name')!);
      }
      
      // Add other params to custom params
      const customParamsList: Array<{ key: string; value: string }> = [];
      params.forEach((value, key) => {
        if (!['sslmode', 'connect_timeout', 'application_name'].includes(key)) {
          customParamsList.push({ key, value });
        }
      });
      setCustomParams(customParamsList);
      
      setUrlParseError('');
    } catch (error: any) {
      setUrlParseError(error.message || 'Failed to parse URL');
    }
  };

  // Build config object
  const buildConfig = (): any => {
    const config: any = {
      host,
      port,
      database,
      user,
      password,
      ssl,
      sslmode,
      testQuery,
      connectTimeout,
      queryTimeout,
      applicationName,
      defaultSchema,
      poolMin,
      poolMax,
      idleTimeout,
      connectionLifetime,
    };
    
    // Add custom parameters
    if (customParams.length > 0) {
      config.customParams = customParams.reduce((acc, { key, value }) => {
        if (key.trim()) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
    }
    
    return config;
  };

  // Test connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const config = buildConfig();
      
      const response = await api.post('/connectors/test-config', {
        connectorType: 'database',
        config,
      });
      
      setTestResult({
        success: true,
        message: response.data.message || 'Connection successful',
        details: response.data.details,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  // Save connector
  const handleSave = () => {
    const config = buildConfig();
    
    onSave({
      name,
      connectorType: 'database',
      config,
      authType: 'basic',
    });
  };

  // Add custom parameter
  const addCustomParam = () => {
    setCustomParams([...customParams, { key: '', value: '' }]);
  };

  // Remove custom parameter
  const removeCustomParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index));
  };

  // Update custom parameter
  const updateCustomParam = (index: number, field: 'key' | 'value', value: string) => {
    setCustomParams(customParams.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    ));
  };

  // Validation
  const isValid = () => {
    if (!name.trim()) return false;
    if (!host.trim() || !database.trim() || !user.trim()) return false;
    if (port < 1 || port > 65535) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {editingConnector ? 'Edit' : 'New'} Database Connector
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure PostgreSQL database connection
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-6 pt-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="pool">Connection Pool</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Connector Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Connector Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production Database"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Database Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Database Type
                </label>
                <select
                  value={databaseType}
                  onChange={(e) => setDatabaseType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="postgresql">PostgreSQL</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Only PostgreSQL is currently supported</p>
              </div>

              {/* Entry Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Connection Details
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setEntryMode('url')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      entryMode === 'url'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Connection URL
                  </button>
                  <button
                    onClick={() => setEntryMode('manual')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      entryMode === 'manual'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Manual Entry
                  </button>
                </div>

                {/* URL Entry */}
                {entryMode === 'url' && (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={connectionUrl}
                        onChange={(e) => setConnectionUrl(e.target.value)}
                        onBlur={parseConnectionUrl}
                        placeholder="postgresql://user:password@host:5432/database"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={parseConnectionUrl}
                        title="Parse URL and populate fields"
                      >
                        Parse
                      </Button>
                    </div>
                    {urlParseError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{urlParseError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format: postgresql://username:password@host:port/database
                    </p>
                  </div>
                )}

                {/* Manual Entry Fields */}
                {entryMode === 'manual' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Host <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={host}
                          onChange={(e) => setHost(e.target.value)}
                          placeholder="localhost"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Port <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={port}
                          onChange={(e) => setPort(parseInt(e.target.value) || 5432)}
                          placeholder="5432"
                          min="1"
                          max="65535"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Database <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                        placeholder="myapp"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={user}
                          onChange={(e) => setUser(e.target.value)}
                          placeholder="postgres"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SSL Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="ssl"
                    checked={ssl}
                    onChange={(e) => setSsl(e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="ssl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable SSL/TLS
                  </label>
                </div>

                {ssl && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      SSL Mode
                    </label>
                    <select
                      value={sslmode}
                      onChange={(e) => setSslmode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                    >
                      <option value="disable">Disable</option>
                      <option value="allow">Allow</option>
                      <option value="prefer">Prefer</option>
                      <option value="require">Require</option>
                      <option value="verify-ca">Verify CA</option>
                      <option value="verify-full">Verify Full</option>
                    </select>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Query
                </label>
                <textarea
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="SELECT 1"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Query executed when testing connection
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connect Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={connectTimeout}
                    onChange={(e) => setConnectTimeout(parseInt(e.target.value) || 10000)}
                    min="1000"
                    max="60000"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Query Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={queryTimeout}
                    onChange={(e) => setQueryTimeout(parseInt(e.target.value) || 30000)}
                    min="1000"
                    max="300000"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={applicationName}
                  onChange={(e) => setApplicationName(e.target.value)}
                  placeholder="DreamFields App"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Appears in pg_stat_activity
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Schema
                </label>
                <input
                  type="text"
                  value={defaultSchema}
                  onChange={(e) => setDefaultSchema(e.target.value)}
                  placeholder="public"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                />
              </div>
            </TabsContent>

            {/* Parameters Tab */}
            <TabsContent value="parameters" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Parameters
                  </label>
                  <Button size="sm" variant="outline" onClick={addCustomParam}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {customParams.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No custom parameters added yet
                    </p>
                    <Button size="sm" variant="ghost" onClick={addCustomParam} className="mt-2">
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Parameter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customParams.map((param, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => updateCustomParam(index, 'key', e.target.value)}
                          placeholder="parameter_name"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => updateCustomParam(index, 'value', e.target.value)}
                          placeholder="value"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomParam(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Add custom connection parameters that will be passed to the PostgreSQL driver
                </p>
              </div>
            </TabsContent>

            {/* Connection Pool Tab */}
            <TabsContent value="pool" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Pool Size
                  </label>
                  <input
                    type="number"
                    value={poolMin}
                    onChange={(e) => setPoolMin(parseInt(e.target.value) || 2)}
                    min="1"
                    max={poolMax}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum number of connections to maintain
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Pool Size
                  </label>
                  <input
                    type="number"
                    value={poolMax}
                    onChange={(e) => setPoolMax(parseInt(e.target.value) || 10)}
                    min={poolMin}
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of connections in pool
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Idle Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={idleTimeout}
                    onChange={(e) => setIdleTimeout(parseInt(e.target.value) || 30000)}
                    min="1000"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Close idle connections after this time
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connection Lifetime (ms)
                  </label>
                  <input
                    type="number"
                    value={connectionLifetime}
                    onChange={(e) => setConnectionLifetime(parseInt(e.target.value) || 3600000)}
                    min="60000"
                    step="60000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum lifetime of a connection
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Connection pooling</strong> helps manage database connections efficiently.
                  Adjust these settings based on your application's load and database server capacity.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Test Connection Result */}
        {testResult && (
          <div className="px-6 pb-4">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    testResult.success
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {testResult.message}
                </p>
                {testResult.details && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <p>Version: {testResult.details.version}</p>
                    <p>Response time: {testResult.details.responseTime}ms</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!isValid() || testing}
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isValid()}
            >
              {editingConnector ? 'Update' : 'Create'} Connector
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

