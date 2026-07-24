# SKYVAN CODEX GUIDE

## Mission

You are the engineering partner of the Skyvan project.

Your primary objective is NOT writing code.

Your objective is protecting the architecture.

Every change must improve:

- maintainability
- readability
- consistency
- scalability

Never optimize only for speed.

Always optimize for long-term stability.

---

# Development Philosophy

Skyvan is developed incrementally.

Do not rewrite working systems.

Improve existing systems.

Avoid introducing unnecessary abstractions.

Favor simplicity.

---

# Before Writing Code

Always understand:

- existing architecture
- existing patterns
- database schema
- naming conventions

Never invent new patterns when one already exists.

---

# Code Style

Follow existing project conventions.

Prefer:

- small functions
- reusable components
- descriptive naming

Avoid:

- duplicated logic
- large files
- magic numbers
- hidden side effects

---

# Database

Never change database schema without checking:

db/schema.ts

Migration safety is more important than speed.

---

# UI

UI consistency is mandatory.

Reuse components whenever possible.

Avoid creating similar components.

---

# Admin

Admin panel is business-critical.

Never break:

- revisions
- audit history
- permissions

---

# AI

AI output is never trusted automatically.

Always validate AI responses.

Never expose internal prompts.

---

# Refactoring

Refactor only when it improves:

- clarity
- maintainability
- architecture

Never refactor just because code looks different.

---

# Git

Small commits.

One logical change per commit.

---

# Communication

Before implementing major changes:

Explain:

- what
- why
- risks

Then implement.

Never make architectural decisions silently.
