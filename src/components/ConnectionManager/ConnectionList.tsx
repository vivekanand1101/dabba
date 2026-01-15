import { useEffect, useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import ConnectionForm from './ConnectionForm';
import type { Connection } from '../../types/connection';

export default function ConnectionList() {
  const { connections, loadConnections, deleteConnection, activeConnectionId, setActiveConnection } =
    useConnectionStore();
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleDelete = async (id: string) => {
    try {
      await deleteConnection(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const handleConnectionSelect = (id: string) => {
    setActiveConnection(id);
    // Notify parent to close modal if needed
    const event = new CustomEvent('connectionSelected');
    window.dispatchEvent(event);
  };

  return (
    <>
      <div className="bg-gray-50 border-r border-gray-200 flex flex-col h-full w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Connections</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              title="New Connection"
            >
              + New
            </button>
          </div>
        </div>

        {/* Connection List */}
        <div className="flex-1 overflow-y-auto">
          {connections.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No connections yet.
              <br />
              Click "+ New" to create one.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className={`group relative p-3 rounded-md cursor-pointer transition-colors ${
                    activeConnectionId === conn.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                  onClick={() => handleConnectionSelect(conn.id)}
                >
                  {/* Color Indicator */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                    style={{ backgroundColor: conn.color }}
                  />

                  <div className="ml-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{conn.name}</h3>
                        <p className="text-xs text-gray-600 truncate">
                          {conn.username}@{conn.host}:{conn.port}
                        </p>
                        {conn.database && (
                          <p className="text-xs text-gray-500 truncate">{conn.database}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="opacity-0 group-hover:opacity-100 ml-2 flex gap-1 transition-opacity">
                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConnection(conn);
                            setShowForm(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Connection"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(conn.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Connection"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Database Type Badge */}
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                      {conn.db_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connection Form Modal */}
      {showForm && (
        <ConnectionForm
          onClose={() => {
            setShowForm(false);
            setEditingConnection(undefined);
          }}
          existingConnection={editingConnection}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Delete Connection?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this connection? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
