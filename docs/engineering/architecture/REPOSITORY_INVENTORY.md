# Repository Inventory

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-22

---

# Purpose

This document provides a high-level inventory of the Skyvan repository.

It is the authoritative starting point for understanding the project structure before examining implementation details.

---

# Repository Overview

Skyvan is a TypeScript-based Next.js application organized around a modular architecture.

The repository separates application code, persistence, documentation, automation scripts and static assets into dedicated top-level directories.

---

# Top-Level Structure

```text
/
├── .agents/
├── .codex/
├── .vscode/
│
├── app/
├── db/
├── docs/
├── public/
├── scripts/
│
├── README.md
├── SKYVAN_CORE_MEMORY.md
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── eslint.config.mjs
├── proxy.ts
├── global.d.ts
├── gemini.md
└── repository-tree.txt
```

Ignored during architectural analysis:

```text
.git/
node_modules/
.next/
.env
```

---

# Main Directories

## app

Primary application source.

Contains:

- App Router
- Pages
- Layouts
- API Routes
- UI
- Business Features

---

## db

Database layer.

Contains:

- Database configuration
- Schema
- Persistence logic

---

## docs

Project documentation.

Contains engineering and project documentation.

---

## public

Static assets served by the application.

---

## scripts

Development and maintenance scripts.

---

## .agents

AI agent configuration and workflows.

---

## .codex

Codex-specific configuration.

---

## .vscode

Workspace configuration.

---

# Core Configuration Files

| File | Purpose |
|------|---------|
| package.json | Project metadata and dependencies |
| tsconfig.json | TypeScript configuration |
| next.config.ts | Next.js configuration |
| drizzle.config.ts | Database ORM configuration |
| eslint.config.mjs | Lint configuration |
| proxy.ts | Runtime middleware / proxy |
| global.d.ts | Global type declarations |

---

# Documentation Files

- README.md
- SKYVAN_CORE_MEMORY.md
- repository-tree.txt
- docs/

---

# Initial Assessment

The repository already demonstrates clear separation between:

- Application
- Persistence
- Documentation
- Automation
- AI tooling
- Development configuration

This provides a strong foundation for long-term maintainability.

---

# Related Documents

- TECH_STACK.md
- MODULE_MAP.md
- SYSTEM_BLUEPRINT.md
- CURRENT_STATE.md

