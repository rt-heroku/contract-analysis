import React, { useState, useEffect } from 'react';
import { History, Star, Clock, Database, Trash, Play, Copy, StarOff } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import api from '@/lib/api';
import { cn } from '@/utils/helpers';

interface Query {
  id: number;
  queryText: string;
  queryName?: string;
  description?: string;
  isFavorite: boolean;
  executionTime?: number;
  rowsAffected?: number;
  status?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface QueryHistoryPanelProps {
  connectorId: number | null;
  onSelectQuery: (query: string) => void;
  onExecuteQuery?: (query: string) => void;
  className?: string;
}

export const QueryHistoryPanel: React.FC<QueryHistoryPanelProps> = ({
  connectorId,
  onSelectQuery,
  onExecuteQuery,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (connectorId) {
      loadQueries();
    }
  }, [connectorId, activeTab, page]);

  const loadQueries = async () => {
    if (!connectorId) return;

    try {
      setLoading(true);

      const endpoint = activeTab === 'favorites' 
        ? `/db-explorer/queries/favorites?connectorId=${connectorId}`
        : `/db-explorer/queries/history?connectorId=${connectorId}&page=${page}&limit=20`;

      const response = await api.get(endpoint);

      if (activeTab === 'favorites') {
        setQueries(response.data.queries || []);
        setHasMore(false);
      } else {
        setQueries(response.data.queries || []);
        setHasMore(page < (response.data.pagination?.totalPages || 1));
      }
    } catch (error) {
      console.error('Failed to load queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (queryId: number, isFavorite: boolean) => {
    try {
      await api.put(`/db-explorer/queries/${queryId}`, { isFavorite: !isFavorite });
      loadQueries();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteQuery = async (queryId: number) => {
    try {
      await api.delete(`/db-explorer/queries/${queryId}`);
      loadQueries();
    } catch (error) {
      console.error('Failed to delete query:', error);
    }
  };

  const copyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredQueries = queries.filter(query =>
    query.queryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (query.queryName && query.queryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (query.description && query.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab('history');
            setPage(1);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <History className="w-4 h-4" />
          History
        </button>
        <button
          onClick={() => {
            setActiveTab('favorites');
            setPage(1);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'favorites'
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <Star className="w-4 h-4" />
          Favorites
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <Input
          type="text"
          placeholder="Search queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Query List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No queries found' : activeTab === 'favorites' ? 'No favorite queries yet' : 'No query history'}
            </div>
          </div>
        ) : (
          filteredQueries.map((query) => (
            <div
              key={query.id}
              className={cn(
                'p-3 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
                query.status === 'error' && 'border-red-200 dark:border-red-800'
              )}
              onClick={() => onSelectQuery(query.queryText)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  {query.queryName && (
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                      {query.queryName}
                    </h4>
                  )}
                  {query.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {query.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(query.id, query.isFavorite);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={query.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {query.isFavorite ? (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {onExecuteQuery && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecuteQuery(query.queryText);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Execute query"
                    >
                      <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyQuery(query.queryText);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copy query"
                  >
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this query?')) {
                        deleteQuery(query.id);
                      }
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete query"
                  >
                    <Trash className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Query Text */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 mb-2 overflow-hidden">
                <pre className="text-xs text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap line-clamp-3">
                  {query.queryText}
                </pre>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(query.createdAt)}
                </div>
                
                {query.executionTime !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>⏱️ {query.executionTime}ms</span>
                  </div>
                )}
                
                {query.rowsAffected !== undefined && (
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {query.rowsAffected} rows
                  </div>
                )}

                {query.status && (
                  <Badge variant={query.status === 'success' ? 'success' : 'error'}>
                    {query.status}
                  </Badge>
                )}
              </div>

              {query.errorMessage && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                  {query.errorMessage}
                </div>
              )}

              {query.tags && query.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {query.tags.map((tag, i) => (
                    <Badge key={i} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination for history */}
      {activeTab === 'history' && (page > 1 || hasMore) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

