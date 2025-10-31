import React from 'react';
import { useNode } from '@craftjs/core';

interface CraftImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
}

export const CraftImage: React.FC<CraftImageProps> & { craft?: any } = ({
  src = 'https://via.placeholder.com/400x300',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
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
      className={selected ? 'ring-2 ring-primary-500' : ''}
      style={{ width, height: height !== 'auto' ? height : undefined }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: height !== 'auto' ? '100%' : 'auto',
          objectFit,
        }}
        className="rounded-lg"
      />
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
  },
  rules: {
    canDrag: () => true,
  },
};

