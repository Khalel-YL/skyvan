# Skyvan Project Overview

## Vision

Skyvan is a modern caravan marketplace and management platform.

The long-term goal is to become the complete operating system for the caravan industry by combining:

- Marketplace
- Administration
- AI-assisted content management
- Revision tracking
- Modular architecture
- Future SaaS capabilities

The project prioritizes long-term maintainability over rapid feature development.

---

# Primary Objectives

The project aims to provide:

- Fast user experience
- Clean administration
- Safe revision management
- High-quality SEO
- AI-assisted workflows
- Scalable architecture

Every engineering decision should support these objectives.

---

# Core Principles

## Architecture First

Architecture is more important than speed.

Never sacrifice maintainability for short-term gains.

---

## Incremental Development

The project evolves continuously.

Existing working systems should be improved rather than rewritten.

Large rewrites are discouraged unless absolutely necessary.

---

## Consistency

All modules should follow the same design principles.

Consistency is preferred over cleverness.

---

## Simplicity

Prefer understandable solutions.

Avoid unnecessary abstractions.

Avoid premature optimization.

---

## Reliability

Admin tools must be predictable.

Database changes must always be reversible.

AI features must never compromise data integrity.

---

# Current Stack

Framework:
- Next.js
- React
- TypeScript

Database:
- PostgreSQL
- Drizzle ORM

Styling:
- Tailwind CSS

Deployment:
- Vercel (planned)

Version Control:
- GitHub

Development:
- VS Code
- Codex
- ChatGPT

---

# Current Focus

Current development focuses on:

1. Stable architecture
2. Admin system
3. Revision management
4. Database consistency
5. AI integration
6. User experience

---

# Engineering Philosophy

Every new feature must satisfy at least one of the following:

- improves maintainability
- improves usability
- improves scalability
- improves performance
- reduces technical debt

Otherwise, the feature should be reconsidered.

---

# Decision Making

When multiple solutions exist, prefer:

1. Existing project patterns
2. Simpler implementation
3. Better readability
4. Lower maintenance cost
5. Better scalability

---

# Definition of Done

A task is complete only when:

- Code is clean
- Naming is consistent
- Types are correct
- Lint passes
- Existing functionality is preserved
- Documentation is updated when necessary

---

# Long-Term Goal

Skyvan should remain understandable even after years of development.

New contributors should be able to understand the architecture quickly through documentation and consistent engineering practices.
