import { useEffect, useState } from 'react';
import { Edit, Trash2, Copy, Play } from 'lucide-react';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTest?: () => void;
  onClose: () => void;
}

export const NodeContextMenu = ({
  x,
  y,
  onEdit,
  onDelete,
  onDuplicate,
  onTest,
  onClose,
}: NodeContextMenuProps) => {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust position if menu would go off screen
    const menuWidth = 200;
    const menuHeight = 160;
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;
    setPosition({ x: adjustedX, y: adjustedY });

    // Close on click outside
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.node-context-menu')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [x, y, onClose]);

  return (
    <div
      className="node-context-menu fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
      style={{ left: position.x, top: position.y, minWidth: '180px' }}
    >
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center space-x-3 text-sm"
      >
        <Edit className="w-4 h-4 text-blue-600" />
        <span>Edit Properties</span>
      </button>

      {onTest && (
        <button
          onClick={() => {
            onTest();
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center space-x-3 text-sm"
        >
          <Play className="w-4 h-4 text-green-600" />
          <span>Test Action</span>
        </button>
      )}

      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
      >
        <Copy className="w-4 h-4 text-gray-600" />
        <span>Duplicate</span>
      </button>

      <div className="border-t border-gray-200 my-1"></div>

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 text-sm text-red-600"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>
  );
};

