export type DatabaseType = 'MySQL' | 'PostgreSQL';

export interface Connection {
  id: string;
  name: string;
  color: string;
  db_type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string | null;
  ssh_config?: SSHConfig | null;
  ssl_config?: SSLConfig | null;
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  auth: SSHAuth;
}

export type SSHAuth =
  | { Password: string }
  | { PrivateKey: { key_path: string; passphrase?: string } }
  | 'Agent';

export interface SSLConfig {
  ca_cert?: string | null;
  client_cert?: string | null;
  client_key?: string | null;
  verify: boolean;
}
