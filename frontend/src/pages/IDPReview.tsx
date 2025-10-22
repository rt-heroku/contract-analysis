import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { FileText, CheckCircle } from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  result: string;
  confidenceScore: number;
  page: number;
}

export const IDPReview: React.FC = () => {
  const navigate = useNavigate();
  const { analysisRecordId } = useParams<{ analysisRecordId: string }>();
  const [searchParams] = useSearchParams();
  
  const executionId = searchParams.get('executionId');
  const jobId = searchParams.get('jobId');
  const idpExecutionId = searchParams.get('idpExecutionId');
  const contractUploadId = searchParams.get('contractUploadId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewItem[]>([]);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await loadReviewData();
        await loadPdf();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [executionId, jobId, idpExecutionId, contractUploadId]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      
      // Review data should be passed via state, or we fetch it again
      const response = await api.post('/idp-status/review', {
        executionId,
        jobId,
        idpExecutionId,
      });

      if (response.data.review && response.data.review.results) {
        setReviewData(response.data.review.results);
        
        // Initialize edited data
        const initial: Record<string, string> = {};
        response.data.review.results.forEach((item: ReviewItem) => {
          initial[item.id] = item.result;
        });
        setEditedData(initial);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load review data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPdf = async () => {
    if (!contractUploadId) return;
    
    try {
      // Get the PDF file
      const response = await api.get(`/documents/${contractUploadId}/file`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Failed to load PDF:', error);
    }
  };

  const handleTextChange = (id: string, value: string) => {
    setEditedData(prev => ({ ...prev, [id]: value }));
    
    // Check if any changes were made
    const hasAnyChanges = reviewData.some(item => {
      return editedData[item.id] !== item.result;
    });
    setHasChanges(hasAnyChanges || value !== reviewData.find(item => item.id === id)?.result);
  };

  const handleApprove = async () => {
    if (!hasChanges) {
      setAlertDialog({
        isOpen: true,
        title: 'No Changes',
        message: 'Please modify at least one field before approving.',
        type: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Build approved_data in the same format as received
      const approvedData = {
        results: reviewData.map(item => ({
          id: item.id,
          name: item.name,
          result: editedData[item.id],
          confidenceScore: item.confidenceScore,
          page: item.page,
        })),
        queriesResults: [],
        analyzersResults: [],
        signaturesResults: [],
      };

      await api.post('/idp-status/approve', {
        executionId,
        jobId,
        idpExecutionId,
        approvedData,
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Review approved successfully. Redirecting...',
        type: 'success',
      });

      // Navigate back to IDP response page after a short delay
      setTimeout(() => {
        navigate(`/idp-response/${analysisRecordId}?approved=true`);
      }, 1500);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to approve review',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-600" />
            Manual Review Required
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve changes to the extracted data
          </p>
        </div>
        <Button
          onClick={() => navigate(`/idp-response/${analysisRecordId}`)}
          variant="secondary"
        >
          Cancel
        </Button>
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Viewer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Document</h2>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[calc(100vh-16rem)] border border-gray-300 rounded-lg"
              title="Document Preview"
            />
          ) : (
            <div className="w-full h-[calc(100vh-16rem)] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">PDF not available</p>
            </div>
          )}
        </div>

        {/* Review Fields */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Fields to Review ({reviewData.length})
          </h2>
          
          <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
            {reviewData.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-900">
                    {item.name.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Page {item.page + 1}</span>
                    <span
                      className={`px-2 py-1 rounded-full ${
                        item.confidenceScore >= 80
                          ? 'bg-green-100 text-green-700'
                          : item.confidenceScore >= 60
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.confidenceScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <textarea
                  value={editedData[item.id] || ''}
                  onChange={(e) => handleTextChange(item.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter corrected value..."
                />
              </div>
            ))}
          </div>

          {/* Approve Button - Fixed at bottom */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={handleApprove}
              disabled={!hasChanges || submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loading size="sm" />
                  <span className="ml-2">Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Changes
                </>
              )}
            </Button>
            {!hasChanges && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Modify at least one field to enable approval
              </p>
            )}
          </div>
        </div>
      </div>

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

