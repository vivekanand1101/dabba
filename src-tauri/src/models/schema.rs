use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Schema {
    pub tables: Vec<TableSchema>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableSchema {
    pub name: String,
    pub columns: Vec<ColumnSchema>,
    pub primary_keys: Vec<String>,
    pub foreign_keys: Vec<ForeignKey>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnSchema {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub default_value: Option<String>,
    pub max_length: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForeignKey {
    pub column_name: String,
    pub referenced_table: String,
    pub referenced_column: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutocompleteData {
    pub tables: Vec<String>,
    pub columns_by_table: HashMap<String, Vec<String>>,
    pub keywords: Vec<String>,
}

impl AutocompleteData {
    pub fn from_schema(schema: &Schema) -> Self {
        let tables: Vec<String> = schema.tables.iter().map(|t| t.name.clone()).collect();

        let mut columns_by_table = HashMap::new();
        for table in &schema.tables {
            let columns: Vec<String> = table.columns.iter().map(|c| c.name.clone()).collect();
            columns_by_table.insert(table.name.clone(), columns);
        }

        let keywords = vec![
            "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "OUTER",
            "ON", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "IS", "NULL",
            "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE",
            "TABLE", "DROP", "ALTER", "ADD", "COLUMN", "INDEX", "PRIMARY", "KEY",
            "FOREIGN", "REFERENCES", "AS", "ORDER", "BY", "GROUP", "HAVING",
            "LIMIT", "OFFSET", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX",
        ]
        .into_iter()
        .map(String::from)
        .collect();

        Self {
            tables,
            columns_by_table,
            keywords,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub columns: Vec<String>,
    pub rows: Vec<HashMap<String, serde_json::Value>>,
    pub total_rows: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableDataRequest {
    pub connection_id: String,
    pub database: String,
    pub table: String,
    pub page: u32,
    pub page_size: u32,
    pub filters: Option<Vec<TableFilter>>,
    pub sort_by: Option<String>,
    pub sort_order: Option<SortOrder>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableFilter {
    pub column: String,
    pub operator: FilterOperator,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FilterOperator {
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
    Like,
    NotLike,
    In,
    NotIn,
    IsNull,
    IsNotNull,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortOrder {
    Asc,
    Desc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InsertRowRequest {
    pub connection_id: String,
    pub database: String,
    pub table: String,
    pub data: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRowRequest {
    pub connection_id: String,
    pub database: String,
    pub table: String,
    pub data: HashMap<String, serde_json::Value>,
    pub where_clause: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteRowRequest {
    pub connection_id: String,
    pub database: String,
    pub table: String,
    pub where_clause: HashMap<String, serde_json::Value>,
}
