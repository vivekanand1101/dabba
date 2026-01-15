import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  PanelGroup: ({ children }: any) => <div data-testid="panel-group">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
}));

// Mock connection store
vi.mock('../store/connectionStore', () => ({
  useConnectionStore: () => ({
    connections: [],
    loadConnections: vi.fn(),
    deleteConnection: vi.fn(),
    activeConnectionId: null,
    setActiveConnection: vi.fn(),
  }),
}));

// Mock query store
vi.mock('../store/queryStore', () => ({
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

// Mock components
vi.mock('../components/ConnectionManager/ConnectionList', () => ({
  default: () => <div data-testid="connection-list">Connection List</div>,
}));

vi.mock('../components/QueryEditor/QueryEditor', () => ({
  default: () => <div data-testid="query-editor">Query Editor</div>,
}));

describe('Resizable Panels', () => {
  it('renders app with panel groups', () => {
    render(<App />);

    const panelGroups = screen.getAllByTestId('panel-group');
    expect(panelGroups.length).toBeGreaterThan(0);
  });

  it('renders panels for sidebar and main content', () => {
    render(<App />);

    // Should have multiple panels
    const panels = screen.getAllByTestId('panel');
    expect(panels.length).toBeGreaterThan(1);
  });

  it('renders resize handles', () => {
    render(<App />);

    const resizeHandles = screen.getAllByTestId('resize-handle');
    expect(resizeHandles.length).toBeGreaterThan(0);
  });

  it('renders connection list in a panel', () => {
    render(<App />);

    expect(screen.getByTestId('connection-list')).toBeInTheDocument();
  });

  it('renders query editor in a panel', () => {
    render(<App />);

    expect(screen.getByTestId('query-editor')).toBeInTheDocument();
  });
});
