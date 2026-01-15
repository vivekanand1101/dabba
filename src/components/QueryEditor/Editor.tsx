import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { createSQLCompletionProvider } from './AutocompleteProvider';
import { useQueryStore } from '../../store/queryStore';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
}

export default function Editor({ value, onChange, onExecute }: EditorProps): JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { autocompleteData } = useQueryStore();

  // Initialize Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Create editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language: 'sql',
      theme: 'vs',
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
    });

    monacoEditorRef.current = editor;

    // Listen to content changes
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    return () => {
      editor.dispose();
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== value) {
      monacoEditorRef.current.setValue(value);
    }
  }, [value]);

  // Register autocomplete provider when data is loaded
  useEffect(() => {
    if (!autocompleteData) return;

    const disposable = monaco.languages.registerCompletionItemProvider(
      'sql',
      createSQLCompletionProvider(autocompleteData)
    );

    return () => {
      disposable.dispose();
    };
  }, [autocompleteData]);

  // Handle Tab key for accepting suggestions
  useEffect(() => {
    if (!monacoEditorRef.current) return;

    const editor = monacoEditorRef.current;
    editor.addCommand(
      monaco.KeyCode.Tab,
      () => {
        editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
      },
      'suggestWidgetVisible'
    );
  }, []);

  // Handle Cmd+Enter / Ctrl+Enter for executing query
  useEffect(() => {
    if (!monacoEditorRef.current) return;

    const editor = monacoEditorRef.current;

    // Add Cmd+Enter (Mac) and Ctrl+Enter (Windows/Linux)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        onExecute();
      }
    );
  }, [onExecute]);

  return (
    <div
      ref={editorRef}
      className="w-full h-full border border-gray-300 rounded"
      style={{ minHeight: '200px' }}
    />
  );
}
