import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentName: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  documentName,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 100, y: 100 });
  const [lastSize, setLastSize] = useState({ width: 900, height: 700 });

  if (!isOpen) return null;

  const handleMaximize = () => {
    if (!isMaximized) {
      setIsMaximized(true);
    } else {
      setIsMaximized(false);
    }
  };

  const modalStyle = isMaximized
    ? {
        width: '100vw',
        height: '100vh',
        x: 0,
        y: 0,
      }
    : {
        width: lastSize.width,
        height: lastSize.height,
        x: lastPosition.x,
        y: lastPosition.y,
      };

  return (
    <>
      {/* Overlay - non-blurred, allows interaction with background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9998 }}
      />

      {/* Draggable & Resizable Modal */}
      <Rnd
        style={{
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
        default={{
          x: 100,
          y: 100,
          width: 900,
          height: 700,
        }}
        position={isMaximized ? { x: 0, y: 0 } : undefined}
        size={isMaximized ? { width: '100vw', height: '100vh' } : undefined}
        minWidth={400}
        minHeight={300}
        bounds="window"
        dragHandleClassName="drag-handle"
        enableResizing={!isMaximized}
        disableDragging={isMaximized}
        onDragStop={(e, d) => {
          if (!isMaximized) {
            setLastPosition({ x: d.x, y: d.y });
          }
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          if (!isMaximized) {
            setLastSize({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            });
            setLastPosition(position);
          }
        }}
      >
        <div className="w-full h-full bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden">
          {/* Header - Draggable */}
          <div className="drag-handle flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-move">
            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
              {documentName}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleMaximize}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title={documentName}
            />
          </div>
        </div>
      </Rnd>
    </>
  );
};

