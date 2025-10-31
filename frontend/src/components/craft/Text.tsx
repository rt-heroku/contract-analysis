import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';

interface CraftTextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  margin?: number;
}

export const CraftText: React.FC<CraftTextProps> & { craft?: any } = ({
  text = 'Text',
  fontSize = 16,
  fontWeight = 'normal',
  color,
  textAlign = 'left',
  margin = 0,
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [editable, setEditable] = useState(false);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      onClick={() => selected && setEditable(true)}
      className={selected ? 'ring-1 ring-primary-400 dark:ring-primary-500' : ''}
      style={{ margin: `${margin * 4}px` }}
    >
      <ContentEditable
        html={text}
        disabled={!editable}
        onChange={(e) => {
          setProp((props: any) => (props.text = e.target.value), 500);
        }}
        tagName="p"
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color: color || undefined,
          textAlign,
          outline: 'none',
        }}
        className="text-gray-900 dark:text-gray-100"
      />
    </div>
  );
};

const TextSettings: React.FC = () => {
  const {
    actions: { setProp },
    fontSize,
    fontWeight,
    textAlign,
    margin,
  } = useNode((node) => ({
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    textAlign: node.data.props.textAlign,
    margin: node.data.props.margin,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Font Size
        </label>
        <input
          type="range"
          min="12"
          max="72"
          value={fontSize}
          onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value)))}
          className="w-full"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{fontSize}px</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Font Weight
        </label>
        <select
          value={fontWeight}
          onChange={(e) => setProp((props: any) => (props.fontWeight = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="lighter">Lighter</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Text Align
        </label>
        <select
          value={textAlign}
          onChange={(e) => setProp((props: any) => (props.textAlign = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Margin
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={margin}
          onChange={(e) => setProp((props: any) => (props.margin = parseInt(e.target.value)))}
          className="w-full"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{margin * 4}px</span>
      </div>
    </div>
  );
};

CraftText.craft = {
  displayName: 'Text',
  props: {
    text: 'Text',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
    margin: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: TextSettings,
  },
};

