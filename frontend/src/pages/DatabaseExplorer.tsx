import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Plus, Code, X, List, Network, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { DbTree, DbObject } from '@/components/db-explorer/DbTree';
import { SqlQueryEditor } from '@/components/db-explorer/SqlQueryEditor';
import { ResultsGrid } from '@/components/db-explorer/ResultsGrid';
import { ObjectDetailsTabs } from '@/components/db-explorer/ObjectDetailsTabs';
import { QueryHistoryPanel } from '@/components/db-explorer/QueryHistoryPanel';
import { CreateTableDialog } from '@/components/db-explorer/CreateTableDialog';
import { ConfirmationDialog } from '@/components/db-explorer/ConfirmationDialog';
import { EditRowDialog } from '@/components/db-explorer/EditRowDialog';
import { AlterTableDialog } from '@/components/db-explorer/AlterTableDialog';
import { IndexManagementDialog } from '@/components/db-explorer/IndexManagementDialog';
import { AISQLGeneratorDialog } from '@/components/db-explorer/AISQLGeneratorDialog';
import { DatabaseERD } from '@/components/db-explorer/DatabaseERD';
import { ConnectorSelectorModal } from '@/components/db-explorer/ConnectorSelectorModal';
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
  const [showConnectorSelector, setShowConnectorSelector] = useState(false);
  
  // Query tabs
  const [queryTabs, setQueryTabs] = useState<QueryTab[]>([
    { id: '1', name: 'Query 1', query: '', isExecuting: false },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  
  // Layout state
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'erd'>('tree');
  const [showQueryEditor, setShowQueryEditor] = useState(true);
  // Resizable panel state
  const [treeWidth, setTreeWidth] = useState(() => {
    const saved = localStorage.getItem('db-explorer-tree-width');
    return saved ? parseInt(saved) : 280;
  });
  const [queryEditorHeight, setQueryEditorHeight] = useState(() => {
    const saved = localStorage.getItem('db-explorer-query-height');
    return saved ? parseInt(saved) : 300;
  });
  const [isResizingTree, setIsResizingTree] = useState(false);
  const [isResizingQuery, setIsResizingQuery] = useState(false);

  // Dialogs
  const [createTableDialog, setCreateTableDialog] = useState<{
    isOpen: boolean;
    schemaName: string;
  }>({ isOpen: false, schemaName: '' });

  const [editRowDialog, setEditRowDialog] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    tableName: string;
    schemaName: string;
    columns: any[];
    rowData?: any;
  }>({
    isOpen: false,
    mode: 'add',
    tableName: '',
    schemaName: '',
    columns: [],
  });

  const [alterTableDialog, setAlterTableDialog] = useState<{
    isOpen: boolean;
    tableName: string;
    schemaName: string;
    columns: any[];
  }>({
    isOpen: false,
    tableName: '',
    schemaName: '',
    columns: [],
  });

  const [indexDialog, setIndexDialog] = useState<{
    isOpen: boolean;
    tableName: string;
    schemaName: string;
    columns: any[];
    indexes: any[];
  }>({
    isOpen: false,
    tableName: '',
    schemaName: '',
    columns: [],
    indexes: [],
  });

  const [aiDialog, setAiDialog] = useState(false);

  const [currentTableContext, setCurrentTableContext] = useState<{
    tableName: string;
    schemaName: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    danger: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    danger: false,
    onConfirm: () => {},
  });

  const [dialogLoading, setDialogLoading] = useState(false);

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

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTree) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setTreeWidth(newWidth);
        localStorage.setItem('db-explorer-tree-width', newWidth.toString());
      }
      if (isResizingQuery) {
        const editorTop = document.querySelector('.query-editor-container')?.getBoundingClientRect().top || 0;
        const newHeight = Math.max(150, Math.min(600, e.clientY - editorTop));
        setQueryEditorHeight(newHeight);
        localStorage.setItem('db-explorer-query-height', newHeight.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizingTree(false);
      setIsResizingQuery(false);
    };

    if (isResizingTree || isResizingQuery) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingTree ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingTree, isResizingQuery]);

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
        // Set current table context for data editing
        setCurrentTableContext({ tableName, schemaName });
        
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

      case 'alter':
        await handleAlterTable(tableName, schemaName);
        break;

      case 'manage-indexes':
        await handleManageIndexes(tableName, schemaName);
        break;

      case 'truncate':
        setConfirmDialog({
          isOpen: true,
          title: 'Truncate Table',
          message: `Are you sure you want to truncate table "${schemaName}"."${tableName}"? This will delete all rows but keep the table structure.`,
          danger: true,
          onConfirm: () => handleTruncateTable(schemaName, tableName),
        });
        break;

      case 'drop':
        setConfirmDialog({
          isOpen: true,
          title: 'Drop Table',
          message: `Are you sure you want to drop table "${schemaName}"."${tableName}"? This action cannot be undone and will permanently delete the table and all its data.`,
          danger: true,
          onConfirm: () => handleDropTable(schemaName, tableName),
        });
        break;
    }
  };

  const handleDropTable = async (schemaName: string, tableName: string) => {
    if (!selectedConnector) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/tables/drop`, {
        schemaName,
        tableName,
        cascade: false,
      });

      setConfirmDialog({ ...confirmDialog, isOpen: false });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Table "${tableName}" dropped successfully`,
        type: 'success',
      });

      // Refresh the tree
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to drop table',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleTruncateTable = async (schemaName: string, tableName: string) => {
    if (!selectedConnector) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/tables/truncate`, {
        schemaName,
        tableName,
        cascade: false,
      });

      setConfirmDialog({ ...confirmDialog, isOpen: false });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Table "${tableName}" truncated successfully`,
        type: 'success',
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to truncate table',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
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
        setCreateTableDialog({
          isOpen: true,
          schemaName,
        });
        break;
    }
  };

  const handleCreateTable = async (data: {
    tableName: string;
    schemaName: string;
    columns: any[];
    primaryKey: string[];
  }) => {
    if (!selectedConnector) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/tables/create`, data);

      setCreateTableDialog({ isOpen: false, schemaName: '' });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Table "${data.tableName}" created successfully`,
        type: 'success',
      });

      // Refresh the tree
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create table',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleAlterTable = async (tableName: string, schemaName: string) => {
    if (!selectedConnector) return;

    try {
      // Fetch table columns
      const response = await api.get(`/db-explorer/${selectedConnector.id}/schemas/${schemaName}/tables/${tableName}/columns`);
      const columns = response.data;

      setAlterTableDialog({
        isOpen: true,
        tableName,
        schemaName,
        columns,
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load table columns',
        type: 'error',
      });
    }
  };

  const handleAddColumn = async (column: any) => {
    if (!selectedConnector || !alterTableDialog.schemaName || !alterTableDialog.tableName) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/tables/add-column`, {
        schemaName: alterTableDialog.schemaName,
        tableName: alterTableDialog.tableName,
        column,
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Column "${column.name}" added successfully`,
        type: 'success',
      });

      // Close dialog and refresh
      setAlterTableDialog({ ...alterTableDialog, isOpen: false });
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add column',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDropColumn = async (columnName: string) => {
    if (!selectedConnector || !alterTableDialog.schemaName || !alterTableDialog.tableName) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/tables/drop-column`, {
        schemaName: alterTableDialog.schemaName,
        tableName: alterTableDialog.tableName,
        columnName,
        cascade: false,
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Column "${columnName}" dropped successfully`,
        type: 'success',
      });

      // Close dialog and refresh
      setAlterTableDialog({ ...alterTableDialog, isOpen: false });
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to drop column',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleManageIndexes = async (tableName: string, schemaName: string) => {
    if (!selectedConnector) return;

    try {
      const [columnsRes, indexesRes] = await Promise.all([
        api.get(`/db-explorer/${selectedConnector.id}/schemas/${schemaName}/tables/${tableName}/columns`),
        api.get(`/db-explorer/${selectedConnector.id}/schemas/${schemaName}/tables/${tableName}/indexes`),
      ]);

      setIndexDialog({
        isOpen: true,
        tableName,
        schemaName,
        columns: columnsRes.data,
        indexes: indexesRes.data,
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load table metadata',
        type: 'error',
      });
    }
  };

  const handleCreateIndex = async (data: { name: string; columns: string[]; isUnique: boolean }) => {
    if (!selectedConnector || !indexDialog.schemaName || !indexDialog.tableName) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/indexes/create`, {
        schemaName: indexDialog.schemaName,
        tableName: indexDialog.tableName,
        ...data,
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Index "${data.name}" created successfully`,
        type: 'success',
      });

      setIndexDialog({ ...indexDialog, isOpen: false });
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create index',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDropIndex = async (indexName: string) => {
    if (!selectedConnector || !indexDialog.schemaName) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/indexes/drop`, {
        schemaName: indexDialog.schemaName,
        indexName,
        cascade: false,
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Index "${indexName}" dropped successfully`,
        type: 'success',
      });

      setIndexDialog({ ...indexDialog, isOpen: false });
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to drop index',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleAIGenerate = async (prompt: string, history: any[]) => {
    if (!selectedConnector) throw new Error('No connector selected');

    const response = await api.post(`/db-explorer/${selectedConnector.id}/ai-generate`, {
      prompt,
      schemaName: 'public', // TODO: Use selected schema from tree
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content,
        sql: msg.sql,
      })),
    });

    return response.data;
  };

  const handleInsertAISQL = (sql: string) => {
    const activeTab = queryTabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      setQueryTabs(tabs =>
        tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, query: sql }
            : tab
        )
      );
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

  // Data editing handlers
  const handleAddRow = async () => {
    if (!selectedConnector || !currentTableContext) return;

    try {
      // Fetch table columns
      const response = await api.get(`/db-explorer/${selectedConnector.id}/schemas/${currentTableContext.schemaName}/tables/${currentTableContext.tableName}/columns`);
      const columns = response.data;

      setEditRowDialog({
        isOpen: true,
        mode: 'add',
        tableName: currentTableContext.tableName,
        schemaName: currentTableContext.schemaName,
        columns,
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load table columns',
        type: 'error',
      });
    }
  };

  const handleEditRow = async (row: any) => {
    if (!selectedConnector || !currentTableContext) return;

    try {
      // Fetch table columns
      const response = await api.get(`/db-explorer/${selectedConnector.id}/schemas/${currentTableContext.schemaName}/tables/${currentTableContext.tableName}/columns`);
      const columns = response.data;

      setEditRowDialog({
        isOpen: true,
        mode: 'edit',
        tableName: currentTableContext.tableName,
        schemaName: currentTableContext.schemaName,
        columns,
        rowData: row,
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load table columns',
        type: 'error',
      });
    }
  };

  const handleDeleteRow = async (row: any) => {
    if (!selectedConnector || !currentTableContext) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Row',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      danger: true,
      onConfirm: () => executeDeleteRow(row),
    });
  };

  const executeDeleteRow = async (row: any) => {
    if (!selectedConnector || !currentTableContext) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/data/delete`, {
        schemaName: currentTableContext.schemaName,
        tableName: currentTableContext.tableName,
        where: row,
      });

      setConfirmDialog({ ...confirmDialog, isOpen: false });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Row deleted successfully',
        type: 'success',
      });

      // Refresh data
      const activeTab = queryTabs.find(tab => tab.id === activeTabId);
      if (activeTab?.query) {
        await executeQuery(activeTab.query, false);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete row',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleBulkDelete = async (rows: any[]) => {
    if (!selectedConnector || !currentTableContext) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Rows',
      message: `Are you sure you want to delete ${rows.length} row(s)? This action cannot be undone.`,
      danger: true,
      onConfirm: () => executeBulkDelete(rows),
    });
  };

  const executeBulkDelete = async (rows: any[]) => {
    if (!selectedConnector || !currentTableContext) return;

    try {
      setDialogLoading(true);
      await api.post(`/db-explorer/${selectedConnector.id}/data/bulk-delete`, {
        schemaName: currentTableContext.schemaName,
        tableName: currentTableContext.tableName,
        whereConditions: rows,
      });

      setConfirmDialog({ ...confirmDialog, isOpen: false });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `${rows.length} row(s) deleted successfully`,
        type: 'success',
      });

      // Refresh data
      const activeTab = queryTabs.find(tab => tab.id === activeTabId);
      if (activeTab?.query) {
        await executeQuery(activeTab.query, false);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete rows',
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSaveRow = async (data: Record<string, any>) => {
    if (!selectedConnector || !editRowDialog.schemaName || !editRowDialog.tableName) return;

    try {
      setDialogLoading(true);

      if (editRowDialog.mode === 'add') {
        // Insert new row
        await api.post(`/db-explorer/${selectedConnector.id}/data/insert`, {
          schemaName: editRowDialog.schemaName,
          tableName: editRowDialog.tableName,
          data,
        });

        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Row added successfully',
          type: 'success',
        });
      } else {
        // Update existing row
        await api.post(`/db-explorer/${selectedConnector.id}/data/update`, {
          schemaName: editRowDialog.schemaName,
          tableName: editRowDialog.tableName,
          data,
          where: editRowDialog.rowData, // Use original data as WHERE clause
        });

        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Row updated successfully',
          type: 'success',
        });
      }

      setEditRowDialog({ ...editRowDialog, isOpen: false });

      // Refresh data
      const activeTab = queryTabs.find(tab => tab.id === activeTabId);
      if (activeTab?.query) {
        await executeQuery(activeTab.query, false);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || `Failed to ${editRowDialog.mode === 'add' ? 'add' : 'update'} row`,
        type: 'error',
      });
    } finally {
      setDialogLoading(false);
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

  const handleSelectObject = (object: DbObject, targetTab?: string) => {
    setSelectedObject(object);

    // Pass target tab to ObjectDetailsTabs via metadata
    if (targetTab && object.metadata) {
      object.metadata.activeTab = targetTab;
    } else if (targetTab) {
      object.metadata = { activeTab: targetTab };
    }

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

  const handleDoubleClickTable = (tableName: string, schemaName: string) => {
    // Create new query tab with table name and smart query
    const newTabId = `query-${Date.now()}`;
    const query = `SELECT * FROM "${schemaName}"."${tableName}" LIMIT 100;`;
    
    const newTab: QueryTab = {
      id: newTabId,
      name: tableName,
      query,
      result: undefined,
      isExecuting: false,
    };

    setQueryTabs([...queryTabs, newTab]);
    setActiveTabId(newTabId);
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
          <Button
            onClick={() => setShowConnectorSelector(true)}
            variant="outline"
            className="gap-2"
          >
            <Database className="w-4 h-4" />
            {selectedConnector ? selectedConnector.name : 'Select Database'}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'tree' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('tree')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              Tree
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'erd' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('erd')}
              className="gap-2"
            >
              <Network className="w-4 h-4" />
              ERD
            </Button>
          </div>

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
        {/* Left Sidebar - Database Tree (Tree View Only) */}
        {viewMode === 'tree' && (
          <>
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
                  onDoubleClickTable={handleDoubleClickTable}
                  onTableAction={handleTableAction}
                  onViewAction={handleViewAction}
                  onSchemaAction={handleSchemaAction}
                  onColumnAction={handleColumnAction}
                />
              )}
            </div>
            {/* Tree Resize Handle */}
            <div
              className="flex-shrink-0 w-1 bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 dark:hover:bg-primary-500 cursor-ew-resize transition-colors group relative"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingTree(true);
              }}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
          </>
        )}

        {/* Center - ERD View or Query Editor & Results */}
        {viewMode === 'erd' ? (
          <div className="flex-1 overflow-hidden">
            {selectedConnector && (
              <DatabaseERD
                connectorId={selectedConnector.id}
                schemaName="public"
                className="w-full h-full"
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query Tabs */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 overflow-x-auto">
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
            
            {/* Toggle Query Editor Button */}
            <button
              onClick={() => setShowQueryEditor(!showQueryEditor)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              title={showQueryEditor ? "Hide Query Editor" : "Show Query Editor"}
            >
              {showQueryEditor ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-xs">Hide Editor</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-xs">Show Editor</span>
                </>
              )}
            </button>
          </div>

          {/* Query Editor */}
          {showQueryEditor && (
            <>
              <div className="flex-shrink-0 query-editor-container" style={{ height: `${queryEditorHeight}px` }}>
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
                    onAIGenerate={() => setAiDialog(true)}
                    onSaveFavorite={handleSaveFavorite}
                    isExecuting={activeTab.isExecuting}
                    executionTime={activeTab.result?.executionTime}
                    rowCount={activeTab.result?.rowCount}
                    className="h-full"
                  />
                )}
              </div>

              {/* Query Editor Resize Handle */}
              <div
                className="flex-shrink-0 h-1 bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 dark:hover:bg-primary-500 cursor-ns-resize transition-colors group relative"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizingQuery(true);
                }}
              >
                <div className="absolute inset-x-0 -top-1 -bottom-1" />
              </div>
            </>
          )}

          {/* Results or Object Details Tabs */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {selectedObject ? (
              /* Object Details Tabs */
              selectedConnector && (
                <ObjectDetailsTabs
                  connectorId={selectedConnector.id}
                  object={selectedObject}
                  onAddRow={handleAddRow}
                  onEditRow={handleEditRow}
                  onDeleteRow={handleDeleteRow}
                  onAddColumn={() => setAlterTableDialog({ isOpen: true, schemaName: selectedObject.schemaName || '', tableName: selectedObject.tableName || '', columns: [] })}
                />
              )
            ) : (
              /* Query Results */
              <div className="flex-1 overflow-auto p-4">
                {activeTab?.result ? (
                  <ResultsGrid
                    data={activeTab.result.rows}
                    columns={Object.keys(activeTab.result.rows[0] || {})}
                    showActions={!!currentTableContext}
                    onEdit={currentTableContext ? handleEditRow : undefined}
                    onDelete={currentTableContext ? handleDeleteRow : undefined}
                    onAdd={currentTableContext ? handleAddRow : undefined}
                    onBulkDelete={currentTableContext ? handleBulkDelete : undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    {activeTab?.isExecuting ? 'Executing query...' : 'Execute a query to see results'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* History Panel (Overlay - Tree View Only) */}
        {viewMode === 'tree' && showHistory && (
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

      {/* Create Table Dialog */}
      <CreateTableDialog
        isOpen={createTableDialog.isOpen}
        onClose={() => setCreateTableDialog({ isOpen: false, schemaName: '' })}
        onSubmit={handleCreateTable}
        schemaName={createTableDialog.schemaName}
        isLoading={dialogLoading}
      />

      {/* Edit/Add Row Dialog */}
      <EditRowDialog
        isOpen={editRowDialog.isOpen}
        onClose={() => setEditRowDialog({ ...editRowDialog, isOpen: false })}
        onSubmit={handleSaveRow}
        columns={editRowDialog.columns}
        initialData={editRowDialog.rowData}
        tableName={editRowDialog.tableName}
        schemaName={editRowDialog.schemaName}
        mode={editRowDialog.mode}
        isLoading={dialogLoading}
      />

      {/* Alter Table Dialog */}
      <AlterTableDialog
        isOpen={alterTableDialog.isOpen}
        onClose={() => setAlterTableDialog({ ...alterTableDialog, isOpen: false })}
        onAddColumn={handleAddColumn}
        onDropColumn={handleDropColumn}
        tableName={alterTableDialog.tableName}
        schemaName={alterTableDialog.schemaName}
        existingColumns={alterTableDialog.columns}
        isLoading={dialogLoading}
      />

      {/* Index Management Dialog */}
      <IndexManagementDialog
        isOpen={indexDialog.isOpen}
        onClose={() => setIndexDialog({ ...indexDialog, isOpen: false })}
        onCreateIndex={handleCreateIndex}
        onDropIndex={handleDropIndex}
        tableName={indexDialog.tableName}
        schemaName={indexDialog.schemaName}
        existingIndexes={indexDialog.indexes}
        columns={indexDialog.columns}
        isLoading={dialogLoading}
      />

      {/* AI SQL Generator Dialog */}
      <AISQLGeneratorDialog
        isOpen={aiDialog}
        onClose={() => setAiDialog(false)}
        onGenerateSQL={handleAIGenerate}
        onInsertSQL={handleInsertAISQL}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger}
        isLoading={dialogLoading}
        confirmText={confirmDialog.danger ? 'Delete' : 'Confirm'}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Connector Selector Modal */}
      <ConnectorSelectorModal
        isOpen={showConnectorSelector}
        onClose={() => setShowConnectorSelector(false)}
        onSelectConnector={(connector) => setSelectedConnector(connector)}
        currentConnectorId={selectedConnector?.id}
        isAdmin={true}
      />
    </div>
  );
};

