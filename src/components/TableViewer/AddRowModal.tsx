import { useState } from 'react';
import { tableApi } from '../../services/tauriApi';

interface AddRowModalProps {
  connectionId: string;
  database: string;
  table: string;
  columns: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRowModal({
  connectionId,
  database,
  table,
  columns,
  onClose,
  onSuccess,
}: AddRowModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [nullColumns, setNullColumns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: Record<string, any> = {};
      for (const column of columns) {
        if (nullColumns.has(column)) {
          data[column] = null;
        } else if (values[column] !== undefined && values[column] !== '') {
          // Try to parse as number if it looks like one
          const value = values[column];
          if (/^-?\d+$/.test(value)) {
            data[column] = parseInt(value, 10);
          } else if (/^-?\d+\.\d+$/.test(value)) {
            data[column] = parseFloat(value);
          } else {
            data[column] = value;
          }
        }
      }

      await tableApi.insertRow({
        connection_id: connectionId,
        database,
        table,
        data,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to insert row');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (column: string, value: string) => {
    setValues({ ...values, [column]: value });
    // Remove from null set if value is entered
    if (value) {
      const newNullColumns = new Set(nullColumns);
      newNullColumns.delete(column);
      setNullColumns(newNullColumns);
    }
  };

  const toggleNull = (column: string) => {
    const newNullColumns = new Set(nullColumns);
    if (nullColumns.has(column)) {
      newNullColumns.delete(column);
    } else {
      newNullColumns.add(column);
      // Clear value when setting to NULL
      const newValues = { ...values };
      delete newValues[column];
      setValues(newValues);
    }
    setNullColumns(newNullColumns);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-green-50">
          <h3 className="text-lg font-bold text-gray-900">Add New Row</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {columns.map((column) => (
              <div key={column} className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column}
                  </label>
                  <input
                    type="text"
                    value={values[column] || ''}
                    onChange={(e) => handleValueChange(column, e.target.value)}
                    disabled={nullColumns.has(column)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Enter value..."
                  />
                </div>
                <div className="pt-7">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nullColumns.has(column)}
                      onChange={() => toggleNull(column)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">NULL</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </form>

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
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Adding...' : 'Add Row'}
          </button>
        </div>
      </div>
    </div>
  );
}
