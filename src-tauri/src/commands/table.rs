use crate::commands::AppState;
use crate::db::MySQLAdapter;
use crate::models::{
    TableData, TableDataRequest, TableSchema, InsertRowRequest,
    UpdateRowRequest, DeleteRowRequest,
};
use tauri::State;

#[tauri::command]
pub async fn get_table_structure(
    connection_id: String,
    database: String,
    table: String,
    state: State<'_, AppState>,
) -> Result<TableSchema, String> {
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", connection_id))?;

    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    let schema = adapter
        .get_schema(&database)
        .await
        .map_err(|e| e.to_string())?;

    schema
        .tables
        .into_iter()
        .find(|t| t.name == table)
        .ok_or_else(|| format!("Table not found: {}", table))
}

#[tauri::command]
pub async fn get_table_data(
    request: TableDataRequest,
    state: State<'_, AppState>,
) -> Result<TableData, String> {
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&request.connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", request.connection_id))?;

    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    adapter
        .get_table_data(&request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn insert_table_row(
    request: InsertRowRequest,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&request.connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", request.connection_id))?;

    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    adapter
        .insert_row(&request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_table_row(
    request: UpdateRowRequest,
    state: State<'_, AppState>,
) -> Result<u64, String> {
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&request.connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", request.connection_id))?;

    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    adapter
        .update_row(&request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_table_rows(
    request: DeleteRowRequest,
    state: State<'_, AppState>,
) -> Result<u64, String> {
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&request.connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", request.connection_id))?;

    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    adapter
        .delete_rows(&request)
        .await
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_table_data_request_creation() {
        let request = TableDataRequest {
            connection_id: "test".to_string(),
            database: "test_db".to_string(),
            table: "users".to_string(),
            page: 0,
            page_size: 10,
            filters: None,
            sort_by: None,
            sort_order: None,
        };
        assert_eq!(request.table, "users");
        assert_eq!(request.page_size, 10);
    }

    #[test]
    fn test_insert_row_request_creation() {
        let mut data = HashMap::new();
        data.insert("name".to_string(), serde_json::Value::String("John".to_string()));
        data.insert("age".to_string(), serde_json::Value::Number(30.into()));

        let request = InsertRowRequest {
            connection_id: "test".to_string(),
            database: "test_db".to_string(),
            table: "users".to_string(),
            data,
        };
        assert_eq!(request.table, "users");
        assert_eq!(request.data.len(), 2);
    }

    #[test]
    fn test_update_row_request_creation() {
        let mut data = HashMap::new();
        data.insert("name".to_string(), serde_json::Value::String("Jane".to_string()));

        let mut where_clause = HashMap::new();
        where_clause.insert("id".to_string(), serde_json::Value::Number(1.into()));

        let request = UpdateRowRequest {
            connection_id: "test".to_string(),
            database: "test_db".to_string(),
            table: "users".to_string(),
            data,
            where_clause,
        };
        assert_eq!(request.table, "users");
        assert_eq!(request.data.len(), 1);
        assert_eq!(request.where_clause.len(), 1);
    }

    #[test]
    fn test_delete_row_request_creation() {
        let mut where_clause = HashMap::new();
        where_clause.insert("id".to_string(), serde_json::Value::Number(1.into()));

        let request = DeleteRowRequest {
            connection_id: "test".to_string(),
            database: "test_db".to_string(),
            table: "users".to_string(),
            where_clause,
        };
        assert_eq!(request.table, "users");
        assert_eq!(request.where_clause.len(), 1);
    }
}
