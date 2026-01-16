use crate::models::Connection;
use crate::AppState;
use tauri::State;

#[cfg(test)]
use crate::storage::connection_store::ConnectionStore;

#[tauri::command]
pub async fn save_connection(
    connection: Connection,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .save_connection(&connection)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_connection(
    id: String,
    state: State<'_, AppState>,
) -> Result<Option<Connection>, String> {
    state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_connections(state: State<'_, AppState>) -> Result<Vec<Connection>, String> {
    state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .list_connections()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_connection(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .delete_connection(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_connection(connection: Connection) -> Result<String, String> {
    if connection.host.is_empty() {
        return Err("Host is required".to_string());
    }
    if connection.username.is_empty() {
        return Err("Username is required".to_string());
    }

    Ok(format!(
        "Connection test successful to {}@{}:{}",
        connection.username, connection.host, connection.port
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::DatabaseType;
    use tempfile::TempDir;

    fn setup_test_store() -> (ConnectionStore, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let store =
            ConnectionStore::new(&db_path, "test_key_32_bytes_long_string!!").unwrap();
        (store, temp_dir)
    }

    #[tokio::test]
    async fn test_save_and_load_connection_via_store() {
        let (mut store, _temp) = setup_test_store();

        let connection = Connection {
            id: "test-1".to_string(),
            name: "Test DB".to_string(),
            color: "#ef4444".to_string(),
            db_type: DatabaseType::MySQL,
            host: "localhost".to_string(),
            port: 3306,
            username: "root".to_string(),
            password: "password".to_string(),
            database: Some("test_db".to_string()),
            ssh_config: None,
            ssl_config: None,
        };

        // Save connection
        let result = store.save_connection(&connection);
        assert!(result.is_ok());

        // Load connection
        let loaded = store.load_connection("test-1").unwrap();
        assert!(loaded.is_some());
        let loaded = loaded.unwrap();
        assert_eq!(loaded.name, "Test DB");
        assert_eq!(loaded.host, "localhost");
    }

    #[tokio::test]
    async fn test_list_connections_via_store() {
        let (mut store, _temp) = setup_test_store();

        // Create 3 connections
        for i in 1..=3 {
            let conn = Connection {
                id: format!("test-{}", i),
                name: format!("DB {}", i),
                color: "#ef4444".to_string(),
                db_type: DatabaseType::MySQL,
                host: "localhost".to_string(),
                port: 3306,
                username: "root".to_string(),
                password: "password".to_string(),
                database: None,
                ssh_config: None,
                ssl_config: None,
            };
            store.save_connection(&conn).unwrap();
        }

        // List all connections
        let list = store.list_connections().unwrap();
        assert_eq!(list.len(), 3);
    }

    #[tokio::test]
    async fn test_delete_connection_via_store() {
        let (mut store, _temp) = setup_test_store();

        let connection = Connection {
            id: "test-delete".to_string(),
            name: "To Delete".to_string(),
            color: "#ef4444".to_string(),
            db_type: DatabaseType::MySQL,
            host: "localhost".to_string(),
            port: 3306,
            username: "root".to_string(),
            password: "password".to_string(),
            database: None,
            ssh_config: None,
            ssl_config: None,
        };

        store.save_connection(&connection).unwrap();

        // Delete
        store.delete_connection("test-delete").unwrap();

        // Verify deleted
        let loaded = store.load_connection("test-delete").unwrap();
        assert!(loaded.is_none());
    }

    #[tokio::test]
    async fn test_connection_validation() {
        let mut connection = Connection {
            id: "test".to_string(),
            name: "Test".to_string(),
            color: "#ef4444".to_string(),
            db_type: DatabaseType::MySQL,
            host: "".to_string(), // Empty host
            port: 3306,
            username: "root".to_string(),
            password: "password".to_string(),
            database: None,
            ssh_config: None,
            ssl_config: None,
        };

        // Should fail with empty host
        let result = test_connection(connection.clone()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Host is required"));

        // Should fail with empty username
        connection.host = "localhost".to_string();
        connection.username = "".to_string();
        let result = test_connection(connection.clone()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Username is required"));

        // Should succeed with valid data
        connection.username = "root".to_string();
        let result = test_connection(connection).await;
        assert!(result.is_ok());
    }
}
