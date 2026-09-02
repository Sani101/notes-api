# Requirements

## Scope for version 0.1

The Notes API lets a single anonymous user create, read, update, delete, list, and search notes. Data is stored in a local SQLite database and survives process restarts.

Tags, authentication, PostgreSQL, caching, and distributed deployment are later milestones.

## Functional requirements

- Create a note with a non-empty title and string content.
- Retrieve a note by its ID.
- Update a note's title or content.
- Delete a note.
- List notes with bounded offset pagination.
- Search titles and content using a case-insensitive substring.

## Non-functional requirements

- Return JSON using consistent success and error envelopes.
- Reject oversized JSON bodies and invalid inputs.
- Avoid leaking framework information in response headers.
- Remain easy to test without opening a fixed network port.

## Out of scope

- User accounts and authorization
- Backups and replicated storage
- Multiple service instances
- Strong availability guarantees
- Production deployment

