import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Activity, Database, Users, Search, Filter } from 'lucide-react';

interface ActivityLog {
  id: number;
  userId: number;
  actionType: string;
  actionDescription: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

interface ApiLog {
  id: number;
  userId?: number;
  jobId?: string;
  requestMethod: string;
  requestUrl: string;
  responseStatus: number;
  responseTimeMs: number;
  createdAt: string;
  user?: {
    email: string;
  };
}

interface Session {
  id: string;
  userId: number;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

export const Logs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'api' | 'sessions'>('activity');
  const [loading, setLoading] = useState(true);
  
  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activitySearch, setActivitySearch] = useState('');

  // API Logs
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiPage, setApiPage] = useState(1);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiSearch, setApiSearch] = useState('');

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsTotal, setSessionsTotal] = useState(0);

  const limit = 20;

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityLogs();
    } else if (activeTab === 'api') {
      fetchApiLogs();
    } else {
      fetchSessions();
    }
  }, [activeTab, activityPage, apiPage, sessionsPage]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/activity-logs', {
        params: {
          page: activityPage,
          limit,
          search: activitySearch || undefined,
        },
      });
      setActivityLogs(response.data.logs);
      setActivityTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/api-logs', {
        params: {
          page: apiPage,
          limit,
          search: apiSearch || undefined,
        },
      });
      setApiLogs(response.data.logs);
      setApiTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch API logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/sessions', {
        params: {
          page: sessionsPage,
          limit,
        },
      });
      setSessions(response.data.sessions);
      setSessionsTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400) return 'error';
    return 'default';
  };

  const tabs = [
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'api', label: 'API Logs', icon: Database },
    { id: 'sessions', label: 'Sessions', icon: Users },
  ];

  const totalPages = (total: number) => Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        <p className="text-gray-600 mt-1">Monitor activity, API calls, and user sessions</p>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by user email or action..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchActivityLogs()}
                  className="pl-10"
                />
              </div>
              <Button onClick={fetchActivityLogs} className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Search
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : activityLogs.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.user?.email || `User #${log.userId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="default">{log.actionType}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {log.actionDescription}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages(activityTotal) > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {((activityPage - 1) * limit) + 1} to {Math.min(activityPage * limit, activityTotal)} of {activityTotal} logs
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={activityPage === 1}
                        onClick={() => setActivityPage(activityPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-600">
                        Page {activityPage} of {totalPages(activityTotal)}
                      </span>
                      <Button
                        variant="outline"
                        disabled={activityPage === totalPages(activityTotal)}
                        onClick={() => setActivityPage(activityPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No activity logs found</p>
              </div>
            )}
          </div>
        )}

        {/* API Logs Tab */}
        {activeTab === 'api' && (
          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by URL or job ID..."
                  value={apiSearch}
                  onChange={(e) => setApiSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchApiLogs()}
                  className="pl-10"
                />
              </div>
              <Button onClick={fetchApiLogs} className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Search
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : apiLogs.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time (ms)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {apiLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.user?.email || log.userId ? `User #${log.userId}` : 'Anonymous'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="default">{log.requestMethod}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                            {log.requestUrl}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusColor(log.responseStatus)}>
                              {log.responseStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.responseTimeMs}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages(apiTotal) > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {((apiPage - 1) * limit) + 1} to {Math.min(apiPage * limit, apiTotal)} of {apiTotal} logs
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={apiPage === 1}
                        onClick={() => setApiPage(apiPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-600">
                        Page {apiPage} of {totalPages(apiTotal)}
                      </span>
                      <Button
                        variant="outline"
                        disabled={apiPage === totalPages(apiTotal)}
                        onClick={() => setApiPage(apiPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No API logs found</p>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : sessions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                            {session.id.substring(0, 12)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {session.user?.email || `User #${session.userId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(session.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(session.expiresAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages(sessionsTotal) > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {((sessionsPage - 1) * limit) + 1} to {Math.min(sessionsPage * limit, sessionsTotal)} of {sessionsTotal} sessions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={sessionsPage === 1}
                        onClick={() => setSessionsPage(sessionsPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-600">
                        Page {sessionsPage} of {totalPages(sessionsTotal)}
                      </span>
                      <Button
                        variant="outline"
                        disabled={sessionsPage === totalPages(sessionsTotal)}
                        onClick={() => setSessionsPage(sessionsPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No active sessions found</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

