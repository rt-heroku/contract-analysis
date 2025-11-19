import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Loader, Download } from 'lucide-react';
import { Button } from '@/components/common/Button';
import api from '@/lib/api';
import { cn } from '@/utils/helpers';

interface SchemaERDProps {
  connectorId: number;
  schemaName: string;
  className?: string;
}

interface TableData {
  tableName: string;
  columns: ColumnData[];
  foreignKeys: ForeignKeyData[];
}

interface ColumnData {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface ForeignKeyData {
  constraintName: string;
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
}

// Custom node component for table visualization
const TableNode = ({ data }: any) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[200px]">
      {/* Table Header */}
      <div className="bg-primary-600 dark:bg-primary-700 text-white px-4 py-2 rounded-t-lg font-semibold text-sm">
        {data.label}
      </div>
      
      {/* Columns */}
      <div className="px-2 py-1">
        {data.columns?.slice(0, 10).map((col: ColumnData, index: number) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 px-2 py-1 text-xs',
              'hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
            )}
          >
            {col.isPrimaryKey && (
              <span className="text-yellow-500 font-bold" title="Primary Key">🔑</span>
            )}
            {col.isForeignKey && !col.isPrimaryKey && (
              <span className="text-blue-500 font-bold" title="Foreign Key">🔗</span>
            )}
            <span className={cn(
              'font-mono',
              col.isPrimaryKey && 'font-semibold text-gray-900 dark:text-gray-100',
              !col.isPrimaryKey && 'text-gray-700 dark:text-gray-300'
            )}>
              {col.columnName}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs ml-auto">
              {col.dataType}
            </span>
          </div>
        ))}
        {data.columns?.length > 10 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 italic">
            ... {data.columns.length - 10} more columns
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

export const SchemaERD: React.FC<SchemaERDProps> = ({
  connectorId,
  schemaName,
  className,
}) => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableData[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadSchemaData();
  }, [connectorId, schemaName]);

  const loadSchemaData = async () => {
    try {
      setLoading(true);

      // Get all tables in schema
      const tablesRes = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables`);
      const tableList = tablesRes.data.tables || [];

      // Load columns and foreign keys for each table
      const tableDataPromises = tableList.map(async (table: any) => {
        const [columnsRes, fkRes] = await Promise.all([
          api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables/${table.tableName}/columns`),
          api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/tables/${table.tableName}/foreign-keys`),
        ]);

        return {
          tableName: table.tableName,
          columns: columnsRes.data.columns || [],
          foreignKeys: fkRes.data.foreignKeys || [],
        };
      });

      const tablesData = await Promise.all(tableDataPromises);
      setTables(tablesData);
      
      // Generate nodes and edges
      generateDiagram(tablesData);
    } catch (error) {
      console.error('Failed to load schema data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDiagram = (tablesData: TableData[]) => {
    // Create nodes for each table
    const newNodes: Node[] = tablesData.map((table) => ({
      id: table.tableName,
      type: 'table',
      data: {
        label: table.tableName,
        columns: table.columns,
      },
      position: { x: 0, y: 0 }, // Will be calculated by layout
    }));

    // Create edges for foreign keys
    const newEdges: Edge[] = [];
    tablesData.forEach((table) => {
      table.foreignKeys.forEach((fk, index) => {
        newEdges.push({
          id: `${table.tableName}-${fk.referencedTableName}-${index}`,
          source: table.tableName,
          target: fk.referencedTableName,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'smoothstep',
          animated: false,
          label: fk.columnName,
          labelStyle: { fontSize: 10, fill: '#666' },
          labelBgStyle: { fill: '#fff' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: '#666',
          },
          style: {
            stroke: '#666',
            strokeWidth: 2,
          },
        });
      });
    });

    // Apply dagre layout
    const layoutedNodes = applyDagreLayout(newNodes, newEdges);
    
    setNodes(layoutedNodes);
    setEdges(newEdges);
  };

  const applyDagreLayout = (nodes: Node[], edges: Edge[]): Node[] => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Set graph options
    dagreGraph.setGraph({
      rankdir: 'LR', // Left to Right
      nodesep: 100,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
    });

    // Add nodes to dagre
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: 250,
        height: Math.min(400, 60 + (node.data.columns?.length || 0) * 25),
      });
    });

    // Add edges to dagre
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply calculated positions to nodes
    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 125, // Center the node
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
  };

  const exportToPNG = () => {
    // This would require html2canvas or a similar library
    // For now, just show alert
    alert('Export to PNG feature coming soon!');
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        <p className="text-gray-500 dark:text-gray-400">No tables found in this schema</p>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={exportToPNG}
          title="Export to PNG"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* ReactFlow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-xs">
        <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Legend</div>
        <div className="space-y-1 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">🔑</span>
            <span>Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-500">🔗</span>
            <span>Foreign Key</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-600"></div>
            <span>Relationship</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
        <div><strong>{tables.length}</strong> tables</div>
        <div><strong>{edges.length}</strong> relationships</div>
      </div>
    </div>
  );
};

