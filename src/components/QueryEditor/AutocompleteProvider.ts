import * as monaco from 'monaco-editor';
import type { AutocompleteData } from '../../types/schema';

export function createSQLCompletionProvider(
  autocompleteData: AutocompleteData
): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['.', ' '],

    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      // Check if we're after a table name with a dot (for column suggestions)
      const dotMatch = textUntilPosition.match(/(\w+)\.(\w*)$/);
      if (dotMatch) {
        const tableName = dotMatch[1];
        const columns = autocompleteData.columns_by_table[tableName] || [];

        return {
          suggestions: columns.map((col) => ({
            label: col,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: col,
            range,
            detail: `Column from ${tableName}`,
          })),
        };
      }

      // Check context for table suggestions
      // Match "FROM", "FROM ", "FROM t", etc. - works even when deleting
      const fromMatch = textUntilPosition.match(/\bFROM\s*\w*$/i);
      const joinMatch = textUntilPosition.match(/\bJOIN\s*\w*$/i);
      const intoMatch = textUntilPosition.match(/\bINTO\s*\w*$/i);

      if (fromMatch || joinMatch || intoMatch) {
        return {
          suggestions: autocompleteData.tables.map((table) => ({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table,
            range,
            detail: 'Table',
          })),
        };
      }

      // General suggestions: keywords, tables, and all columns
      const suggestions: monaco.languages.CompletionItem[] = [];

      // Add SQL keywords
      autocompleteData.keywords.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
        });
      });

      // Add tables
      autocompleteData.tables.forEach((table) => {
        suggestions.push({
          label: table,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: table,
          range,
          detail: 'Table',
        });
      });

      // Add all columns (with table context)
      Object.entries(autocompleteData.columns_by_table).forEach(([table, columns]) => {
        columns.forEach((col) => {
          suggestions.push({
            label: col,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: col,
            range,
            detail: `${table}.${col}`,
          });
        });
      });

      return { suggestions };
    },
  };
}
