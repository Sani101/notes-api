# Architecture: version 0.2

```text
Client -> Express HTTP application -> SqliteNoteStore -> data/notes.db
```

The application remains a monolith: routing, validation, business flow, and database access run in one Node.js process. SQLite provides durable local storage without operating a separate database server.

The route layer depends on a small store interface rather than directly using SQLite. The original memory store remains useful for fast HTTP tests. A later PostgreSQL store can implement the same operations while the HTTP contract stays stable.

## Current trade-offs

- SQLite is simple and durable on one machine, but it is not shared storage for horizontally scaled API instances.
- Offset pagination is easy to understand, but becomes inefficient and potentially inconsistent on large, frequently changing datasets.
- `LIKE` substring search is sufficient for learning, but a larger system may need database full-text search or a search service.
- Random UUIDs avoid coordination when generating IDs, but use more space than small sequential integers.
- WAL mode improves read/write concurrency, but SQLite still has one writer at a time.

## First scaling boundary

The database file lives on one machine. Multiple local processes could share it, but multiple machines cannot safely share a local path. A database server such as PostgreSQL is the next storage step before horizontal scaling.

