import React from 'react';
import { useEditor } from '@craftjs/core';
import { ArrowUp, ArrowDown, Copy, Trash2, Move } from 'lucide-react';

export const ComponentToolbar: React.FC<{ render?: React.ReactNode }> = () => {
  const { selected, actions, query } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').first();
    
    let selectedNode = null;
    if (currentNodeId) {
      selectedNode = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.displayName || state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related?.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
        parent: state.nodes[currentNodeId].data.parent,
        dom: state.nodes[currentNodeId].dom,
      };
    }

    return {
      selected: selectedNode,
    };
  });

  if (!selected || !selected.dom) return null;

  const handleMoveUp = () => {
    if (selected.parent) {
      actions.move(selected.id, selected.parent, 0);
    }
  };

  const handleMoveDown = () => {
    if (selected.parent) {
      const parentNode = query.node(selected.parent).get();
      const siblings = parentNode.data.nodes || [];
      actions.move(selected.id, selected.parent, siblings.length);
    }
  };

  const handleDuplicate = () => {
    try {
      const tree = query.node(selected.id).toNodeTree();
      if (selected.parent) {
        actions.addNodeTree(tree, selected.parent);
      }
    } catch (error) {
      console.error('Failed to duplicate component:', error);
    }
  };

  const handleDelete = () => {
    if (selected.isDeletable) {
      actions.delete(selected.id);
    }
  };

  // Get the position of the selected element
  const rect = selected.dom.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-primary-600 text-white px-3 py-1.5 rounded shadow-lg animate-in fade-in duration-200"
      style={{
        top: `${rect.top + scrollTop - 40}px`,
        left: `${rect.left + scrollLeft}px`,
        pointerEvents: 'all',
      }}
    >
      {/* Component Name */}
      <span className="text-sm font-semibold mr-2 flex items-center gap-1">
        <Move className="w-3 h-3" />
        {selected.name}
      </span>

      {/* Divider */}
      <div className="h-4 w-px bg-white/30 mx-1" />

      {/* Move Up */}
      <button
        onClick={handleMoveUp}
        className="p-1 hover:bg-primary-700 rounded transition-colors"
        title="Move up"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {/* Move Down */}
      <button
        onClick={handleMoveDown}
        className="p-1 hover:bg-primary-700 rounded transition-colors"
        title="Move down"
      >
        <ArrowDown className="w-4 h-4" />
      </button>

      {/* Duplicate */}
      <button
        onClick={handleDuplicate}
        className="p-1 hover:bg-primary-700 rounded transition-colors"
        title="Duplicate"
      >
        <Copy className="w-4 h-4" />
      </button>

      {/* Delete */}
      {selected.isDeletable && (
        <>
          <div className="h-4 w-px bg-white/30 mx-1" />
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

