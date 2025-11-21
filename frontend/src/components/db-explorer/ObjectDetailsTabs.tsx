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
  const [stats, setStats] = useState<any>(null);
  
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
  }, [activeTab, dataLimit]);

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
      ] = await Promise.all([
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/columns`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/foreign-keys`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/indexes`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/stats`),
      ]);

      setColumns(columnsRes.data);
      setForeignKeys(fkRes.data);
      setIndexes(indexesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load table details:', error);
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
      const [triggersRes] = await Promise.all([
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.name}/triggers`),
      ]);

      setTriggers(triggersRes.data);
    } catch (error) {
      console.error('Failed to load additional details:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'more' || activeTab === 'dependencies' || activeTab === 'performance') {
      loadMoreDetails();
    }
  }, [activeTab]);

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

  const filteredColumns = columns.filter(col =>
    col.column_name.toLowerCase().includes(columnSearch.toLowerCase()) ||
    col.data_type.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const outgoingFKs = foreignKeys.filter(fk => fk.direction === 'outgoing');
  const incomingFKs = foreignKeys.filter(fk => fk.direction === 'incoming');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
                            {Object.values(row).slice(0, 6).map((value: any, vIdx) => (
                              <td key={vIdx} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                {value === null ? (
                                  <span className="text-gray-400 italic">NULL</span>
                                ) : (
                                  String(value).substring(0, 50)
                                )}
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
          <TabsContent value="data" className="p-0">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
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
            
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin" />
                </div>
              ) : tableData.length > 0 ? (
                <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
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
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {Object.values(row).map((value: any, vIdx) => (
                            <td key={vIdx} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {value === null ? (
                                <span className="text-gray-400 italic">NULL</span>
                              ) : typeof value === 'object' ? (
                                <span className="font-mono text-xs">{JSON.stringify(value)}</span>
                              ) : (
                                String(value)
                              )}
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
          <TabsContent value="columns" className="p-0">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
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

            <div className="p-4">
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
              <div>
                <h3 className="text-lg font-semibold mb-3">Triggers</h3>
                <p className="text-gray-500 dark:text-gray-400">Triggers will be displayed here</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Constraints</h3>
                <p className="text-gray-500 dark:text-gray-400">Constraints will be displayed here</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Policies</h3>
                <p className="text-gray-500 dark:text-gray-400">Policies will be displayed here</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Rules</h3>
                <p className="text-gray-500 dark:text-gray-400">Rules will be displayed here</p>
              </div>
            </div>
          </TabsContent>

          {/* Dependencies Tab - Placeholder */}
          <TabsContent value="dependencies" className="p-4">
            <p className="text-gray-500 dark:text-gray-400">Dependencies will be displayed here</p>
          </TabsContent>

          {/* Performance Tab - Placeholder */}
          <TabsContent value="performance" className="p-4">
            <p className="text-gray-500 dark:text-gray-400">Performance metrics will be displayed here</p>
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
    </div>
  );
};

