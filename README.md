# DBClient - Desktop SQL Database Client

A modern, native desktop SQL database client built with Tauri 2.0, React, and TypeScript. Features a Monaco-based query editor with intelligent autocomplete, query execution with cancellation, and secure encrypted connection storage.

**Desktop-Only Application:** This is a native desktop application for macOS, Windows, and Linux. No web browser support.

## 🚀 Features

### Core Functionality
- **🔐 Secure Connection Management**
  - Encrypted password storage using AES-256-GCM
  - Support for MySQL databases (PostgreSQL coming soon)
  - Connection testing before saving
  - Color-coded connections for easy identification
  - Edit and delete existing connections

### Query Editor
- **✨ Monaco Editor Integration**
  - Full SQL syntax highlighting
  - IntelliSense-style autocomplete
  - Context-aware suggestions (tables after FROM, columns after table.)
  - Backspace-compatible search (suggestions persist when deleting)
  - Keyboard shortcuts: Cmd/Ctrl+Enter to execute queries
  - Tab key to accept suggestions

- **🎯 Query Execution**
  - Execute SQL queries with real-time feedback
  - Results displayed in a formatted table
  - Execution time and row count statistics
  - Query cancellation support (stop long-running queries)
  - Error handling with clear error messages
  - Query history tracking

### User Interface
- **📱 Modern, Responsive Design**
  - Resizable panels (horizontal and vertical)
  - Tab management (Cmd/Ctrl+T for new tabs)
  - Collapsible connection sidebar
  - NULL value handling in results
  - Loading states and progress indicators

### Developer Experience
- **🛠️ Native Development**
  - Hot module reloading with Tauri
  - Fast Rust compilation
  - Real-time UI updates

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **Rust** 1.70 or higher (for Tauri)
- **npm** or **yarn**
- **MySQL** database (for production use)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dbclient
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**

   ```bash
   npm run tauri dev
   ```
   Launches native desktop application with hot reloading

## 📦 Building for Production

### Desktop Application

**macOS:**
```bash
npm run tauri build
```
Creates `.app` bundle in `src-tauri/target/release/bundle/macos/`

**Windows:**
```bash
npm run tauri build
```
Creates `.exe` installer in `src-tauri/target/release/bundle/`

**Linux:**
```bash
npm run tauri build
```
Creates `.AppImage` or `.deb` in `src-tauri/target/release/bundle/`

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run specific test suite
```bash
npm test -- QueryEditor.test.tsx
```

### Run backend tests
```bash
cd src-tauri
cargo test
```

### Test coverage
- **Frontend:** 57 tests across 8 test suites
- **Backend:** 19 tests (2 integration tests require MySQL)

## 🗂️ Project Structure

```
dbclient/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── ConnectionManager/    # Connection list & form
│   │   └── QueryEditor/          # Monaco editor & results
│   ├── services/
│   │   └── tauriApi.ts          # Backend API communication
│   ├── store/                   # Zustand state management
│   │   ├── connectionStore.ts
│   │   └── queryStore.ts
│   ├── types/                   # TypeScript type definitions
│   └── hooks/                   # Custom React hooks
│
├── src-tauri/                   # Rust backend (Tauri)
│   ├── src/
│   │   ├── commands/            # Tauri command handlers
│   │   │   ├── connection.rs   # Connection CRUD
│   │   │   ├── query.rs        # Query execution
│   │   │   └── schema.rs       # Schema introspection
│   │   ├── db/
│   │   │   └── mysql_adapter.rs # MySQL database adapter
│   │   ├── models/              # Data models
│   │   └── storage/             # Encrypted storage
│   │       ├── encryption.rs   # AES-256-GCM encryption
│   │       └── connection_store.rs
│   └── Cargo.toml
│
└── tests/                       # Integration tests
```

## 🎨 Key Technologies

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Monaco Editor** - VS Code's editor
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Vitest** - Testing framework

### Backend
- **Tauri 2.0** - Cross-platform framework
- **Rust** - Systems programming language
- **sqlx** - Async SQL toolkit
- **AES-GCM** - Password encryption
- **SQLite** - Connection metadata storage

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Execute query |
| `Cmd/Ctrl + T` | New tab |
| `Tab` | Accept autocomplete suggestion |
| `Cmd/Ctrl + W` | Close tab |

## 🔒 Security

- **Password Encryption:** All database passwords are encrypted using AES-256-GCM before storage
- **Key Derivation:** PBKDF2 with random salt for key generation
- **Secure Storage:** Encrypted connection data stored in local SQLite database
- **No Network:** All data stays local, no telemetry or external connections

## 🐛 Known Limitations

1. **Query Cancellation:** Currently stops UI blocking but doesn't kill the database query on the server
2. **Database Support:** Only MySQL is currently supported (PostgreSQL planned)

## 🛣️ Roadmap

### Phase 1 - Core Features ✅
- [x] Encrypted connection storage
- [x] Connection management (add, edit, delete)
- [x] Query execution
- [x] Monaco editor integration
- [x] SQL autocomplete

### Phase 2 - Enhanced UX ✅
- [x] Query cancellation
- [x] Keyboard shortcuts
- [x] Resizable panels
- [x] Tab management

### Phase 3 - Advanced Features (Planned)
- [ ] PostgreSQL support
- [ ] Query history UI
- [ ] Saved queries/snippets
- [ ] Export results (CSV, JSON)
- [ ] Database schema browser
- [ ] Table data viewer
- [ ] Multi-statement execution
- [ ] Query result pagination

### Phase 4 - Professional Features (Future)
- [ ] SSH tunnel support
- [ ] SSL/TLS connections
- [ ] Multiple database tabs
- [ ] Query performance analysis
- [ ] Visual query builder
- [ ] Dark mode

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new features
4. Ensure all tests pass (`npm test && cd src-tauri && cargo test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and well-described

## 📝 License

[Add your license here - e.g., MIT, Apache 2.0]

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Amazing cross-platform framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Powerful code editor
- [sqlx](https://github.com/launchbadge/sqlx) - Excellent Rust SQL toolkit

## 📧 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- [Add contact information if desired]

---

**Built with ❤️ using Tauri + React + TypeScript**
