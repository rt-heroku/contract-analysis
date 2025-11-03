import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit } from 'lucide-react';

interface MarkdownEditorProps {
  content?: string;
  mode?: 'edit' | 'preview' | 'split';
  width?: string;
  height?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> & { craft?: any } = ({
  content = '# Markdown Content\n\nEdit this content...',
  mode = 'split',
  width = '100%',
  height = '400px',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [localContent, setLocalContent] = useState(content);
  const [viewMode, setViewMode] = useState(mode);

  const handleChange = (value: string) => {
    setLocalContent(value);
    setProp((props: any) => (props.content = value), 500);
  };

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      {/* Toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('edit')}
          className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
            viewMode === 'edit'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          <Edit className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
            viewMode === 'preview'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            viewMode === 'split'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          Split
        </button>
      </div>

      {/* Content */}
      <div
        className={`flex ${viewMode === 'split' ? 'divide-x divide-gray-200 dark:divide-gray-700' : ''}`}
        style={{ height }}
      >
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={viewMode === 'split' ? 'flex-1' : 'w-full'}>
            <textarea
              value={localContent}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none"
              placeholder="Write markdown here..."
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`overflow-y-auto ${viewMode === 'split' ? 'flex-1' : 'w-full'}`}>
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{localContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MarkdownEditorSettings: React.FC = () => {
  const {
    actions: { setProp },
    mode,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    mode: node.data.props.mode,
    width: node.data.props.width,
    height: node.data.props.height,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Editor Mode</h4>
        <select
          value={mode}
          onChange={(e) => setProp((props: any) => (props.mode = e.target.value))}
          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
        >
          <option value="edit">Edit Only</option>
          <option value="preview">Preview Only</option>
          <option value="split">Split (Edit + Preview)</option>
        </select>
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
              placeholder="400px"
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

MarkdownEditor.craft = {
  displayName: 'Markdown Editor',
  props: {
    content: '# Markdown Content\n\nEdit this content...',
    mode: 'split',
    width: '100%',
    height: '400px',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: MarkdownEditorSettings,
  },
};

