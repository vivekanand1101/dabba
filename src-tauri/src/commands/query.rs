use crate::commands::AppState;
use crate::db::MySQLAdapter;
use crate::models::{QueryRequest, QueryResult};
use tauri::State;

#[tauri::command]
pub async fn execute_query(
    request: QueryRequest,
    state: State<'_, AppState>,
) -> Result<QueryResult, String> {
    // Load connection from store
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&request.connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", request.connection_id))?;

    // Create adapter
    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    // Execute query with optional pagination and database selection
    let result = if let (Some(page), Some(page_size)) = (request.page, request.page_size) {
        adapter
            .execute_paginated(&request.sql, page, page_size)
            .await
            .map_err(|e| e.to_string())?
    } else {
        adapter
            .execute_query_with_database(&request.sql, request.database.as_deref())
            .await
            .map_err(|e| e.to_string())?
    };

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_request_creation() {
        let request = QueryRequest {
            connection_id: "test".to_string(),
            sql: "SELECT 1".to_string(),
            database: Some("test_db".to_string()),
            page: None,
            page_size: None,
        };
        assert_eq!(request.connection_id, "test");
        assert_eq!(request.sql, "SELECT 1");
    }

    #[test]
    fn test_query_request_with_pagination() {
        let request = QueryRequest {
            connection_id: "test".to_string(),
            sql: "SELECT * FROM users".to_string(),
            database: Some("test_db".to_string()),
            page: Some(0),
            page_size: Some(10),
        };
        assert_eq!(request.page, Some(0));
        assert_eq!(request.page_size, Some(10));
    }
}
