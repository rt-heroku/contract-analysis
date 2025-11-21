import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Loader, Table as TableIcon, Link2, Key } from 'lucide-react';
import api from '@/lib/api';

interface MiniERDProps {
  connectorId: number;
  schemaName: string;
  tableName: string;
}

interface TableInfo {
  tableName: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
  }>;
}

interface ForeignKey {
  constraint_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
  direction?: 'outgoing' | 'incoming';
}

export const MiniERD: React.FC<MiniERDProps> = ({
  connectorId,
  schemaName,
  tableName,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadERDData();
  }, [connectorId, schemaName, tableName]);

  const loadERDData = async () => {
    try {
      setLoading(true);

      // Load current table columns and foreign keys
      const [columnsRes, fkRes] = await Promise.all([
        api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables/${tableName}/columns`),
        api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables/${tableName}/foreign-keys`),
      ]);

      const columns = Array.isArray(columnsRes.data.columns) ? columnsRes.data.columns : [];
      const foreignKeys: ForeignKey[] = Array.isArray(fkRes.data.foreignKeys) ? fkRes.data.foreignKeys : [];

      // Separate outgoing and incoming FKs
      const outgoingFKs = Array.isArray(foreignKeys) ? foreignKeys.filter(fk => fk.direction === 'outgoing' || !fk.direction) : [];
      const incomingFKs = Array.isArray(foreignKeys) ? foreignKeys.filter(fk => fk.direction === 'incoming') : [];

      // Get unique related tables
      const relatedTables = new Set<string>();
      outgoingFKs.forEach(fk => {
        relatedTables.add(`${fk.foreign_table_schema}.${fk.foreign_table_name}`);
      });
      incomingFKs.forEach(fk => {
        // For incoming FKs, we need to find the source table
        // This information should be in the FK data
        if (fk.foreign_table_schema && fk.foreign_table_name) {
          relatedTables.add(`${fk.foreign_table_schema}.${fk.foreign_table_name}`);
        }
      });

      // Load columns for related tables
      const relatedTableData: Map<string, TableInfo> = new Map();
      await Promise.all(
        Array.from(relatedTables).map(async (tableKey) => {
          const [relSchema, relTable] = tableKey.split('.');
          try {
            const relColumnsRes = await api.get(
              `/db-explorer/${connectorId}/schemas/${relSchema}/tables/${relTable}/columns`
            );
            relatedTableData.set(tableKey, {
              tableName: relTable,
              columns: Array.isArray(relColumnsRes.data.columns) ? relColumnsRes.data.columns : [],
            });
          } catch (error) {
            console.error(`Failed to load columns for ${tableKey}:`, error);
          }
        })
      );

      // Build nodes
      const nodesList: Node[] = [];

      // Center table (main table)
      nodesList.push(createTableNode(
        `${schemaName}.${tableName}`,
        tableName,
        columns,
        true
      ));

      // Related tables
      relatedTableData.forEach((tableInfo, tableKey) => {
        nodesList.push(createTableNode(
          tableKey,
          tableInfo.tableName,
          tableInfo.columns,
          false
        ));
      });

      // Build edges (FK relationships)
      const edgesList: Edge[] = [];
      let edgeIndex = 0;

      // Outgoing FKs (this table → other tables)
      outgoingFKs.forEach(fk => {
        const targetTableKey = `${fk.foreign_table_schema}.${fk.foreign_table_name}`;
        edgesList.push({
          id: `edge-${edgeIndex++}`,
          source: `${schemaName}.${tableName}`,
          target: targetTableKey,
          sourceHandle: fk.column_name,
          targetHandle: fk.foreign_column_name,
          label: fk.constraint_name,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#3b82f6',
          },
        });
      });

      // Incoming FKs (other tables → this table)
      incomingFKs.forEach(fk => {
        const sourceTableKey = `${fk.foreign_table_schema}.${fk.foreign_table_name}`;
        edgesList.push({
          id: `edge-${edgeIndex++}`,
          source: sourceTableKey,
          target: `${schemaName}.${tableName}`,
          sourceHandle: fk.foreign_column_name,
          targetHandle: fk.column_name,
          label: fk.constraint_name,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#10b981',
          },
        });
      });

      // Layout nodes using dagre
      const layoutedGraph = layoutNodes(nodesList, edgesList);

      setNodes(layoutedGraph.nodes);
      setEdges(layoutedGraph.edges);
    } catch (error) {
      console.error('Failed to load ERD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTableNode = (
    id: string,
    name: string,
    columns: any[],
    isMainTable: boolean
  ): Node => {
    return {
      id,
      type: 'default',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        label: (
          <div className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-md min-w-[250px] ${
            isMainTable 
              ? 'border-primary-500 dark:border-primary-400' 
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {/* Table Header */}
            <div className={`px-4 py-2 font-bold text-center border-b ${
              isMainTable
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <TableIcon className="w-4 h-4" />
                <span>{name}</span>
              </div>
            </div>

            {/* Columns */}
            <div className="max-h-[300px] overflow-y-auto">
              {columns.slice(0, 10).map((col, idx) => (
                <div
                  key={idx}
                  className="px-4 py-1.5 text-sm border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {col.is_primary_key && (
                      <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                    )}
                    {col.is_foreign_key && !col.is_primary_key && (
                      <Link2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs truncate">{col.column_name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {col.data_type}
                  </span>
                </div>
              ))}
              {columns.length > 10 && (
                <div className="px-4 py-2 text-xs text-center text-gray-400 dark:text-gray-500 italic">
                  +{columns.length - 10} more columns
                </div>
              )}
            </div>
          </div>
        ),
      },
      style: {
        padding: 0,
        border: 'none',
        background: 'transparent',
      },
    };
  };

  const layoutNodes = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', ranksep: 150, nodesep: 80 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 280, height: 400 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 140,
          y: nodeWithPosition.y - 200,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <TableIcon className="w-12 h-12 mb-3 opacity-50" />
        <p>No relationships found for this table</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold mb-2 text-gray-900 dark:text-gray-100">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Outgoing FK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Incoming FK</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="w-3 h-3 text-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Foreign Key</span>
          </div>
        </div>
      </div>
    </div>
  );
};

