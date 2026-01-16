import { useEffect, useState } from 'react';
import { tableApi } from '../../services/tauriApi';
import { useTabStore } from '../../store/tabStore';
import type { TableData, TableFilter } from '../../types/table';
import { SortOrder } from '../../types/table';
import AddRowModal from './AddRowModal';
import EditRowModal from './EditRowModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface TableDataViewerProps {
  connectionId: string;
  database: string;
  table: string;
}

export default function TableDataViewer({
  connectionId,
  database,
  table,
}: TableDataViewerProps) {
  const { createTableStructureTab } = useTabStore();
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined);
  const [filters] = useState<TableFilter[]>([]); // TODO: Add filter UI later

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [deletingRows, setDeletingRows] = useState<Record<string, any>[] | null>(null);

  useEffect(() => {
    loadTableData();
  }, [connectionId, database, table, page, pageSize, sortBy, sortOrder, filters]);

  const loadTableData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tableApi.getTableData({
        connection_id: connectionId,
        database,
        table,
        page,
        page_size: pageSize,
        filters: filters.length > 0 ? filters : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(result);
      setSelectedRows(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order
      if (sortOrder === SortOrder.Asc) {
        setSortOrder(SortOrder.Desc);
      } else if (sortOrder === SortOrder.Desc) {
        setSortBy(undefined);
        setSortOrder(undefined);
      } else {
        setSortOrder(SortOrder.Asc);
      }
    } else {
      setSortBy(column);
      setSortOrder(SortOrder.Asc);
    }
    setPage(0);
  };

  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data?.rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data?.rows.map((_, i) => i) || []));
    }
  };

  const handleDeleteSelected = () => {
    if (!data || selectedRows.size === 0) return;
    const rowsToDelete = Array.from(selectedRows).map(i => data.rows[i]);
    setDeletingRows(rowsToDelete);
  };

  const totalPages = data ? Math.ceil(data.total_rows / pageSize) : 0;

  return (
    <>
      <div className="h-full w-full bg-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Table Data</h2>
              <p className="text-sm text-gray-600 mt-1">
                {database}.{table}
                {data && (
                  <span className="ml-2 text-gray-500">
                    ({data.total_rows.toLocaleString()} {data.total_rows === 1 ? 'row' : 'rows'})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => createTableStructureTab(connectionId, database, table)}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Structure
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>

            {selectedRows.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete ({selectedRows.size})
              </button>
            )}

            <button
              onClick={loadTableData}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading data...</p>
            </div>
          )}

          {error && (
            <div className="m-6 bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {data && !loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === data.rows.length && data.rows.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(column)}
                      >
                        <div className="flex items-center gap-1">
                          {column}
                          {sortBy === column && (
                            <span className="text-blue-600">
                              {sortOrder === SortOrder.Asc ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={data.columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`hover:bg-gray-50 ${selectedRows.has(rowIndex) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowIndex)}
                            onChange={() => handleRowSelect(rowIndex)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        {data.columns.map((column) => (
                          <td key={column} className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {row[column] === null ? (
                              <span className="text-gray-400 italic">NULL</span>
                            ) : (
                              String(row[column])
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRow(row)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingRows([row])}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {data && !loading && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={200}>200 per page</option>
              </select>

              <span className="text-sm text-gray-600">
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.total_rows)} of {data.total_rows.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                First
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddRowModal
          connectionId={connectionId}
          database={database}
          table={table}
          columns={data?.columns || []}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadTableData}
        />
      )}

      {editingRow && (
        <EditRowModal
          connectionId={connectionId}
          database={database}
          table={table}
          columns={data?.columns || []}
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSuccess={loadTableData}
        />
      )}

      {deletingRows && (
        <DeleteConfirmModal
          connectionId={connectionId}
          database={database}
          table={table}
          rows={deletingRows}
          onClose={() => setDeletingRows(null)}
          onSuccess={loadTableData}
        />
      )}
    </>
  );
}
