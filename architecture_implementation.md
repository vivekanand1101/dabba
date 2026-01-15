# Cross-Platform SQL Database Client - Implementation Plan

## Executive Summary

Building a production-ready SQL database client in Rust using **Tauri 2.0** (React + Rust backend). The application will focus on MySQL 8.0+ initially with PostgreSQL support planned next. Key differentiator: **comprehensive search functionality** that combines Beekeeper's powerful query editor with Adminer's superior search and filtering capabilities.

## Technology Stack

### Frontend
- **Framework**: React + TypeScript
- **UI Components**: shadcn/ui (Refactoring UI principles, clarity-focused)
- **Code Editor**: Monaco Editor with custom SQL autocomplete
- **Data Grid**: AG Grid React (transaction-based editing)
- **Layout**: react-resizable-panels for resizable panes
- **State**: Zustand (lightweight, simple)
- **Styling**: Tailwind CSS

### Backend (Rust)
- **Framework**: Tauri 2.0
- **Database Driver**: sqlx (async, compile-time checked)
- **Async Runtime**: tokio
- **Local Storage**: rusqlite + SQLCipher (AES-256 encryption)
- **SSH**: russh + russh-keys
- **Encryption**: aes-gcm
- **Serialization**: serde + serde_json

## Core Features (MVP)

### 1. Connection Management
- Save/load multiple connections with names
- **Per-connection color coding** (light theme) for visual distinction
- Security: SSH tunneling, SSL/TLS with custom certs, basic auth
- AES-256 encrypted credential storage in local SQLite database
- Connection pooling with health checks

### 2. Query Editor
- SQL syntax highlighting
- **Inline autocomplete** (critical):
  - Tab key to accept suggestion
  - Column names, table names, views from selected database
  - SQL keywords
  - Context-aware (e.g., columns after table name)
- Query history (last 100 queries)
- Saved queries with names
- VSCode-style shortcuts (Cmd/Ctrl+Enter to run, Cmd/Ctrl+S to save, Cmd/Ctrl+T new tab)

### 3. Comprehensive Search (Major Differentiator)
Four integrated search modes:
1. **Quick filter**: Simple text filter on current table
2. **WHERE clause builder**: GUI with dropdowns for column/operator/value (AND/OR logic)
3. **Full-text search**: MySQL MATCH AGAINST across database
4. **Schema search**: Find tables/columns/views by name

Plus traditional **freehand SQL query editor** for power users.

### 4. Table View & Staged Editing
- AG Grid with responsive data grid
- **Staged changes model**: Edit multiple cells, review, then apply as single transaction
- Validation before apply:
  - Type validation (numbers, dates, etc.)
  - Foreign key awareness (dropdown with valid FK values)
  - Constraint warnings (NOT NULL, UNIQUE, etc.)
- Only edit tables with primary keys
- Row operations: add, delete, clone
- Pagination: limit + offset (100/1000/5000 configurable)

### 5. Export & Responsiveness
- SQL dumps (INSERT statements) - priority format
- Export query results or table data
- **Fully responsive layout**:
  - Resizable panels (query/results)
  - Column resizing in grid
  - Horizontal/vertical scrolling
  - Works on all laptop sizes

### 6. Tabs & Layout
- Multiple tabs in single window
- Each tab has independent connection
- Connection color coding visible in tab indicators

## Project Structure

```
dbclient/
├── src/                                # React frontend
│   ├── main.tsx
│   ├── App.tsx                         # Tab management, main layout
│   ├── components/
│   │   ├── ConnectionManager/          # Connection forms, SSH/SSL config
│   │   ├── QueryEditor/                # Monaco editor + autocomplete
│   │   ├── SearchInterface/            # 4 search modes (differentiator)
│   │   ├── DataGrid/                   # AG Grid + staged changes
│   │   ├── Layout/                     # Tabs, split panes, status bar
│   │   └── Export/                     # Export dialog
│   ├── store/                          # Zustand stores
│   │   ├── connectionStore.ts
│   │   ├── queryStore.ts
│   │   ├── tabStore.ts
│   │   └── editStore.ts                # Staged changes tracking
│   └── services/
│       └── tauriApi.ts                 # Typed Tauri command wrappers
│
├── src-tauri/                          # Rust backend
│   └── src/
│       ├── main.rs                     # Entry point, state initialization
│       ├── commands/                   # Tauri command handlers
│       │   ├── connection.rs           # CRUD for connections
│       │   ├── query.rs                # Execute queries
│       │   ├── schema.rs               # Introspection for autocomplete
│       │   ├── edit.rs                 # Apply staged changes
│       │   └── export.rs               # SQL export
│       ├── db/                         # Database abstraction
│       │   ├── connection_pool.rs
│       │   ├── mysql_adapter.rs
│       │   ├── postgres_adapter.rs     # Phase 9
│       │   ├── traits.rs               # DatabaseAdapter trait
│       │   └── query_builder.rs
│       ├── storage/                    # Local encrypted SQLite
│       │   ├── connection_store.rs
│       │   ├── query_history.rs
│       │   ├── saved_queries.rs
│       │   └── encryption.rs           # AES-256-GCM
│       ├── ssh/                        # SSH tunnel implementation
│       │   ├── tunnel.rs
│       │   └── key_manager.rs
│       ├── security/
│       │   ├── credential_manager.rs
│       │   └── ssl_config.rs
│       ├── search/                     # Search engine
│       │   ├── fulltext.rs             # MATCH AGAINST
│       │   ├── where_builder.rs        # GUI query builder
│       │   └── schema_search.rs
│       ├── models/                     # Data models
│       │   ├── connection.rs
│       │   ├── query.rs
│       │   └── schema.rs
│       └── error.rs                    # Error types
```

## Critical Files (Implementation Priority)

### Phase 1: Foundation
1. **src-tauri/src/main.rs** - Tauri entry point, register commands, initialize state
2. **src-tauri/src/storage/encryption.rs** - AES-256-GCM credential encryption
3. **src-tauri/src/db/traits.rs** - DatabaseAdapter trait (abstraction for MySQL/PostgreSQL)
4. **src/App.tsx** - Main app shell with tab management
5. **src-tauri/src/models/connection.rs** - Connection data model with SSH/SSL configs

### Phase 2: Connection Management
6. **src-tauri/src/storage/connection_store.rs** - CRUD for encrypted connections
7. **src-tauri/src/commands/connection.rs** - Tauri commands (save/load/test connections)
8. **src-tauri/src/ssh/tunnel.rs** - SSH port forwarding implementation
9. **src-tauri/src/db/connection_pool.rs** - Connection pooling with health checks
10. **src/components/ConnectionManager/ConnectionForm.tsx** - Connection UI with color picker

### Phase 3: Query Editor
11. **src-tauri/src/db/mysql_adapter.rs** - MySQL implementation of DatabaseAdapter
12. **src-tauri/src/commands/schema.rs** - Schema introspection for autocomplete
13. **src/components/QueryEditor/Editor.tsx** - Monaco editor wrapper
14. **src/components/QueryEditor/AutocompleteProvider.ts** - SQL autocomplete logic
15. **src-tauri/src/commands/query.rs** - Query execution with pagination

### Phase 4: Search Interface (Differentiator)
16. **src-tauri/src/search/where_builder.rs** - Convert GUI conditions to WHERE clause
17. **src-tauri/src/search/fulltext.rs** - MySQL MATCH AGAINST implementation
18. **src-tauri/src/search/schema_search.rs** - Search table/column names
19. **src/components/SearchInterface/WhereClauseBuilder.tsx** - Visual query builder
20. **src/components/SearchInterface/FullTextSearch.tsx** - FTS UI

### Phase 5: Data Grid & Editing
21. **src/components/DataGrid/ResultGrid.tsx** - AG Grid wrapper with staged editing
22. **src/store/editStore.ts** - Track staged changes (added/updated/deleted rows)
23. **src-tauri/src/commands/edit.rs** - Apply changes as transaction with validation
24. **src/components/DataGrid/StagedChangesPanel.tsx** - Review changes before apply

### Phase 6: Export & Polish
25. **src-tauri/src/commands/export.rs** - Stream SQL exports to file
26. **src/components/Layout/SplitPane.tsx** - Resizable panels
27. **src/styles/globals.css** - Connection color coding, Refactoring UI principles

## Implementation Phases

### Phase 1: Project Setup (Week 1-2)
- Initialize Tauri 2.0 project with React + TypeScript
- Set up SQLCipher database for local storage
- Implement AES-256-GCM encryption for credentials
- Basic UI shell: tabs, sidebar, main area, status bar
- Connection color coding CSS

### Phase 2: Connection Management (Week 2-3)
- Connection CRUD with encrypted storage
- SSH tunnel implementation (russh)
- SSL/TLS configuration support
- Connection pool management
- Test connection functionality
- Connection form UI with color picker

### Phase 3: Query Editor with Autocomplete (Week 3-4)
- Monaco Editor integration
- Schema introspection (INFORMATION_SCHEMA queries)
- **Inline autocomplete provider**:
  - Tab key acceptance
  - Context-aware suggestions
  - Keywords, tables, columns, views
- Query execution with pagination
- Query history and saved queries

### Phase 4: Search Interface (Week 4-5)
**Major differentiator - implement all four modes:**
- Quick filter on current table
- WHERE clause builder (GUI with dropdowns)
- Full-text search (MATCH AGAINST)
- Schema search (find tables/columns)

### Phase 5: Table View & Staged Editing (Week 5-6)
- AG Grid integration with custom cell editors
- Staged changes tracking (Zustand store)
- Validation system:
  - Type validation
  - Foreign key dropdown with valid values
  - Constraint warnings (NOT NULL, UNIQUE)
- Apply changes as single transaction
- Row operations (add/delete/clone)

### Phase 6: Export & Pagination (Week 6-7)
- SQL export (streaming for large datasets)
- Pagination controls (100/1000/5000 page sizes)
- Export dialog UI

### Phase 7: Responsive Layout & Polish (Week 7-8)
- Resizable panels (react-resizable-panels)
- Column resizing in grid
- Responsive breakpoints for all laptop sizes
- Refactoring UI principles:
  - Clear hierarchy (font weight/size)
  - Consistent spacing scale
  - Connection color coding throughout
  - Data clarity (PK bold, FK underlined)

### Phase 8: Testing & Security (Week 8-9)
- Backend unit tests (encryption, query building)
- Frontend component tests
- E2E tests (Playwright)
- Security audit:
  - SQL injection prevention (parameterized queries only)
  - Credential encryption validation
  - SSH tunnel security
- Performance testing (10k, 100k rows)

### Phase 9: PostgreSQL Support (Week 9-10)
- PostgreSQL adapter implementing DatabaseAdapter trait
- Handle PostgreSQL-specific types (arrays, JSONB)
- PostgreSQL full-text search (tsvector/tsquery)
- Abstract database differences in traits.rs

## Database Abstraction Design

```rust
// src-tauri/src/db/traits.rs
#[async_trait]
pub trait DatabaseAdapter: Send + Sync {
    async fn execute_query(&self, sql: &str, params: &[Value]) -> Result<QueryResult>;
    async fn execute_paginated(&self, sql: &str, page: u32, page_size: u32) -> Result<QueryResult>;
    async fn get_schema(&self, database: &str) -> Result<Schema>;
    async fn get_autocomplete_data(&self, database: &str) -> Result<AutocompleteData>;
    async fn get_table_info(&self, table: &str) -> Result<TableInfo>;
    async fn get_foreign_keys(&self, table: &str) -> Result<Vec<ForeignKey>>;
    async fn apply_changes(&self, table: &str, changes: &TableChanges) -> Result<()>;
    async fn export_as_sql(&self, query: &str, output_path: &str) -> Result<ExportProgress>;
    async fn fulltext_search(&self, database: &str, tables: &[String], term: &str) -> Result<Vec<SearchResult>>;
}

pub enum DatabaseType {
    MySQL,
    PostgreSQL,
}

impl DatabaseType {
    pub fn fulltext_query(&self, table: &str, columns: &[&str]) -> String {
        match self {
            DatabaseType::MySQL => {
                format!("SELECT *, MATCH({}) AGAINST(? IN NATURAL LANGUAGE MODE) AS score FROM {} WHERE MATCH({}) AGAINST(? IN NATURAL LANGUAGE MODE) ORDER BY score DESC",
                    columns.join(", "), table, columns.join(", "))
            }
            DatabaseType::PostgreSQL => {
                format!("SELECT *, ts_rank(to_tsvector('english', {}), query) AS score FROM {}, to_tsquery('english', ?) query WHERE to_tsvector('english', {}) @@ query ORDER BY score DESC",
                    columns.join(" || ' ' || "), table, columns.join(" || ' ' || "))
            }
        }
    }
}
```

## Security Architecture

### Credential Encryption Flow
```
User Master Password (first run)
    ↓ Argon2 with salt
Encryption Key (32 bytes)
    ↓ Store in OS keychain (keyring crate)
Per-Connection Password Encryption
    ↓ AES-256-GCM with random nonce
Encrypted Password in SQLCipher DB
```

### SQL Injection Prevention
- **Always** use sqlx parameterized queries
- Validate table/column names against INFORMATION_SCHEMA
- Whitelist operators in WHERE clause builder
- Never concatenate user input into SQL

### SSH Tunnel Security
- Support SSH Agent, password, or private key auth
- Validate host keys (prevent MITM)
- Encrypted private key support (passphrase prompt)
- Automatic tunnel reconnection on failure

## Design System (Refactoring UI Principles)

### Visual Hierarchy
- Use font weight (400/600/700) and size, not just color
- Primary text: 700 weight, large size
- Secondary text: 600 weight, medium size
- Tertiary text: 400 weight, small size

### Connection Color Coding
```css
:root {
  --color-connection-1: #ef4444; /* red */
  --color-connection-2: #f59e0b; /* amber */
  --color-connection-3: #10b981; /* emerald */
  --color-connection-4: #3b82f6; /* blue */
  --color-connection-5: #8b5cf6; /* violet */
}

/* Applied to: tab indicators, connection selector, status bar, query editor border */
.connection-indicator {
  border-left: 4px solid var(--connection-color);
}
```

### Data Grid Styling
- Primary keys: bold (600 weight)
- Foreign keys: underline dotted with blue color
- Edited cells: yellow background (#fef3c7)
- Deleted rows: strikethrough + 50% opacity
- Added rows: green left border

### Spacing Scale
- xs: 0.25rem, sm: 0.5rem, md: 1rem, lg: 1.5rem, xl: 2rem
- Consistent application throughout UI

## Key Technical Decisions

### 1. Tauri over Electron
- Smaller bundle size (<600KB vs 50MB+)
- Lower memory usage (no Chromium overhead)
- Native performance with Rust backend
- Cross-platform: macOS, Windows, Linux

### 2. sqlx over diesel
- Async with tokio integration
- Compile-time query verification
- Multi-database support (MySQL, PostgreSQL)
- Connection pooling built-in

### 3. AG Grid over TanStack Table
- Transaction-based editing (applyTransaction API)
- Excellent performance with large datasets
- Rich features (virtual scrolling, custom editors)
- Mature, production-ready

### 4. Monaco Editor over CodeMirror
- Industry standard (VSCode editor)
- Excellent TypeScript support
- Easy autocomplete integration
- Rich language features

## Comprehensive Testing Strategy

**CRITICAL RULE**: All tests for a phase MUST pass before proceeding to the next phase. No exceptions.

### Test Setup & Tooling

#### Backend Testing (Rust)
```toml
# Add to src-tauri/Cargo.toml [dev-dependencies]
tokio-test = "0.4"
mockall = "0.12"
serial_test = "3.0"
tempfile = "3.8"
```

**Test Database Setup**:
- Use Docker container for test MySQL instance
- Create `test_helpers.rs` with database fixture utilities
- Seed test data before each test suite

#### Frontend Testing (React)
```json
// Add to package.json devDependencies
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "playwright": "^1.40.0"
}
```

#### Test Database Docker Setup
```bash
# Create docker-compose.test.yml
docker run -d \
  -e MYSQL_ROOT_PASSWORD=test_password \
  -e MYSQL_DATABASE=test_db \
  -p 3307:3306 \
  mysql:8.0
```

---

## Phase 1 Testing: Project Setup & Encryption

### Test 1.1: Encryption Module Tests
**File**: `src-tauri/src/storage/encryption.rs`

**Unit Tests to Write**:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_key_produces_32_bytes() {
        let key = generate_key();
        assert_eq!(key.len(), 32);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = generate_key();
        let plaintext = "sensitive_password_123";

        let encrypted = encrypt(plaintext, &key).expect("encryption failed");
        assert_ne!(encrypted, plaintext.as_bytes());

        let decrypted = decrypt(&encrypted, &key).expect("decryption failed");
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_decrypt_with_wrong_key_fails() {
        let key1 = generate_key();
        let key2 = generate_key();
        let plaintext = "password";

        let encrypted = encrypt(plaintext, &key1).unwrap();
        let result = decrypt(&encrypted, &key2);

        assert!(result.is_err());
    }

    #[test]
    fn test_encrypt_produces_different_ciphertext_each_time() {
        let key = generate_key();
        let plaintext = "password";

        let encrypted1 = encrypt(plaintext, &key).unwrap();
        let encrypted2 = encrypt(plaintext, &key).unwrap();

        // Different nonces should produce different ciphertexts
        assert_ne!(encrypted1, encrypted2);

        // But both should decrypt to same plaintext
        assert_eq!(decrypt(&encrypted1, &key).unwrap(), plaintext);
        assert_eq!(decrypt(&encrypted2, &key).unwrap(), plaintext);
    }

    #[test]
    fn test_key_derivation_from_password() {
        let password = "user_master_password";
        let salt = b"random_salt_12345678"; // 20 bytes minimum

        let key1 = derive_key_from_password(password, salt).unwrap();
        let key2 = derive_key_from_password(password, salt).unwrap();

        // Same password + salt = same key
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);
    }

    #[test]
    fn test_different_salt_produces_different_key() {
        let password = "password";
        let salt1 = b"salt1_12345678901234";
        let salt2 = b"salt2_12345678901234";

        let key1 = derive_key_from_password(password, salt1).unwrap();
        let key2 = derive_key_from_password(password, salt2).unwrap();

        assert_ne!(key1, key2);
    }
}
```

**Pass Criteria**: All 6 tests pass. Run: `cargo test --package dbclient encryption`

**DO NOT PROCEED** until these tests pass.

---

### Test 1.2: Local Storage (SQLCipher) Tests
**File**: `src-tauri/src/storage/connection_store.rs`

**Unit Tests to Write**:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_test_db() -> (ConnectionStore, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let store = ConnectionStore::new(&db_path, "test_key_32_bytes_long_string!!").unwrap();
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
        let loaded = store.load_connection("test-id").expect("load failed").expect("not found");

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
            password: "my_secret_password".to_string(),
            // ... other fields
        };

        store.save_connection(&conn).unwrap();

        // Read raw database to verify encryption
        let db_path = temp.path().join("test.db");
        let raw_conn = rusqlite::Connection::open(&db_path).unwrap();
        let password_in_db: String = raw_conn
            .query_row("SELECT password FROM connections WHERE id = ?", ["test-id"], |row| row.get(0))
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
                // ... other fields
            };
            store.save_connection(&conn).unwrap();
        }

        let all = store.list_connections().unwrap();
        assert_eq!(all.len(), 3);
    }

    #[test]
    fn test_delete_connection() {
        let (mut store, _temp) = setup_test_db();

        let conn = Connection { id: "test-id".to_string(), /* ... */ };
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
            // ...
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
```

**Pass Criteria**: All 7 tests pass. Run: `cargo test --package dbclient connection_store`

**DO NOT PROCEED** until these tests pass.

---

### Test 1.3: Frontend App Shell Tests
**File**: `src/App.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Shell', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('creates new tab when Cmd+T is pressed', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially 1 tab
    expect(screen.getAllByRole('tab')).toHaveLength(1);

    // Press Cmd+T
    await user.keyboard('{Meta>}t{/Meta}');

    // Should have 2 tabs
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('closes tab when close button clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create 2 tabs
    await user.keyboard('{Meta>}t{/Meta}');
    expect(screen.getAllByRole('tab')).toHaveLength(2);

    // Click close on first tab
    const closeButtons = screen.getAllByRole('button', { name: /close tab/i });
    await user.click(closeButtons[0]);

    // Should have 1 tab
    expect(screen.getAllByRole('tab')).toHaveLength(1);
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('{Meta>}t{/Meta}'); // Create 2nd tab

    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true'); // 2nd tab active

    await user.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true'); // 1st tab now active
  });
});
```

**Pass Criteria**: All 4 tests pass. Run: `npm test -- App.test.tsx`

**DO NOT PROCEED** until Phase 1 tests pass.

---

## Phase 2 Testing: Connection Management

### Test 2.1: Database Adapter Trait Tests
**File**: `src-tauri/src/db/mysql_adapter.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serial_test::serial;

    // Helper to create test database connection
    async fn test_pool() -> Pool<MySql> {
        sqlx::mysql::MySqlPoolOptions::new()
            .max_connections(5)
            .connect("mysql://root:test_password@localhost:3307/test_db")
            .await
            .expect("Failed to connect to test database")
    }

    #[tokio::test]
    #[serial]
    async fn test_execute_simple_query() {
        let pool = test_pool().await;
        let adapter = MySqlAdapter::new(pool);

        let result = adapter.execute_query("SELECT 1 AS num", &[]).await.unwrap();

        assert_eq!(result.rows.len(), 1);
        assert_eq!(result.columns.len(), 1);
        assert_eq!(result.columns[0].name, "num");
    }

    #[tokio::test]
    #[serial]
    async fn test_execute_parameterized_query() {
        let pool = test_pool().await;
        let adapter = MySqlAdapter::new(pool);

        // Setup: create test table
        sqlx::query("CREATE TABLE IF NOT EXISTS test_users (id INT, name VARCHAR(50))")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO test_users VALUES (1, 'Alice'), (2, 'Bob')")
            .execute(&adapter.pool).await.unwrap();

        let result = adapter
            .execute_query("SELECT * FROM test_users WHERE id = ?", &[Value::Int(1)])
            .await
            .unwrap();

        assert_eq!(result.rows.len(), 1);
        assert_eq!(result.rows[0].get("name"), Some(&Value::String("Alice".to_string())));

        // Cleanup
        sqlx::query("DROP TABLE test_users").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_get_schema_returns_tables() {
        let pool = test_pool().await;
        let adapter = MySqlAdapter::new(pool);

        // Create test table
        sqlx::query("CREATE TABLE IF NOT EXISTS test_schema (id INT)")
            .execute(&adapter.pool).await.unwrap();

        let schema = adapter.get_schema("test_db").await.unwrap();

        assert!(schema.tables.iter().any(|t| t.name == "test_schema"));

        // Cleanup
        sqlx::query("DROP TABLE test_schema").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_get_autocomplete_data() {
        let pool = test_pool().await;
        let adapter = MySqlAdapter::new(pool);

        // Create test table with columns
        sqlx::query("CREATE TABLE IF NOT EXISTS test_autocomplete (id INT, name VARCHAR(50), email VARCHAR(100))")
            .execute(&adapter.pool).await.unwrap();

        let data = adapter.get_autocomplete_data("test_db").await.unwrap();

        assert!(data.tables.contains(&"test_autocomplete".to_string()));
        assert!(data.columns_by_table.contains_key("test_autocomplete"));

        let columns = &data.columns_by_table["test_autocomplete"];
        assert!(columns.contains(&"id".to_string()));
        assert!(columns.contains(&"name".to_string()));
        assert!(columns.contains(&"email".to_string()));

        // Cleanup
        sqlx::query("DROP TABLE test_autocomplete").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_get_foreign_keys() {
        let pool = test_pool().await;
        let adapter = MySqlAdapter::new(pool);

        // Create tables with foreign key
        sqlx::query("CREATE TABLE IF NOT EXISTS test_parent (id INT PRIMARY KEY)")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("CREATE TABLE IF NOT EXISTS test_child (id INT PRIMARY KEY, parent_id INT, FOREIGN KEY (parent_id) REFERENCES test_parent(id))")
            .execute(&adapter.pool).await.unwrap();

        let fks = adapter.get_foreign_keys("test_child").await.unwrap();

        assert_eq!(fks.len(), 1);
        assert_eq!(fks[0].column, "parent_id");
        assert_eq!(fks[0].referenced_table, "test_parent");
        assert_eq!(fks[0].referenced_column, "id");

        // Cleanup
        sqlx::query("DROP TABLE test_child").execute(&adapter.pool).await.unwrap();
        sqlx::query("DROP TABLE test_parent").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_sql_injection_prevention() {
        let pool = test_pool().await;
        let adapter = MySqlAdapter::new(pool);

        // Attempt SQL injection via parameter
        let malicious_input = "1 OR 1=1; DROP TABLE users; --";

        // This should treat the input as a literal value, not SQL
        let result = adapter
            .execute_query("SELECT * FROM information_schema.tables WHERE table_name = ?", &[Value::String(malicious_input.to_string())])
            .await;

        // Should succeed but return no results (table doesn't exist)
        assert!(result.is_ok());
        assert_eq!(result.unwrap().rows.len(), 0);

        // Verify no tables were dropped
        let tables: Vec<(String,)> = sqlx::query_as("SHOW TABLES")
            .fetch_all(&adapter.pool)
            .await
            .unwrap();
        assert!(!tables.is_empty()); // Database still has tables
    }
}
```

**Pass Criteria**: All 6 tests pass. Run: `cargo test --package dbclient mysql_adapter`

**DO NOT PROCEED** until these tests pass.

---

### Test 2.2: SSH Tunnel Tests
**File**: `src-tauri/src/ssh/tunnel.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires SSH server setup
    async fn test_ssh_tunnel_connection() {
        let config = SSHConfig {
            host: "localhost".to_string(),
            port: 22,
            username: "test_user".to_string(),
            auth: SSHAuth::Password("test_password".to_string()),
        };

        let tunnel = SSHTunnel::new(config, "localhost".to_string(), 3306, 13306).await;

        assert!(tunnel.is_ok());
        let tunnel = tunnel.unwrap();

        // Verify local port is listening
        assert!(tunnel.is_connected());

        // Cleanup
        tunnel.close().await.unwrap();
    }

    #[tokio::test]
    #[ignore]
    async fn test_ssh_tunnel_with_invalid_credentials() {
        let config = SSHConfig {
            host: "localhost".to_string(),
            port: 22,
            username: "invalid_user".to_string(),
            auth: SSHAuth::Password("wrong_password".to_string()),
        };

        let result = SSHTunnel::new(config, "localhost".to_string(), 3306, 13306).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("authentication"));
    }

    #[test]
    fn test_ssh_private_key_parsing() {
        let pem_key = r#"-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
...
-----END OPENSSH PRIVATE KEY-----"#;

        let result = parse_private_key(pem_key);
        assert!(result.is_ok());
    }
}
```

**Pass Criteria**: Non-ignored tests pass. Ignored tests documented for manual testing.

**DO NOT PROCEED** until these tests pass.

---

### Test 2.3: Connection Form UI Tests
**File**: `src/components/ConnectionManager/ConnectionForm.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionForm from './ConnectionForm';

describe('ConnectionForm', () => {
  it('renders all required fields', () => {
    render(<ConnectionForm onSave={vi.fn()} />);

    expect(screen.getByLabelText(/connection name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/database/i)).toBeInTheDocument();
  });

  it('renders color picker for connection color', () => {
    render(<ConnectionForm onSave={vi.fn()} />);

    expect(screen.getByLabelText(/connection color/i)).toBeInTheDocument();
  });

  it('shows SSH configuration when SSH toggle is enabled', async () => {
    const user = userEvent.setup();
    render(<ConnectionForm onSave={vi.fn()} />);

    const sshToggle = screen.getByLabelText(/use ssh tunnel/i);
    await user.click(sshToggle);

    expect(screen.getByLabelText(/ssh host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ssh port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ssh username/i)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ConnectionForm onSave={onSave} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show validation errors
    expect(screen.getByText(/connection name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/host is required/i)).toBeInTheDocument();

    // Should not call onSave
    expect(onSave).not.toHaveCalled();
  });

  it('calls onSave with form data when valid', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ConnectionForm onSave={onSave} />);

    // Fill form
    await user.type(screen.getByLabelText(/connection name/i), 'My Database');
    await user.type(screen.getByLabelText(/host/i), 'localhost');
    await user.type(screen.getByLabelText(/port/i), '3306');
    await user.type(screen.getByLabelText(/username/i), 'root');
    await user.type(screen.getByLabelText(/password/i), 'password');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'My Database',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
    }));
  });

  it('allows color selection', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ConnectionForm onSave={onSave} />);

    const colorPicker = screen.getByLabelText(/connection color/i);
    await user.click(colorPicker);

    // Select red color
    const redOption = screen.getByTestId('color-option-red');
    await user.click(redOption);

    // Fill other required fields...
    // ...

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      color: '#ef4444',
    }));
  });
});
```

**Pass Criteria**: All 6 tests pass. Run: `npm test -- ConnectionForm.test.tsx`

**DO NOT PROCEED** until Phase 2 tests pass.

---

## Phase 3 Testing: Query Editor & Autocomplete

### Test 3.1: Autocomplete Provider Tests
**File**: `src/components/QueryEditor/AutocompleteProvider.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import * as monaco from 'monaco-editor';
import { createSQLCompletionProvider } from './AutocompleteProvider';

describe('SQL Autocomplete Provider', () => {
  const mockAutocompleteData = {
    tables: ['users', 'orders', 'products'],
    columnsByTable: {
      users: ['id', 'name', 'email', 'created_at'],
      orders: ['id', 'user_id', 'product_id', 'quantity'],
      products: ['id', 'name', 'price'],
    },
    keywords: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INSERT', 'UPDATE', 'DELETE'],
  };

  it('suggests tables after SELECT * FROM', () => {
    const provider = createSQLCompletionProvider(mockAutocompleteData);
    const model = monaco.editor.createModel('SELECT * FROM ', 'sql');
    const position = new monaco.Position(1, 15); // After "FROM "

    const result = provider.provideCompletionItems(model, position, {} as any, {} as any);

    expect(result.suggestions).toHaveLength(10); // 3 tables + 7 keywords
    expect(result.suggestions.some(s => s.label === 'users')).toBe(true);
    expect(result.suggestions.some(s => s.label === 'orders')).toBe(true);
  });

  it('suggests columns after table name with dot', () => {
    const provider = createSQLCompletionProvider(mockAutocompleteData);
    const model = monaco.editor.createModel('SELECT users.', 'sql');
    const position = new monaco.Position(1, 14); // After "users."

    const result = provider.provideCompletionItems(model, position, {} as any, {} as any);

    expect(result.suggestions).toHaveLength(4); // 4 columns in users table
    expect(result.suggestions.map(s => s.label)).toEqual(['id', 'name', 'email', 'created_at']);
  });

  it('suggests SQL keywords at start of line', () => {
    const provider = createSQLCompletionProvider(mockAutocompleteData);
    const model = monaco.editor.createModel('', 'sql');
    const position = new monaco.Position(1, 1);

    const result = provider.provideCompletionItems(model, position, {} as any, {} as any);

    expect(result.suggestions.some(s => s.label === 'SELECT')).toBe(true);
    expect(result.suggestions.some(s => s.label === 'INSERT')).toBe(true);
    expect(result.suggestions.some(s => s.label === 'UPDATE')).toBe(true);
  });

  it('filters suggestions based on typed text', () => {
    const provider = createSQLCompletionProvider(mockAutocompleteData);
    const model = monaco.editor.createModel('SELECT * FROM us', 'sql');
    const position = new monaco.Position(1, 17); // After "us"

    const result = provider.provideCompletionItems(model, position, {} as any, {} as any);

    // Should prioritize "users" over other suggestions
    expect(result.suggestions[0].label).toBe('users');
  });

  it('suggests columns after WHERE clause', () => {
    const provider = createSQLCompletionProvider(mockAutocompleteData);
    const model = monaco.editor.createModel('SELECT * FROM users WHERE ', 'sql');
    const position = new monaco.Position(1, 27); // After "WHERE "

    const result = provider.provideCompletionItems(model, position, {} as any, {} as any);

    // Should suggest columns from users table
    expect(result.suggestions.some(s => s.label === 'id')).toBe(true);
    expect(result.suggestions.some(s => s.label === 'name')).toBe(true);
  });
});
```

**Pass Criteria**: All 5 tests pass. Run: `npm test -- AutocompleteProvider.test.ts`

---

### Test 3.2: Query Execution Tests
**File**: `src-tauri/src/commands/query.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_helpers::*;

    #[tokio::test]
    async fn test_execute_select_query() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;

        let result = execute_query(
            conn_id.clone(),
            "SELECT 1 AS num, 'hello' AS text".to_string(),
            state.clone(),
        ).await;

        assert!(result.is_ok());
        let result = result.unwrap();
        assert_eq!(result.rows.len(), 1);
        assert_eq!(result.columns.len(), 2);
    }

    #[tokio::test]
    async fn test_execute_invalid_query_returns_error() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;

        let result = execute_query(
            conn_id.clone(),
            "SELECT * FROM nonexistent_table_xyz".to_string(),
            state.clone(),
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Table") || result.unwrap_err().contains("doesn't exist"));
    }

    #[tokio::test]
    async fn test_execute_paginated_query() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;

        // Create table with 100 rows
        let adapter = state.get_adapter(&conn_id).await.unwrap();
        sqlx::query("CREATE TABLE test_pagination (id INT)")
            .execute(&adapter.pool).await.unwrap();
        for i in 1..=100 {
            sqlx::query(&format!("INSERT INTO test_pagination VALUES ({})", i))
                .execute(&adapter.pool).await.unwrap();
        }

        // Query first page (10 rows)
        let result = execute_query_paginated(
            conn_id.clone(),
            "SELECT * FROM test_pagination".to_string(),
            0, // page 0
            10, // 10 rows per page
            state.clone(),
        ).await.unwrap();

        assert_eq!(result.rows.len(), 10);
        assert_eq!(result.total_count, 100);
        assert_eq!(result.page, 0);

        // Query second page
        let result2 = execute_query_paginated(
            conn_id.clone(),
            "SELECT * FROM test_pagination".to_string(),
            1, // page 1
            10,
            state.clone(),
        ).await.unwrap();

        assert_eq!(result2.rows.len(), 10);
        assert_eq!(result2.page, 1);

        // Verify different rows
        assert_ne!(result.rows[0], result2.rows[0]);
    }

    #[tokio::test]
    async fn test_query_history_saved() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;

        let query = "SELECT * FROM users WHERE id = 1";
        execute_query(conn_id.clone(), query.to_string(), state.clone()).await.ok();

        // Check history
        let history = state.storage.get_query_history(&conn_id, 10).await.unwrap();

        assert!(history.iter().any(|h| h.query == query));
    }
}
```

**Pass Criteria**: All 4 tests pass. Run: `cargo test --package dbclient query`

**DO NOT PROCEED** until Phase 3 tests pass.

---

## Phase 4 Testing: Search Interface

### Test 4.1: WHERE Clause Builder Tests
**File**: `src-tauri/src/search/where_builder.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_equality_condition() {
        let condition = Condition {
            column: "name".to_string(),
            operator: Operator::Equals,
            value: Value::String("Alice".to_string()),
        };

        let clause = build_where_clause(&[condition]);

        assert_eq!(clause, "WHERE name = 'Alice'");
    }

    #[test]
    fn test_multiple_and_conditions() {
        let conditions = vec![
            Condition {
                column: "age".to_string(),
                operator: Operator::GreaterThan,
                value: Value::Int(18),
            },
            Condition {
                column: "status".to_string(),
                operator: Operator::Equals,
                value: Value::String("active".to_string()),
            },
        ];

        let clause = build_where_clause_with_logic(&conditions, LogicOperator::And);

        assert_eq!(clause, "WHERE age > 18 AND status = 'active'");
    }

    #[test]
    fn test_like_operator() {
        let condition = Condition {
            column: "email".to_string(),
            operator: Operator::Like,
            value: Value::String("%@gmail.com".to_string()),
        };

        let clause = build_where_clause(&[condition]);

        assert_eq!(clause, "WHERE email LIKE '%@gmail.com'");
    }

    #[test]
    fn test_in_operator() {
        let condition = Condition {
            column: "status".to_string(),
            operator: Operator::In,
            value: Value::Array(vec![
                Value::String("active".to_string()),
                Value::String("pending".to_string()),
            ]),
        };

        let clause = build_where_clause(&[condition]);

        assert_eq!(clause, "WHERE status IN ('active', 'pending')");
    }

    #[test]
    fn test_null_value_handling() {
        let condition = Condition {
            column: "deleted_at".to_string(),
            operator: Operator::IsNull,
            value: Value::Null,
        };

        let clause = build_where_clause(&[condition]);

        assert_eq!(clause, "WHERE deleted_at IS NULL");
    }

    #[test]
    fn test_sql_injection_prevention_in_values() {
        let condition = Condition {
            column: "name".to_string(),
            operator: Operator::Equals,
            value: Value::String("'; DROP TABLE users; --".to_string()),
        };

        let clause = build_where_clause(&[condition]);

        // Should escape single quotes
        assert!(clause.contains("\\'")||clause.contains("''"));
        assert!(!clause.contains("DROP TABLE"));
    }

    #[test]
    fn test_column_name_validation() {
        let condition = Condition {
            column: "id; DROP TABLE users;".to_string(),
            operator: Operator::Equals,
            value: Value::Int(1),
        };

        let result = validate_condition(&condition);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid column name"));
    }

    #[test]
    fn test_complex_nested_conditions() {
        // (age > 18 AND status = 'active') OR (role = 'admin')
        let group1 = ConditionGroup {
            conditions: vec![
                Condition { column: "age".to_string(), operator: Operator::GreaterThan, value: Value::Int(18) },
                Condition { column: "status".to_string(), operator: Operator::Equals, value: Value::String("active".to_string()) },
            ],
            logic: LogicOperator::And,
        };

        let group2 = ConditionGroup {
            conditions: vec![
                Condition { column: "role".to_string(), operator: Operator::Equals, value: Value::String("admin".to_string()) },
            ],
            logic: LogicOperator::And,
        };

        let clause = build_where_clause_with_groups(&[group1, group2], LogicOperator::Or);

        assert_eq!(clause, "WHERE (age > 18 AND status = 'active') OR (role = 'admin')");
    }
}
```

**Pass Criteria**: All 8 tests pass. Run: `cargo test --package dbclient where_builder`

---

### Test 4.2: Full-Text Search Tests
**File**: `src-tauri/src/search/fulltext.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_helpers::*;

    #[tokio::test]
    #[serial]
    async fn test_fulltext_search_mysql() {
        let adapter = test_mysql_adapter().await;

        // Create table with FULLTEXT index
        sqlx::query("CREATE TABLE articles (id INT, title VARCHAR(200), content TEXT, FULLTEXT(title, content))")
            .execute(&adapter.pool).await.unwrap();

        sqlx::query("INSERT INTO articles VALUES (1, 'Rust Programming', 'Rust is a systems programming language')")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO articles VALUES (2, 'Python Tutorial', 'Python is great for beginners')")
            .execute(&adapter.pool).await.unwrap();

        // Search for "Rust"
        let results = adapter.fulltext_search("test_db", &["articles".to_string()], "Rust").await.unwrap();

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].table, "articles");
        assert!(results[0].relevance_score > 0.0);

        sqlx::query("DROP TABLE articles").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    async fn test_fulltext_search_no_results() {
        let adapter = test_mysql_adapter().await;

        sqlx::query("CREATE TABLE articles (id INT, title VARCHAR(200), FULLTEXT(title))")
            .execute(&adapter.pool).await.unwrap();

        let results = adapter.fulltext_search("test_db", &["articles".to_string()], "nonexistent").await.unwrap();

        assert_eq!(results.len(), 0);

        sqlx::query("DROP TABLE articles").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    async fn test_fulltext_search_multiple_tables() {
        let adapter = test_mysql_adapter().await;

        sqlx::query("CREATE TABLE posts (id INT, content TEXT, FULLTEXT(content))")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("CREATE TABLE comments (id INT, text TEXT, FULLTEXT(text))")
            .execute(&adapter.pool).await.unwrap();

        sqlx::query("INSERT INTO posts VALUES (1, 'Rust is awesome')").execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO comments VALUES (1, 'I love Rust too')").execute(&adapter.pool).await.unwrap();

        let results = adapter.fulltext_search("test_db", &["posts".to_string(), "comments".to_string()], "Rust").await.unwrap();

        assert_eq!(results.len(), 2);
        assert!(results.iter().any(|r| r.table == "posts"));
        assert!(results.iter().any(|r| r.table == "comments"));

        sqlx::query("DROP TABLE posts").execute(&adapter.pool).await.unwrap();
        sqlx::query("DROP TABLE comments").execute(&adapter.pool).await.unwrap();
    }
}
```

**Pass Criteria**: All 3 tests pass. Run: `cargo test --package dbclient fulltext`

**DO NOT PROCEED** until Phase 4 tests pass.

---

## Phase 5 Testing: Table Editing & Staged Changes

### Test 5.1: Staged Changes Store Tests
**File**: `src/store/editStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditStore } from './editStore';

describe('EditStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditStore.setState({
      changes: new Map(),
    });
  });

  it('tracks added rows', () => {
    const store = useEditStore.getState();
    const newRow = { name: 'Alice', email: 'alice@test.com' };

    store.addRow('users', newRow);

    const changes = store.getChanges('users');
    expect(changes.added).toHaveLength(1);
    expect(changes.added[0]).toEqual(newRow);
  });

  it('tracks updated cells', () => {
    const store = useEditStore.getState();
    const originalRow = { id: '1', name: 'Bob', email: 'bob@test.com' };

    store.updateCell('users', '1', 'name', 'Robert', originalRow);

    const changes = store.getChanges('users');
    expect(changes.updated.size).toBe(1);
    expect(changes.updated.get('1')?.changes.get('name')).toBe('Robert');
  });

  it('tracks multiple changes to same row', () => {
    const store = useEditStore.getState();
    const originalRow = { id: '1', name: 'Bob', email: 'bob@test.com' };

    store.updateCell('users', '1', 'name', 'Robert', originalRow);
    store.updateCell('users', '1', 'email', 'robert@test.com', originalRow);

    const changes = store.getChanges('users');
    const rowChanges = changes.updated.get('1');
    expect(rowChanges?.changes.size).toBe(2);
    expect(rowChanges?.changes.get('name')).toBe('Robert');
    expect(rowChanges?.changes.get('email')).toBe('robert@test.com');
  });

  it('tracks deleted rows', () => {
    const store = useEditStore.getState();

    store.deleteRow('users', '1');
    store.deleteRow('users', '2');

    const changes = store.getChanges('users');
    expect(changes.deleted.size).toBe(2);
    expect(changes.deleted.has('1')).toBe(true);
    expect(changes.deleted.has('2')).toBe(true);
  });

  it('clears changes for table', () => {
    const store = useEditStore.getState();

    store.addRow('users', { name: 'Alice' });
    store.deleteRow('users', '1');

    expect(store.hasChanges('users')).toBe(true);

    store.clearChanges('users');

    expect(store.hasChanges('users')).toBe(false);
  });

  it('handles changes for multiple tables independently', () => {
    const store = useEditStore.getState();

    store.addRow('users', { name: 'Alice' });
    store.addRow('orders', { product_id: 1 });

    expect(store.getChanges('users').added).toHaveLength(1);
    expect(store.getChanges('orders').added).toHaveLength(1);

    store.clearChanges('users');

    expect(store.hasChanges('users')).toBe(false);
    expect(store.hasChanges('orders')).toBe(true);
  });

  it('provides change summary', () => {
    const store = useEditStore.getState();

    store.addRow('users', { name: 'Alice' });
    store.addRow('users', { name: 'Bob' });
    store.updateCell('users', '1', 'name', 'Updated', { id: '1', name: 'Original' });
    store.deleteRow('users', '2');

    const summary = store.getChangeSummary('users');

    expect(summary.addedCount).toBe(2);
    expect(summary.updatedCount).toBe(1);
    expect(summary.deletedCount).toBe(1);
    expect(summary.totalChanges).toBe(4);
  });
});
```

**Pass Criteria**: All 7 tests pass. Run: `npm test -- editStore.test.ts`

---

### Test 5.2: Apply Changes Tests
**File**: `src-tauri/src/commands/edit.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_helpers::*;

    #[tokio::test]
    #[serial]
    async fn test_apply_insert_changes() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        // Create test table
        sqlx::query("CREATE TABLE test_users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50))")
            .execute(&adapter.pool).await.unwrap();

        let changes = TableChanges {
            added: vec![
                row_from_pairs(vec![("name", Value::String("Alice".to_string()))]),
                row_from_pairs(vec![("name", Value::String("Bob".to_string()))]),
            ],
            updated: HashMap::new(),
            deleted: HashSet::new(),
        };

        let result = apply_table_changes(conn_id.clone(), "test_db".to_string(), "test_users".to_string(), changes, state.clone()).await;

        assert!(result.is_ok());

        // Verify rows inserted
        let rows: Vec<(i32, String)> = sqlx::query_as("SELECT id, name FROM test_users ORDER BY id")
            .fetch_all(&adapter.pool).await.unwrap();

        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].1, "Alice");
        assert_eq!(rows[1].1, "Bob");

        sqlx::query("DROP TABLE test_users").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_apply_update_changes() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        sqlx::query("CREATE TABLE test_users (id INT PRIMARY KEY, name VARCHAR(50))")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO test_users VALUES (1, 'Alice'), (2, 'Bob')")
            .execute(&adapter.pool).await.unwrap();

        let mut updated = HashMap::new();
        updated.insert(
            "1".to_string(),
            RowUpdate {
                row: row_from_pairs(vec![("id", Value::Int(1)), ("name", Value::String("Alicia".to_string()))]),
                original: row_from_pairs(vec![("id", Value::Int(1)), ("name", Value::String("Alice".to_string()))]),
                changes: {
                    let mut map = HashMap::new();
                    map.insert("name".to_string(), Value::String("Alicia".to_string()));
                    map
                },
            },
        );

        let changes = TableChanges {
            added: vec![],
            updated,
            deleted: HashSet::new(),
        };

        let result = apply_table_changes(conn_id.clone(), "test_db".to_string(), "test_users".to_string(), changes, state.clone()).await;

        assert!(result.is_ok());

        // Verify update
        let name: (String,) = sqlx::query_as("SELECT name FROM test_users WHERE id = 1")
            .fetch_one(&adapter.pool).await.unwrap();

        assert_eq!(name.0, "Alicia");

        sqlx::query("DROP TABLE test_users").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_apply_delete_changes() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        sqlx::query("CREATE TABLE test_users (id INT PRIMARY KEY, name VARCHAR(50))")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO test_users VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')")
            .execute(&adapter.pool).await.unwrap();

        let mut deleted = HashSet::new();
        deleted.insert("2".to_string());

        let changes = TableChanges {
            added: vec![],
            updated: HashMap::new(),
            deleted,
        };

        let result = apply_table_changes(conn_id.clone(), "test_db".to_string(), "test_users".to_string(), changes, state.clone()).await;

        assert!(result.is_ok());

        // Verify deletion
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM test_users")
            .fetch_one(&adapter.pool).await.unwrap();

        assert_eq!(count.0, 2);

        let remaining: Vec<(i32,)> = sqlx::query_as("SELECT id FROM test_users ORDER BY id")
            .fetch_all(&adapter.pool).await.unwrap();

        assert_eq!(remaining, vec![(1,), (3,)]);

        sqlx::query("DROP TABLE test_users").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_transaction_rollback_on_error() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        sqlx::query("CREATE TABLE test_users (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL)")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO test_users VALUES (1, 'Alice')")
            .execute(&adapter.pool).await.unwrap();

        // Try to insert invalid data (NULL for NOT NULL column)
        let changes = TableChanges {
            added: vec![
                row_from_pairs(vec![("id", Value::Int(2)), ("name", Value::Null)]), // This will fail
            ],
            updated: HashMap::new(),
            deleted: HashSet::new(),
        };

        let result = apply_table_changes(conn_id.clone(), "test_db".to_string(), "test_users".to_string(), changes, state.clone()).await;

        assert!(result.is_err());

        // Verify no changes were applied (transaction rolled back)
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM test_users")
            .fetch_one(&adapter.pool).await.unwrap();

        assert_eq!(count.0, 1); // Still only original row

        sqlx::query("DROP TABLE test_users").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    #[serial]
    async fn test_edit_table_without_primary_key_fails() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        // Create table WITHOUT primary key
        sqlx::query("CREATE TABLE test_no_pk (name VARCHAR(50))")
            .execute(&adapter.pool).await.unwrap();

        let changes = TableChanges {
            added: vec![row_from_pairs(vec![("name", Value::String("Alice".to_string()))])],
            updated: HashMap::new(),
            deleted: HashSet::new(),
        };

        let result = apply_table_changes(conn_id.clone(), "test_db".to_string(), "test_no_pk".to_string(), changes, state.clone()).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("primary key"));

        sqlx::query("DROP TABLE test_no_pk").execute(&adapter.pool).await.unwrap();
    }
}
```

**Pass Criteria**: All 5 tests pass. Run: `cargo test --package dbclient edit`

**DO NOT PROCEED** until Phase 5 tests pass.

---

## Phase 6-7 Testing: Export & Responsiveness

### Test 6.1: SQL Export Tests
**File**: `src-tauri/src/commands/export.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    #[serial]
    async fn test_export_table_as_sql() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        // Create and populate test table
        sqlx::query("CREATE TABLE test_export (id INT PRIMARY KEY, name VARCHAR(50))")
            .execute(&adapter.pool).await.unwrap();
        sqlx::query("INSERT INTO test_export VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')")
            .execute(&adapter.pool).await.unwrap();

        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("export.sql");

        let result = export_as_sql(
            conn_id.clone(),
            "test_db".to_string(),
            "test_export".to_string(),
            None,
            output_path.to_str().unwrap().to_string(),
            state.clone(),
        ).await;

        assert!(result.is_ok());

        // Verify file contents
        let contents = std::fs::read_to_string(&output_path).unwrap();
        assert!(contents.contains("INSERT INTO test_export VALUES"));
        assert!(contents.contains("Alice"));
        assert!(contents.contains("Bob"));
        assert!(contents.contains("Charlie"));

        sqlx::query("DROP TABLE test_export").execute(&adapter.pool).await.unwrap();
    }

    #[tokio::test]
    async fn test_export_large_table_streaming() {
        let state = setup_test_state().await;
        let conn_id = create_test_connection(&state).await;
        let adapter = state.get_adapter(&conn_id).await.unwrap();

        // Create table with 10,000 rows
        sqlx::query("CREATE TABLE test_large (id INT PRIMARY KEY)")
            .execute(&adapter.pool).await.unwrap();

        for i in 0..10000 {
            if i % 1000 == 0 {
                // Batch inserts for speed
                let values = (i..i+1000).map(|n| format!("({})", n)).collect::<Vec<_>>().join(",");
                sqlx::query(&format!("INSERT INTO test_large VALUES {}", values))
                    .execute(&adapter.pool).await.unwrap();
            }
        }

        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("large_export.sql");

        let result = export_as_sql(
            conn_id.clone(),
            "test_db".to_string(),
            "test_large".to_string(),
            None,
            output_path.to_str().unwrap().to_string(),
            state.clone(),
        ).await;

        assert!(result.is_ok());

        // Verify file exists and has content
        let metadata = std::fs::metadata(&output_path).unwrap();
        assert!(metadata.len() > 100000); // Should be substantial file

        sqlx::query("DROP TABLE test_large").execute(&adapter.pool).await.unwrap();
    }
}
```

**Pass Criteria**: All 2 tests pass. Run: `cargo test --package dbclient export`

---

### Test 6.2: Responsive Layout Tests
**File**: `src/components/Layout/SplitPane.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplitPane } from './SplitPane';

describe('SplitPane', () => {
  it('renders both panes', () => {
    render(
      <SplitPane>
        <div>Pane 1</div>
        <div>Pane 2</div>
      </SplitPane>
    );

    expect(screen.getByText('Pane 1')).toBeInTheDocument();
    expect(screen.getByText('Pane 2')).toBeInTheDocument();
  });

  it('renders resize handle between panes', () => {
    render(
      <SplitPane>
        <div>Pane 1</div>
        <div>Pane 2</div>
      </SplitPane>
    );

    const handle = screen.getByTestId('resize-handle');
    expect(handle).toBeInTheDocument();
  });

  it('respects min size constraints', () => {
    const { container } = render(
      <SplitPane minSize={200}>
        <div>Pane 1</div>
        <div>Pane 2</div>
      </SplitPane>
    );

    const pane = container.querySelector('[data-testid="pane-1"]');
    const style = window.getComputedStyle(pane!);

    // Min width should be enforced
    expect(parseInt(style.minWidth)).toBeGreaterThanOrEqual(200);
  });
});
```

**Pass Criteria**: All 3 tests pass. Run: `npm test -- SplitPane.test.tsx`

**DO NOT PROCEED** until Phase 6-7 tests pass.

---

## Phase 8: End-to-End Testing with Playwright

### E2E Test Suite
**File**: `e2e/complete-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete Database Client Workflow', () => {
  test('create connection, execute query, edit data, export', async ({ page }) => {
    await page.goto('http://localhost:1420'); // Tauri dev server

    // Step 1: Create connection
    await page.click('button:has-text("New Connection")');
    await page.fill('input[name="name"]', 'Test MySQL');
    await page.fill('input[name="host"]', 'localhost');
    await page.fill('input[name="port"]', '3307');
    await page.fill('input[name="username"]', 'root');
    await page.fill('input[name="password"]', 'test_password');
    await page.fill('input[name="database"]', 'test_db');

    // Select color
    await page.click('[data-testid="color-picker"]');
    await page.click('[data-testid="color-option-red"]');

    await page.click('button:has-text("Save")');

    // Verify connection saved
    await expect(page.locator('text=Test MySQL')).toBeVisible();

    // Step 2: Execute query
    await page.click('text=Test MySQL'); // Connect
    await page.waitForSelector('.monaco-editor');

    // Type query
    await page.click('.monaco-editor');
    await page.keyboard.type('SELECT * FROM test_users');

    // Execute with Cmd+Enter
    await page.keyboard.press('Meta+Enter');

    // Wait for results
    await page.waitForSelector('[data-testid="result-grid"]');

    // Verify results displayed
    const grid = page.locator('[data-testid="result-grid"]');
    await expect(grid).toBeVisible();

    // Step 3: Edit data
    // Double-click cell to edit
    const cell = grid.locator('div[role="gridcell"]').first();
    await cell.dblclick();

    await page.keyboard.type('Updated Value');
    await page.keyboard.press('Enter');

    // Verify staged changes panel
    await expect(page.locator('text=1 change')).toBeVisible();

    // Apply changes
    await page.click('button:has-text("Apply Changes")');

    // Wait for success message
    await expect(page.locator('text=Changes applied successfully')).toBeVisible();

    // Step 4: Export
    await page.click('button:has-text("Export")');
    await page.click('text=SQL');

    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('.sql');
  });

  test('autocomplete works in query editor', async ({ page }) => {
    await page.goto('http://localhost:1420');

    // Connect to database (assume connection exists)
    await page.click('text=Test MySQL');
    await page.waitForSelector('.monaco-editor');

    // Type partial query
    await page.click('.monaco-editor');
    await page.keyboard.type('SELECT * FROM ');

    // Wait for autocomplete suggestions
    await page.waitForSelector('.monaco-list-row');

    // Verify table suggestions appear
    await expect(page.locator('.monaco-list-row:has-text("test_users")')).toBeVisible();

    // Press Tab to accept
    await page.keyboard.press('Tab');

    // Verify table name inserted
    const editorText = await page.locator('.monaco-editor').textContent();
    expect(editorText).toContain('test_users');
  });

  test('search interface works', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.click('text=Test MySQL');

    // Open search interface
    await page.click('button:has-text("Search")');

    // Test WHERE clause builder
    await page.click('text=WHERE Clause Builder');

    // Add condition
    await page.click('button:has-text("Add Condition")');
    await page.selectOption('select[name="column"]', 'name');
    await page.selectOption('select[name="operator"]', 'LIKE');
    await page.fill('input[name="value"]', '%Alice%');

    // Execute search
    await page.click('button:has-text("Search")');

    // Verify results
    await page.waitForSelector('[data-testid="result-grid"]');
    const grid = page.locator('[data-testid="result-grid"]');
    await expect(grid.locator('text=Alice')).toBeVisible();
  });

  test('responsive layout at different sizes', async ({ page }) => {
    // Test at 13" laptop size (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:1420');

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Test panel resizing
    const handle = page.locator('[data-testid="resize-handle"]');
    const box = await handle.boundingBox();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + box.height / 2);
      await page.mouse.up();

      // Verify panels resized
      const pane1 = page.locator('[data-testid="pane-1"]');
      const width = await pane1.evaluate(el => el.clientWidth);
      expect(width).toBeGreaterThan(0);
    }
  });
});
```

**Pass Criteria**: All 4 E2E tests pass. Run: `npx playwright test`

---

## Testing Command Reference

### Run All Tests
```bash
# Backend tests
cargo test --workspace

# Frontend tests
npm test

# E2E tests
npx playwright test

# Run specific test file
cargo test --package dbclient encryption
npm test -- ConnectionForm.test.tsx
```

### Coverage Reports
```bash
# Rust coverage (using tarpaulin)
cargo install cargo-tarpaulin
cargo tarpaulin --out Html

# Frontend coverage
npm test -- --coverage
```

### CI/CD Integration
All tests must pass in CI before merging:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Backend tests
        run: cargo test --workspace
      - name: Frontend tests
        run: npm test
      - name: E2E tests
        run: npx playwright test
```

---

## Test-Driven Development Workflow

**For Each Feature:**

1. **Write tests FIRST** (before implementation)
2. **Run tests** - they should FAIL (red)
3. **Implement feature** to make tests pass
4. **Run tests again** - they should PASS (green)
5. **Refactor** if needed, tests still passing
6. **DO NOT PROCEED** to next feature until all tests pass

**Example Workflow for a Single Feature:**

```bash
# 1. Write test
# Edit: src-tauri/src/storage/encryption.rs (add test_encrypt_decrypt_roundtrip)

# 2. Run test (should fail)
$ cargo test test_encrypt_decrypt_roundtrip
# FAIL: function not implemented

# 3. Implement encrypt() and decrypt()
# Edit: src-tauri/src/storage/encryption.rs (add implementations)

# 4. Run test again
$ cargo test test_encrypt_decrypt_roundtrip
# PASS

# 5. Move to next test
```

---

## Success Criteria Summary

**Phase 1**: 13 tests passing (6 encryption + 7 storage)
**Phase 2**: 12 tests passing (6 adapter + 3 SSH + 6 UI)
**Phase 3**: 9 tests passing (5 autocomplete + 4 query)
**Phase 4**: 11 tests passing (8 WHERE builder + 3 FTS)
**Phase 5**: 12 tests passing (7 store + 5 edit)
**Phase 6-7**: 5 tests passing (2 export + 3 layout)
**Phase 8**: 4 E2E tests passing

**TOTAL: 66+ tests must pass for MVP completion**

**Test coverage target: >70% overall**

## Success Criteria

### MVP Complete When:
1. ✅ Can connect to MySQL 8.0+ with SSH tunnel and SSL
2. ✅ Can execute SQL queries with inline autocomplete
3. ✅ Can search database with all four search modes
4. ✅ Can edit table data with staged changes and apply as transaction
5. ✅ Can export query results as SQL
6. ✅ UI is fully responsive on all laptop sizes
7. ✅ Connection color coding works throughout UI
8. ✅ All credentials encrypted at rest
9. ✅ PostgreSQL support functional
10. ✅ Comprehensive test coverage (>70%)

## Development Timeline

**Total: 9-14 weeks to production-ready MVP**

- Weeks 1-2: Project setup, connection management foundation
- Weeks 3-4: Query editor with autocomplete
- Weeks 4-5: Comprehensive search (differentiator)
- Weeks 5-6: Data grid with staged editing
- Weeks 6-7: Export, responsive layout, polish
- Weeks 8-9: Testing, security hardening
- Weeks 9-10: PostgreSQL support

## Next Steps After MVP

1. **Additional Databases**: SQLite, Microsoft SQL Server, Oracle
2. **Import**: CSV, JSON, Excel import functionality
3. **Compressed Exports**: .gz, .zip support
4. **Query Performance**: EXPLAIN visualization, profiling
5. **Collaboration**: Share saved queries, team features
6. **Advanced Search**: Regex search, multi-table joins in GUI builder
7. **Schema Management**: Create/alter tables, migrations
8. **ER Diagrams**: Visual schema representation

---

## Summary

This plan delivers a modern, performant SQL database client that:
- **Combines strengths**: Beekeeper's query editor + Adminer's comprehensive search
- **Differentiates**: Superior search with 4 integrated modes
- **Prioritizes UX**: Inline autocomplete, connection color coding, staged editing
- **Ensures security**: AES-256 encryption, SSH tunnels, SSL/TLS
- **Performs well**: Rust backend, connection pooling, streaming exports
- **Scales easily**: Database abstraction for multi-DB support

Built with Tauri 2.0 (React + Rust) for native performance, small bundle size, and excellent developer experience.
