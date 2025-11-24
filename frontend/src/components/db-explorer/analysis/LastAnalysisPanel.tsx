import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface LastAnalysisPanelProps {
  connectorId: number;
  schema: string;
  table: string;
  onViewDetails: (analysis: any) => void;
  refreshTrigger?: number; // Used to force refresh from parent
}

export const LastAnalysisPanel: React.FC<LastAnalysisPanelProps> = ({
  connectorId,
  schema,
  table,
  onViewDetails,
  refreshTrigger,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  useEffect(() => {
    loadLastAnalysis();
  }, [connectorId, schema, table, refreshTrigger]);

  const loadLastAnalysis = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/table-analysis/${connectorId}/schemas/${schema}/tables/${table}/latest-analysis`
      );
      setLastAnalysis(response.data);
    } catch (error: any) {
      console.error('Failed to load last analysis:', error);
      setLastAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScenarioLabel = (scenario: string) => {
    const labels: Record<string, string> = {
      general_health: 'General Health Check',
      high_bloat: 'High Table Bloat',
      missing_indexes: 'Missing Indexes',
      slow_queries: 'Slow Queries',
      caching_strategy: 'Caching Strategy',
      large_table_optimization: 'Large Table Optimization',
    };
    return labels[scenario] || scenario;
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading last analysis...
        </div>
      </div>
    );
  }

  if (!lastAnalysis) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            No analysis available yet. Click "Analyze Table Health" or "Get Performance Tips" to
            start.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Last Analysis</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <Clock className="w-3 h-3" />
                <span>
                  Last analyzed{' '}
                  {formatDistanceToNow(new Date(lastAnalysis.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastAnalysis.healthScore !== undefined && (
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">Health Score</div>
                <div className={`text-2xl font-bold ${getHealthScoreColor(lastAnalysis.healthScore)}`}>
                  {lastAnalysis.healthScore}/100
                </div>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Scenario */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Analysis Type
            </h4>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded">
                {getScenarioLabel(lastAnalysis.scenarioDetected)}
              </span>
            </div>
          </div>

          {/* Summary (truncated) */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Summary</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {lastAnalysis.summary}
            </p>
          </div>

          {/* Recommendations Count */}
          {lastAnalysis.recommendations && lastAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Recommendations
              </h4>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {lastAnalysis.recommendations.length} recommendation(s) available
                </span>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <div className="pt-2">
            <Button
              onClick={() => onViewDetails(lastAnalysis)}
              variant="outline"
              className="w-full"
            >
              View Full Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

