import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { X } from 'lucide-react';

interface ModalProps {
  children?: React.ReactNode;
  title?: string;
  width?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> & { craft?: any } = ({
  children,
  title = 'Modal Title',
  width = 'max-w-2xl',
  showCloseButton = true,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isOpen, setIsOpen] = useState(true);

  // Handler for closing the modal
  const handleClose = () => {
    setIsOpen(false);
    // Re-open after a short delay to allow previewing again
    setTimeout(() => setIsOpen(true), 100);
  };

  // In editor mode, render without the blocking overlay
  if (enabled) {
    return (
      <div
        ref={(ref) => ref && connect(drag(ref))}
        className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} my-8 mx-auto ${width}`}
      >
        {/* Show a badge to indicate it's a modal */}
        <div className="text-xs text-center mb-2 text-gray-500 dark:text-gray-400 font-semibold">
          📄 MODAL PREVIEW (Will show as overlay when published)
        </div>
        
        {/* Modal Content (without overlay) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full overflow-hidden flex flex-col border-2 border-primary-500 dark:border-primary-400">
          {/* Modal Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {showCloseButton && (
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Modal Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            {children || (
              <div className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                Drop components here
              </div>
            )}
          </div>

          {/* Modal Footer (optional placeholder) */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // In preview/published mode, render with the overlay
  if (!isOpen) {
    return (
      <div
        ref={(ref) => ref && connect(drag(ref))}
        className="text-center py-4"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Open Modal
        </button>
      </div>
    );
  }

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} relative`}
    >
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        {/* Modal Content */}
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${width} w-full max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {showCloseButton && (
                <button 
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Modal Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            {children}
          </div>

          {/* Modal Footer (optional placeholder) */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button 
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalSettings: React.FC = () => {
  const {
    actions: { setProp },
    title,
    width,
    showCloseButton,
  } = useNode((node) => ({
    title: node.data.props.title,
    width: node.data.props.width,
    showCloseButton: node.data.props.showCloseButton,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Modal Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Width
        </label>
        <select
          value={width}
          onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        >
          <option value="max-w-sm">Small</option>
          <option value="max-w-2xl">Medium</option>
          <option value="max-w-4xl">Large</option>
          <option value="max-w-6xl">Extra Large</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCloseButton}
            onChange={(e) => setProp((props: any) => (props.showCloseButton = e.target.checked))}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show Close Button
          </span>
        </label>
      </div>
    </div>
  );
};

Modal.craft = {
  displayName: 'Modal',
  props: {
    title: 'Modal Title',
    width: 'max-w-2xl',
    showCloseButton: true,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ModalSettings,
  },
};

