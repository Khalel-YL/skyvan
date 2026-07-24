# System Blueprint

**Status:** Active
**Version:** 1.0
**Last Updated:** 2026-07-22

---

# Purpose

This document defines the high-level architecture of the Skyvan platform.

It describes how the major architectural layers interact.

It intentionally avoids implementation details.

---

# Architecture Overview

Skyvan follows a layered architecture.

```text
┌───────────────────────────────┐
│           Browser             │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Next.js App Router     │
│         Pages & Layouts        │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
 Server Components   Client Components
        │                │
        └───────┬────────┘
                ▼
        Business Features
                │
                ▼
        Server Actions
                │
                ▼
          API Layer
                │
                ▼
       Business Services
                │
                ▼
         Database Layer
                │
                ▼
          PostgreSQL
```

---

# Architectural Layers

## 1. Presentation Layer

Responsibilities

- User Interface
- Routing
- Layouts
- Rendering
- Navigation

Technology

- Next.js
- React

---

## 2. Feature Layer

Responsibilities

- Business features
- User workflows
- Domain-specific functionality

Examples

- Workshop
- Proposal
- Offer
- Admin

---

## 3. Action Layer

Responsibilities

- Server Actions
- Business orchestration
- Validation
- Transaction coordination

Characteristics

- Stateless
- Secure
- Reusable

---

## 4. API Layer

Responsibilities

- External communication
- Internal endpoints
- Integrations

Rules

API routes should remain thin.

Business logic belongs elsewhere.

---

## 5. Service Layer

Responsibilities

- Business rules
- Domain logic
- Reusable operations

Guidelines

No UI code.

No rendering.

Pure business responsibilities.

---

## 6. Persistence Layer

Responsibilities

- Database access
- Queries
- Transactions
- Data persistence

Technology

- PostgreSQL
- Drizzle ORM

---

# AI Architecture

AI is a platform capability.

It is not the application's core architecture.

AI services may be used by multiple modules.

Responsibilities

- Generation
- Classification
- Extraction
- Analysis

---

# Shared Components

Shared modules include

- Components
- Utilities
- Types
- Constants
- Configuration

Shared modules should not contain business-specific logic.

---

# Request Flow

```text
Browser

↓

Route

↓

Page

↓

Feature

↓

Server Action

↓

Service

↓

Database

↓

Response

↓

Render
```

---

# Design Principles

- Separation of concerns
- Modular architecture
- Reusable business logic
- Stateless server operations
- Explicit dependencies
- Type safety
- Minimal coupling

---

# Architectural Constraints

Business logic must not exist inside UI components.

Database access must remain isolated.

Modules communicate through explicit interfaces.

Avoid circular dependencies.

Shared code must remain framework-independent whenever possible.

---

# Scalability Goals

The architecture should support

- Additional AI providers
- Additional business modules
- Independent feature evolution
- Horizontal scaling
- Future microservice extraction if required

---

# Related Documents

- REPOSITORY_INVENTORY.md
- TECH_STACK.md
- MODULE_MAP.md
- CURRENT_STATE.md
