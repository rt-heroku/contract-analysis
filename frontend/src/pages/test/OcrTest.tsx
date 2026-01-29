import React, { useState } from 'react';
import api from '../../lib/api';
import { JSONMonacoEditor } from '../../components/common/MonacoEditor';
import { Loading } from '../../components/common/Loading';

interface AnalysisResponse {
  success: boolean;
  totalPages: number;
  pages: any[];
  summary: Record<string, any>;
  error?: string;
}

export const OcrTest: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('eng');
  const [useAI, setUseAI] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('useAI', String(useAI));
      formData.append('includeMetadata', String(includeMetadata));

      const { data } = await api.post('/document-classifier/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(data);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">OCR / Document Classifier Test</h1>
      <p className="text-sm text-gray-600">
        Upload a PDF or image. The backend will run OCR and classify each page via MuleSoft LLM.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded p-4 space-y-4 border border-gray-200"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">File</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 block w-32 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
            />
            Use AI classification
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
            />
            Include metadata
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Analyze'}
          </button>
          {loading && <Loading size="sm" />}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      <div className="bg-white shadow rounded p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Result</h2>
          {result && (
            <span className="text-xs text-gray-500">
              Pages: {result.totalPages} | Success: {String(result.success)}
            </span>
          )}
        </div>
        <div style={{ height: '400px' }}>
          <JSONMonacoEditor
            value={JSON.stringify(result ?? { message: 'No result yet' }, null, 2)}
            readOnly
            theme="vs"
            minimap={false}
          />
        </div>
      </div>
    </div>
  );
};








