import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Download, Copy, ChevronLeft, ChevronRight, Edit, Trash, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/helpers';

interface ResultsGridProps {
  data: any[];
  columns: string[];
  className?: string;
  maxHeight?: string;
  paginate?: boolean;
  pageSize?: number;
  onEdit?: (row: any, rowIndex: number) => void;
  onDelete?: (row: any, rowIndex: number) => void;
  onBulkDelete?: (rows: any[]) => void;
  onAdd?: () => void;
  showActions?: boolean;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  data,
  columns,
  className,
  maxHeight = '600px',
  paginate = true,
  pageSize = 50,
  onEdit,
  onDelete,
  onBulkDelete,
  onAdd,
  showActions = false,
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });
  }, [data, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginate) return sortedData;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize, paginate]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  };

  const getCellClassName = (value: any): string => {
    if (value === null || value === undefined) {
      return 'text-gray-400 dark:text-gray-500 italic';
    }
    if (typeof value === 'number') {
      return 'text-right font-mono';
    }
    if (typeof value === 'boolean') {
      return 'font-mono';
    }
    if (typeof value === 'object') {
      return 'font-mono text-xs';
    }
    return '';
  };

  const copyCell = (value: any, column: string, rowIndex: number) => {
    const text = formatCellValue(value);
    navigator.clipboard.writeText(text);
    const cellKey = `${rowIndex}-${column}`;
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const exportToCSV = () => {
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        const formatted = formatCellValue(value);
        // Escape quotes and wrap in quotes if contains comma
        return formatted.includes(',') ? `"${formatted.replace(/"/g, '""')}"` : formatted;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleRowSelection = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIndices = paginatedData.map((_, idx) => idx);
      setSelectedRows(new Set(allIndices));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedRows.size > 0) {
      const rowsToDelete = Array.from(selectedRows).map(idx => paginatedData[idx]);
      onBulkDelete(rowsToDelete);
      setSelectedRows(new Set());
    }
  };

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
        <p className="text-gray-500 dark:text-gray-400">No results to display</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedData.length} of {sortedData.length} rows
          </div>
          {selectedRows.size > 0 && (
            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {selectedRows.size} selected
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showActions && onAdd && (
            <Button
              size="sm"
              variant="primary"
              onClick={onAdd}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </Button>
          )}
          {selectedRows.size > 0 && onBulkDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash className="w-4 h-4" />
              Delete Selected ({selectedRows.size})
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={exportToJSON}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
            <tr>
              {showActions && (
                <th className="px-4 py-2 w-12 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none whitespace-nowrap"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column}</span>
                    {sortColumn === column && (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {showActions && (
                <th className="px-4 py-2 w-32 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                  selectedRows.has(rowIndex) && 'bg-primary-50 dark:bg-primary-900/20'
                )}
              >
                {showActions && (
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => toggleRowSelection(rowIndex)}
                      className="rounded"
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = row[column];
                  const cellKey = `${rowIndex}-${column}`;
                  
                  return (
                    <td
                      key={column}
                      className={cn(
                        'px-4 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-md truncate',
                        getCellClassName(value),
                        'group relative'
                      )}
                      title={formatCellValue(value)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{formatCellValue(value)}</span>
                        <button
                          onClick={() => copyCell(value, column, rowIndex)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                          title="Copy cell value"
                        >
                          {copiedCell === cellKey ? (
                            <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  );
                })}
                {showActions && (
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row, rowIndex)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit row"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row, rowIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete row"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'px-3 py-1 text-sm rounded transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

