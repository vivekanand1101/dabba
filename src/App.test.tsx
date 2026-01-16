import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useTabStore } from './store/tabStore';

// Mock Monaco Editor
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn(),
      addCommand: vi.fn(),
    })),
  },
  KeyCode: {
    Tab: 2,
    Enter: 3,
  },
  KeyMod: {
    CtrlCmd: 2048,
  },
  languages: {
    registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
  },
}));

// Mock stores
vi.mock('./store/connectionStore', () => ({
  useConnectionStore: vi.fn(() => ({
    connections: [],
    activeConnectionId: null,
    loadConnections: vi.fn(),
    deleteConnection: vi.fn(),
    setActiveConnection: vi.fn(),
    selectedDatabase: null,
    setSelectedDatabase: vi.fn(),
  })),
}));

vi.mock('./store/queryStore', () => ({
  useQueryStore: vi.fn(() => ({
    currentResult: null,
    isExecuting: false,
    error: null,
    executeQuery: vi.fn(),
    clearError: vi.fn(),
    loadAutocompleteData: vi.fn(),
    autocompleteData: null,
  })),
}));

describe('App Shell', () => {
  beforeEach(() => {
    // Reset tab store state before each test
    const store = useTabStore.getState();
    // Close all tabs except one
    while (store.tabs.length > 1) {
      store.closeTab(store.tabs[store.tabs.length - 1].id);
    }
  });
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('creates new tab when Cmd+T is pressed', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially 1 tab
    expect(screen.getAllByRole('tab')).toHaveLength(1);

    // Press Cmd+T
    await user.keyboard('{Meta>}t{/Meta}');

    // Should have 2 tabs
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('closes tab when close button clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create 2 tabs first
    await user.keyboard('{Meta>}t{/Meta}');
    expect(screen.getAllByRole('tab')).toHaveLength(2);

    // Click close on first tab
    const closeButtons = screen.getAllByRole('button', { name: /close tab/i });
    await user.click(closeButtons[0]);

    // Should have 1 tab
    expect(screen.getAllByRole('tab')).toHaveLength(1);
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create 2nd tab
    await user.keyboard('{Meta>}t{/Meta}');

    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true'); // 2nd tab active

    await user.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true'); // 1st tab now active
  });
});
