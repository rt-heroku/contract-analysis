import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  Table, 
  PlayCircle,
  Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Document {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  jobId: string;
  userId: number;
  createdAt: string;
  hasBeenProcessed: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'data'>('all');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = user?.roles?.some((role: string) => role.toLowerCase() === 'admin');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'contract' | 'data') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      alert(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDeletingId(id);
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalyze = (doc: Document) => {
    // Navigate to processing page with this document pre-selected
    navigate(`/processing?contractId=${doc.id}`);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (fileType.includes('spreadsheet') || fileType.includes('csv') || fileType.includes('excel')) {
      return <Table className="w-5 h-5 text-green-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalFilename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'pdf' && doc.fileType.includes('pdf')) ||
      (filterType === 'data' && (doc.fileType.includes('spreadsheet') || doc.fileType.includes('csv') || doc.fileType.includes('excel')));
    
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Documents Library</h1>
          <p className="text-gray-600 mt-1">Manage uploaded contracts and data files</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-block cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleUpload(e, 'contract')}
              className="hidden"
              disabled={uploadingFile}
            />
            <span className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm ${uploadingFile ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </span>
          </label>
          <label className="inline-block cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleUpload(e, 'data')}
              className="hidden"
              disabled={uploadingFile}
            />
            <span className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm ${uploadingFile ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </span>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'pdf' ? 'primary' : 'outline'}
            onClick={() => setFilterType('pdf')}
          >
            PDFs
          </Button>
          <Button
            variant={filterType === 'data' ? 'primary' : 'outline'}
            onClick={() => setFilterType('data')}
          >
            Data Files
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No documents found. Upload your first document to get started.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(doc.fileType)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.originalFilename}
                          </div>
                          <div className="text-xs text-gray-500">
                            {doc.fileType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.user.firstName || doc.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.hasBeenProcessed ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Processed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Processed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {doc.hasBeenProcessed && doc.fileType.includes('pdf') && (
                          <Button
                            onClick={() => handleAnalyze(doc)}
                            size="sm"
                            className="bg-primary-600 hover:bg-primary-700"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Analyze
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDownload(doc)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {(isAdmin || doc.userId === user?.id) && (
                          <Button
                            onClick={() => handleDelete(doc.id)}
                            variant="outline"
                            size="sm"
                            disabled={deletingId === doc.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {uploadingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <Loading size="lg" />
            <p className="mt-4 text-gray-700">Uploading file...</p>
          </div>
        </div>
      )}
    </div>
  );
};

