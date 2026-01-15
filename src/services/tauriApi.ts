import { invoke } from '@tauri-apps/api/core';
import type { Connection } from '../types/connection';
import type { AutocompleteData, Schema, TableSchema } from '../types/schema';
import type { QueryRequest, QueryResult } from '../types/query';
import type {
  TableData,
  TableDataRequest,
  InsertRowRequest,
  UpdateRowRequest,
  DeleteRowRequest,
} from '../types/table';

interface ConnectionApi {
  save(connection: Connection): Promise<void>;
  load(id: string): Promise<Connection | null>;
  list(): Promise<Connection[]>;
  delete(id: string): Promise<void>;
  test(connection: Connection): Promise<string>;
}

export const connectionApi: ConnectionApi = {
  save(connection: Connection): Promise<void> {
    return invoke('save_connection', { connection });
  },

  load(id: string): Promise<Connection | null> {
    return invoke('load_connection', { id });
  },

  list(): Promise<Connection[]> {
    return invoke('list_connections');
  },

  delete(id: string): Promise<void> {
    return invoke('delete_connection', { id });
  },

  test(connection: Connection): Promise<string> {
    return invoke('test_connection', { connection });
  },
};

interface SchemaApi {
  getSchema(connectionId: string): Promise<Schema>;
  getAutocompleteData(connectionId: string, database: string): Promise<AutocompleteData>;
}

export const schemaApi: SchemaApi = {
  getSchema(connectionId: string): Promise<Schema> {
    return invoke('get_schema', { connectionId });
  },

  getAutocompleteData(connectionId: string, database: string): Promise<AutocompleteData> {
    return invoke('get_autocomplete_data', { connectionId, database });
  },
};

interface QueryApi {
  execute(request: QueryRequest): Promise<QueryResult>;
}

export const queryApi: QueryApi = {
  execute(request: QueryRequest): Promise<QueryResult> {
    return invoke('execute_query', { request });
  },
};

interface DatabaseApi {
  listDatabases(connectionId: string): Promise<string[]>;
}

export const databaseApi: DatabaseApi = {
  listDatabases(connectionId: string): Promise<string[]> {
    return invoke('list_databases', { connectionId });
  },
};

interface TableApi {
  getTableStructure(connectionId: string, database: string, table: string): Promise<TableSchema>;
  getTableData(request: TableDataRequest): Promise<TableData>;
  insertRow(request: InsertRowRequest): Promise<void>;
  updateRow(request: UpdateRowRequest): Promise<number>;
  deleteRows(request: DeleteRowRequest): Promise<number>;
}

export const tableApi: TableApi = {
  getTableStructure(connectionId: string, database: string, table: string): Promise<TableSchema> {
    return invoke('get_table_structure', { connectionId, database, table });
  },

  getTableData(request: TableDataRequest): Promise<TableData> {
    return invoke('get_table_data', { request });
  },

  insertRow(request: InsertRowRequest): Promise<void> {
    return invoke('insert_table_row', { request });
  },

  updateRow(request: UpdateRowRequest): Promise<number> {
    return invoke('update_table_row', { request });
  },

  deleteRows(request: DeleteRowRequest): Promise<number> {
    return invoke('delete_table_rows', { request });
  },
};
