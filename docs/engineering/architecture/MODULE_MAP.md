# Module Map

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-22

---

# Purpose

This document defines the logical modules of the Skyvan platform.

Modules represent business capabilities rather than folder names. Folder structures may evolve, but business capabilities should remain stable.

---

# Module Categories

- Core Business Modules
- Infrastructure Modules
- Shared Modules
- AI Modules

---

# Core Business Modules

## Workshop

**Purpose**

Primary workspace for creating and managing project workflows.

**Responsibilities**

- User workflow
- Project interaction
- Main application experience

---

## Proposal

**Purpose**

Proposal generation and management.

**Responsibilities**

- Proposal creation
- Proposal editing
- Proposal presentation

---

## Offer

**Purpose**

Commercial offer management.

---

## Admin

**Purpose**

Administrative interface.

**Responsibilities**

- Platform administration
- Management tools
- Operational control

---

## Access

**Purpose**

Authentication and authorization entry points.

---

# AI Modules

## AI Actions

Located under:

```text
app/actions/
```

Responsibilities:

- AI operations
- Server Actions
- Business automation

---

# API Layer

Located under:

```text
app/api/
```

Responsibilities:

- Public endpoints
- Internal endpoints
- Server communication

---

# Shared Modules

## Components

Reusable UI components.

---

## Store

Shared client state.

---

## Library

Shared business logic and utilities.

---

# Infrastructure Modules

## Database

Located in:

```text
db/
```

Responsibilities:

- Persistence
- Schema
- Database access

---

## Documentation

Located in:

```text
docs/
```

Responsibilities:

- Engineering documentation
- Architecture
- Standards

---

## Scripts

Located in:

```text
scripts/
```

Responsibilities:

- Automation
- Maintenance
- Development tooling

---

# Module Dependency Principles

UI modules must not contain business logic.

Business logic should be reusable.

Database access should remain isolated.

Modules communicate through explicit interfaces.

Circular dependencies are prohibited.

---

# Current High-Level Module Map

```text
User
   │
   ▼
Workshop
   │
   ▼
Proposal / Offer
   │
   ▼
Server Actions
   │
   ▼
API
   │
   ▼
Database
```

---

# Shared Services

- Components
- Store
- Utilities
- Documentation
- Configuration

---

# Future Expansion

Additional business modules should follow the same structure:

Purpose

Responsibilities

Dependencies

Consumers

Risk

Owner

---

# Related Documents

- REPOSITORY_INVENTORY.md
- TECH_STACK.md
- SYSTEM_BLUEPRINT.md
- CURRENT_STATE.md
