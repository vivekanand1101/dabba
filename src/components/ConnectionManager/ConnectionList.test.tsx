import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionList from './ConnectionList';
import { useConnectionStore } from '../../store/connectionStore';

// Mock the connection store
vi.mock('../../store/connectionStore', () => ({
  useConnectionStore: vi.fn(),
}));

// Mock ConnectionForm component
vi.mock('./ConnectionForm', () => ({
  default: ({ onClose, existingConnection }: any) => (
    <div data-testid="connection-form">
      <button onClick={onClose}>Close</button>
      {existingConnection && (
        <div data-testid="editing-connection">{existingConnection.name}</div>
      )}
    </div>
  ),
}));

describe('ConnectionList - Edit Functionality', () => {
  const mockLoadConnections = vi.fn();
  const mockDeleteConnection = vi.fn();
  const mockSetActiveConnection = vi.fn();

  const mockConnections = [
    {
      id: 'conn-1',
      name: 'Test Connection 1',
      color: '#ef4444',
      db_type: 'MySQL' as const,
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'test_db',
    },
    {
      id: 'conn-2',
      name: 'Test Connection 2',
      color: '#3b82f6',
      db_type: 'PostgreSQL' as const,
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'postgres_db',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useConnectionStore as any).mockReturnValue({
      connections: mockConnections,
      loadConnections: mockLoadConnections,
      deleteConnection: mockDeleteConnection,
      activeConnectionId: null,
      setActiveConnection: mockSetActiveConnection,
    });
  });

  it('renders connections with edit buttons', () => {
    render(<ConnectionList />);

    expect(screen.getByText('Test Connection 1')).toBeInTheDocument();
    expect(screen.getByText('Test Connection 2')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionList />);

    // Find the first connection
    const connection1 = screen.getByText('Test Connection 1').closest('div')?.parentElement;
    expect(connection1).toBeInTheDocument();

    // Hover to show edit button
    if (connection1) {
      await user.hover(connection1);
    }

    // Find and click edit button (pencil icon)
    const editButtons = screen.getAllByTitle('Edit Connection');
    await user.click(editButtons[0]);

    // Form should open with existing connection
    await waitFor(() => {
      expect(screen.getByTestId('connection-form')).toBeInTheDocument();
      expect(screen.getByTestId('editing-connection')).toHaveTextContent('Test Connection 1');
    });
  });

  it('opens new connection form when + New is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionList />);

    const newButton = screen.getByText('+ New');
    await user.click(newButton);

    // Form should open without existing connection
    await waitFor(() => {
      expect(screen.getByTestId('connection-form')).toBeInTheDocument();
      expect(screen.queryByTestId('editing-connection')).not.toBeInTheDocument();
    });
  });

  it('closes form and clears editing state', async () => {
    const user = userEvent.setup();
    render(<ConnectionList />);

    // Open edit form
    const editButtons = screen.getAllByTitle('Edit Connection');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('connection-form')).toBeInTheDocument();
    });

    // Close form
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    // Form should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('connection-form')).not.toBeInTheDocument();
    });
  });

  it('shows delete confirmation when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionList />);

    // Find delete button
    const deleteButtons = screen.getAllByTitle('Delete Connection');
    await user.click(deleteButtons[0]);

    // Delete confirmation should appear
    await waitFor(() => {
      expect(screen.getByText('Delete Connection?')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });
  });

  it('deletes connection when confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteConnection.mockResolvedValue(undefined);
    render(<ConnectionList />);

    // Click delete button
    const deleteButtons = screen.getAllByTitle('Delete Connection');
    await user.click(deleteButtons[0]);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Delete Connection?')).toBeInTheDocument();
    });

    const deleteConfirmButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteConfirmButton);

    // Delete should be called
    await waitFor(() => {
      expect(mockDeleteConnection).toHaveBeenCalledWith('conn-1');
    });
  });

  it('displays empty state when no connections', () => {
    (useConnectionStore as any).mockReturnValue({
      connections: [],
      loadConnections: mockLoadConnections,
      deleteConnection: mockDeleteConnection,
      activeConnectionId: null,
      setActiveConnection: mockSetActiveConnection,
    });

    render(<ConnectionList />);

    expect(screen.getByText(/No connections yet/)).toBeInTheDocument();
    expect(screen.getByText(/Click.*New.*to create one/)).toBeInTheDocument();
  });

  it('highlights active connection', () => {
    (useConnectionStore as any).mockReturnValue({
      connections: mockConnections,
      loadConnections: mockLoadConnections,
      deleteConnection: mockDeleteConnection,
      activeConnectionId: 'conn-1',
      setActiveConnection: mockSetActiveConnection,
    });

    const { container } = render(<ConnectionList />);

    // Find the connection div with the bg-blue-100 class
    const activeConnection = container.querySelector('.bg-blue-100');
    expect(activeConnection).toBeInTheDocument();
    expect(activeConnection).toHaveTextContent('Test Connection 1');
  });

  it('sets active connection when clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionList />);

    const connection2 = screen.getByText('Test Connection 2').closest('div')?.parentElement;
    if (connection2) {
      await user.click(connection2);
    }

    expect(mockSetActiveConnection).toHaveBeenCalledWith('conn-2');
  });
});
