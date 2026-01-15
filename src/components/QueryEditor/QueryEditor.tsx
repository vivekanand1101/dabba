import { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from './Editor';
import { useQueryStore } from '../../store/queryStore';
import { useConnectionStore } from '../../store/connectionStore';

export default function QueryEditor(): JSX.Element {
  const [sql, setSql] = useState('SELECT * FROM ');
  const { activeConnectionId, selectedDatabase } = useConnectionStore();
  const { currentResult, isExecuting, error, executeQuery, cancelQuery, clearError } = useQueryStore();

  const handleExecute = useCallback(async () => {
    if (!activeConnectionId) {
      alert('Please select a connection first');
      return;
    }

    if (!selectedDatabase) {
      alert('Please select a database first');
      return;
    }

    if (!sql.trim()) {
      alert('Please enter a SQL query');
      return;
    }

    await executeQuery(activeConnectionId, sql, selectedDatabase);
  }, [activeConnectionId, selectedDatabase, sql, executeQuery]);

  return (
    <div className="h-full">
      <PanelGroup direction="vertical">
        {/* Editor Section */}
        <Panel defaultSize={40} minSize={20} maxSize={80}>
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Query Editor</h2>
              <div className="flex gap-2">
                {isExecuting ? (
                  <button
                    onClick={cancelQuery}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                    title="Cancel Query"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={handleExecute}
                    disabled={!activeConnectionId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Execute (Cmd+Enter)
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                value={sql}
                onChange={setSql}
                onExecute={handleExecute}
              />
            </div>

            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="h-1 bg-gray-300 hover:bg-blue-500 transition-colors cursor-row-resize" />

        {/* Results Section */}
        <Panel defaultSize={60}>
          <div className="h-full overflow-auto p-4">
        {currentResult ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Results</h3>
              <div className="text-sm text-gray-600">
                {currentResult.total_rows} {currentResult.total_rows === 1 ? 'row' : 'rows'} in{' '}
                {currentResult.execution_time_ms}ms
              </div>
            </div>

            {currentResult.total_rows === 0 ? (
              <div className="text-center text-gray-500 py-8">No results</div>
            ) : (
              <div className="overflow-x-auto border border-gray-300 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {currentResult.columns.map((col, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentResult.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {cell === null ? (
                              <span className="text-gray-400 italic">NULL</span>
                            ) : typeof cell === 'object' ? (
                              JSON.stringify(cell)
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {activeConnectionId
              ? 'Write a SQL query and press Execute (Cmd+Enter)'
              : 'Select a connection from the sidebar to start querying'}
          </div>
        )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
