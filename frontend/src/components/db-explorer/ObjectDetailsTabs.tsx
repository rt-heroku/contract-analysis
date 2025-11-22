import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  List, 
  Link2, 
  MoreHorizontal,
  RefreshCw,
  Download,
  Plus,
  Filter,
  Search,
  TrendingUp,
  GitBranch,
  Zap,
  Activity,
  Key,
  Eye,
  Loader,
  ChevronRight,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { DbObject } from './DbTree';
import { MiniERD } from './MiniERD';
import { CellValueModal } from './CellValueModal';
import api from '@/lib/api';

interface ObjectDetailsTabsProps {
  connectorId: number;
  object: DbObject | null;
  onRefreshData?: () => void;
  onAddRow?: () => void;
  onEditRow?: (row: any) => void;
  onDeleteRow?: (row: any) => void;
  onAddColumn?: () => void;
  onExecuteQuery?: (query: string) => void;
}

export const ObjectDetailsTabs: React.FC<ObjectDetailsTabsProps> = ({
  connectorId,
  object,
  onAddRow,
  onEditRow,
  onDeleteRow,
  onAddColumn,
}) => {
  const [activeTab, setActiveTab] = useState(object?.metadata?.activeTab || 'overview');
  const [loading, setLoading] = useState(false);
  const [dataLimit, setDataLimit] = useState(100);
  const [showIncomingFK, setShowIncomingFK] = useState(true);
  const [showOutgoingFK, setShowOutgoingFK] = useState(true);
  
  // Cell value modal
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [selectedCellValue, setSelectedCellValue] = useState<any>(null);
  const [selectedColumnName, setSelectedColumnName] = useState('');

  // Update active tab when object changes with a target tab
  useEffect(() => {
    if (object?.metadata?.activeTab) {
      setActiveTab(object.metadata.activeTab);
    }
  }, [object?.metadata?.activeTab]);
  
  // Data states
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);
  const [indexes, setIndexes] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [constraints, setConstraints] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dependencies, setDependencies] = useState<any>({ views: [], materializedViews: [], functions: [] });
  const [performance, setPerformance] = useState<any>({ table: {}, indexes: [] });
  
  const [columnSearch, setColumnSearch] = useState('');

  useEffect(() => {
    if (object && object.type === 'table') {
      loadTableDetails();
    }
  }, [object, connectorId]);

  useEffect(() => {
    if (object && activeTab === 'data') {
      loadTableData();
    }
  }, [activeTab, dataLimit, object, connectorId]);

  useEffect(() => {
    if (object && activeTab === 'more') {
      loadMoreDetails();
    }
  }, [activeTab, object, connectorId]);

  const loadTableDetails = async () => {
    if (!object || object.type !== 'table') return;

    try {
      setLoading(true);
      
      // Load all details in parallel
      const [
        columnsRes,
        fkRes,
        indexesRes,
        statsRes,
        depsRes,
        perfRes,
      ] = await Promise.all([
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/columns`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/foreign-keys`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/indexes`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/stats`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/dependencies`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/performance`),
      ]);

      setColumns(Array.isArray(columnsRes.data.columns) ? columnsRes.data.columns : []);
      setForeignKeys(Array.isArray(fkRes.data.foreignKeys) ? fkRes.data.foreignKeys : []);
      setIndexes(Array.isArray(indexesRes.data.indexes) ? indexesRes.data.indexes : []);
      setStats(statsRes.data || null);
      setDependencies(depsRes.data || { views: [], materializedViews: [], functions: [] });
      setPerformance(perfRes.data || { table: {}, indexes: [] });
    } catch (error) {
      console.error('Failed to load table details:', error);
      // Reset to defaults on error
      setColumns([]);
      setForeignKeys([]);
      setIndexes([]);
      setStats(null);
      setDependencies({ views: [], materializedViews: [], functions: [] });
      setPerformance({ table: {}, indexes: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    if (!object || object.type !== 'table') return;

    try {
      setLoading(true);
      const response = await api.post(`/db-explorer/${connectorId}/query`, {
        query: `SELECT * FROM "${object.schemaName}"."${object.name}" LIMIT ${dataLimit}`,
        saveToHistory: false,
      });
      
      setTableData(response.data.rows || []);
    } catch (error) {
      console.error('Failed to load table data:', error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreDetails = async () => {
    if (!object || object.type !== 'table') return;

    try {
      const [triggersRes, constraintsRes, policiesRes, rulesRes] = await Promise.all([
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/triggers`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/constraints`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/policies`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/rules`),
      ]);

      setTriggers(Array.isArray(triggersRes.data.triggers) ? triggersRes.data.triggers : []);
      setConstraints(Array.isArray(constraintsRes.data.constraints) ? constraintsRes.data.constraints : []);
      setPolicies(Array.isArray(policiesRes.data.policies) ? policiesRes.data.policies : []);
      setRules(Array.isArray(rulesRes.data.rules) ? rulesRes.data.rules : []);
    } catch (error) {
      console.error('Failed to load additional details:', error);
      setTriggers([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'more' || activeTab === 'dependencies' || activeTab === 'performance') {
      loadMoreDetails();
    }
  }, [activeTab]);

  const handleViewCellValue = (value: any, columnName: string) => {
    setSelectedCellValue(value);
    setSelectedColumnName(columnName);
    setCellModalOpen(true);
  };

  const renderCellValue = (value: any, columnName: string, maxLength: number = 50) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    }

    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const isTruncated = stringValue.length > maxLength;

    if (isTruncated) {
      return (
        <div className="flex items-center gap-2">
          <span className="truncate flex-1">{stringValue.substring(0, maxLength)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewCellValue(value, columnName);
            }}
            className="flex-shrink-0 px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded transition-colors"
            title="View full value"
          >
            ...
          </button>
        </div>
      );
    }

    return <span>{stringValue}</span>;
  };

  if (!object) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an object to view details</p>
        </div>
      </div>
    );
  }

  const filteredColumns = Array.isArray(columns) ? columns.filter(col =>
    (col.column_name || '').toLowerCase().includes(columnSearch.toLowerCase()) ||
    (col.data_type || '').toLowerCase().includes(columnSearch.toLowerCase())
  ) : [];

  const outgoingFKs = Array.isArray(foreignKeys) ? foreignKeys.filter(fk => fk.direction === 'outgoing') : [];
  const incomingFKs = Array.isArray(foreignKeys) ? foreignKeys.filter(fk => fk.direction === 'incoming') : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        <TabsList className="border-b border-gray-200 dark:border-gray-700 px-4">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="data">
            <TableIcon className="w-4 h-4 mr-2" />
            Data
          </TabsTrigger>
          <TabsTrigger value="columns">
            <List className="w-4 h-4 mr-2" />
            Columns
          </TabsTrigger>
          <TabsTrigger value="foreignkeys">
            <Link2 className="w-4 h-4 mr-2" />
            Foreign Keys
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <GitBranch className="w-4 h-4 mr-2" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <Activity className="w-4 h-4 mr-2" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="more">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            More
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Table Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                    <p className="font-mono">{object.schemaName}.{object.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                    <p className="capitalize">{object.type}</p>
                  </div>
                  {stats && (
                    <>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Row Count:</span>
                        <p className="font-semibold">{stats.rowCount?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Table Size:</span>
                        <p>{stats.tableSize || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Index Size:</span>
                        <p>{stats.indexSize || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Size:</span>
                        <p>{stats.totalSize || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Statistics</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {columns.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Columns</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {indexes.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Indexes</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {foreignKeys.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Foreign Keys</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {triggers.length || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Triggers</div>
                  </div>
                </div>
              </div>

              {/* Sample Data Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Sample Data (First 5 Rows)</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin" />
                  </div>
                ) : tableData.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          {Object.keys(tableData[0] || {}).slice(0, 6).map(key => (
                            <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              {key}
                            </th>
                          ))}
                          {Object.keys(tableData[0] || {}).length > 6 && (
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              ...
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tableData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            {Object.entries(row).slice(0, 6).map(([key, value]: [string, any], vIdx) => (
                              <td key={vIdx} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                                {renderCellValue(value, key, 40)}
                              </td>
                            ))}
                            {Object.keys(row).length > 6 && (
                              <td className="px-4 py-2 text-sm text-gray-400">
                                +{Object.keys(row).length - 6} more
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No data to preview
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="p-0 h-full flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={loadTableData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Limit:</span>
                  <select
                    value={dataLimit}
                    onChange={(e) => setDataLimit(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                  >
                    <option value="100">100</option>
                    <option value="500">500</option>
                    <option value="1000">1,000</option>
                    <option value="5000">5,000</option>
                    <option value="10000">10,000</option>
                  </select>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {tableData.length} row{tableData.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onAddRow && (
                  <Button size="sm" variant="primary" onClick={onAddRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin" />
                </div>
              ) : tableData.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto h-full">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                      <tr>
                        {Object.keys(tableData[0]).map(key => (
                          <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {Object.entries(row).map(([key, value]: [string, any], vIdx) => (
                            <td key={vIdx} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                              {renderCellValue(value, key, 100)}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right text-sm">
                            <div className="flex items-center justify-end gap-2">
                              {onEditRow && (
                                <button
                                  onClick={() => onEditRow(row)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  Edit
                                </button>
                              )}
                              {onDeleteRow && (
                                <button
                                  onClick={() => onDeleteRow(row)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No data found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Columns Tab */}
          <TabsContent value="columns" className="p-0 h-full flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="Search columns..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onAddColumn && (
                  <Button size="sm" variant="primary" onClick={onAddColumn}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Copy DDL
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {filteredColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                            {col.column_name}
                          </span>
                          {col.is_primary_key && (
                            <Badge variant="warning">
                              <Key className="w-3 h-3 mr-1" />
                              PK
                            </Badge>
                          )}
                          {col.is_foreign_key && (
                            <Badge variant="info">
                              <Link2 className="w-3 h-3 mr-1" />
                              FK
                            </Badge>
                          )}
                          {col.is_indexed && (
                            <Badge variant="default">
                              <Zap className="w-3 h-3 mr-1" />
                              Indexed
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {col.data_type}
                          {!col.is_nullable && <span className="ml-2 text-red-500">NOT NULL</span>}
                          {col.column_default && <span className="ml-2">Default: {col.column_default}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Foreign Keys Tab - CONTINUED IN NEXT FILE PART */}
          <TabsContent value="foreignkeys" className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOutgoingFK}
                    onChange={(e) => setShowOutgoingFK(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Outgoing ({outgoingFKs.length})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showIncomingFK}
                    onChange={(e) => setShowIncomingFK(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Incoming ({incomingFKs.length})</span>
                </label>
              </div>
            </div>

            <div className="space-y-6">
              {showOutgoingFK && outgoingFKs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Outgoing References</h3>
                  <div className="space-y-2">
                    {outgoingFKs.map((fk, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{fk.constraint_name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {fk.column_name}
                          </code>
                          {' → '}
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {fk.foreign_table_schema}.{fk.foreign_table_name}({fk.foreign_column_name})
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showIncomingFK && incomingFKs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Incoming References</h3>
                  <div className="space-y-2">
                    {incomingFKs.map((fk, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{fk.constraint_name}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {fk.foreign_table_schema}.{fk.foreign_table_name}({fk.foreign_column_name})
                          </code>
                          {' → '}
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {fk.column_name}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((showOutgoingFK && outgoingFKs.length === 0) || (showIncomingFK && incomingFKs.length === 0)) && (
                <div className="text-center py-12">
                  <Link2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No foreign key relationships found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* More Tab - Placeholder for now */}
          <TabsContent value="more" className="p-4">
            <div className="space-y-6">
              {/* Triggers */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Triggers ({triggers.length})
                </h3>
                {triggers.length > 0 ? (
                  <div className="space-y-2">
                    {triggers.map((trigger: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono font-semibold">{trigger.triggerName || trigger.trigger_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">Event:</span> {trigger.eventManipulation || trigger.event_manipulation || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Timing:</span> {trigger.actionTiming || trigger.action_timing || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No triggers found</p>
                )}
              </div>

              {/* Constraints */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Constraints ({constraints.length})
                </h3>
                {constraints.length > 0 ? (
                  <div className="space-y-2">
                    {constraints.map((constraint: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono font-semibold">{constraint.constraintName || constraint.constraint_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">Type:</span> {constraint.constraintType || constraint.constraint_type || 'N/A'}
                        </div>
                        {(constraint.definition || constraint.constraint_definition) && (
                          <pre className="text-xs mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded overflow-x-auto">
                            {constraint.definition || constraint.constraint_definition}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No constraints found</p>
                )}
              </div>

              {/* Policies */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Policies ({policies.length})
                </h3>
                {policies.length > 0 ? (
                  <div className="space-y-2">
                    {policies.map((policy: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono font-semibold">{policy.policyName || policy.policy_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">Command:</span> {policy.cmd || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No policies found</p>
                )}
              </div>

              {/* Rules */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Rules ({rules.length})
                </h3>
                {rules.length > 0 ? (
                  <div className="space-y-2">
                    {rules.map((rule: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono font-semibold">{rule.ruleName || rule.rule_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">Event:</span> {rule.eventType || rule.event_type || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No rules found</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="p-4">
            <div className="space-y-6">
              {/* Views */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Views ({dependencies.views?.length || 0})</h3>
                {dependencies.views && dependencies.views.length > 0 ? (
                  <div className="space-y-2">
                    {dependencies.views.map((view: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono">{view.dependent_schema}.{view.dependent_view}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No views depend on this table</p>
                )}
              </div>

              {/* Materialized Views */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Materialized Views ({dependencies.materializedViews?.length || 0})</h3>
                {dependencies.materializedViews && dependencies.materializedViews.length > 0 ? (
                  <div className="space-y-2">
                    {dependencies.materializedViews.map((view: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono">{view.dependent_schema}.{view.dependent_view}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No materialized views depend on this table</p>
                )}
              </div>

              {/* Functions */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Functions ({dependencies.functions?.length || 0})</h3>
                {dependencies.functions && dependencies.functions.length > 0 ? (
                  <div className="space-y-2">
                    {dependencies.functions.map((func: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="font-mono">{func.schema_name}.{func.function_name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No functions depend on this table</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="p-4">
            <div className="space-y-6">
              {/* Table Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Table Performance
                </h3>
                {performance.table && Object.keys(performance.table).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Sequential Scans</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {performance.table.seq_scan?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Index Scans</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {performance.table.idx_scan?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Live Rows</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {performance.table.live_rows?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Dead Rows</div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {performance.table.dead_rows?.toLocaleString() || 0}
                      </div>
                    </div>
                    {performance.table.bloat_ratio !== undefined && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Bloat Ratio</div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {performance.table.bloat_ratio?.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No performance data available</p>
                )}
              </div>

              {/* Index Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Index Performance ({performance.indexes?.length || 0})
                </h3>
                {performance.indexes && performance.indexes.length > 0 ? (
                  <div className="space-y-2">
                    {performance.indexes.map((index: any, idx: number) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono font-semibold">{index.index_name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Scans: {index.scans?.toLocaleString() || 0} | 
                              Tuples Read: {index.tuples_read?.toLocaleString() || 0} | 
                              Size: {index.index_size || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No index performance data available</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="p-0 h-full">
            {object && object.type === 'table' && object.schemaName && object.tableName && (
              <MiniERD
                connectorId={connectorId}
                schemaName={object.schemaName}
                tableName={object.tableName}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Cell Value Modal */}
      <CellValueModal
        isOpen={cellModalOpen}
        onClose={() => setCellModalOpen(false)}
        value={selectedCellValue}
        columnName={selectedColumnName}
      />
    </div>
  );
};

