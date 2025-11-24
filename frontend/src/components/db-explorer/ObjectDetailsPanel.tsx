import React, { useState, useEffect } from 'react';
import { Table, Code, Info, Key, Link as LinkIcon, Loader } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import api from '@/lib/api';
import { DbObject } from './DbTree';
import { cn } from '@/utils/helpers';
import Editor from '@monaco-editor/react';

interface ObjectDetailsPanelProps {
  connectorId: number;
  object: DbObject | null;
  className?: string;
}

export const ObjectDetailsPanel: React.FC<ObjectDetailsPanelProps> = ({
  connectorId,
  object,
  className,
}) => {
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [indexes, setIndexes] = useState<any[]>([]);
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);
  const [ddl, setDdl] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (object && object.type === 'table') {
      loadTableDetails();
    } else if (object && object.type === 'function') {
      // For functions, just show the metadata
      setActiveTab('overview');
    }
  }, [object, connectorId]);

  const loadTableDetails = async () => {
    if (!object || !object.schemaName || !object.tableName) return;

    try {
      setLoading(true);

      const [columnsRes, indexesRes, fkRes, ddlRes] = await Promise.all([
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.tableName}/columns`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.tableName}/indexes`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.tableName}/foreign-keys`),
        api.get(`/db-explorer/${connectorId}/schemas/${object.schemaName}/tables/${object.tableName}/ddl`),
      ]);

      setColumns(columnsRes.data.columns || []);
      setIndexes(indexesRes.data.indexes || []);
      setForeignKeys(fkRes.data.foreignKeys || []);
      setDdl(ddlRes.data.ddl || '');
    } catch (error) {
      console.error('Failed to load table details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!object) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        Select an object to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    ...(object.type === 'table' ? [
      { id: 'columns', label: `Columns (${columns.length})`, icon: Table },
      { id: 'indexes', label: `Indexes (${indexes.length})`, icon: Key },
      { id: 'foreign-keys', label: `Foreign Keys (${foreignKeys.length})`, icon: LinkIcon },
      { id: 'ddl', label: 'DDL', icon: Code },
    ] : []),
  ];

  const renderOverview = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {object.name}
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="info">{object.type.toUpperCase()}</Badge>
          {object.schemaName && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Schema: {object.schemaName}
            </span>
          )}
        </div>
      </div>

      {object.metadata && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(object.metadata).map(([key, value]) => {
            if (key === 'definition' || key === 'schemaName' || key === 'tableName') return null;
            
            return (
              <div key={key} className="space-y-1">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {object.type === 'function' && object.metadata?.definition && (
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
            Definition
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono">
              {object.metadata.definition}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderColumns = () => (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Name
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Nullable
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Default
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Constraints
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column, index) => (
            <tr
              key={index}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                {column.columnName}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono">
                {column.dataType}
                {column.maxLength && `(${column.maxLength})`}
              </td>
              <td className="px-4 py-2 text-sm">
                {column.isNullable ? (
                  <Badge variant="default">YES</Badge>
                ) : (
                  <Badge variant="warning">NO</Badge>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                {column.defaultValue || '-'}
              </td>
              <td className="px-4 py-2 text-sm">
                <div className="flex gap-1">
                  {column.isPrimaryKey && <Badge variant="warning">PK</Badge>}
                  {column.isForeignKey && <Badge variant="info">FK</Badge>}
                  {column.isUnique && <Badge variant="info">UNIQUE</Badge>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderIndexes = () => (
    <div className="space-y-4">
      {indexes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No indexes found
        </div>
      ) : (
        indexes.map((index, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {index.indexName}
              </h4>
              <div className="flex gap-2">
                {index.isPrimary && <Badge variant="warning">PRIMARY</Badge>}
                {index.isUnique && <Badge variant="info">UNIQUE</Badge>}
                <Badge variant="default">{index.indexType}</Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Columns: <span className="font-mono">{index.columns.join(', ')}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs font-mono text-gray-900 dark:text-gray-100 overflow-auto">
              {index.definition}
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderForeignKeys = () => (
    <div className="overflow-auto">
      {foreignKeys.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No foreign keys found
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                Constraint
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                Column
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                References
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                On Delete
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                On Update
              </th>
            </tr>
          </thead>
          <tbody>
            {foreignKeys.map((fk, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {fk.constraintName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {fk.columnName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {fk.referencedSchemaName}.{fk.referencedTableName}.{fk.referencedColumnName}
                </td>
                <td className="px-4 py-2 text-sm">
                  <Badge variant="default">{fk.onDelete}</Badge>
                </td>
                <td className="px-4 py-2 text-sm">
                  <Badge variant="default">{fk.onUpdate}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderDDL = () => (
    <div className="h-96">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={ddl}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
        }}
      />
    </div>
  );

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'columns' && renderColumns()}
        {activeTab === 'indexes' && renderIndexes()}
        {activeTab === 'foreign-keys' && renderForeignKeys()}
        {activeTab === 'ddl' && renderDDL()}
      </div>
    </div>
  );
};

