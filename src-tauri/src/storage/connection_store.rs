use crate::models::{Connection, DatabaseType};
use crate::storage::encryption::{decode_encrypted, decrypt, encode_encrypted, encrypt};
use rusqlite::{params, Connection as SqliteConnection, Row};
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum StoreError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Connection not found: {0}")]
    NotFound(String),
}

pub type Result<T> = std::result::Result<T, StoreError>;

/// Raw data extracted from a database row before decryption/parsing
struct RawConnectionRow {
    id: String,
    name: String,
    color: String,
    db_type_str: String,
    host: String,
    port: u16,
    username: String,
    encoded_password: String,
    database: Option<String>,
    ssh_config_json: Option<String>,
    ssl_config_json: Option<String>,
}

impl RawConnectionRow {
    fn from_row(row: &Row<'_>) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            db_type_str: row.get(3)?,
            host: row.get(4)?,
            port: row.get(5)?,
            username: row.get(6)?,
            encoded_password: row.get(7)?,
            database: row.get(8)?,
            ssh_config_json: row.get(9)?,
            ssl_config_json: row.get(10)?,
        })
    }

    fn into_connection(self, encryption_key: &[u8; 32]) -> Result<Connection> {
        let encrypted_password = decode_encrypted(&self.encoded_password)
            .map_err(|e| StoreError::Encryption(e.to_string()))?;
        let password = decrypt(&encrypted_password, encryption_key)
            .map_err(|e| StoreError::Encryption(e.to_string()))?;

        let db_type = parse_database_type(&self.db_type_str)?;

        let ssh_config = self
            .ssh_config_json
            .map(|json| serde_json::from_str(&json))
            .transpose()
            .map_err(|e| StoreError::Serialization(e.to_string()))?;

        let ssl_config = self
            .ssl_config_json
            .map(|json| serde_json::from_str(&json))
            .transpose()
            .map_err(|e| StoreError::Serialization(e.to_string()))?;

        Ok(Connection {
            id: self.id,
            name: self.name,
            color: self.color,
            db_type,
            host: self.host,
            port: self.port,
            username: self.username,
            password,
            database: self.database,
            ssh_config,
            ssl_config,
        })
    }
}

fn parse_database_type(s: &str) -> Result<DatabaseType> {
    s.parse()
        .map_err(|e: String| StoreError::Serialization(e))
}

pub struct ConnectionStore {
    db: SqliteConnection,
    encryption_key: [u8; 32],
}

impl ConnectionStore {
    /// Create a new connection store with the given database path and encryption key
    pub fn new(db_path: &Path, encryption_key: &str) -> Result<Self> {
        let db = SqliteConnection::open(db_path)?;

        // Create encryption key from string (in production, derive this properly)
        let mut key = [0u8; 32];
        let key_bytes = encryption_key.as_bytes();
        let copy_len = std::cmp::min(key_bytes.len(), 32);
        key[..copy_len].copy_from_slice(&key_bytes[..copy_len]);

        // Initialize database schema
        db.execute(
            "CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL,
                db_type TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                database TEXT,
                ssh_config TEXT,
                ssl_config TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )",
            [],
        )?;

        Ok(Self {
            db,
            encryption_key: key,
        })
    }

    /// Check if the store is initialized
    pub fn is_initialized(&self) -> bool {
        self.db
            .query_row(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='connections'",
                [],
                |_| Ok(()),
            )
            .is_ok()
    }

    /// Save a connection to the database
    pub fn save_connection(&mut self, connection: &Connection) -> Result<()> {
        let encrypted_password = encrypt(&connection.password, &self.encryption_key)
            .map_err(|e| StoreError::Encryption(e.to_string()))?;
        let encoded_password = encode_encrypted(&encrypted_password);

        let ssh_config_json = connection
            .ssh_config
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|e| StoreError::Serialization(e.to_string()))?;

        let ssl_config_json = connection
            .ssl_config
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|e| StoreError::Serialization(e.to_string()))?;

        self.db.execute(
            "INSERT OR REPLACE INTO connections
            (id, name, color, db_type, host, port, username, password, database, ssh_config, ssl_config)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                connection.id,
                connection.name,
                connection.color,
                format!("{:?}", connection.db_type),
                connection.host,
                connection.port,
                connection.username,
                encoded_password,
                connection.database,
                ssh_config_json,
                ssl_config_json,
            ],
        )?;

        Ok(())
    }

    /// Load a connection by ID
    pub fn load_connection(&self, id: &str) -> Result<Option<Connection>> {
        let mut stmt = self.db.prepare(
            "SELECT id, name, color, db_type, host, port, username, password, database, ssh_config, ssl_config
             FROM connections WHERE id = ?1",
        )?;

        match stmt.query_row(params![id], RawConnectionRow::from_row) {
            Ok(raw) => Ok(Some(raw.into_connection(&self.encryption_key)?)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(StoreError::Database(e)),
        }
    }

    /// List all connections
    pub fn list_connections(&self) -> Result<Vec<Connection>> {
        let mut stmt = self.db.prepare(
            "SELECT id, name, color, db_type, host, port, username, password, database, ssh_config, ssl_config
             FROM connections ORDER BY name",
        )?;

        let raw_connections: Vec<RawConnectionRow> = stmt
            .query_map([], RawConnectionRow::from_row)?
            .collect::<rusqlite::Result<Vec<_>>>()?;

        raw_connections
            .into_iter()
            .map(|raw| raw.into_connection(&self.encryption_key))
            .collect()
    }

    /// Delete a connection
    pub fn delete_connection(&mut self, id: &str) -> Result<()> {
        self.db
            .execute("DELETE FROM connections WHERE id = ?1", params![id])?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::DatabaseType;
    use tempfile::TempDir;

    fn setup_test_db() -> (ConnectionStore, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let store =
            ConnectionStore::new(&db_path, "test_key_32_bytes_long_string!!").unwrap();
        (store, temp_dir)
    }

    #[test]
    fn test_create_connection_store() {
        let (store, _temp) = setup_test_db();
        // Should create database without errors
        assert!(store.is_initialized());
    }

    #[test]
    fn test_save_and_load_connection() {
        let (mut store, _temp) = setup_test_db();

        let conn = Connection {
            id: "test-id".to_string(),
            name: "Test Connection".to_string(),
            color: "#ef4444".to_string(),
            db_type: DatabaseType::MySQL,
            host: "localhost".to_string(),
            port: 3306,
            username: "root".to_string(),
            password: "secret_password".to_string(),
            database: Some("test_db".to_string()),
            ssh_config: None,
            ssl_config: None,
        };

        // Save
        store.save_connection(&conn).expect("save failed");

        // Load
        let loaded = store
            .load_connection("test-id")
            .expect("load failed")
            .expect("not found");

        assert_eq!(loaded.id, conn.id);
        assert_eq!(loaded.name, conn.name);
        assert_eq!(loaded.password, conn.password); // Should be decrypted
    }

    #[test]
    fn test_password_encrypted_in_database() {
        let (mut store, temp) = setup_test_db();

        let conn = Connection {
            id: "test-id".to_string(),
            name: "Test".to_string(),
            color: "#ef4444".to_string(),
            db_type: DatabaseType::MySQL,
            host: "localhost".to_string(),
            port: 3306,
            username: "root".to_string(),
            password: "my_secret_password".to_string(),
            database: Some("test_db".to_string()),
            ssh_config: None,
            ssl_config: None,
        };

        store.save_connection(&conn).unwrap();

        // Read raw database to verify encryption
        let db_path = temp.path().join("test.db");
        let raw_conn = SqliteConnection::open(&db_path).unwrap();
        let password_in_db: String = raw_conn
            .query_row(
                "SELECT password FROM connections WHERE id = ?",
                ["test-id"],
                |row| row.get(0),
            )
            .unwrap();

        // Password should NOT be plaintext
        assert_ne!(password_in_db, "my_secret_password");
        assert!(password_in_db.len() > 20); // Encrypted data is longer
    }

    #[test]
    fn test_list_all_connections() {
        let (mut store, _temp) = setup_test_db();

        // Save 3 connections
        for i in 1..=3 {
            let conn = Connection {
                id: format!("conn-{}", i),
                name: format!("Connection {}", i),
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

        let all = store.list_connections().unwrap();
        assert_eq!(all.len(), 3);
    }

    #[test]
    fn test_delete_connection() {
        let (mut store, _temp) = setup_test_db();

        let conn = Connection {
            id: "test-id".to_string(),
            name: "Test".to_string(),
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

        store.delete_connection("test-id").expect("delete failed");

        let result = store.load_connection("test-id").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_update_connection() {
        let (mut store, _temp) = setup_test_db();

        let mut conn = Connection {
            id: "test-id".to_string(),
            name: "Original Name".to_string(),
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

        conn.name = "Updated Name".to_string();
        conn.password = "new_password".to_string();
        store.save_connection(&conn).unwrap();

        let loaded = store.load_connection("test-id").unwrap().unwrap();
        assert_eq!(loaded.name, "Updated Name");
        assert_eq!(loaded.password, "new_password");
    }
}
