import { useEffect, useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { useQueryStore } from '../../store/queryStore';
import { databaseApi } from '../../services/tauriApi';
import ConnectionList from '../ConnectionManager/ConnectionList';
import TableViewerContainer from '../TableViewer/TableViewerContainer';

export default function DatabaseExplorer() {
  const { connections, activeConnectionId, selectedDatabase, setSelectedDatabase, loadConnections } = useConnectionStore();
  const { autocompleteData, loadAutocompleteData } = useQueryStore();

  const activeConnection = connections.find(c => c.id === activeConnectionId);

  const [databases, setDatabases] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConnections, setShowConnections] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Close modal when connection is selected
  useEffect(() => {
    const handleConnectionSelected = () => {
      setShowConnections(false);
    };

    window.addEventListener('connectionSelected', handleConnectionSelected);
    return () => {
      window.removeEventListener('connectionSelected', handleConnectionSelected);
    };
  }, []);

  // Load databases when connection changes
  useEffect(() => {
    if (activeConnectionId) {
      loadDatabases();
    } else {
      setDatabases([]);
      setSelectedDatabase('');
    }
  }, [activeConnectionId]);

  // Load autocomplete data when database changes
  useEffect(() => {
    if (activeConnectionId && selectedDatabase) {
      loadAutocompleteData(activeConnectionId, selectedDatabase);
    }
  }, [activeConnectionId, selectedDatabase, loadAutocompleteData]);

  const loadDatabases = async () => {
    if (!activeConnectionId) return;

    setLoading(true);
    try {
      const dbs = await databaseApi.listDatabases(activeConnectionId);
      setDatabases(dbs);
      if (dbs.length > 0 && !selectedDatabase) {
        setSelectedDatabase(dbs[0]);
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = () => {
    if (!autocompleteData) return [];
    if (!searchQuery) return autocompleteData.tables;

    return autocompleteData.tables.filter(table =>
      table.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Database Selector */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Database
        </label>
        {activeConnectionId ? (
          <select
            value={selectedDatabase || ''}
            onChange={(e) => setSelectedDatabase(e.target.value || null)}
            disabled={loading || databases.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {databases.length === 0 && (
              <option value="">No databases found</option>
            )}
            {databases.map((db) => (
              <option key={db} value={db}>
                {db}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500 p-2 border border-gray-300 rounded-md bg-gray-50">
            No connection selected
          </div>
        )}
      </div>

      {/* Search Box */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!selectedDatabase}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedDatabase && autocompleteData ? (
          <>
            {filteredTables().length > 0 ? (
              <div className="space-y-1">
                {filteredTables().map((table) => (
                  <div
                    key={table}
                    className="px-3 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    title={table}
                    onClick={() => setSelectedTable(table)}
                  >
                    <svg
                      className="w-4 h-4 text-gray-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="truncate">{table}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                {searchQuery ? 'No tables match your search' : 'No tables found'}
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">
            {activeConnectionId
              ? 'Select a database to view tables'
              : 'Connect to a database to get started'}
          </div>
        )}
      </div>

      {/* Connection Button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => setShowConnections(true)}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-3 text-sm font-medium transition-colors"
        >
          {activeConnection ? (
            <>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: activeConnection.color }}
              />
              <span className="truncate flex-1 text-left">{activeConnection.name}</span>
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </>
          ) : (
            <>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Connection</span>
            </>
          )}
        </button>
      </div>

      {/* Connection Modal */}
      {showConnections && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowConnections(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">Manage Connections</h2>
              <button
                onClick={() => setShowConnections(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <ConnectionList />
            </div>
          </div>
        </div>
      )}

      {/* Table Viewer */}
      {selectedTable && activeConnectionId && selectedDatabase && (
        <TableViewerContainer
          connectionId={activeConnectionId}
          database={selectedDatabase}
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}
