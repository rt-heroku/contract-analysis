import React, { useState } from 'react';
import { Check, X, AlertTriangle, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';

interface Recommendation {
  title: string;
  description: string;
  sql?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  impact?: string;
  effort?: string;
}

interface RecommendationChecklistProps {
  analysisId: number;
  recommendations: Recommendation[];
  onActionExecuted: (recommendation: Recommendation) => void;
}

export const RecommendationChecklist: React.FC<RecommendationChecklistProps> = ({
  analysisId,
  recommendations,
  onActionExecuted,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [executedItems, setExecutedItems] = useState<Set<number>>(new Set());
  const [executing, setExecuting] = useState(false);

  const handleToggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleExecuteSelected = async () => {
    if (selectedItems.size === 0) return;

    try {
      setExecuting(true);
      const itemsToExecute = Array.from(selectedItems);

      // Track each executed action in the backend
      for (const index of itemsToExecute) {
        const recommendation = recommendations[index];
        await api.post(`/table-analysis/analysis/${analysisId}/execute`, {
          recommendation: recommendation.title,
          sqlExecuted: recommendation.sql || null,
        });
        onActionExecuted(recommendation);
      }

      // Mark items as executed
      const newExecuted = new Set([...executedItems, ...itemsToExecute]);
      setExecutedItems(newExecuted);
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error('Failed to track executed actions:', error);
    } finally {
      setExecuting(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'low':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Actionable Recommendations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select items to track execution
          </p>
        </div>
        <Button
          onClick={handleExecuteSelected}
          disabled={selectedItems.size === 0 || executing}
          className="flex items-center gap-2"
        >
          {executing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Execute Selected ({selectedItems.size})
        </Button>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const isSelected = selectedItems.has(index);
          const isExecuted = executedItems.has(index);

          return (
            <div
              key={index}
              className={`p-4 border rounded-lg transition-all ${
                isExecuted
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="pt-1">
                  {isExecuted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleItem(index)}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Title & Priority */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{rec.title}</h4>
                    {rec.priority && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(
                          rec.priority
                        )}`}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                    )}
                    {rec.category && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {rec.category}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rec.description}</p>

                  {/* Impact & Effort */}
                  {(rec.impact || rec.effort) && (
                    <div className="flex items-center gap-4 text-sm">
                      {rec.impact && (
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            Impact:
                          </span>{' '}
                          <span className="text-gray-700 dark:text-gray-300">{rec.impact}</span>
                        </div>
                      )}
                      {rec.effort && (
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            Effort:
                          </span>{' '}
                          <span className="text-gray-700 dark:text-gray-300">{rec.effort}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SQL Command */}
                  {rec.sql && (
                    <div className="mt-2 p-3 bg-gray-900 dark:bg-gray-950 rounded-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-400">SQL Command:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(rec.sql || '');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                        {rec.sql}
                      </pre>
                    </div>
                  )}

                  {/* Warning for SQL execution */}
                  {rec.sql && !isExecuted && (
                    <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-yellow-800 dark:text-yellow-300">
                        <strong>Manual execution required:</strong> Copy and execute the SQL
                        command manually in your database client. Checking this item will only
                        track that you've executed it.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {executedItems.size > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">
              {executedItems.size} of {recommendations.length} recommendations executed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

