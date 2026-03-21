# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) · [Semantic Versioning](https://semver.org/)

---

## [0.1.0] — 2026-03-20

Initial release. Published as `@effectorhq/studio`.

### Added

- **Interactive Studio UI** (`src/app.html`) — single-file web application for creating and editing Effector manifests:
  - Visual form for all `effector.toml` fields: name, version, type, description, author, interface (input/output/context), permissions, resources, compose
  - Live TOML preview — updates in real-time as you type
  - One-click copy and download of the generated `effector.toml`
  - Light/dark theme support
- **HTTP server** (`src/server.js`) — `node:http` server (zero dependencies) with REST API:
  - `GET /` — serves `app.html`
  - `POST /api/create` — validates and writes `effector.toml` to the target directory
  - `POST /api/validate` — validates a manifest against `@effectorhq/core` schema
  - `GET /api/types` — returns the full type catalog from `@effectorhq/core`
- **CLI** (`src/cli.js`) — `studio` / `effector-studio` binary:
  - Starts the HTTP server and auto-opens the browser
  - `--port <n>` flag (default: `7432`)
  - `--no-open` flag for headless / CI use
- Uses `@effectorhq/core` for schema validation and type resolution
- Zero npm dependencies beyond `@effectorhq/core`
- MIT licensed
