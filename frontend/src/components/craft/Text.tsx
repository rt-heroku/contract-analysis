import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';

interface TextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  margin?: number;
}

export const Text: React.FC<TextProps> = ({
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
      className={selected ? 'ring-1 ring-primary-400' : ''}
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

Text.craft = {
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
};

