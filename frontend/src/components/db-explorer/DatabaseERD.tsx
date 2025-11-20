import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Loader, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import api from '@/lib/api';
import { cn } from '@/utils/helpers';

interface DatabaseERDProps {
  connectorId: number;
  schemaName: string;
  className?: string;
}

// Custom table node component
const TableNode = ({ data }: any) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl min-w-[280px] max-w-[320px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 py-3 rounded-t-lg">
        <div className="font-bold text-white text-base truncate" title={data.label}>
          {data.label}
        </div>
        {data.rowCount !== undefined && (
          <div className="text-xs text-primary-100 mt-0.5">{data.rowCount.toLocaleString()} rows</div>
        )}
      </div>

      {/* Columns */}
      <div className="p-2 max-h-[300px] overflow-y-auto">
        {data.columns && data.columns.length > 0 ? (
          <div className="space-y-0.5">
            {data.columns.slice(0, 12).map((column: any, index: number) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded text-xs',
                  column.isPrimaryKey && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                )}
                title={`${column.name} (${column.type})`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'font-medium truncate text-xs',
                      column.isPrimaryKey && 'text-blue-700 dark:text-blue-400'
                    )}>
                      {column.name}
                    </span>
                    {column.isPrimaryKey && (
                      <span className="text-[9px] px-1 py-0.5 bg-blue-500 text-white rounded font-bold">PK</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {column.type}
                    {!column.nullable && ' • NOT NULL'}
                  </div>
                </div>
              </div>
            ))}
            {data.columns.length > 12 && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 px-2 py-1 italic">
                + {data.columns.length - 12} more columns...
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 p-2">No columns</div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

// Layout algorithm using dagre for hierarchical positioning
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure layout
  dagreGraph.setGraph({ 
    rankdir: 'TB',        // Top to Bottom
    align: 'UL',          // Up-Left alignment
    nodesep: 150,         // Horizontal spacing between nodes
    ranksep: 200,         // Vertical spacing between ranks
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: 280,   // Table card width
      height: 200,  // Approximate table card height
    });
  });

  // Add edges to graph (this determines the hierarchy)
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 140, // Center the node (half of width)
        y: nodeWithPosition.y - 100, // Center the node (half of height)
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const DatabaseERD: React.FC<DatabaseERDProps> = ({
  connectorId,
  schemaName,
  className,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load ERD data
  useEffect(() => {
    loadERD();
  }, [connectorId, schemaName]);

  const loadERD = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/db-explorer/${connectorId}/schemas/${schemaName}/erd`);
      const { tables, relationships } = response.data;

      if (tables.length === 0) {
        setError('No tables found in this schema');
        return;
      }

      // Create nodes from tables (positions will be calculated by layout algorithm)
      const tableNodes: Node[] = tables.map((table: any) => {
        const columns = table.columns || [];
        
        return {
          id: table.table_name,
          type: 'table',
          position: { x: 0, y: 0 }, // Temporary position, will be calculated
          data: {
            label: table.table_name,
            columns: columns,
            rowCount: table.row_count,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };
      });

      // Create edges from foreign key relationships
      const relationshipEdges: Edge[] = relationships.map((rel: any) => {
        const edgeId = `fk-${rel.from_table}-${rel.from_column}-${rel.to_table}-${rel.to_column}`;
        
        return {
          id: edgeId,
          source: rel.from_table,
          target: rel.to_table,
          type: 'smoothstep',
          animated: false,
          label: `${rel.from_column} → ${rel.to_column}`,
          labelStyle: { 
            fontSize: 10, 
            fill: '#374151',
            fontWeight: 600,
          },
          labelBgStyle: { 
            fill: 'white',
            fillOpacity: 0.95,
            padding: 4,
          },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#3b82f6',
          },
          style: {
            strokeWidth: 2,
            stroke: '#3b82f6',
          },
        };
      });

      // Apply hierarchical layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        tableNodes,
        relationshipEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error: any) {
      console.error('Failed to load ERD:', error);
      setError(error.response?.data?.error || 'Failed to load schema diagram');
    } finally {
      setLoading(false);
    }
  };

  const handleFitView = useCallback(() => {
    // ReactFlow provides fitView through useReactFlow hook, but for simplicity we'll trigger it via controls
  }, []);

  const handleExportImage = useCallback(async () => {
    // For now, just inform user
    alert('Export functionality coming soon! Use browser screenshot for now.');
  }, []);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900', className)}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-primary-600 dark:text-primary-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading schema diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900', className)}>
        <div className="text-center max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-2 text-lg font-semibold">
            Error Loading Diagram
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <Button
            variant="primary"
            size="sm"
            onClick={loadERD}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full', className)}>
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportImage}
          className="bg-white dark:bg-gray-800 shadow-lg gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleFitView}
          className="bg-white dark:bg-gray-800 shadow-lg gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          Fit View
        </Button>
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Schema: {schemaName}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
          <div>{nodes.length} tables</div>
          <div>{edges.length} relationships</div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.15,
          minZoom: 0.3,
          maxZoom: 1.2,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        className="bg-gray-50 dark:bg-gray-900"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background 
          color="#94a3b8" 
          gap={20} 
          size={1}
          className="dark:opacity-20"
        />
        <Controls 
          showInteractive={false}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        />
        <MiniMap
          nodeColor={() => '#3b82f6'}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          maskColor="rgb(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};

