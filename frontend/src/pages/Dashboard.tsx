import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Loading } from '@/components/common/Loading';
import { FileText, CheckCircle, Clock, XCircle, Upload } from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/utils/helpers';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analysesRes] = await Promise.all([
          api.get('/analysis/statistics'),
          api.get('/analysis?limit=5'),
        ]);
        setStats(statsRes.data.statistics);
        setRecentAnalyses(analysesRes.data.analyses || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  const statCards = [
    {
      title: 'Total Analyses',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Processing',
      value: stats?.processing || 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      title: 'Failed',
      value: stats?.failed || 0,
      icon: XCircle,
      color: 'text-red-600 bg-red-100',
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your document processing
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-0">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="flex gap-4">
          <Button onClick={() => navigate('/processing')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
          <Button variant="secondary" onClick={() => navigate('/history')}>
            <FileText className="w-4 h-4 mr-2" />
            View History
          </Button>
        </div>
      </Card>

      {/* Recent Analyses */}
      <Card title="Recent Analyses" subtitle="Your latest document processing results">
        {recentAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No analyses yet</p>
            <p className="text-gray-500 text-sm mt-1">Start by uploading documents</p>
            <Button
              onClick={() => navigate('/processing')}
              className="mt-4"
            >
              Upload Documents
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/analysis/${analysis.id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {analysis.contractUpload?.filename || 'Document Analysis'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatRelativeTime(analysis.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusVariant(analysis.status)}>
                    {analysis.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(analysis.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};


