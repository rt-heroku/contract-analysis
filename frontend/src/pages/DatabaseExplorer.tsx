import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Plus, Code, X } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { DbTree, DbObject } from '@/components/db-explorer/DbTree';
import { SqlQueryEditor } from '@/components/db-explorer/SqlQueryEditor';
import { ResultsGrid } from '@/components/db-explorer/ResultsGrid';
import { ObjectDetailsPanel } from '@/components/db-explorer/ObjectDetailsPanel';
import { QueryHistoryPanel } from '@/components/db-explorer/QueryHistoryPanel';
import api from '@/lib/api';
import { cn } from '@/utils/helpers';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface QueryResult {
  rows: any[];
  fields: any[];
  rowCount: number;
  executionTime: number;
  command: string;
}

interface QueryTab {
  id: string;
  name: string;
  query: string;
  result?: QueryResult;
  isExecuting: boolean;
}

export const DatabaseExplorer: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState<DbObject | null>(null);
  
  // Query tabs
  const [queryTabs, setQueryTabs] = useState<QueryTab[]>([
    { id: '1', name: 'Query 1', query: '', isExecuting: false },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  
  // Layout state
  const [showHistory, setShowHistory] = useState(false);
  const [showObjectDetails, setShowObjectDetails] = useState(false);
  const treeWidth = 280;

  // Alert dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/db-explorer/connectors');
      const conns = response.data.connectors || [];
      setConnectors(conns);
      
      if (conns.length > 0) {
        setSelectedConnector(conns[0]);
      }
    } catch (error: any) {
      console.error('Failed to load connectors:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load database connectors',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (query: string, saveToHistory: boolean = true) => {
    if (!selectedConnector) return;

    const activeTab = queryTabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;

    try {
      // Update tab state to executing
      setQueryTabs(tabs =>
        tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, isExecuting: true, result: undefined }
            : tab
        )
      );

      const response = await api.post(`/db-explorer/${selectedConnector.id}/query`, {
        query,
        saveToHistory,
      });

      const result: QueryResult = response.data;

      // Update tab with results
      setQueryTabs(tabs =>
        tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, isExecuting: false, result }
            : tab
        )
      );
    } catch (error: any) {
      console.error('Failed to execute query:', error);
      
      setQueryTabs(tabs =>
        tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, isExecuting: false }
            : tab
        )
      );

      setAlertDialog({
        isOpen: true,
        title: 'Query Execution Failed',
        message: error.response?.data?.error || 'Failed to execute query',
        type: 'error',
      });
    }
  };

  const handleTableAction = async (action: string, tableName: string, schemaName: string) => {
    if (!selectedConnector) return;

    switch (action) {
      case 'view-data':
        // Generate and execute SELECT query
        const selectQuery = `SELECT * FROM "${schemaName}"."${tableName}" LIMIT 100;`;
        const activeTab = queryTabs.find(tab => tab.id === activeTabId);
        if (activeTab) {
          setQueryTabs(tabs =>
            tabs.map(tab =>
              tab.id === activeTabId
                ? { ...tab, query: selectQuery }
                : tab
            )
          );
          await executeQuery(selectQuery, false);
        }
        break;

      case 'export':
        setAlertDialog({
          isOpen: true,
          title: 'Export Table',
          message: `Export functionality for ${tableName} will be available soon.`,
          type: 'info',
        });
        break;

      case 'truncate':
        // Show confirmation dialog (will be implemented in Part B)
        setAlertDialog({
          isOpen: true,
          title: 'Truncate Table',
          message: `Are you sure you want to truncate table "${schemaName}"."${tableName}"? This will delete all rows.`,
          type: 'warning',
        });
        break;

      case 'drop':
        // Show confirmation dialog (will be implemented in Part B)
        setAlertDialog({
          isOpen: true,
          title: 'Drop Table',
          message: `Are you sure you want to drop table "${schemaName}"."${tableName}"? This action cannot be undone.`,
          type: 'warning',
        });
        break;
    }
  };

  const handleViewAction = async (action: string, viewName: string, schemaName: string) => {
    if (!selectedConnector) return;

    switch (action) {
      case 'view-definition':
        // Select the view object to show its definition
        setSelectedObject({
          type: 'view',
          name: viewName,
          schemaName: schemaName,
        });
        setShowObjectDetails(true);
        break;

      case 'drop':
        setAlertDialog({
          isOpen: true,
          title: 'Drop View',
          message: `Are you sure you want to drop view "${schemaName}"."${viewName}"?`,
          type: 'warning',
        });
        break;
    }
  };

  const handleSchemaAction = async (action: string, schemaName: string) => {
    if (!selectedConnector) return;

    switch (action) {
      case 'create-table':
        setAlertDialog({
          isOpen: true,
          title: 'Create Table',
          message: `Create table functionality in schema "${schemaName}" will be implemented in Part B.`,
          type: 'info',
        });
        break;
    }
  };

  const handleColumnAction = async (action: string, columnName: string, tableName: string, schemaName: string) => {
    if (!selectedConnector) return;

    switch (action) {
      case 'create-index':
        setAlertDialog({
          isOpen: true,
          title: 'Create Index',
          message: `Create index on column "${columnName}" in table "${schemaName}"."${tableName}" will be available soon.`,
          type: 'info',
        });
        break;
    }
  };

  const handleExplainQuery = async (query: string) => {
    if (!selectedConnector) return;

    try {
      const response = await api.post(`/db-explorer/${selectedConnector.id}/explain`, {
        query,
      });

      // Show explain result in a dialog or new tab
      setAlertDialog({
        isOpen: true,
        title: 'Query Execution Plan',
        message: JSON.stringify(response.data.explain, null, 2),
        type: 'info',
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Explain Failed',
        message: error.response?.data?.error || 'Failed to explain query',
        type: 'error',
      });
    }
  };

  const handleSaveFavorite = async (query: string, queryName: string) => {
    if (!selectedConnector) return;

    try {
      await api.post('/db-explorer/queries/favorites', {
        connectorId: selectedConnector.id,
        queryText: query,
        queryName,
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Query saved to favorites',
        type: 'success',
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save favorite',
        type: 'error',
      });
    }
  };

  const handleSelectObject = (object: DbObject) => {
    setSelectedObject(object);
    setShowObjectDetails(true);

    // If it's a table, generate SELECT query
    if (object.type === 'table' && object.schemaName && object.tableName) {
      const query = `SELECT * FROM "${object.schemaName}"."${object.tableName}" LIMIT 100;`;
      const activeTab = queryTabs.find(tab => tab.id === activeTabId);
      if (activeTab) {
        setQueryTabs(tabs =>
          tabs.map(tab =>
            tab.id === activeTabId
              ? { ...tab, query }
              : tab
          )
        );
      }
    }
  };

  const handleSelectQueryFromHistory = (query: string) => {
    const activeTab = queryTabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      setQueryTabs(tabs =>
        tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, query }
            : tab
        )
      );
    }
  };

  const addNewQueryTab = () => {
    const newId = String(Date.now());
    const newTab: QueryTab = {
      id: newId,
      name: `Query ${queryTabs.length + 1}`,
      query: '',
      isExecuting: false,
    };
    setQueryTabs([...queryTabs, newTab]);
    setActiveTabId(newId);
  };

  const closeQueryTab = (tabId: string) => {
    if (queryTabs.length === 1) return; // Don't close last tab
    
    const newTabs = queryTabs.filter(tab => tab.id !== tabId);
    setQueryTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const activeTab = queryTabs.find(tab => tab.id === activeTabId);

  if (loading) {
    return <Loading />;
  }

  if (connectors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            No Database Connectors
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to create a database connector to use the Database Explorer.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/connectors'}>
            <Plus className="w-4 h-4 mr-2" />
            Create Connector
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Database className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Database Explorer
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Connector Selector */}
          <select
            value={selectedConnector?.id || ''}
            onChange={(e) => {
              const connector = connectors.find(c => c.id === parseInt(e.target.value));
              setSelectedConnector(connector || null);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {connectors.map(connector => (
              <option key={connector.id} value={connector.id}>
                {connector.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadConnectors}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            title="Query History"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Database Tree */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto"
          style={{ width: `${treeWidth}px` }}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Objects
            </h3>
          </div>
          {selectedConnector && (
            <DbTree
              connectorId={selectedConnector.id}
              onSelectObject={handleSelectObject}
              onTableAction={handleTableAction}
              onViewAction={handleViewAction}
              onSchemaAction={handleSchemaAction}
              onColumnAction={handleColumnAction}
            />
          )}
        </div>

        {/* Center - Query Editor & Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {queryTabs.map(tab => (
              <div
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer group',
                  activeTabId === tab.id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'bg-gray-200 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                )}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="text-sm font-medium">{tab.name}</span>
                {queryTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeQueryTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addNewQueryTab}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="New Query Tab"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Query Editor */}
          <div className="flex-shrink-0" style={{ height: '300px' }}>
            {activeTab && (
              <SqlQueryEditor
                value={activeTab.query}
                onChange={(query) =>
                  setQueryTabs(tabs =>
                    tabs.map(tab =>
                      tab.id === activeTabId ? { ...tab, query } : tab
                    )
                  )
                }
                onExecute={(query) => executeQuery(query)}
                onExplain={handleExplainQuery}
                onSaveFavorite={handleSaveFavorite}
                isExecuting={activeTab.isExecuting}
                executionTime={activeTab.result?.executionTime}
                rowCount={activeTab.result?.rowCount}
                className="h-full"
              />
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab?.result ? (
              <ResultsGrid
                data={activeTab.result.rows}
                columns={Object.keys(activeTab.result.rows[0] || {})}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                {activeTab?.isExecuting ? 'Executing query...' : 'Execute a query to see results'}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Object Details */}
        {showObjectDetails && (
          <div
            className="flex-shrink-0 border-l border-gray-200 dark:border-gray-700 overflow-auto"
            style={{ width: '400px' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Object Details
              </h3>
              <button
                onClick={() => setShowObjectDetails(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedConnector && (
              <ObjectDetailsPanel
                connectorId={selectedConnector.id}
                object={selectedObject}
                className="border-0"
              />
            )}
          </div>
        )}

        {/* History Panel (Overlay) */}
        {showHistory && (
          <div className="absolute top-0 right-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-10 border-l border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Query History & Favorites
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedConnector && (
              <QueryHistoryPanel
                connectorId={selectedConnector.id}
                onSelectQuery={handleSelectQueryFromHistory}
                onExecuteQuery={(query) => executeQuery(query, false)}
                className="border-0 h-full"
              />
            )}
          </div>
        )}
      </div>

      {/* Alert Dialog */}
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

