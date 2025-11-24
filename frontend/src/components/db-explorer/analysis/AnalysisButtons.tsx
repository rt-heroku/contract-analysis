import React, { useState } from 'react';
import { Activity, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import api from '@/lib/api';

interface AnalysisButtonsProps {
  connectorId: number;
  schema: string;
  table: string;
  onAnalysisComplete: (analysis: any) => void;
}

export const AnalysisButtons: React.FC<AnalysisButtonsProps> = ({
  connectorId,
  schema,
  table,
  onAnalysisComplete,
}) => {
  const [healthLoading, setHealthLoading] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeHealth = async () => {
    try {
      setHealthLoading(true);
      setError(null);
      const response = await api.post(
        `/table-analysis/${connectorId}/schemas/${schema}/tables/${table}/analyze-health`
      );
      console.log('Health analysis response:', response.data);
      onAnalysisComplete({
        ...response.data,
        type: 'health',
      });
    } catch (error: any) {
      console.error('Health analysis failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Analysis failed';
      setError(errorMessage);
      alert(`Analysis failed: ${errorMessage}`);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleGetPerformanceTips = async () => {
    try {
      setTipsLoading(true);
      setError(null);
      const response = await api.post(
        `/table-analysis/${connectorId}/schemas/${schema}/tables/${table}/performance-tips`
      );
      console.log('Performance tips response:', response.data);
      onAnalysisComplete({
        ...response.data,
        type: 'performance',
      });
    } catch (error: any) {
      console.error('Performance tips failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Analysis failed';
      setError(errorMessage);
      alert(`Analysis failed: ${errorMessage}`);
    } finally {
      setTipsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          onClick={handleAnalyzeHealth}
          disabled={healthLoading || tipsLoading}
          className="flex items-center gap-2"
          variant="outline"
        >
          {healthLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          Analyze Table Health
        </Button>
        <Button
          onClick={handleGetPerformanceTips}
          disabled={healthLoading || tipsLoading}
          className="flex items-center gap-2"
          variant="secondary"
        >
          {tipsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Get Performance Tips
        </Button>
      </div>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

