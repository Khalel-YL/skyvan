# Technology Stack

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-07-22

---

# Purpose

This document defines the technologies that power the Skyvan platform.

Each dependency must have a clear engineering purpose. Technology choices are intentional—not trend-driven.

---

# Design Principles

- Prefer stable technologies.
- Minimize unnecessary dependencies.
- Favor type safety.
- Prefer convention over configuration.
- Every dependency must solve a real problem.

---

# Core Runtime

## Next.js

**Role**

Application Framework

**Responsibilities**

- App Router
- Server Components
- Client Components
- Route Handlers
- Rendering
- Middleware

**Criticality**

★★★★★

---

## React

**Role**

User Interface Library

**Responsibilities**

- Component architecture
- Rendering
- State updates
- UI composition

**Criticality**

★★★★★

---

## TypeScript

**Role**

Primary programming language

**Responsibilities**

- Static typing
- Safer refactoring
- IDE tooling
- Compile-time validation

**Project Policy**

TypeScript is mandatory.

Avoid using `any` unless explicitly justified.

---

# Database

## PostgreSQL

**Role**

Primary relational database

**Responsibilities**

- Persistent storage
- Transactions
- Relational data

---

## Drizzle ORM

**Role**

Database abstraction layer

**Responsibilities**

- Schema
- Queries
- Migrations
- Type-safe SQL

**Reason**

Chosen for its lightweight architecture and excellent TypeScript integration.

---

# State Management

## Zustand

**Role**

Client state management

**Usage Guidelines**

Use React state first.

Use Zustand only for shared client state.

Avoid unnecessary global stores.

---

# AI Layer

## OpenAI

**Responsibilities**

- Content generation
- Classification
- Extraction
- Reasoning
- AI workflows

---

# Document Processing

## pdfjs-dist

**Responsibilities**

- PDF parsing
- Text extraction
- Document analysis

---

# 3D Engine

## Three.js

**Responsibilities**

- 3D rendering

---

## React Three Fiber

**Responsibilities**

- React integration for Three.js

---

# Icons

## Lucide React

Primary icon library.

---

# Utilities

## uuid

Unique identifier generation.

---

# Development

## ESLint

Static analysis.

Maintains code quality.

---

# Version Control

Git

GitHub

Primary source control platform.

---

# Architecture Characteristics

- Full-stack Next.js
- Type-safe
- Modular
- AI-first
- PostgreSQL-backed
- App Router architecture

---

# Dependency Policy

Before introducing any new dependency, answer:

1. Why is it needed?
2. Can the platform solve this without it?
3. Is it actively maintained?
4. Is it secure?
5. What is the long-term maintenance cost?

If these questions cannot be answered, the dependency should not be added.

---

# Engineering Rule

Technology decisions should prioritize:

1. Reliability
2. Maintainability
3. Simplicity
4. Performance

Never adopt technology solely because it is popular.

---

# Related Documents

- REPOSITORY_INVENTORY.md
- MODULE_MAP.md
- SYSTEM_BLUEPRINT.md
