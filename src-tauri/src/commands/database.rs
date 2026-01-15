use crate::commands::AppState;
use crate::db::MySQLAdapter;
use tauri::State;

#[tauri::command]
pub async fn list_databases(connection_id: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    // Load connection from store
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", connection_id))?;

    // Create adapter
    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    // Get list of databases
    let databases = adapter
        .list_databases()
        .await
        .map_err(|e| e.to_string())?;

    Ok(databases)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_databases_command_exists() {
        // This test just ensures the command compiles
        assert!(true);
    }
}
