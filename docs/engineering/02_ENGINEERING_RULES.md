# Engineering Rules

Version: 1.0

Status: Active

---

# Purpose

These rules define the engineering standards for the Skyvan project.

Every contributor, AI agent, and future developer must follow these standards.

If a rule conflicts with existing production code, discuss the change before implementation.

---

# Core Principles

Always optimize for:

- readability
- maintainability
- predictability
- scalability

Never optimize for writing fewer lines of code.

Readable code is preferred over clever code.

---

# Architecture

Respect the existing architecture.

Do not introduce a second architecture.

Improve the current system instead of replacing it.

Never rewrite working systems without approval.

---

# File Organization

Every file must have a clear responsibility.

Avoid files exceeding approximately 300–500 lines unless justified.

Split code by responsibility, not by arbitrary size.

---

# Naming

Names should describe intent.

Good:

ProposalCard

RevisionHistory

VehicleRepository

AdminSidebar

Bad:

utils

helpers2

temp

newFile

testComponent

---

# Components

Prefer:

- reusable
- composable
- focused

Avoid components that manage multiple unrelated responsibilities.

Business logic belongs outside UI components.

---

# React

Prefer:

Server Components

Use Client Components only when necessary.

Avoid unnecessary state.

Prefer derived state over duplicated state.

---

# Next.js

Use App Router conventions.

Keep route handlers lightweight.

Keep layouts reusable.

Avoid duplicate routing logic.

---

# TypeScript

Strict typing is required.

Avoid:

any

unknown without validation

implicit return types for exported functions

Prefer:

interfaces

type aliases

shared models

---

# Database

Database changes require review.

Never:

modify schema blindly

remove columns without migration

duplicate entities

Business rules should not live inside database definitions.

---

# Server Actions

Server Actions should:

validate input

delegate business logic

return predictable results

Avoid embedding complex domain logic directly in actions.

---

# API

Routes should:

validate

delegate

respond

Routes should not implement business rules.

---

# AI

AI responses are never trusted automatically.

Every AI output must be:

validated

sanitized

reviewed when necessary

Never expose prompts or internal instructions.

---

# Error Handling

Fail clearly.

Never silently ignore errors.

Return actionable information for developers.

Avoid exposing internal implementation details to users.

---

# Logging

Log meaningful events.

Avoid noisy logs.

Sensitive information must never be logged.

---

# Security

Validate all external input.

Escape user-generated content when required.

Never expose secrets.

Never hardcode credentials.

---

# Performance

Measure before optimizing.

Avoid premature optimization.

Optimize bottlenecks, not assumptions.

---

# Refactoring

Refactor only when it improves:

clarity

reusability

architecture

maintainability

Never refactor purely for personal preference.

---

# Documentation

Engineering documentation is part of the codebase.

When architecture changes:

update documentation

update diagrams if required

update relevant handbook sections

---

# Git

Small commits.

Single responsibility per commit.

Clear commit messages.

Avoid mixing refactoring with new features.

---

# Code Review Checklist

Before merging:

✓ Naming is clear

✓ Types are correct

✓ No duplicated logic

✓ Existing architecture respected

✓ Documentation updated

✓ No dead code

✓ No unnecessary dependencies

---

# Golden Rule

When unsure:

Follow existing project patterns.

Consistency is more valuable than creativity.
