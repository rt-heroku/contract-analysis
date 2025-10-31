import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

/**
 * Hook to fetch and bind to process execution data
 * Can be used in Craft.js components to display dynamic data
 * 
 * @param dataPath - Path to data in execution result (e.g., 'result.allOutputs.node_123')
 * @returns The data at the specified path, or null if not found
 */
export const useProcessData = (dataPath?: string) => {
  const { executionId } = useParams<{ executionId?: string }>();
  const [searchParams] = useSearchParams();
  const executionIdFromQuery = searchParams.get('executionId');
  
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // If no data path specified, return null
    if (!dataPath) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      try {
        let executionData: any;
        
        // Try to get execution ID from URL params or query string
        const execId = executionId || executionIdFromQuery;
        
        if (execId) {
          // Fetch specific execution
          const response = await api.get(`/executions/${execId}`);
          executionData = response.data;
        } else {
          // No execution ID - use mock/preview data
          executionData = {
            result: {
              finalOutput: { message: 'Preview mode - no execution data' },
              allOutputs: {
                node_123: [
                  { id: 1, name: 'Sample Row 1', status: 'completed' },
                  { id: 2, name: 'Sample Row 2', status: 'pending' },
                  { id: 3, name: 'Sample Row 3', status: 'failed' },
                ],
              },
            },
            status: 'preview',
            executionId: 'preview',
          };
        }
        
        // Navigate to the specific data path
        // e.g., 'result.allOutputs.node_123' -> executionData.result.allOutputs.node_123
        const value = dataPath.split('.').reduce((obj, key) => {
          if (obj && typeof obj === 'object' && key in obj) {
            return obj[key];
          }
          return undefined;
        }, executionData);
        
        setData(value !== undefined ? value : null);
      } catch (err: any) {
        console.error('Failed to fetch process data:', err);
        setData(null);
      }
    };

    fetchData();
  }, [executionId, executionIdFromQuery, dataPath]);

  return data;
};

