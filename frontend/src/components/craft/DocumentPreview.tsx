import React from 'react';
import { useNode } from '@craftjs/core';
import { FileText } from 'lucide-react';

interface DocumentPreviewProps {
  documentUrl?: string;
  documentType?: 'pdf' | 'image' | 'iframe';
  width?: string;
  height?: string;
  showDownload?: boolean;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> & { craft?: any } = ({
  documentUrl = '',
  documentType = 'pdf',
  width = '100%',
  height = '600px',
  showDownload = true,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const renderPreview = () => {
    if (!documentUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Configure document URL in settings
          </p>
        </div>
      );
    }

    if (documentType === 'pdf') {
      return (
        <iframe
          src={`${documentUrl}#toolbar=0`}
          className="w-full h-full border-0"
          title="Document Preview"
        />
      );
    }

    if (documentType === 'image') {
      return (
        <img
          src={documentUrl}
          alt="Document Preview"
          className="w-full h-full object-contain"
        />
      );
    }

    return (
      <iframe
        src={documentUrl}
        className="w-full h-full border-0"
        title="Document Preview"
      />
    );
  };

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
      style={{
        width,
        height,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      {showDownload && documentUrl && (
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-600 dark:text-gray-400">Document Preview</span>
          <a
            href={documentUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Download
          </a>
        </div>
      )}
      <div className="w-full" style={{ height: showDownload && documentUrl ? 'calc(100% - 41px)' : '100%' }}>
        {renderPreview()}
      </div>
    </div>
  );
};

const DocumentPreviewSettings: React.FC = () => {
  const {
    actions: { setProp },
    documentUrl,
    documentType,
    width,
    height,
    showDownload,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    documentUrl: node.data.props.documentUrl,
    documentType: node.data.props.documentType,
    width: node.data.props.width,
    height: node.data.props.height,
    showDownload: node.data.props.showDownload,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Document</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Document URL</label>
            <input
              type="text"
              value={documentUrl}
              onChange={(e) => setProp((props: any) => (props.documentUrl = e.target.value))}
              placeholder="https://example.com/document.pdf"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
            <select
              value={documentType}
              onChange={(e) => setProp((props: any) => (props.documentType = e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="iframe">Other (iFrame)</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDownload}
                onChange={(e) => setProp((props: any) => (props.showDownload = e.target.checked))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Show Download Button</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
              placeholder="100%"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = e.target.value))}
              placeholder="600px"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Margin <span className="text-xs font-normal text-gray-500">{marginTop}px {marginRight}px {marginBottom}px {marginLeft}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginTop} onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginRight} onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginBottom} onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginLeft} onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DocumentPreview.craft = {
  displayName: 'Document Preview',
  props: {
    documentUrl: '',
    documentType: 'pdf',
    width: '100%',
    height: '600px',
    showDownload: true,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: DocumentPreviewSettings,
  },
};

