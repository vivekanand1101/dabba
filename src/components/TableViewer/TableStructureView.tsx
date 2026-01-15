import { useEffect, useState } from 'react';
import { tableApi } from '../../services/tauriApi';
import type { TableSchema } from '../../types/schema';

interface TableStructureViewProps {
  connectionId: string;
  database: string;
  table: string;
  onClose: () => void;
}

export default function TableStructureView({
  connectionId,
  database,
  table,
  onClose,
}: TableStructureViewProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTableStructure();
  }, [connectionId, database, table]);

  const loadTableStructure = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tableApi.getTableStructure(connectionId, database, table);
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table structure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Table Structure</h2>
            <p className="text-sm text-gray-600 mt-1">
              {database}.{table}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-gray-600">Loading table structure...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
              <p className="font-medium">Error loading table structure</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {schema && !loading && !error && (
            <div className="space-y-6">
              {/* Columns Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Columns</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nullable
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Default
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Max Length
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Key
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schema.columns.map((column) => {
                        const isPrimaryKey = schema.primary_keys.includes(column.name);
                        const foreignKey = schema.foreign_keys.find(fk => fk.column_name === column.name);

                        return (
                          <tr key={column.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {column.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {column.data_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {column.is_nullable ? (
                                <span className="text-green-600">✓ Yes</span>
                              ) : (
                                <span className="text-red-600">✗ No</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {column.default_value || (
                                <span className="text-gray-400 italic">None</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {column.max_length || (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-col gap-1">
                                {isPrimaryKey && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    PRIMARY
                                  </span>
                                )}
                                {foreignKey && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                                    title={`References ${foreignKey.referenced_table}.${foreignKey.referenced_column}`}>
                                    FOREIGN
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Foreign Keys Details */}
              {schema.foreign_keys.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Foreign Key Relationships</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <ul className="space-y-2">
                      {schema.foreign_keys.map((fk, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{fk.column_name}</span>
                          <span className="mx-2 text-gray-500">→</span>
                          <span className="font-medium">{fk.referenced_table}.{fk.referenced_column}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
