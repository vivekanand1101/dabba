export interface TableData {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
}

export interface TableDataRequest {
  connection_id: string;
  database: string;
  table: string;
  page: number;
  page_size: number;
  filters?: TableFilter[];
  sort_by?: string;
  sort_order?: SortOrder;
}

export interface TableFilter {
  column: string;
  operator: FilterOperator;
  value: string;
}

export enum FilterOperator {
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  GreaterThanOrEqual = 'GreaterThanOrEqual',
  LessThanOrEqual = 'LessThanOrEqual',
  Like = 'Like',
  NotLike = 'NotLike',
  In = 'In',
  NotIn = 'NotIn',
  IsNull = 'IsNull',
  IsNotNull = 'IsNotNull',
}

export enum SortOrder {
  Asc = 'Asc',
  Desc = 'Desc',
}

export interface InsertRowRequest {
  connection_id: string;
  database: string;
  table: string;
  data: Record<string, any>;
}

export interface UpdateRowRequest {
  connection_id: string;
  database: string;
  table: string;
  data: Record<string, any>;
  where_clause: Record<string, any>;
}

export interface DeleteRowRequest {
  connection_id: string;
  database: string;
  table: string;
  where_clause: Record<string, any>;
}
