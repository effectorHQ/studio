# @effectorhq/studio

[![npm](https://img.shields.io/npm/v/@effectorhq/studio?color=E03E3E&logo=npm&logoColor=white)](https://www.npmjs.com/package/@effectorhq/studio)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache-2.0-blue.svg)](./LICENSE)

Interactive visual studio for creating typed AI agent tools. Fill in a form, see live TOML + SKILL.md preview, compile to MCP / OpenAI / LangChain, and scaffold your project — all in the browser.

## Quick Start

```bash
npx @effectorhq/studio
```

Opens `http://localhost:7432` in your browser.

## Options

```bash
npx @effectorhq/studio --port 8080     # custom port
npx @effectorhq/studio --no-open       # don't auto-open browser
```

## What It Does

1. **Create** — Fill in name, description, type, input/output types, permissions
2. **Preview** — See live-generated `effector.toml` and `SKILL.md` as you type
3. **Compile** — Switch between MCP, OpenAI Agents, LangChain, JSON targets
4. **Validate** — Real-time validation against the Effector spec
5. **Scaffold** — Write the complete project to disk with one click

## API

The studio also exposes a JSON API for programmatic use:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/types` | Returns the 40-type catalog |
| `POST` | `/api/validate` | Validate `{ toml }` |
| `POST` | `/api/compile` | Compile `{ toml, skill, target }` |
| `POST` | `/api/scaffold` | Write project `{ name, toml, skill, outputDir }` |

## License

This project is currently licensed under the Apache 2.0 License 。
