import React, { useState } from 'react';
import { Activity, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

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

  const handleAnalyzeHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await api.post(
        `/table-analysis/${connectorId}/schemas/${schema}/tables/${table}/analyze-health`
      );
      onAnalysisComplete({
        ...response.data,
        type: 'health',
      });
    } catch (error: any) {
      console.error('Health analysis failed:', error);
      // Error will be handled by parent component
    } finally {
      setHealthLoading(false);
    }
  };

  const handleGetPerformanceTips = async () => {
    try {
      setTipsLoading(true);
      const response = await api.post(
        `/table-analysis/${connectorId}/schemas/${schema}/tables/${table}/performance-tips`
      );
      onAnalysisComplete({
        ...response.data,
        type: 'performance',
      });
    } catch (error: any) {
      console.error('Performance tips failed:', error);
      // Error will be handled by parent component
    } finally {
      setTipsLoading(false);
    }
  };

  return (
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
        variant="default"
      >
        {tipsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        Get Performance Tips
      </Button>
    </div>
  );
};

