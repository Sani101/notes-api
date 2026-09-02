import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export class SqliteNoteStore {
  #database;

  constructor(filename) {
    this.#database = new DatabaseSync(filename);
    this.#database.exec("PRAGMA journal_mode = WAL;");
    this.#database.exec("PRAGMA foreign_keys = ON;");
    this.#migrate();
  }

  #migrate() {
    const version = this.#database.prepare("PRAGMA user_version").get().user_version;

    if (version < 1) {
      this.#database.exec(`
        BEGIN;

        CREATE TABLE notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
          content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX notes_created_at_idx ON notes (created_at DESC);

        PRAGMA user_version = 1;
        COMMIT;
      `);
    }
  }

  create({ title, content }) {
    const timestamp = new Date().toISOString();
    const note = {
      id: randomUUID(),
      title,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.#database
      .prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(note.id, note.title, note.content, note.createdAt, note.updatedAt);

    return note;
  }

  findById(id) {
    const row = this.#database
      .prepare(`
        SELECT id, title, content, created_at AS createdAt, updated_at AS updatedAt
        FROM notes
        WHERE id = ?
      `)
      .get(id);

    return row ? { ...row } : null;
  }

  list({ limit, offset, query }) {
    const pattern = `%${query.toLowerCase()}%`;
    const whereClause = "WHERE lower(title) LIKE ? OR lower(content) LIKE ?";

    const rows = this.#database
      .prepare(`
        SELECT id, title, content, created_at AS createdAt, updated_at AS updatedAt
        FROM notes
        ${whereClause}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
      `)
      .all(pattern, pattern, limit, offset);

    const { total } = this.#database
      .prepare(`SELECT count(*) AS total FROM notes ${whereClause}`)
      .get(pattern, pattern);

    return {
      items: rows.map((row) => ({ ...row })),
      page: { limit, offset, total, hasMore: offset + limit < total },
    };
  }

  update(id, changes) {
    const current = this.findById(id);
    if (!current) return null;

    const updated = {
      ...current,
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    this.#database
      .prepare(`
        UPDATE notes
        SET title = ?, content = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(updated.title, updated.content, updated.updatedAt, id);

    return updated;
  }

  delete(id) {
    return this.#database.prepare("DELETE FROM notes WHERE id = ?").run(id).changes === 1;
  }

  close() {
    this.#database.close();
  }
}

