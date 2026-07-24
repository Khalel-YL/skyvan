# API Architecture

**Status:** Active
**Version:** 1.0
**Last Updated:** 2026-07-22

---

# Purpose

This document describes the external and internal API architecture of Skyvan.

---

# API Philosophy

- APIs expose capabilities.
- Business rules stay outside route handlers.
- Route handlers validate, delegate, and respond.

---

# Entry Point

Location

```text
app/api/
```

---

# Responsibilities

- HTTP request handling
- Authentication checks
- Request validation
- Response formatting
- Delegation to services/actions

---

# Request Lifecycle

```text
HTTP Request
      │
      ▼
API Route
      │
      ▼
Validation
      │
      ▼
Business Action / Service
      │
      ▼
Database
      │
      ▼
Response
```

---

# Rules

- Keep route handlers thin.
- Do not place business logic inside routes.
- Return consistent response shapes.
- Validate inputs before execution.
- Centralize error handling.

---

# Dependencies

- Server Actions
- Database Layer
- Authentication
- Shared Utilities

---

# Related Documents

- MODULE_MAP.md
- SYSTEM_BLUEPRINT.md
- DATABASE_ARCHITECTURE.md
