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
