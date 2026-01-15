import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import Editor from './Editor';

// Store mock commands
let mockCommands: Array<{ keybinding: number; handler: () => void }> = [];
let mockEditor: any;

// Mock Monaco Editor at the top level
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => mockEditor),
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
vi.mock('../../store/queryStore', () => ({
  useQueryStore: vi.fn(() => ({
    autocompleteData: null,
    loadAutocompleteData: vi.fn(),
  })),
}));

// This test verifies that Cmd+Enter works when focus is IN the Monaco Editor
describe('Editor - Cmd+Enter Keyboard Shortcut', () => {
  let mockOnExecute: ReturnType<typeof vi.fn>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnExecute = vi.fn();
    mockOnChange = vi.fn();
    mockCommands = [];

    // Create mock editor
    mockEditor = {
      getValue: vi.fn(() => 'SELECT * FROM users'),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn(),
      addCommand: vi.fn((keybinding, handler) => {
        // Store the command so we can verify it was registered
        mockCommands.push({ keybinding, handler });
      }),
    };
  });

  it('registers Cmd+Enter command in Monaco Editor', () => {
    render(
      <Editor
        value="SELECT * FROM users"
        onChange={mockOnChange}
        connectionId="test-conn"
        onExecute={mockOnExecute}
      />
    );

    // Wait for useEffect to run
    waitFor(() => {
      expect(mockEditor.addCommand).toHaveBeenCalled();
    });

    // Verify that a command was registered with Cmd+Enter keybinding
    const cmdEnterCommand = mockCommands.find(
      (cmd) => cmd.keybinding === (2048 | 3) // CtrlCmd | Enter
    );

    expect(cmdEnterCommand).toBeDefined();
  });

  it('calls onExecute when Cmd+Enter is pressed in editor', async () => {
    render(
      <Editor
        value="SELECT * FROM users"
        onChange={mockOnChange}
        connectionId="test-conn"
        onExecute={mockOnExecute}
      />
    );

    await waitFor(() => {
      expect(mockEditor.addCommand).toHaveBeenCalled();
    });

    // Find the Cmd+Enter command
    const cmdEnterCommand = mockCommands.find(
      (cmd) => cmd.keybinding === (2048 | 3)
    );

    expect(cmdEnterCommand).toBeDefined();

    // Simulate pressing Cmd+Enter by calling the handler
    cmdEnterCommand!.handler();

    // Verify onExecute was called
    expect(mockOnExecute).toHaveBeenCalledTimes(1);
  });

  it('updates handler when onExecute prop changes', async () => {
    const { rerender } = render(
      <Editor
        value="SELECT * FROM users"
        onChange={mockOnChange}
        connectionId="test-conn"
        onExecute={mockOnExecute}
      />
    );

    await waitFor(() => {
      expect(mockEditor.addCommand).toHaveBeenCalled();
    });

    // Count initial calls (Tab + Cmd+Enter shortcuts)
    const initialCallCount = mockEditor.addCommand.mock.calls.length;

    const newMockOnExecute = vi.fn();

    // Re-render with new onExecute
    rerender(
      <Editor
        value="SELECT * FROM users"
        onChange={mockOnChange}
        connectionId="test-conn"
        onExecute={newMockOnExecute}
      />
    );

    await waitFor(() => {
      // The command should be registered again (at least one more time for the Cmd+Enter)
      expect(mockEditor.addCommand.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    // Verify the new handler is registered
    const lastCmdEnterCommand = mockCommands.reverse().find(
      (cmd) => cmd.keybinding === (2048 | 3)
    );
    expect(lastCmdEnterCommand).toBeDefined();
    lastCmdEnterCommand!.handler();
    expect(newMockOnExecute).toHaveBeenCalledTimes(1);
  });

  it('registers command even when no connection is selected', () => {
    render(
      <Editor
        value="SELECT * FROM users"
        onChange={mockOnChange}
        connectionId={null}
        onExecute={mockOnExecute}
      />
    );

    waitFor(() => {
      expect(mockEditor.addCommand).toHaveBeenCalled();
    });

    const cmdEnterCommand = mockCommands.find(
      (cmd) => cmd.keybinding === (2048 | 3)
    );

    expect(cmdEnterCommand).toBeDefined();
  });
});
