import React from 'react';
import { Activity, Zap, AlertCircle, TrendingUp, Clock, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RecommendationChecklist } from './RecommendationChecklist';
import { formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/common/Modal';

interface AnalysisResult {
  id: number;
  type: 'health' | 'performance';
  scenarioDetected: string;
  healthScore?: number;
  summary: string;
  recommendations: any[];
  rawResponse: any;
  isMarkdown?: boolean;
  markdownContent?: string;
  createdAt: string;
}

interface AnalysisResultModalProps {
  analysis: AnalysisResult | null;
  isOpen: boolean;
  onClose: () => void;
  onActionExecuted?: (recommendation: any) => void;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  analysis,
  isOpen,
  onClose,
  onActionExecuted,
}) => {
  if (!analysis) return null;

  const isHealthCheck = analysis.type === 'health';
  const isPerformanceTips = analysis.type === 'performance';

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100 dark:bg-gray-800';
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getScenarioLabel = (scenario: string) => {
    const labels: Record<string, string> = {
      general_health: 'General Health Check',
      high_bloat: 'High Table Bloat Detected',
      missing_indexes: 'Missing Indexes Detected',
      slow_queries: 'Slow Queries Detected',
      caching_strategy: 'Caching Strategy Analysis',
      large_table_optimization: 'Large Table Optimization',
    };
    return labels[scenario] || scenario;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {isHealthCheck ? (
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isHealthCheck ? 'Table Health Analysis' : 'Performance Optimization Tips'}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                Analyzed {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {/* Markdown Report - Full screen */}
          {analysis.isMarkdown && analysis.markdownContent && (
            <div className="markdown-content prose prose-slate max-w-none
                          prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                          prose-p:text-gray-700 dark:prose-p:text-gray-300
                          prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                          prose-code:text-blue-600 dark:prose-code:text-blue-400
                          prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                          prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950
                          prose-pre:text-gray-100
                          prose-table:border-collapse prose-table:w-full prose-table:text-sm
                          prose-thead:bg-gradient-to-r prose-thead:from-blue-500 prose-thead:to-indigo-600
                          prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-blue-400
                          prose-td:p-3 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700
                          prose-tr:even:bg-gray-50 dark:prose-tr:even:bg-gray-900/50
                          prose-tr:hover:bg-blue-50 dark:prose-tr:hover:bg-blue-900/20
                          prose-tr:transition-colors
                          prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                          prose-ol:text-gray-700 dark:prose-ol:text-gray-300
                          prose-li:text-gray-700 dark:prose-li:text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysis.markdownContent.replace(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
          )}

          {/* JSON/Structured Display */}
          {!analysis.isMarkdown && (
            <>
          {/* Health Score (for health checks only) */}
          {isHealthCheck && analysis.healthScore !== undefined && (
            <div
              className={`p-6 rounded-lg border ${getHealthScoreBg(
                analysis.healthScore
              )} border-gray-300 dark:border-gray-600`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Overall Health Score
                  </h3>
                  <p className={`text-4xl font-bold mt-2 ${getHealthScoreColor(analysis.healthScore)}`}>
                    {analysis.healthScore}/100
                  </p>
                </div>
                <TrendingUp
                  className={`w-12 h-12 ${getHealthScoreColor(analysis.healthScore)}`}
                />
              </div>
            </div>
          )}

          {/* Scenario Detected */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                  Analysis Type: {getScenarioLabel(analysis.scenarioDetected)}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
                  The AI has identified specific patterns in your table that require attention.
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {analysis.summary}
            </p>
          </div>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              {isPerformanceTips ? (
                <RecommendationChecklist
                  analysisId={analysis.id}
                  recommendations={analysis.recommendations}
                  onActionExecuted={onActionExecuted || (() => {})}
                />
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <h4 className="font-semibold mb-2">{rec.title}</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {rec.description}
                        </p>
                        {rec.sql && (
                          <div className="mt-3 p-3 bg-gray-900 dark:bg-gray-950 rounded-md">
                            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                              {rec.sql}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Insights (from raw response) */}
          {analysis.rawResponse?.insights && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Additional Insights</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {typeof analysis.rawResponse.insights === 'string'
                    ? analysis.rawResponse.insights
                    : JSON.stringify(analysis.rawResponse.insights, null, 2)}
                </p>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

