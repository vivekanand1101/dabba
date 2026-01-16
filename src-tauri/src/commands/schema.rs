use crate::commands::AppState;
use crate::db::MySQLAdapter;
use crate::models::{AutocompleteData, Schema};
use tauri::State;

#[tauri::command]
pub async fn get_schema(connection_id: String, state: State<'_, AppState>) -> Result<Schema, String> {
    // Load connection from store
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", connection_id))?;

    // Get database name
    let database = connection
        .database
        .as_ref()
        .ok_or_else(|| "No database specified".to_string())?;

    // Create adapter and get schema
    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    let schema = adapter
        .get_schema(database)
        .await
        .map_err(|e| e.to_string())?;

    Ok(schema)
}

#[tauri::command]
pub async fn get_autocomplete_data(
    connection_id: String,
    database: String,
    state: State<'_, AppState>,
) -> Result<AutocompleteData, String> {
    // Load connection from store
    let connection = state
        .connection_store
        .lock()
        .map_err(|e| e.to_string())?
        .load_connection(&connection_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Connection not found: {}", connection_id))?;

    // Create adapter and get schema
    let adapter = MySQLAdapter::new(&connection)
        .await
        .map_err(|e| e.to_string())?;

    let schema = adapter
        .get_schema(&database)
        .await
        .map_err(|e| e.to_string())?;

    Ok(AutocompleteData::from_schema(&schema))
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_autocomplete_data_contains_keywords() {
        use crate::models::{AutocompleteData, Schema};
        let schema = Schema { tables: vec![] };
        let data = AutocompleteData::from_schema(&schema);
        assert!(!data.keywords.is_empty());
        assert!(data.keywords.contains(&"SELECT".to_string()));
        assert!(data.keywords.contains(&"FROM".to_string()));
    }
}
