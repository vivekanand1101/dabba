import { describe, it, expect } from 'vitest';
import { createSQLCompletionProvider } from './AutocompleteProvider';
import type { AutocompleteData } from '../../types/schema';

// Mock monaco types
const mockRange = {
  startLineNumber: 1,
  startColumn: 1,
  endLineNumber: 1,
  endColumn: 10,
};

const mockAutocompleteData: AutocompleteData = {
  tables: ['users', 'posts', 'comments'],
  columns_by_table: {
    users: ['id', 'name', 'email'],
    posts: ['id', 'user_id', 'title', 'content'],
    comments: ['id', 'post_id', 'user_id', 'text'],
  },
  keywords: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INSERT', 'UPDATE', 'DELETE'],
};

function createMockModel(text: string, cursorColumn: number) {
  return {
    getValueInRange: () => text,
    getWordUntilPosition: () => ({
      word: '',
      startColumn: cursorColumn,
      endColumn: cursorColumn,
    }),
  };
}

function createMockPosition(column: number) {
  return {
    lineNumber: 1,
    column,
  };
}

describe('AutocompleteProvider - Backspace Support', () => {
  const provider = createSQLCompletionProvider(mockAutocompleteData);

  it('shows table suggestions after typing "FROM "', () => {
    const model = createMockModel('SELECT * FROM ', 14);
    const position = createMockPosition(14);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);
    expect(result?.suggestions.map(s => s.label)).toContain('users');
    expect(result?.suggestions.map(s => s.label)).toContain('posts');
  });

  it('continues showing table suggestions when typing partial table name "FROM u"', () => {
    const model = createMockModel('SELECT * FROM u', 15);
    const position = createMockPosition(15);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);
    expect(result?.suggestions.map(s => s.label)).toContain('users');
  });

  it('continues showing table suggestions after backspace from "FROM use" to "FROM us"', () => {
    const model = createMockModel('SELECT * FROM us', 16);
    const position = createMockPosition(16);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);
    expect(result?.suggestions.map(s => s.label)).toContain('users');
  });

  it('continues showing table suggestions after backspace from "FROM us" to "FROM u"', () => {
    const model = createMockModel('SELECT * FROM u', 15);
    const position = createMockPosition(15);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);
    expect(result?.suggestions.map(s => s.label)).toContain('users');
  });

  it('continues showing table suggestions after deleting all the way back to "FROM "', () => {
    const model = createMockModel('SELECT * FROM ', 14);
    const position = createMockPosition(14);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);
    expect(result?.suggestions.map(s => s.label)).toContain('users');
  });

  it('shows table suggestions even without trailing space "FROM"', () => {
    const model = createMockModel('SELECT * FROM', 13);
    const position = createMockPosition(13);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);
    expect(result?.suggestions.map(s => s.label)).toContain('users');
  });

  it('shows table suggestions after JOIN keyword', () => {
    const model = createMockModel('SELECT * FROM users JOIN ', 25);
    const position = createMockPosition(25);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.map(s => s.label)).toContain('posts');
  });

  it('shows table suggestions after INTO keyword', () => {
    const model = createMockModel('INSERT INTO ', 12);
    const position = createMockPosition(12);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.map(s => s.label)).toContain('users');
  });

  it('shows column suggestions after table.', () => {
    const model = createMockModel('SELECT users.', 13);
    const position = createMockPosition(13);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.map(s => s.label)).toContain('id');
    expect(result?.suggestions.map(s => s.label)).toContain('name');
    expect(result?.suggestions.map(s => s.label)).toContain('email');
  });

  it('shows column suggestions when typing partial column name "users.n"', () => {
    const model = createMockModel('SELECT users.n', 14);
    const position = createMockPosition(14);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.map(s => s.label)).toContain('name');
  });

  it('provides general suggestions (keywords, tables, columns) in default context', () => {
    const model = createMockModel('SELECT ', 7);
    const position = createMockPosition(7);

    const result = provider.provideCompletionItems(model as any, position as any, {} as any, {} as any);

    expect(result?.suggestions).toBeDefined();
    expect(result?.suggestions.length).toBeGreaterThan(0);

    // Should have keywords
    expect(result?.suggestions.map(s => s.label)).toContain('SELECT');
    expect(result?.suggestions.map(s => s.label)).toContain('WHERE');

    // Should have tables
    expect(result?.suggestions.map(s => s.label)).toContain('users');

    // Should have columns
    expect(result?.suggestions.map(s => s.label)).toContain('id');
  });
});
