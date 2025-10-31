import React from 'react';
import { useNode } from '@craftjs/core';

interface CraftImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export const CraftImage: React.FC<CraftImageProps> & { craft?: any } = ({
  src = 'https://via.placeholder.com/400x300',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  borderRadius = 8,
  borderWidth = 0,
  borderColor = '#e5e7eb',
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
      style={{
        width,
        height: height !== 'auto' ? height : undefined,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: height !== 'auto' ? '100%' : 'auto',
          objectFit,
          borderRadius: `${borderRadius}px`,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        }}
      />
    </div>
  );
};

const ImageSettings: React.FC = () => {
  const {
    actions: { setProp },
    src,
    alt,
    width,
    height,
    objectFit,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    borderRadius,
    borderWidth,
    borderColor,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    width: node.data.props.width,
    height: node.data.props.height,
    objectFit: node.data.props.objectFit,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
    borderColor: node.data.props.borderColor,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Image Source</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">URL</label>
            <input type="text" value={src} onChange={(e) => setProp((props: any) => (props.src = e.target.value))} placeholder="https://..." className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Alt Text</label>
            <input type="text" value={alt} onChange={(e) => setProp((props: any) => (props.alt = e.target.value))} placeholder="Image description" className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input type="text" value={width} onChange={(e) => setProp((props: any) => (props.width = e.target.value))} placeholder="100%" className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input type="text" value={height} onChange={(e) => setProp((props: any) => (props.height = e.target.value))} placeholder="auto" className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Object Fit</label>
            <select value={objectFit} onChange={(e) => setProp((props: any) => (props.objectFit = e.target.value))} className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded">
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
            </select>
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

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Border</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Radius</label>
            <input type="range" min="0" max="50" value={borderRadius} onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value)))} className="w-full" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{borderRadius}px</span>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Width</label>
            <input type="range" min="0" max="10" value={borderWidth} onChange={(e) => setProp((props: any) => (props.borderWidth = parseInt(e.target.value)))} className="w-full" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{borderWidth}px</span>
          </div>
          {borderWidth > 0 && (
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Color</label>
              <input type="text" value={borderColor} onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))} className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CraftImage.craft = {
  displayName: 'Image',
  props: {
    src: 'https://via.placeholder.com/400x300',
    alt: 'Image',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    borderRadius: 8,
    borderWidth: 0,
    borderColor: '#e5e7eb',
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: ImageSettings,
  },
};

