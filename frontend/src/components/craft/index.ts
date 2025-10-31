import { Container as ContainerComponent } from './Container';
import { CraftText as CraftTextComponent } from './Text';
import { CraftButton as CraftButtonComponent } from './CraftButton';
import { CraftCard as CraftCardComponent } from './CraftCard';
import { DataTable as DataTableComponent } from './DataTable';
import { CraftImage as CraftImageComponent } from './CraftImage';

// Re-export components
export { Container } from './Container';
export { CraftText } from './Text';
export { CraftButton } from './CraftButton';
export { CraftCard } from './CraftCard';
export { DataTable } from './DataTable';
export { CraftImage } from './CraftImage';

// Component library for Craft.js Editor
export const ComponentLibrary = {
  Container: ContainerComponent,
  CraftText: CraftTextComponent,
  CraftButton: CraftButtonComponent,
  CraftCard: CraftCardComponent,
  DataTable: DataTableComponent,
  CraftImage: CraftImageComponent,
};

