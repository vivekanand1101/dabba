export interface AutocompleteData {
  tables: string[];
  columns_by_table: Record<string, string[]>;
  keywords: string[];
}

export interface ColumnSchema {
  name: string;
  data_type: string;
  is_nullable: boolean;
  default_value?: string;
  max_length?: number;
}

export interface ForeignKey {
  column_name: string;
  referenced_table: string;
  referenced_column: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primary_keys: string[];
  foreign_keys: ForeignKey[];
}

export interface Schema {
  tables: TableSchema[];
}
