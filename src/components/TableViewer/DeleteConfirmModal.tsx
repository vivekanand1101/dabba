import { useState } from 'react';
import { tableApi } from '../../services/tauriApi';

interface DeleteConfirmModalProps {
  connectionId: string;
  database: string;
  table: string;
  rows: Record<string, any>[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({
  connectionId,
  database,
  table,
  rows,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      let totalDeleted = 0;

      // Delete each row individually
      for (const row of rows) {
        const whereClause: Record<string, any> = {};
        // Use all columns as where clause to ensure exact match
        for (const [key, value] of Object.entries(row)) {
          whereClause[key] = value;
        }

        const rowsAffected = await tableApi.deleteRows({
          connection_id: connectionId,
          database,
          table,
          where_clause: whereClause,
        });

        totalDeleted += rowsAffected;
      }

      if (totalDeleted === 0) {
        setError('No rows were deleted. They may have been already removed.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rows');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This action cannot be undone.
              </p>

              {rows.length <= 5 && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-3 max-h-40 overflow-auto">
                  <p className="text-xs font-medium text-gray-600 mb-2">Rows to be deleted:</p>
                  <div className="space-y-1">
                    {rows.map((row, index) => (
                      <div key={index} className="text-xs text-gray-700 font-mono bg-white p-2 rounded border border-gray-200">
                        {JSON.stringify(row)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Deleting...' : `Delete ${rows.length} ${rows.length === 1 ? 'Row' : 'Rows'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
