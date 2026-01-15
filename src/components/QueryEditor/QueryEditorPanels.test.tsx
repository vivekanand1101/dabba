import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QueryEditor from './QueryEditor';

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div
      data-testid="panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
    >
      {children}
    </div>
  ),
  PanelGroup: ({ children, direction }: any) => (
    <div data-testid="panel-group" data-direction={direction}>
      {children}
    </div>
  ),
  PanelResizeHandle: ({ className }: any) => (
    <div data-testid="resize-handle" className={className} />
  ),
}));

// Mock stores
vi.mock('../../store/connectionStore', () => ({
  useConnectionStore: () => ({
    activeConnectionId: 'test-conn',
  }),
}));

vi.mock('../../store/queryStore', () => ({
  useQueryStore: () => ({
    currentResult: null,
    isExecuting: false,
    error: null,
    executeQuery: vi.fn(),
    clearError: vi.fn(),
    loadAutocompleteData: vi.fn(),
    autocompleteData: null,
  }),
}));

// Mock Editor component
vi.mock('./Editor', () => ({
  default: () => <div data-testid="monaco-editor">Monaco Editor</div>,
}));

describe('QueryEditor Resizable Panels', () => {
  it('renders with vertical panel group', () => {
    render(<QueryEditor />);

    const panelGroup = screen.getByTestId('panel-group');
    expect(panelGroup).toHaveAttribute('data-direction', 'vertical');
  });

  it('renders two panels (editor and results)', () => {
    render(<QueryEditor />);

    const panels = screen.getAllByTestId('panel');
    expect(panels).toHaveLength(2);
  });

  it('editor panel has correct size constraints', () => {
    render(<QueryEditor />);

    const panels = screen.getAllByTestId('panel');
    const editorPanel = panels[0];

    expect(editorPanel).toHaveAttribute('data-default-size', '40');
    expect(editorPanel).toHaveAttribute('data-min-size', '20');
    expect(editorPanel).toHaveAttribute('data-max-size', '80');
  });

  it('results panel has correct size constraints', () => {
    render(<QueryEditor />);

    const panels = screen.getAllByTestId('panel');
    const resultsPanel = panels[1];

    expect(resultsPanel).toHaveAttribute('data-default-size', '60');
  });

  it('renders resize handle between editor and results', () => {
    render(<QueryEditor />);

    const resizeHandle = screen.getByTestId('resize-handle');
    expect(resizeHandle).toBeInTheDocument();
    expect(resizeHandle).toHaveClass('cursor-row-resize');
  });

  it('resize handle has hover effect styles', () => {
    render(<QueryEditor />);

    const resizeHandle = screen.getByTestId('resize-handle');
    expect(resizeHandle).toHaveClass('hover:bg-blue-500');
    expect(resizeHandle).toHaveClass('transition-colors');
  });

  it('editor panel contains monaco editor', () => {
    render(<QueryEditor />);

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('results panel contains placeholder text when no results', () => {
    render(<QueryEditor />);

    expect(screen.getByText(/Write a SQL query and press Execute/)).toBeInTheDocument();
  });

  it('renders execute button in editor panel', () => {
    render(<QueryEditor />);

    expect(screen.getByRole('button', { name: /Execute/ })).toBeInTheDocument();
  });
});
