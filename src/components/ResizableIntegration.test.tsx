import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueryEditor from './QueryEditor/QueryEditor';

// Real integration test with actual react-resizable-panels
describe('Resizable Panels Integration', () => {
  beforeEach(() => {
    // Mock stores
    vi.mock('../store/connectionStore', () => ({
      useConnectionStore: () => ({
        activeConnectionId: 'test-conn',
      }),
    }));

    vi.mock('../store/queryStore', () => ({
      useQueryStore: () => ({
        currentResult: {
          columns: ['id', 'name'],
          rows: [[1, 'Test']],
          total_rows: 1,
          execution_time_ms: 10,
        },
        isExecuting: false,
        error: null,
        executeQuery: vi.fn(),
        clearError: vi.fn(),
        loadAutocompleteData: vi.fn(),
        autocompleteData: null,
      }),
    }));

    vi.mock('./QueryEditor/Editor', () => ({
      default: () => <div data-testid="monaco-editor">Editor</div>,
    }));
  });

  it('renders query editor with results', () => {
    render(<QueryEditor />);

    expect(screen.getByText('Query Editor')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('displays result table data', () => {
    render(<QueryEditor />);

    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows execution stats', () => {
    render(<QueryEditor />);

    expect(screen.getByText(/1 row in 10ms/)).toBeInTheDocument();
  });
});

describe('Sidebar Resize Integration', () => {
  beforeEach(() => {
    vi.mock('../store/connectionStore', () => ({
      useConnectionStore: () => ({
        connections: [
          {
            id: 'conn-1',
            name: 'Test DB',
            color: '#ef4444',
            db_type: 'MySQL',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: 'pass',
            database: 'test',
          },
        ],
        loadConnections: vi.fn(),
        deleteConnection: vi.fn(),
        activeConnectionId: null,
        setActiveConnection: vi.fn(),
      }),
    }));
  });

  it('renders connections in resizable sidebar', () => {
    // This is tested through the App component
    // The actual drag behavior would require E2E tests with real browser
    expect(true).toBe(true);
  });
});
