use crate::models::{
    ColumnSchema, Connection, ForeignKey, QueryResult, Schema, TableSchema,
    TableData, TableDataRequest, FilterOperator, SortOrder, InsertRowRequest,
    UpdateRowRequest, DeleteRowRequest,
};
use sqlx::mysql::{MySqlPool, MySqlPoolOptions, MySqlRow};
use sqlx::{Column, Row, TypeInfo};
use std::collections::HashMap;
use std::time::Instant;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Query error: {0}")]
    Query(String),

    #[error("Schema error: {0}")]
    Schema(String),
}

pub type Result<T> = std::result::Result<T, DatabaseError>;

pub struct MySQLAdapter {
    pool: MySqlPool,
}

impl MySQLAdapter {
    pub async fn new(connection: &Connection) -> Result<Self> {
        let database_url = Self::build_connection_string(connection);

        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .map_err(|e| DatabaseError::Connection(e.to_string()))?;

        Ok(Self { pool })
    }

    fn build_connection_string(connection: &Connection) -> String {
        let database = connection.database.as_deref().unwrap_or("");
        format!(
            "mysql://{}:{}@{}:{}/{}",
            connection.username, connection.password, connection.host, connection.port, database
        )
    }

    pub async fn list_databases(&self) -> Result<Vec<String>> {
        let query = "SHOW DATABASES";
        let rows: Vec<MySqlRow> = sqlx::query(query)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;

        let databases: Vec<String> = rows
            .iter()
            .map(|row| row.get::<String, _>(0))
            .filter(|db| {
                // Filter out system databases
                !matches!(
                    db.as_str(),
                    "information_schema" | "mysql" | "performance_schema" | "sys"
                )
            })
            .collect();

        Ok(databases)
    }

    pub async fn get_schema(&self, database: &str) -> Result<Schema> {
        let tables = self.get_tables(database).await?;
        let mut table_schemas = Vec::new();

        for table_name in tables {
            let columns = self.get_columns(database, &table_name).await?;
            let primary_keys = self.get_primary_keys(database, &table_name).await?;
            let foreign_keys = self.get_foreign_keys(database, &table_name).await?;

            table_schemas.push(TableSchema {
                name: table_name,
                columns,
                primary_keys,
                foreign_keys,
            });
        }

        Ok(Schema {
            tables: table_schemas,
        })
    }

    async fn get_tables(&self, database: &str) -> Result<Vec<String>> {
        let query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'";

        let rows: Vec<(String,)> = sqlx::query_as(query)
            .bind(database)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Schema(e.to_string()))?;

        Ok(rows.into_iter().map(|(name,)| name).collect())
    }

    async fn get_columns(&self, database: &str, table: &str) -> Result<Vec<ColumnSchema>> {
        let query = r#"
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        "#;

        let rows: Vec<MySqlRow> = sqlx::query(query)
            .bind(database)
            .bind(table)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Schema(e.to_string()))?;

        let columns = rows
            .into_iter()
            .map(|row| ColumnSchema {
                name: row.get("COLUMN_NAME"),
                data_type: row.get("DATA_TYPE"),
                is_nullable: row.get::<String, _>("IS_NULLABLE") == "YES",
                default_value: row.get("COLUMN_DEFAULT"),
                max_length: row.get("CHARACTER_MAXIMUM_LENGTH"),
            })
            .collect();

        Ok(columns)
    }

    async fn get_primary_keys(&self, database: &str, table: &str) -> Result<Vec<String>> {
        let query = r#"
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
            ORDER BY ORDINAL_POSITION
        "#;

        let rows: Vec<(String,)> = sqlx::query_as(query)
            .bind(database)
            .bind(table)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Schema(e.to_string()))?;

        Ok(rows.into_iter().map(|(name,)| name).collect())
    }

    async fn get_foreign_keys(&self, database: &str, table: &str) -> Result<Vec<ForeignKey>> {
        let query = r#"
            SELECT
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                AND REFERENCED_TABLE_NAME IS NOT NULL
        "#;

        let rows: Vec<MySqlRow> = sqlx::query(query)
            .bind(database)
            .bind(table)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Schema(e.to_string()))?;

        let foreign_keys = rows
            .into_iter()
            .map(|row| ForeignKey {
                column_name: row.get("COLUMN_NAME"),
                referenced_table: row.get("REFERENCED_TABLE_NAME"),
                referenced_column: row.get("REFERENCED_COLUMN_NAME"),
            })
            .collect();

        Ok(foreign_keys)
    }

    pub async fn switch_database(&self, database: &str) -> Result<()> {
        let use_query = format!("USE `{}`", database);
        sqlx::query(&use_query)
            .execute(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;
        Ok(())
    }

    pub async fn execute_query(&self, sql: &str) -> Result<QueryResult> {
        self.execute_query_with_database(sql, None).await
    }

    pub async fn execute_query_with_database(&self, sql: &str, database: Option<&str>) -> Result<QueryResult> {
        // Switch database if specified
        if let Some(db) = database {
            self.switch_database(db).await?;
        }

        let start = Instant::now();

        let rows: Vec<MySqlRow> = sqlx::query(sql)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;

        let execution_time_ms = start.elapsed().as_millis() as u64;

        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                total_rows: 0,
                execution_time_ms,
            });
        }

        let columns: Vec<String> = rows[0]
            .columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();

        let data_rows: Vec<Vec<serde_json::Value>> = rows
            .into_iter()
            .map(|row| {
                row.columns()
                    .iter()
                    .enumerate()
                    .map(|(i, col)| {
                        let type_name = col.type_info().name();
                        Self::extract_value(&row, i, type_name)
                    })
                    .collect()
            })
            .collect();

        let total_rows = data_rows.len();

        Ok(QueryResult {
            columns,
            rows: data_rows,
            total_rows,
            execution_time_ms,
        })
    }

    fn extract_value(row: &MySqlRow, index: usize, type_name: &str) -> serde_json::Value {
        match type_name {
            "BIGINT" | "INT" | "SMALLINT" | "TINYINT" => row
                .try_get::<i64, _>(index)
                .ok()
                .map(serde_json::Value::from)
                .unwrap_or(serde_json::Value::Null),
            "FLOAT" | "DOUBLE" => row
                .try_get::<f64, _>(index)
                .ok()
                .map(serde_json::Value::from)
                .unwrap_or(serde_json::Value::Null),
            "BOOLEAN" => row
                .try_get::<bool, _>(index)
                .ok()
                .map(serde_json::Value::from)
                .unwrap_or(serde_json::Value::Null),
            _ => row
                .try_get::<String, _>(index)
                .ok()
                .map(serde_json::Value::from)
                .unwrap_or(serde_json::Value::Null),
        }
    }

    pub async fn execute_paginated(
        &self,
        sql: &str,
        page: u32,
        page_size: u32,
    ) -> Result<QueryResult> {
        let offset = page * page_size;
        let paginated_sql = format!("{} LIMIT {} OFFSET {}", sql, page_size, offset);
        self.execute_query(&paginated_sql).await
    }

    pub async fn get_table_data(&self, request: &TableDataRequest) -> Result<TableData> {
        self.switch_database(&request.database).await?;

        // Build the base query
        let mut query = format!("SELECT * FROM `{}`", request.table);
        let mut where_conditions = Vec::new();

        // Add filters
        if let Some(filters) = &request.filters {
            for filter in filters {
                let condition = match &filter.operator {
                    FilterOperator::Equals => format!("`{}` = '{}'", filter.column, filter.value),
                    FilterOperator::NotEquals => format!("`{}` != '{}'", filter.column, filter.value),
                    FilterOperator::GreaterThan => format!("`{}` > '{}'", filter.column, filter.value),
                    FilterOperator::LessThan => format!("`{}` < '{}'", filter.column, filter.value),
                    FilterOperator::GreaterThanOrEqual => format!("`{}` >= '{}'", filter.column, filter.value),
                    FilterOperator::LessThanOrEqual => format!("`{}` <= '{}'", filter.column, filter.value),
                    FilterOperator::Like => format!("`{}` LIKE '%{}%'", filter.column, filter.value),
                    FilterOperator::NotLike => format!("`{}` NOT LIKE '%{}%'", filter.column, filter.value),
                    FilterOperator::In => format!("`{}` IN ({})", filter.column, filter.value),
                    FilterOperator::NotIn => format!("`{}` NOT IN ({})", filter.column, filter.value),
                    FilterOperator::IsNull => format!("`{}` IS NULL", filter.column),
                    FilterOperator::IsNotNull => format!("`{}` IS NOT NULL", filter.column),
                };
                where_conditions.push(condition);
            }
        }

        if !where_conditions.is_empty() {
            query.push_str(&format!(" WHERE {}", where_conditions.join(" AND ")));
        }

        // Add sorting
        if let Some(sort_by) = &request.sort_by {
            let order = match &request.sort_order {
                Some(SortOrder::Desc) => "DESC",
                _ => "ASC",
            };
            query.push_str(&format!(" ORDER BY `{}` {}", sort_by, order));
        }

        // Get total count before pagination
        let count_query = if !where_conditions.is_empty() {
            format!("SELECT COUNT(*) as count FROM `{}` WHERE {}", request.table, where_conditions.join(" AND "))
        } else {
            format!("SELECT COUNT(*) as count FROM `{}`", request.table)
        };

        let count_row: (i64,) = sqlx::query_as(&count_query)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;
        let total_rows = count_row.0 as u64;

        // Add pagination
        let offset = request.page * request.page_size;
        query.push_str(&format!(" LIMIT {} OFFSET {}", request.page_size, offset));

        // Execute query
        let rows: Vec<MySqlRow> = sqlx::query(&query)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;

        if rows.is_empty() {
            return Ok(TableData {
                columns: vec![],
                rows: vec![],
                total_rows,
            });
        }

        let columns: Vec<String> = rows[0]
            .columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();

        let data_rows: Vec<HashMap<String, serde_json::Value>> = rows
            .into_iter()
            .map(|row| {
                let mut row_data = HashMap::new();
                for (i, col) in row.columns().iter().enumerate() {
                    let col_name = col.name().to_string();
                    let type_name = col.type_info().name();
                    let value = Self::extract_value(&row, i, type_name);
                    row_data.insert(col_name, value);
                }
                row_data
            })
            .collect();

        Ok(TableData {
            columns,
            rows: data_rows,
            total_rows,
        })
    }

    pub async fn insert_row(&self, request: &InsertRowRequest) -> Result<()> {
        self.switch_database(&request.database).await?;

        let columns: Vec<String> = request.data.keys().cloned().collect();
        let values: Vec<String> = columns.iter()
            .map(|col| {
                let value = &request.data[col];
                Self::value_to_sql_string(value)
            })
            .collect();

        let query = format!(
            "INSERT INTO `{}` ({}) VALUES ({})",
            request.table,
            columns.iter().map(|c| format!("`{}`", c)).collect::<Vec<_>>().join(", "),
            values.join(", ")
        );

        sqlx::query(&query)
            .execute(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;

        Ok(())
    }

    pub async fn update_row(&self, request: &UpdateRowRequest) -> Result<u64> {
        self.switch_database(&request.database).await?;

        let set_clauses: Vec<String> = request.data.iter()
            .map(|(col, value)| {
                format!("`{}` = {}", col, Self::value_to_sql_string(value))
            })
            .collect();

        let where_clauses: Vec<String> = request.where_clause.iter()
            .map(|(col, value)| {
                format!("`{}` = {}", col, Self::value_to_sql_string(value))
            })
            .collect();

        let query = format!(
            "UPDATE `{}` SET {} WHERE {}",
            request.table,
            set_clauses.join(", "),
            where_clauses.join(" AND ")
        );

        let result = sqlx::query(&query)
            .execute(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;

        Ok(result.rows_affected())
    }

    pub async fn delete_rows(&self, request: &DeleteRowRequest) -> Result<u64> {
        self.switch_database(&request.database).await?;

        let where_clauses: Vec<String> = request.where_clause.iter()
            .map(|(col, value)| {
                format!("`{}` = {}", col, Self::value_to_sql_string(value))
            })
            .collect();

        let query = format!(
            "DELETE FROM `{}` WHERE {}",
            request.table,
            where_clauses.join(" AND ")
        );

        let result = sqlx::query(&query)
            .execute(&self.pool)
            .await
            .map_err(|e| DatabaseError::Query(e.to_string()))?;

        Ok(result.rows_affected())
    }

    fn value_to_sql_string(value: &serde_json::Value) -> String {
        match value {
            serde_json::Value::Null => "NULL".to_string(),
            serde_json::Value::Bool(true) => "TRUE".to_string(),
            serde_json::Value::Bool(false) => "FALSE".to_string(),
            serde_json::Value::Number(n) => n.to_string(),
            serde_json::Value::String(s) => format!("'{}'", s.replace('\'', "''")),
            // For objects and arrays, serialize to JSON string
            _ => format!("'{}'", value.to_string().replace('\'', "''")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::DatabaseType;

    fn create_test_connection() -> Connection {
        Connection {
            id: "test".to_string(),
            name: "Test".to_string(),
            color: "#ef4444".to_string(),
            db_type: DatabaseType::MySQL,
            host: "localhost".to_string(),
            port: 3306,
            username: "root".to_string(),
            password: "password".to_string(),
            database: Some("test_db".to_string()),
            ssh_config: None,
            ssl_config: None,
        }
    }

    #[tokio::test]
    #[ignore] // Requires MySQL server
    async fn test_build_connection_string() {
        let conn = create_test_connection();
        let url = MySQLAdapter::build_connection_string(&conn);
        assert_eq!(url, "mysql://root:password@localhost:3306/test_db");
    }

    #[tokio::test]
    #[ignore] // Requires MySQL server
    async fn test_connection() {
        let conn = create_test_connection();
        let adapter = MySQLAdapter::new(&conn).await;
        assert!(adapter.is_ok());
    }
}
