// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod error;
mod models;
mod storage;

use storage::connection_store::ConnectionStore;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub connection_store: Mutex<ConnectionStore>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Get the app data directory
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");

            let db_path = app_dir.join("connections.db");

            // TODO: In production, this should be derived from a user-provided master password
            // For now, use a fixed encryption key
            let encryption_key = "dbclient_default_key_32bytes!";

            let connection_store = ConnectionStore::new(&db_path, encryption_key)
                .expect("Failed to initialize connection store");

            app.manage(AppState {
                connection_store: Mutex::new(connection_store),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_connection,
            commands::load_connection,
            commands::list_connections,
            commands::delete_connection,
            commands::test_connection,
            commands::list_databases,
            commands::get_schema,
            commands::get_autocomplete_data,
            commands::execute_query,
            commands::get_table_structure,
            commands::get_table_data,
            commands::insert_table_row,
            commands::update_table_row,
            commands::delete_table_rows,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
