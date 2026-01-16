use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};
use base64::{engine::general_purpose, Engine as _};
use rand::RngCore;
use thiserror::Error;

const NONCE_SIZE: usize = 12;
const KEY_SIZE: usize = 32;

#[allow(dead_code)]
const MIN_SALT_SIZE: usize = 16;

#[derive(Error, Debug)]
pub enum EncryptionError {
    #[error("Encryption failed: {0}")]
    Encryption(String),

    #[error("Decryption failed: {0}")]
    Decryption(String),

    #[error("Key derivation failed: {0}")]
    KeyDerivation(String),

    #[error("Invalid key length")]
    InvalidKeyLength,
}

pub type Result<T> = std::result::Result<T, EncryptionError>;

/// Generate a random 32-byte encryption key
#[allow(dead_code)]
pub fn generate_key() -> [u8; KEY_SIZE] {
    let mut key = [0u8; KEY_SIZE];
    OsRng.fill_bytes(&mut key);
    key
}

/// Derive a key from a password using Argon2
#[allow(dead_code)]
pub fn derive_key_from_password(password: &str, salt: &[u8]) -> Result<[u8; KEY_SIZE]> {
    if salt.len() < MIN_SALT_SIZE {
        return Err(EncryptionError::KeyDerivation(
            "Salt must be at least 16 bytes".to_string(),
        ));
    }

    let argon2 = Argon2::default();
    let salt_string = SaltString::encode_b64(salt)
        .map_err(|e| EncryptionError::KeyDerivation(e.to_string()))?;

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt_string)
        .map_err(|e| EncryptionError::KeyDerivation(e.to_string()))?;

    let hash = password_hash
        .hash
        .ok_or_else(|| EncryptionError::KeyDerivation("No hash produced".to_string()))?;

    let hash_bytes = hash.as_bytes();
    if hash_bytes.len() < KEY_SIZE {
        return Err(EncryptionError::InvalidKeyLength);
    }

    let mut key = [0u8; KEY_SIZE];
    key.copy_from_slice(&hash_bytes[..KEY_SIZE]);
    Ok(key)
}

/// Encrypt data using AES-256-GCM
pub fn encrypt(plaintext: &str, key: &[u8; KEY_SIZE]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| EncryptionError::Encryption(e.to_string()))?;

    let mut result = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    Ok(result)
}

/// Decrypt data using AES-256-GCM
pub fn decrypt(encrypted_data: &[u8], key: &[u8; KEY_SIZE]) -> Result<String> {
    if encrypted_data.len() < NONCE_SIZE {
        return Err(EncryptionError::Decryption(
            "Encrypted data too short".to_string(),
        ));
    }

    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(&encrypted_data[..NONCE_SIZE]);
    let ciphertext = &encrypted_data[NONCE_SIZE..];

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| EncryptionError::Decryption(e.to_string()))?;

    String::from_utf8(plaintext)
        .map_err(|e| EncryptionError::Decryption(format!("Invalid UTF-8: {}", e)))
}

/// Encode encrypted data as base64 for storage
pub fn encode_encrypted(encrypted_data: &[u8]) -> String {
    general_purpose::STANDARD.encode(encrypted_data)
}

/// Decode base64 encrypted data
pub fn decode_encrypted(encoded: &str) -> Result<Vec<u8>> {
    general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| EncryptionError::Decryption(format!("Invalid base64: {}", e)))
}

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
        assert_ne!(encrypted.as_slice(), plaintext.as_bytes());

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
        let salt = b"random_salt_12345678"; // 20 bytes

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
