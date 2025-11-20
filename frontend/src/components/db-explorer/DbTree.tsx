import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Database, Table, Eye, FileCode, Zap, List, Hash, Key, Loader, Link, Shield, AlertCircle, FileWarning } from 'lucide-react';
import { cn } from '@/utils/helpers';
import api from '@/lib/api';
import { ContextMenu, getTableContextMenuItems, getColumnContextMenuItems, getSchemaContextMenuItems, getViewContextMenuItems } from './ContextMenu';

interface DbTreeProps {
  connectorId: number;
  onSelectObject: (object: DbObject) => void;
  onTableAction?: (action: string, tableName: string, schemaName: string) => void;
  onViewAction?: (action: string, viewName: string, schemaName: string) => void;
  onSchemaAction?: (action: string, schemaName: string) => void;
  onColumnAction?: (action: string, columnName: string, tableName: string, schemaName: string) => void;
  className?: string;
}

export interface DbObject {
  type: 'schema' | 'table' | 'view' | 'function' | 'sequence' | 'trigger' | 'index' | 'materialized_view';
  name: string;
  schemaName?: string;
  tableName?: string;
  metadata?: any;
}

interface TreeNode {
  id: string;
  label: string;
  icon: React.ElementType;
  type: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  metadata?: any;
}

export const DbTree: React.FC<DbTreeProps> = ({ 
  connectorId, 
  onSelectObject, 
  onTableAction,
  onViewAction,
  onSchemaAction,
  onColumnAction,
  className 
}) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: any[] } | null>(null);

  useEffect(() => {
    loadSchemas();
  }, [connectorId]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/db-explorer/${connectorId}/schemas`);
      const schemas = response.data.schemas || [];

      const schemaNodes: TreeNode[] = schemas.map((schema: string) => ({
        id: `schema-${schema}`,
        label: schema,
        icon: Database,
        type: 'schema',
        isExpanded: false,
        metadata: { schemaName: schema },
        children: [
          {
            id: `schema-${schema}-tables`,
            label: 'Tables',
            icon: Table,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'tables' },
          },
          {
            id: `schema-${schema}-views`,
            label: 'Views',
            icon: Eye,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'views' },
          },
          {
            id: `schema-${schema}-functions`,
            label: 'Functions',
            icon: FileCode,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'functions' },
          },
          {
            id: `schema-${schema}-sequences`,
            label: 'Sequences',
            icon: Hash,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'sequences' },
          },
          {
            id: `schema-${schema}-materialized-views`,
            label: 'Materialized Views',
            icon: Zap,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'materialized_views' },
          },
          {
            id: `schema-${schema}-triggers`,
            label: 'Triggers',
            icon: Zap,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'triggers' },
          },
          {
            id: `schema-${schema}-foreign-keys`,
            label: 'Foreign Keys',
            icon: Link,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'foreign_keys' },
          },
          {
            id: `schema-${schema}-constraints`,
            label: 'Constraints',
            icon: Shield,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'constraints' },
          },
          {
            id: `schema-${schema}-policies`,
            label: 'Policies',
            icon: AlertCircle,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'policies' },
          },
          {
            id: `schema-${schema}-rules`,
            label: 'Rules',
            icon: FileWarning,
            type: 'folder',
            isExpanded: false,
            metadata: { schemaName: schema, folderType: 'rules' },
          },
        ],
      }));

      setTree(schemaNodes);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContents = async (node: TreeNode) => {
    const { schemaName, folderType } = node.metadata;

    try {
      if (folderType === 'tables') {
        const response = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables`);
        const tables = response.data.tables || [];
        return tables.map((table: any) => ({
          id: `table-${schemaName}-${table.tableName}`,
          label: `${table.tableName} ${table.rowCount !== undefined ? `(${table.rowCount})` : ''}`,
          icon: Table,
          type: 'table',
          metadata: {
            schemaName,
            tableName: table.tableName,
            tableType: table.tableType,
            rowCount: table.rowCount,
          },
          children: [
            {
              id: `table-${schemaName}-${table.tableName}-columns`,
              label: 'Columns',
              icon: List,
              type: 'columns-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
            {
              id: `table-${schemaName}-${table.tableName}-indexes`,
              label: 'Indexes',
              icon: Key,
              type: 'indexes-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
            {
              id: `table-${schemaName}-${table.tableName}-foreign-keys`,
              label: 'Foreign Keys',
              icon: Link,
              type: 'foreign-keys-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
            {
              id: `table-${schemaName}-${table.tableName}-triggers`,
              label: 'Triggers',
              icon: Zap,
              type: 'triggers-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
            {
              id: `table-${schemaName}-${table.tableName}-constraints`,
              label: 'Constraints',
              icon: Shield,
              type: 'constraints-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
            {
              id: `table-${schemaName}-${table.tableName}-policies`,
              label: 'Policies',
              icon: AlertCircle,
              type: 'policies-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
            {
              id: `table-${schemaName}-${table.tableName}-rules`,
              label: 'Rules',
              icon: FileWarning,
              type: 'rules-folder',
              metadata: { schemaName, tableName: table.tableName },
            },
          ],
        }));
      } else if (folderType === 'views') {
        const response = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables`);
        const views = (response.data.tables || []).filter((t: any) => t.tableType === 'VIEW');
        return views.map((view: any) => ({
          id: `view-${schemaName}-${view.tableName}`,
          label: view.tableName,
          icon: Eye,
          type: 'view',
          metadata: {
            schemaName,
            tableName: view.tableName,
            tableType: 'VIEW',
          },
        }));
      } else if (folderType === 'functions') {
        const response = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/functions`);
        const functions = response.data.functions || [];
        return functions.map((func: any) => ({
          id: `function-${schemaName}-${func.functionName}`,
          label: `${func.functionName}(${func.arguments || ''})`,
          icon: FileCode,
          type: 'function',
          metadata: {
            schemaName,
            functionName: func.functionName,
            ...func,
          },
        }));
      } else if (folderType === 'sequences') {
        const response = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/sequences`);
        const sequences = response.data.sequences || [];
        return sequences.map((seq: any) => ({
          id: `sequence-${schemaName}-${seq.sequenceName}`,
          label: seq.sequenceName,
          icon: Hash,
          type: 'sequence',
          metadata: {
            schemaName,
            sequenceName: seq.sequenceName,
            ...seq,
          },
        }));
      } else if (folderType === 'materialized_views') {
        const response = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/materialized-views`);
        const views = response.data.views || [];
        return views.map((view: any) => ({
          id: `mat-view-${schemaName}-${view.tableName}`,
          label: view.tableName,
          icon: Zap,
          type: 'materialized_view',
          metadata: {
            schemaName,
            tableName: view.tableName,
            tableType: 'MATERIALIZED VIEW',
          },
        }));
      }
    } catch (error) {
      console.error(`Failed to load ${folderType}:`, error);
      return [];
    }

    return [];
  };

  const toggleNode = async (nodeId: string) => {
    const updateTree = (nodes: TreeNode[], currentPath: number[]): TreeNode[] => {
      if (currentPath.length === 0) {
        return nodes;
      }

      const [currentIndex, ...restPath] = currentPath;
      
      return nodes.map((node, index) => {
        if (index === currentIndex) {
          if (restPath.length === 0) {
            // This is the node to toggle
            const newExpanded = !node.isExpanded;
            
            if (newExpanded && node.children && node.type === 'folder' && !node.children.some(c => c.type !== 'folder')) {
              // Load folder contents
              return {
                ...node,
                isExpanded: newExpanded,
                isLoading: true,
              };
            }
            
            return {
              ...node,
              isExpanded: newExpanded,
            };
          } else {
            // Recurse deeper
            return {
              ...node,
              children: node.children ? updateTree(node.children, restPath) : [],
            };
          }
        }
        return node;
      });
    };

    // Find the path to the node
    const findPath = (nodes: TreeNode[], targetId: string, currentPath: number[] = []): number[] | null => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
          return [...currentPath, i];
        }
        if (nodes[i].children) {
          const childPath = findPath(nodes[i].children!, targetId, [...currentPath, i]);
          if (childPath) {
            return childPath;
          }
        }
      }
      return null;
    };

    const nodePath = findPath(tree, nodeId);
    if (!nodePath) return;

    // Get the node
    let targetNode: TreeNode | undefined;
    let current: TreeNode[] = tree;
    for (const idx of nodePath) {
      targetNode = current[idx];
      if (targetNode.children) {
        current = targetNode.children;
      }
    }

    // Load folder contents if needed
    if (targetNode && targetNode.type === 'folder' && !targetNode.isExpanded) {
      const contents = await loadFolderContents(targetNode);
      
      // Update tree with loaded contents
      const updateWithContents = (nodes: TreeNode[], currentPath: number[]): TreeNode[] => {
        if (currentPath.length === 0) return nodes;
        
        const [currentIndex, ...restPath] = currentPath;
        
        return nodes.map((node, index) => {
          if (index === currentIndex) {
            if (restPath.length === 0) {
              return {
                ...node,
                isExpanded: true,
                isLoading: false,
                children: contents,
              };
            } else {
              return {
                ...node,
                children: node.children ? updateWithContents(node.children, restPath) : [],
              };
            }
          }
          return node;
        });
      };

      setTree(updateWithContents(tree, nodePath));
    } else {
      setTree(updateTree(tree, nodePath));
    }
  };

  const handleNodeClick = (node: TreeNode) => {
    setSelectedId(node.id);
    
    // Emit select event
    if (node.type !== 'folder' && node.type !== 'schema') {
      // Use metadata tableName for tables (to avoid row count in label)
      // Otherwise use the label
      const actualName = node.type === 'table' && node.metadata?.tableName 
        ? node.metadata.tableName 
        : node.label;
      
      const dbObject: DbObject = {
        type: node.type as any,
        name: actualName,
        schemaName: node.metadata?.schemaName,
        tableName: node.metadata?.tableName,
        metadata: node.metadata,
      };
      onSelectObject(dbObject);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    const schemaName = node.metadata?.schemaName || '';

    let menuItems: any[] = [];

    // Schema context menu
    if (node.type === 'schema') {
      menuItems = getSchemaContextMenuItems(
        node.label,
        () => onSchemaAction?.('create-table', node.label),
        () => loadSchemas()
      );
    }
    // Table context menu
    else if (node.type === 'table') {
      // Use actual table name from metadata (not label which includes row count)
      const tableName = node.metadata?.tableName || node.label;
      
      menuItems = getTableContextMenuItems(
        tableName,
        schemaName,
        () => onTableAction?.('view-data', tableName, schemaName),
        () => {
          navigator.clipboard.writeText(tableName);
        },
        () => onTableAction?.('export', tableName, schemaName),
        () => onTableAction?.('alter', tableName, schemaName),
        () => onTableAction?.('manage-indexes', tableName, schemaName),
        () => onTableAction?.('truncate', tableName, schemaName),
        () => onTableAction?.('drop', tableName, schemaName),
        () => toggleNode(node.id)
      );
    }
    // View context menu
    else if (node.type === 'view' || node.type === 'materialized_view') {
      menuItems = getViewContextMenuItems(
        node.label,
        () => onViewAction?.('view-definition', node.label, schemaName),
        () => {
          navigator.clipboard.writeText(node.label);
        },
        () => onViewAction?.('drop', node.label, schemaName)
      );
    }
    // Column context menu (if we add column nodes in the future)
    else if (node.type === 'column') {
      const tableName = node.metadata?.tableName || '';
      menuItems = getColumnContextMenuItems(
        node.label,
        () => {
          navigator.clipboard.writeText(node.label);
        },
        () => onColumnAction?.('create-index', node.label, tableName, schemaName)
      );
    }

    if (menuItems.length > 0) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: menuItems,
      });
    }
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const Icon = node.icon;
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = hasChildren || node.type === 'folder';

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded',
            selectedId === node.id && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
            'transition-colors'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (canExpand) {
              toggleNode(node.id);
            }
            handleNodeClick(node);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {canExpand && (
            <span className="flex-shrink-0">
              {node.isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!canExpand && <span className="w-4 flex-shrink-0" />}
          <Icon className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
          <span className="truncate flex-1">{node.label}</span>
        </div>
        
        {node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('overflow-auto', className)}>
        {tree.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No schemas found
          </div>
        ) : (
          <div className="py-2">
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </div>
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

