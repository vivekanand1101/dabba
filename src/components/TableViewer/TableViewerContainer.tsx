import { useState } from 'react';
import TableDataViewer from './TableDataViewer';
import TableStructureView from './TableStructureView';

interface TableViewerContainerProps {
  connectionId: string;
  database: string;
  table: string;
  initialView?: 'data' | 'structure';
  onClose: () => void;
}

export default function TableViewerContainer({
  connectionId,
  database,
  table,
  initialView = 'data',
  onClose,
}: TableViewerContainerProps) {
  const [view, setView] = useState<'data' | 'structure'>(initialView);

  if (view === 'structure') {
    return (
      <TableStructureView
        connectionId={connectionId}
        database={database}
        table={table}
        onClose={onClose}
      />
    );
  }

  return (
    <TableDataViewer
      connectionId={connectionId}
      database={database}
      table={table}
      onClose={onClose}
      onViewStructure={() => setView('structure')}
    />
  );
}
