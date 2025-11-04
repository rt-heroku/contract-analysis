import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  dismissible?: boolean;
  showIcon?: boolean;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const Alert: React.FC<AlertProps> & { craft?: any } = ({
  type = 'info',
  title = 'Alert Title',
  message = 'This is an alert message.',
  dismissible = false,
  showIcon = true,
  width = '100%',
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

  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const typeStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-500 dark:text-green-400',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500 dark:text-yellow-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: XCircle,
      iconColor: 'text-red-500 dark:text-red-400',
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${style.bg} ${style.border} border rounded-lg p-4 ${
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
      <div className="flex items-start gap-3">
        {showIcon && <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />}
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-semibold ${style.text} mb-1`}>{title}</h3>
          )}
          {message && <p className={`text-sm ${style.text}`}>{message}</p>}
        </div>
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className={`${style.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const AlertSettings: React.FC = () => {
  const {
    actions: { setProp },
    type,
    title,
    message,
    dismissible,
    showIcon,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    type: node.data.props.type,
    title: node.data.props.title,
    message: node.data.props.message,
    dismissible: node.data.props.dismissible,
    showIcon: node.data.props.showIcon,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Content</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
              placeholder="Alert Title"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setProp((props: any) => (props.message = e.target.value))}
              placeholder="This is an alert message."
              rows={3}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded resize-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Type</h4>
        <select
          value={type}
          onChange={(e) => setProp((props: any) => (props.type = e.target.value))}
          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
        >
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Options</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showIcon}
              onChange={(e) => setProp((props: any) => (props.showIcon = e.target.checked))}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Show Icon</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dismissible}
              onChange={(e) => setProp((props: any) => (props.dismissible = e.target.checked))}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Dismissible</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
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

Alert.craft = {
  displayName: 'Alert',
  props: {
    type: 'info',
    title: 'Alert Title',
    message: 'This is an alert message.',
    dismissible: false,
    showIcon: true,
    width: '100%',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: AlertSettings,
  },
};

