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
import { Loader, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
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
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[250px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 py-3 rounded-t-lg">
        <div className="font-bold text-white text-lg">{data.label}</div>
        {data.rowCount !== undefined && (
          <div className="text-xs text-primary-100 mt-1">{data.rowCount} rows</div>
        )}
      </div>

      {/* Columns */}
      <div className="p-2">
        {data.columns && data.columns.length > 0 ? (
          <div className="space-y-1">
            {data.columns.map((column: any, index: number) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-sm',
                  column.isPrimaryKey && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium truncate',
                      column.isPrimaryKey && 'text-blue-700 dark:text-blue-400'
                    )}>
                      {column.name}
                    </span>
                    {column.isPrimaryKey && (
                      <Badge variant="info">PK</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {column.type}
                    {!column.nullable && ' • NOT NULL'}
                  </div>
                </div>
              </div>
            ))}
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

      // Create nodes from tables
      const tableNodes: Node[] = tables.map((table: any, index: number) => {
        const columns = table.columns || [];
        
        // Calculate grid position (3 columns max)
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = col * 400 + 50;
        const y = row * 400 + 50;

        return {
          id: table.table_name,
          type: 'table',
          position: { x, y },
          data: {
            label: table.table_name,
            columns: columns,
            rowCount: table.row_count,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });

      // Create edges from relationships
      const relationshipEdges: Edge[] = relationships.map((rel: any, index: number) => ({
        id: `edge-${index}`,
        source: rel.from_table,
        target: rel.to_table,
        type: 'smoothstep',
        animated: false,
        label: rel.from_column,
        labelStyle: { 
          fontSize: 11, 
          fill: '#6b7280',
          fontWeight: 500,
        },
        labelBgStyle: { 
          fill: 'white',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#3b82f6',
        },
        style: {
          strokeWidth: 2,
          stroke: '#3b82f6',
        },
      }));

      setNodes(tableNodes);
      setEdges(relationshipEdges);
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
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        minZoom={0.05}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="bg-gray-50 dark:bg-gray-900"
      >
        <Background 
          color="#94a3b8" 
          gap={16} 
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
        />
      </ReactFlow>
    </div>
  );
};

