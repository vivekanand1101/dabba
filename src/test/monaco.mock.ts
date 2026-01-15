import { vi } from 'vitest';

// Mock Monaco Editor for tests
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn(),
      addCommand: vi.fn(() => ({ dispose: vi.fn() })),
    })),
    createModel: vi.fn(),
  },
  languages: {
    registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
    CompletionItemKind: {
      Field: 0,
      Class: 1,
      Keyword: 2,
    },
  },
  KeyCode: {
    Tab: 9,
  },
  Position: vi.fn(),
}));
