import React, { useEffect, useRef } from 'react';
import { 
  Table, 
  Trash, 
  Copy, 
  Download, 
  Plus, 
  RefreshCw,
  Scissors,
  FileText,
  Key,
  Edit,
  Eye
} from 'lucide-react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.divider ? (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          ) : (
            <button
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`
                w-full px-4 py-2 text-left flex items-center gap-3 text-sm
                ${item.disabled 
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                  : item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                transition-colors
              `}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Helper functions to generate common context menu items
export const getTableContextMenuItems = (
  _tableName: string,
  _schemaName: string,
  onViewData: () => void,
  onCopyName: () => void,
  onExport: () => void,
  onExportDDL: () => void,
  onAlter: () => void,
  onManageIndexes: () => void,
  onTruncate: () => void,
  onDrop: () => void,
  onRefresh: () => void
): ContextMenuItem[] => [
  {
    label: 'View Data',
    icon: <Table className="w-4 h-4" />,
    onClick: onViewData,
  },
  {
    label: 'Copy Name',
    icon: <Copy className="w-4 h-4" />,
    onClick: onCopyName,
  },
  {
    label: 'Export Data',
    icon: <Download className="w-4 h-4" />,
    onClick: onExport,
  },
  {
    label: 'Export DDL',
    icon: <FileText className="w-4 h-4" />,
    onClick: onExportDDL,
  },
  { divider: true } as ContextMenuItem,
  {
    label: 'Alter Table',
    icon: <Edit className="w-4 h-4" />,
    onClick: onAlter,
  },
  {
    label: 'Manage Indexes',
    icon: <Key className="w-4 h-4" />,
    onClick: onManageIndexes,
  },
  {
    label: 'Refresh',
    icon: <RefreshCw className="w-4 h-4" />,
    onClick: onRefresh,
  },
  { divider: true } as ContextMenuItem,
  {
    label: 'Truncate Table',
    icon: <Scissors className="w-4 h-4" />,
    onClick: onTruncate,
    danger: true,
  },
  {
    label: 'Drop Table',
    icon: <Trash className="w-4 h-4" />,
    onClick: onDrop,
    danger: true,
  },
];

export const getColumnContextMenuItems = (
  _columnName: string,
  onCopyName: () => void,
  onCreateIndex: () => void,
  onEditColumn?: () => void,
  onDeleteColumn?: () => void
): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [
    {
      label: 'Copy Column Name',
      icon: <Copy className="w-4 h-4" />,
      onClick: onCopyName,
    },
    {
      label: 'Create Index',
      icon: <Key className="w-4 h-4" />,
      onClick: onCreateIndex,
    },
  ];

  if (onEditColumn || onDeleteColumn) {
    items.push({ divider: true } as ContextMenuItem);
    if (onEditColumn) {
      items.push({
        label: 'Edit Column',
        icon: <Edit className="w-4 h-4" />,
        onClick: onEditColumn,
      });
    }
    if (onDeleteColumn) {
      items.push({
        label: 'Delete Column',
        icon: <Trash className="w-4 h-4" />,
        onClick: onDeleteColumn,
        danger: true,
      });
    }
  }

  return items;
};

export const getSchemaContextMenuItems = (
  _schemaName: string,
  onCreateTable: () => void,
  onRefresh: () => void
): ContextMenuItem[] => [
  {
    label: 'Create Table',
    icon: <Plus className="w-4 h-4" />,
    onClick: onCreateTable,
  },
  {
    label: 'Refresh',
    icon: <RefreshCw className="w-4 h-4" />,
    onClick: onRefresh,
  },
];

export const getViewContextMenuItems = (
  _viewName: string,
  onViewDefinition: () => void,
  onCopyName: () => void,
  onExportDDL: () => void,
  onDrop: () => void
): ContextMenuItem[] => [
  {
    label: 'View Definition',
    icon: <FileText className="w-4 h-4" />,
    onClick: onViewDefinition,
  },
  {
    label: 'Copy Name',
    icon: <Copy className="w-4 h-4" />,
    onClick: onCopyName,
  },
  {
    label: 'Export DDL',
    icon: <Download className="w-4 h-4" />,
    onClick: onExportDDL,
  },
  { divider: true } as ContextMenuItem,
  {
    label: 'Drop View',
    icon: <Trash className="w-4 h-4" />,
    onClick: onDrop,
    danger: true,
  },
];

export const getFunctionContextMenuItems = (
  _functionName: string,
  onViewCode: () => void,
  onCopyName: () => void,
  onExportDDL: () => void,
  onDrop: () => void
): ContextMenuItem[] => [
  {
    label: 'View Code',
    icon: <Eye className="w-4 h-4" />,
    onClick: onViewCode,
  },
  {
    label: 'Copy Name',
    icon: <Copy className="w-4 h-4" />,
    onClick: onCopyName,
  },
  {
    label: 'Export DDL',
    icon: <Download className="w-4 h-4" />,
    onClick: onExportDDL,
  },
  { divider: true } as ContextMenuItem,
  {
    label: 'Drop Function',
    icon: <Trash className="w-4 h-4" />,
    onClick: onDrop,
    danger: true,
  },
];

export const getDatabaseContextMenuItems = (
  onRefresh: () => void
): ContextMenuItem[] => [
  {
    label: 'Refresh All',
    icon: <RefreshCw className="w-4 h-4" />,
    onClick: onRefresh,
  },
];

/**
 * Context menu for data rows in table view
 */
export const getDataRowContextMenuItems = (
  onView: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onCopy?: () => void
): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [
    {
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: onView,
    },
    {
      label: 'Edit Row',
      icon: <Edit className="w-4 h-4" />,
      onClick: onEdit,
    },
  ];

  if (onCopy) {
    items.push({
      label: 'Copy Row Data',
      icon: <Copy className="w-4 h-4" />,
      onClick: onCopy,
    });
  }

  items.push({ divider: true } as ContextMenuItem);
  items.push({
    label: 'Delete Row',
    icon: <Trash className="w-4 h-4" />,
    onClick: onDelete,
    danger: true,
  });

  return items;
};

