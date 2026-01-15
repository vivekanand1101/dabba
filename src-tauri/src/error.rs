use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Storage error: {0}")]
    Storage(#[from] crate::storage::connection_store::StoreError),

    #[error("Encryption error: {0}")]
    Encryption(#[from] crate::storage::encryption::EncryptionError),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Not found: {0}")]
    NotFound(String),
}

#[allow(dead_code)]
pub type Result<T> = std::result::Result<T, AppError>;

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
