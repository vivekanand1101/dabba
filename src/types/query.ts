export interface QueryRequest {
  connection_id: string;
  sql: string;
  database?: string;
  page?: number;
  page_size?: number;
}

export interface QueryResult {
  columns: string[];
  rows: Array<Array<any>>;
  total_rows: number;
  execution_time_ms: number;
}

export interface QueryHistoryEntry {
  id: string;
  connection_id: string;
  sql: string;
  executed_at: number;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
}
