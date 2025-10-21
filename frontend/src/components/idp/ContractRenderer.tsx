import React from 'react';
import { GenericIDPRenderer } from './GenericIDPRenderer';

interface ContractRendererProps {
  data: any;
}

export const ContractRenderer: React.FC<ContractRendererProps> = ({ data }) => {
  // For now, contracts use the generic renderer
  // This can be specialized later if needed
  return <GenericIDPRenderer data={data} />;
};

