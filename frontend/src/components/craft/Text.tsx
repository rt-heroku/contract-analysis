import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';

interface CraftTextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  width?: string;
  height?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  background?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export const CraftText: React.FC<CraftTextProps> & { craft?: any } = ({
  text = 'Text',
  fontSize = 16,
  fontWeight = 'normal',
  color,
  textAlign = 'left',
  lineHeight = 1.5,
  width = 'auto',
  height = 'auto',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  paddingTop = 0,
  paddingRight = 0,
  paddingBottom = 0,
  paddingLeft = 0,
  background = 'transparent',
  borderRadius = 0,
  borderWidth = 0,
  borderColor = '#e5e7eb',
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
      style={{
        width,
        height,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        paddingTop: `${paddingTop * 4}px`,
        paddingRight: `${paddingRight * 4}px`,
        paddingBottom: `${paddingBottom * 4}px`,
        paddingLeft: `${paddingLeft * 4}px`,
        background,
        borderRadius: `${borderRadius}px`,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
      }}
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
          lineHeight,
          outline: 'none',
          margin: 0,
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
    color,
    textAlign,
    lineHeight,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    background,
    borderRadius,
    borderWidth,
    borderColor,
  } = useNode((node) => ({
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
    textAlign: node.data.props.textAlign,
    lineHeight: node.data.props.lineHeight,
    width: node.data.props.width,
    height: node.data.props.height,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    background: node.data.props.background,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
    borderColor: node.data.props.borderColor,
  }));

  return (
    <div className="space-y-6">
      {/* Typography */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Typography</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Size</label>
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
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Weight</label>
            <select
              value={fontWeight}
              onChange={(e) => setProp((props: any) => (props.fontWeight = e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="600">Semi-Bold</option>
              <option value="lighter">Lighter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Align</label>
            <select
              value={textAlign}
              onChange={(e) => setProp((props: any) => (props.textAlign = e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Line Height</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setProp((props: any) => (props.lineHeight = parseFloat(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{lineHeight}</span>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Color</label>
            <input
              type="text"
              value={color || ''}
              onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
              placeholder="inherit"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
              placeholder="auto"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = e.target.value))}
              placeholder="auto"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      {/* Margin */}
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
              <input
                type="range"
                min="0"
                max="100"
                value={marginTop}
                onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={marginRight}
                onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={marginBottom}
                onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={marginLeft}
                onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Padding */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Padding <span className="text-xs font-normal text-gray-500">{paddingTop * 4}px {paddingRight * 4}px {paddingBottom * 4}px {paddingLeft * 4}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={paddingTop}
                onChange={(e) => setProp((props: any) => (props.paddingTop = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={paddingRight}
                onChange={(e) => setProp((props: any) => (props.paddingRight = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={paddingBottom}
                onChange={(e) => setProp((props: any) => (props.paddingBottom = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={paddingLeft}
                onChange={(e) => setProp((props: any) => (props.paddingLeft = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Styling */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Styling</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Background</label>
            <input
              type="text"
              value={background}
              onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
              placeholder="transparent"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Radius</label>
            <input
              type="range"
              min="0"
              max="50"
              value={borderRadius}
              onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{borderRadius}px</span>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Width</label>
            <input
              type="range"
              min="0"
              max="10"
              value={borderWidth}
              onChange={(e) => setProp((props: any) => (props.borderWidth = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{borderWidth}px</span>
          </div>

          {borderWidth > 0 && (
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Color</label>
              <input
                type="text"
                value={borderColor}
                onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
              />
            </div>
          )}
        </div>
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
    color: undefined,
    textAlign: 'left',
    lineHeight: 1.5,
    width: 'auto',
    height: 'auto',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    background: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#e5e7eb',
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: TextSettings,
  },
};

