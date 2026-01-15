import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueryEditor from './QueryEditor';
import { useQueryStore } from '../../store/queryStore';
import { useConnectionStore } from '../../store/connectionStore';

// Mock the stores
vi.mock('../../store/queryStore', () => ({
  useQueryStore: vi.fn(),
}));

vi.mock('../../store/connectionStore', () => ({
  useConnectionStore: vi.fn(),
}));

// Mock Editor component
vi.mock('./Editor', () => ({
  default: ({ value, onChange, onExecute }: any) => (
    <textarea
      data-testid="sql-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('QueryEditor', () => {
  const mockExecuteQuery = vi.fn();
  const mockCancelQuery = vi.fn();
  const mockClearError = vi.fn();
  const mockLoadAutocompleteData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: false,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    (useConnectionStore as any).mockReturnValue({
      activeConnectionId: 'test-conn-id',
    });

    mockExecuteQuery.mockResolvedValue(undefined);
  });

  it('executes query when Execute button is clicked', async () => {
    const user = userEvent.setup();
    render(<QueryEditor />);

    const editor = screen.getByTestId('sql-editor');
    await user.clear(editor);
    await user.type(editor, 'SELECT 2');

    const executeButton = screen.getByRole('button', { name: /Execute/ });
    await user.click(executeButton);

    await waitFor(() => {
      expect(mockExecuteQuery).toHaveBeenCalledWith('test-conn-id', 'SELECT 2');
    });
  });

  it('shows loading state while executing', () => {
    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: true,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    // Should show cancel button, not "Executing..." text
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('displays query results after execution', () => {
    const mockResult = {
      columns: ['id', 'name'],
      rows: [
        [1, 'Alice'],
        [2, 'Bob'],
      ],
      total_rows: 2,
      execution_time_ms: 15,
    };

    (useQueryStore as any).mockReturnValue({
      currentResult: mockResult,
      isExecuting: false,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('2 rows in 15ms')).toBeInTheDocument();
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('displays error message when query fails', () => {
    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: false,
      error: 'Syntax error: unexpected token',
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Syntax error: unexpected token')).toBeInTheDocument();
  });

  it('clears error when close button is clicked', async () => {
    const user = userEvent.setup();

    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: false,
      error: 'Test error',
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('disables execute button when no connection', () => {
    (useConnectionStore as any).mockReturnValue({
      activeConnectionId: null,
    });

    render(<QueryEditor />);

    const executeButton = screen.getByRole('button', { name: /Execute/ });
    expect(executeButton).toBeDisabled();
  });

  it('displays NULL values correctly in results', () => {
    const mockResult = {
      columns: ['id', 'value'],
      rows: [
        [1, 'text'],
        [2, null],
      ],
      total_rows: 2,
      execution_time_ms: 10,
    };

    (useQueryStore as any).mockReturnValue({
      currentResult: mockResult,
      isExecuting: false,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    expect(screen.getByText('NULL')).toBeInTheDocument();
  });

  it('shows cancel button when query is executing', () => {
    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: true,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Execute/i })).not.toBeInTheDocument();
  });

  it('shows execute button when query is not executing', () => {
    render(<QueryEditor />);

    expect(screen.getByRole('button', { name: /Execute/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeInTheDocument();
  });

  it('calls cancelQuery when cancel button is clicked', async () => {
    const user = userEvent.setup();

    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: true,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    render(<QueryEditor />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockCancelQuery).toHaveBeenCalledTimes(1);
  });

  it('shows cancel button with X icon when executing', () => {
    (useQueryStore as any).mockReturnValue({
      currentResult: null,
      isExecuting: true,
      error: null,
      executeQuery: mockExecuteQuery,
      cancelQuery: mockCancelQuery,
      clearError: mockClearError,
      loadAutocompleteData: mockLoadAutocompleteData,
    });

    const { container } = render(<QueryEditor />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toHaveClass('bg-red-600');

    // Check that the X icon SVG is present
    const svg = cancelButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
