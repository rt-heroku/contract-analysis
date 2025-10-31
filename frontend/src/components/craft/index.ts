import { Container as ContainerComponent } from './Container';
import { CraftText as CraftTextComponent } from './Text';
import { CraftButton as CraftButtonComponent } from './CraftButton';
import { CraftCard as CraftCardComponent } from './CraftCard';
import { DataTable as DataTableComponent } from './DataTable';
import { CraftImage as CraftImageComponent } from './CraftImage';
import { Columns as ColumnsComponent } from './Columns';
import { Column as ColumnComponent } from './Column';
import { Modal as ModalComponent } from './Modal';

// Re-export components
export { Container } from './Container';
export { CraftText } from './Text';
export { CraftButton } from './CraftButton';
export { CraftCard } from './CraftCard';
export { DataTable } from './DataTable';
export { CraftImage } from './CraftImage';
export { Columns } from './Columns';
export { Column } from './Column';
export { Modal } from './Modal';

// Component library for Craft.js Editor
export const ComponentLibrary = {
  Container: ContainerComponent,
  CraftText: CraftTextComponent,
  CraftButton: CraftButtonComponent,
  CraftCard: CraftCardComponent,
  DataTable: DataTableComponent,
  CraftImage: CraftImageComponent,
  Columns: ColumnsComponent,
  Column: ColumnComponent,
  Modal: ModalComponent,
};

