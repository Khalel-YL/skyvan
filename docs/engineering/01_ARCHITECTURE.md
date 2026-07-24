# Skyvan Architecture

## Purpose

This document defines the architectural boundaries of the Skyvan project.

Every new feature should follow this structure.

Architecture consistency has higher priority than implementation speed.

---

# High Level Structure

Skyvan is organized into clear responsibility layers.

```

app/
db/
docs/
public/
scripts/
skyvan/
.agents/

```

Each directory has a single responsibility.

---

# app/

The application layer.

Contains:

- pages
- routes
- layouts
- UI
- features
- server actions

Business logic should remain modular.

Avoid placing unrelated utilities inside app/.

---

# db/

Database layer.

Responsible for:

- schema
- migrations
- database connection
- ORM configuration

Only database-related code belongs here.

Never place business logic inside db/.

---

# docs/

Project documentation.

Contains:

- engineering handbook
- architecture
- workflow
- roadmap
- technical decisions

Documentation is part of the project.

Documentation must evolve with the code.

---

# public/

Static assets only.

Examples:

- images
- icons
- logos

No application logic.

---

# scripts/

Developer utilities.

Examples:

- migration helpers
- maintenance scripts
- import/export tools

Scripts should never contain application logic.

---

# skyvan/

Project-specific core modules.

This folder contains reusable domain logic shared across features.

Avoid UI code here unless explicitly designed as shared infrastructure.

---

# .agents/

AI agent definitions.

Each agent has a focused responsibility.

Example:

Frontend Agent

Backend Agent

Database Agent

Reviewer Agent

Architect Agent

Agents never replace documentation.

Agents consume documentation.

---

# Layer Responsibilities

UI

↓

Application Logic

↓

Domain Logic

↓

Database

Never bypass layers without justification.

---

# Component Philosophy

Components should be:

small

predictable

reusable

easy to test

Avoid extremely large components.

---

# Server / Client Separation

Prefer Server Components whenever possible.

Use Client Components only when necessary.

Examples:

user interaction

browser APIs

animations

stateful UI

Server-first architecture is preferred.

---

# Data Flow

Database

↓

Server

↓

Application

↓

UI

Avoid direct database access from UI.

---

# Import Rules

Prefer relative imports inside the same feature.

Prefer shared modules for reusable logic.

Avoid circular dependencies.

Avoid deep import chains.

---

# Naming

Names should describe responsibility.

Avoid generic names like:

helpers

utils2

temp

newComponent

Prefer:

VehicleCard

RevisionTimeline

AdminSidebar

ListingRepository

---

# Feature Development

Each new feature should answer:

Where does it belong?

Can existing code be reused?

Does it introduce duplication?

Does it follow current architecture?

---

# Scalability

Architecture should support:

new modules

new admin tools

AI features

future SaaS expansion

multi-language support

without major rewrites.

---

# Forbidden Practices

Large God Components

Business logic inside UI

Database logic inside components

Duplicated utilities

Circular dependencies

Anonymous architecture decisions

---

# Architectural Rule

Whenever uncertain:

Follow existing project patterns.

Never invent a second architecture.
