use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DatabaseType {
    MySQL,
    PostgreSQL,
}

impl fmt::Display for DatabaseType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DatabaseType::MySQL => write!(f, "MySQL"),
            DatabaseType::PostgreSQL => write!(f, "PostgreSQL"),
        }
    }
}

impl FromStr for DatabaseType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "MySQL" => Ok(DatabaseType::MySQL),
            "PostgreSQL" => Ok(DatabaseType::PostgreSQL),
            _ => Err(format!("Invalid database type: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSHConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth: SSHAuth,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SSHAuth {
    Password(String),
    PrivateKey { key_path: String, passphrase: Option<String> },
    Agent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSLConfig {
    pub ca_cert: Option<String>,
    pub client_cert: Option<String>,
    pub client_key: Option<String>,
    pub verify: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub id: String,
    pub name: String,
    pub color: String,
    pub db_type: DatabaseType,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
    pub ssh_config: Option<SSHConfig>,
    pub ssl_config: Option<SSLConfig>,
}

impl Connection {
    #[allow(dead_code)]
    pub fn new(
        name: String,
        color: String,
        db_type: DatabaseType,
        host: String,
        port: u16,
        username: String,
        password: String,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            color,
            db_type,
            host,
            port,
            username,
            password,
            database: None,
            ssh_config: None,
            ssl_config: None,
        }
    }
}
