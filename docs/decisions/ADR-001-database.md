# ADR-001: Database Selection

## Context

DocFlow needs to store:
- Users
- Projects
- GitHub repositories
- Documentation versions
- Repository changes
- Agent jobs
- Generated documentation

Documentation itself has a semi-structured format.

## Options
1. PostgreSQL
2. MongoDB
3. PostgreSQL + JSONB

## Decision
PostgreSQL + JSONB.

## Why?
PostgreSQL gives us strong relationships between:

User → Project → Repository → Commit → Documentation

while JSONB allows documentation structures to evolve without
requiring a migration for every small schema change.

## Trade-offs

Advantages:
- Strong relational integrity
- Transactions
- Flexible documentation structure
- Good querying capabilities

Disadvantages:
- More schema design than MongoDB
- JSONB can become difficult to query if overused

## Consequences

Relational metadata will use normal PostgreSQL tables.
Generated documentation content will be stored in JSONB.