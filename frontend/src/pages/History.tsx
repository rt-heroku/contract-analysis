import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AlertDialog } from '@/components/common/AlertDialog';
import { FileText, Download, Eye, Search, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { Input } from '@/components/common/Input';

interface Upload {
  id: number;
  filename: string;
  createdAt: string;
}

interface Analysis {
  id: number;
  jobId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contractUploadId: number;
  dataUploadId: number;
  contractUpload: Upload;
  dataUpload: Upload;
  contractAnalysis?: {
    terms: string[];
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [rerunningId, setRerunningId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  
  // Check if user is admin
  const isAdmin = user?.roles?.some((r: string) => r.toLowerCase() === 'admin');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, searchDebounce]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analysis', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchDebounce || undefined,
        },
      });
      setAnalyses(response.data.analyses);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewAnalysis = (id: number) => {
    navigate(`/analysis/${id}`);
  };

  const handleDownloadFile = async (analysisId: number, fileType: 'contract' | 'data') => {
    try {
      // This will download the file from the backend
      window.open(`${api.defaults.baseURL}/uploads/${analysisId}/${fileType}`, '_blank');
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleRerunAnalysis = async (analysis: Analysis, forceReprocess: boolean = false) => {
    try {
      setRerunningId(analysis.id);
      
      // Check if this analysis already has an IDP response (contract analysis)
      if (analysis.contractAnalysis && !forceReprocess) {
        // IDP response already exists! Ask user if they want to reprocess
        setConfirmDialog({
          isOpen: true,
          title: 'IDP Already Processed',
          message: 'This document has already been processed by MuleSoft IDP.\n\nClick "Skip & Continue" to go directly to the analysis page (Recommended), or click "Reprocess" to re-run the expensive IDP processing (~15 seconds).',
          onConfirm: () => {
            // User chose to reprocess - call API again
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            handleRerunAnalysis(analysis, true);
          },
          onCancel: () => {
            // User chose to skip - navigate directly to IDP response
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            navigate(`/idp-response/${analysis.id}`);
          },
          confirmText: 'Reprocess',
          cancelText: 'Skip & Continue',
          type: 'warning',
        });
        setRerunningId(null);
        return;
      }
      
      if (analysis.contractAnalysis && forceReprocess) {
        // User confirmed they want to reprocess - call the expensive API
        console.log('User confirmed: Re-processing document with MuleSoft IDP');
        const response = await api.post('/analysis/start', {
          contractUploadId: analysis.contractUploadId,
          dataUploadId: analysis.dataUploadId,
        });

        if (response.data.analysisRecordId) {
          // Navigate to IDP Response page (Step 1 will complete)
          navigate(`/idp-response/${response.data.analysisRecordId}`);
        }
      } else if (analysis.contractAnalysis) {
        // IDP response already exists and user didn't force reprocess! Navigate directly to it
        console.log('IDP response already exists, skipping expensive MuleSoft call');
        navigate(`/idp-response/${analysis.id}`);
      } else {
        // No IDP response yet, need to process the document
        console.log('No IDP response found, calling MuleSoft to process document');
        const response = await api.post('/analysis/start', {
          contractUploadId: analysis.contractUploadId,
          dataUploadId: analysis.dataUploadId,
        });

        if (response.data.analysisRecordId) {
          // Navigate to IDP Response page (Step 1 will complete)
          navigate(`/idp-response/${response.data.analysisRecordId}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to rerun analysis:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Rerun Failed',
        message: error.response?.data?.error || 'Failed to rerun analysis. Please try again.',
        type: 'error',
      });
    } finally {
      setRerunningId(null);
    }
  };

  const handleDeleteAnalysis = (analysisId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Analysis',
      message: 'Are you sure you want to delete this analysis? All of your data will be permanently removed. This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setDeletingId(analysisId);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          
          await api.delete(`/analysis/${analysisId}`);
          
          // Refresh the list after deletion
          fetchHistory();
          
          setAlertDialog({
            isOpen: true,
            title: 'Analysis Deleted',
            message: 'The analysis has been successfully deleted.',
            type: 'success',
          });
        } catch (error: any) {
          console.error('Failed to delete analysis:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Deletion Failed',
            message: error.response?.data?.error || 'Failed to delete analysis. Please try again.',
            type: 'error',
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
          <p className="text-gray-600 mt-1">View and manage your document analyses</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Analysis List */}
      <div className="space-y-4">
        {analyses.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No analyses found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? 'Try a different search term' : 'Start by processing some documents'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate('/processing')}
                  className="mt-4 bg-primary-600 hover:bg-primary-700"
                >
                  Start Processing
                </Button>
              )}
            </div>
          </Card>
        ) : (
          analyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={getStatusColor(analysis.status)}>
                      {analysis.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(analysis.createdAt)}
                    </span>
                    <span className="text-sm text-gray-500">Job ID: {analysis.jobId}</span>
                  </div>

                  {/* Files Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Contract File */}
                    {analysis.contractUpload && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Contract Document
                          </h3>
                        </div>
                        <p className="text-sm text-blue-800 break-all mb-2">
                          {analysis.contractUpload.filename}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(analysis.id, 'contract')}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Data File */}
                    {analysis.dataUpload && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-green-900 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Data File
                          </h3>
                        </div>
                        <p className="text-sm text-green-800 break-all mb-2">
                          {analysis.dataUpload.filename}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(analysis.id, 'data')}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms Preview (if available) */}
                  {analysis.contractAnalysis?.terms && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Key Terms:</p>
                      {/* Handle terms as array */}
                      {Array.isArray(analysis.contractAnalysis.terms) && analysis.contractAnalysis.terms.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {analysis.contractAnalysis.terms.slice(0, 5).map((term, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {term}
                            </span>
                          ))}
                          {analysis.contractAnalysis.terms.length > 5 && (
                            <span className="px-2 py-1 text-gray-500 text-xs">
                              +{analysis.contractAnalysis.terms.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                      {/* Handle terms as string */}
                      {typeof analysis.contractAnalysis.terms === 'string' && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {analysis.contractAnalysis.terms}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col gap-2">
                  <Button
                    onClick={() => handleViewAnalysis(analysis.id)}
                    className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  <Button
                    onClick={() => handleRerunAnalysis(analysis)}
                    disabled={rerunningId === analysis.id}
                    style={{ 
                      backgroundColor: rerunningId === analysis.id ? '#4ade80' : '#16a34a',
                      color: 'white',
                      borderColor: '#16a34a'
                    }}
                    className="hover:bg-green-700 focus:ring-green-500 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${rerunningId === analysis.id ? 'animate-spin' : ''}`} />
                    {rerunningId === analysis.id ? 'Re-running...' : 'Re-run Analysis'}
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                      disabled={deletingId === analysis.id}
                      className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400 disabled:opacity-100 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === analysis.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          if (confirmDialog.onCancel) {
            confirmDialog.onCancel();
          } else {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          }
        }}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        cancelText={confirmDialog.cancelText}
        isLoading={deletingId !== null}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
};

