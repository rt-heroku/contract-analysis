import React, { useState } from 'react';
import { X, Database, Globe, HardDrive, FolderOpen, Server, Cpu, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface ConnectorTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
}

interface ConnectorType {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  implemented: boolean;
}

interface ConnectorCategory {
  name: string;
  description: string;
  types: ConnectorType[];
}

const connectorCategories: ConnectorCategory[] = [
  {
    name: 'Databases',
    description: 'Connect to relational and NoSQL databases',
    types: [
      {
        type: 'database',
        name: 'PostgreSQL',
        description: 'Connect to PostgreSQL databases',
        icon: Database,
        color: '#336791',
        implemented: true,
      },
      {
        type: 'mysql',
        name: 'MySQL',
        description: 'Connect to MySQL/MariaDB databases',
        icon: Database,
        color: '#4479A1',
        implemented: false,
      },
      {
        type: 'mongodb',
        name: 'MongoDB',
        description: 'Connect to MongoDB databases',
        icon: Database,
        color: '#47A248',
        implemented: false,
      },
      {
        type: 'redis',
        name: 'Redis',
        description: 'Connect to Redis cache',
        icon: Cpu,
        color: '#DC382D',
        implemented: false,
      },
    ],
  },
  {
    name: 'APIs & Web Services',
    description: 'Connect to REST APIs and web services',
    types: [
      {
        type: 'rest',
        name: 'REST API',
        description: 'Connect to RESTful web services',
        icon: Globe,
        color: '#3b82f6',
        implemented: true,
      },
      {
        type: 'graphql',
        name: 'GraphQL',
        description: 'Connect to GraphQL APIs',
        icon: Globe,
        color: '#E535AB',
        implemented: false,
      },
      {
        type: 'soap',
        name: 'SOAP',
        description: 'Connect to SOAP web services',
        icon: Globe,
        color: '#6366f1',
        implemented: false,
      },
    ],
  },
  {
    name: 'Cloud Storage',
    description: 'Connect to cloud storage providers',
    types: [
      {
        type: 's3',
        name: 'Amazon S3',
        description: 'Connect to S3-compatible storage',
        icon: HardDrive,
        color: '#f59e0b',
        implemented: false,
      },
      {
        type: 'azure_blob',
        name: 'Azure Blob Storage',
        description: 'Connect to Azure blob storage',
        icon: HardDrive,
        color: '#0078D4',
        implemented: false,
      },
      {
        type: 'gcs',
        name: 'Google Cloud Storage',
        description: 'Connect to GCS',
        icon: HardDrive,
        color: '#4285F4',
        implemented: false,
      },
    ],
  },
  {
    name: 'File Systems',
    description: 'Connect to file systems and protocols',
    types: [
      {
        type: 'ftp',
        name: 'FTP/SFTP',
        description: 'Connect via FTP or SFTP',
        icon: FolderOpen,
        color: '#8b5cf6',
        implemented: false,
      },
      {
        type: 'file',
        name: 'Local File System',
        description: 'Access local file system',
        icon: Server,
        color: '#6366f1',
        implemented: false,
      },
      {
        type: 'smb',
        name: 'SMB/CIFS',
        description: 'Connect to Windows file shares',
        icon: FolderOpen,
        color: '#10b981',
        implemented: false,
      },
    ],
  },
  {
    name: 'AI & Machine Learning',
    description: 'Connect to AI and ML services',
    types: [
      {
        type: 'inference',
        name: 'LLM Inference',
        description: 'Connect to LLM APIs (OpenAI, Claude, etc.)',
        icon: Sparkles,
        color: '#ec4899',
        implemented: true,
      },
    ],
  },
];

export const ConnectorTypeSelectionModal: React.FC<ConnectorTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Databases', 'APIs & Web Services'])
  );

  if (!isOpen) return null;

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Select Connector Type
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose the type of system you want to connect to
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {connectorCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.name);
              
              return (
                <div key={category.name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {category.types.length} type{category.types.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.types.map((connectorType) => {
                        const Icon = connectorType.icon;
                        
                        return (
                          <button
                            key={connectorType.type}
                            onClick={() => {
                              if (connectorType.implemented) {
                                onSelectType(connectorType.type);
                              }
                            }}
                            disabled={!connectorType.implemented}
                            className={`relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                              connectorType.implemented
                                ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md cursor-pointer'
                                : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* Icon */}
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: `${connectorType.color}20`,
                                color: connectorType.color,
                              }}
                            >
                              <Icon className="w-6 h-6" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {connectorType.name}
                                </h4>
                                {!connectorType.implemented && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {connectorType.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            More connector types coming soon. Need a specific connector?{' '}
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              Request it
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

