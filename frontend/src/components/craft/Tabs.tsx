import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Plus, X } from 'lucide-react';

interface TabsProps {
  tabs?: Array<{ id: string; label: string }>;
  defaultTab?: string;
  orientation?: 'horizontal' | 'vertical';
  children?: React.ReactNode;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const Tabs: React.FC<TabsProps> & { craft?: any } = ({
  tabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
  ],
  defaultTab = 'tab1',
  orientation = 'horizontal',
  children,
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

  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      } border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden`}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      <div
        className={`flex ${
          orientation === 'vertical' ? 'flex-row' : 'flex-col'
        }`}
      >
        {/* Tab Headers */}
        <div
          className={`flex ${
            orientation === 'vertical'
              ? 'flex-col border-r'
              : 'flex-row border-b'
          } border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } ${orientation === 'vertical' ? 'text-left border-b-0 border-l-2' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 bg-white dark:bg-gray-800 min-h-[200px]">
          {children || (
            <div className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">
              <div className="font-medium mb-1">Tab Content Area</div>
              <div className="text-xs opacity-75">
                Drop components here for each tab
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabsSettings: React.FC = () => {
  const {
    actions: { setProp },
    tabs,
    defaultTab,
    orientation,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    tabs: node.data.props.tabs,
    defaultTab: node.data.props.defaultTab,
    orientation: node.data.props.orientation,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  const [newTabLabel, setNewTabLabel] = useState('');

  const handleAddTab = () => {
    if (newTabLabel) {
      const newId = `tab${tabs.length + 1}`;
      setProp((props: any) => {
        props.tabs = [...props.tabs, { id: newId, label: newTabLabel }];
      });
      setNewTabLabel('');
    }
  };

  const handleRemoveTab = (index: number) => {
    setProp((props: any) => {
      props.tabs = props.tabs.filter((_: any, i: number) => i !== index);
      // If removing the default tab, set new default
      if (props.tabs[index].id === props.defaultTab && props.tabs.length > 1) {
        props.defaultTab = props.tabs[0].id;
      }
    });
  };

  const handleUpdateLabel = (index: number, newLabel: string) => {
    setProp((props: any) => {
      props.tabs[index].label = newLabel;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Orientation</h4>
        <select
          value={orientation}
          onChange={(e) => setProp((props: any) => (props.orientation = e.target.value))}
          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tabs</h4>
        {tabs && tabs.length > 0 && (
          <div className="space-y-2 mb-3">
            {tabs.map((tab: any, index: number) => (
              <div key={tab.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <input
                  type="text"
                  value={tab.label}
                  onChange={(e) => handleUpdateLabel(index, e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTab"
                    checked={defaultTab === tab.id}
                    onChange={() => setProp((props: any) => (props.defaultTab = tab.id))}
                    className="text-primary-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Default</span>
                </label>
                {tabs.length > 1 && (
                  <button
                    onClick={() => handleRemoveTab(index)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Add Tab</div>
          <input
            type="text"
            value={newTabLabel}
            onChange={(e) => setNewTabLabel(e.target.value)}
            placeholder="Tab Label"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
          <button
            onClick={handleAddTab}
            disabled={!newTabLabel}
            className="w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Tab
          </button>
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

Tabs.craft = {
  displayName: 'Tabs',
  props: {
    tabs: [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
    ],
    defaultTab: 'tab1',
    orientation: 'horizontal',
    width: '100%',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: TabsSettings,
  },
};

