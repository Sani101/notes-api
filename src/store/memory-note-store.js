import { randomUUID } from "node:crypto";

export class MemoryNoteStore {
  #notes = new Map();

  create({ title, content }) {
    const timestamp = new Date().toISOString();
    const note = {
      id: randomUUID(),
      title,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.#notes.set(note.id, note);
    return structuredClone(note);
  }

  findById(id) {
    const note = this.#notes.get(id);
    return note ? structuredClone(note) : null;
  }

  list({ limit, offset, query }) {
    const normalizedQuery = query.toLowerCase();
    const matchingNotes = [...this.#notes.values()]
      .filter((note) =>
        `${note.title} ${note.content}`.toLowerCase().includes(normalizedQuery),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      items: structuredClone(matchingNotes.slice(offset, offset + limit)),
      page: {
        limit,
        offset,
        total: matchingNotes.length,
        hasMore: offset + limit < matchingNotes.length,
      },
    };
  }

  update(id, changes) {
    const current = this.#notes.get(id);
    if (!current) return null;

    const updated = {
      ...current,
      ...changes,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.#notes.set(id, updated);
    return structuredClone(updated);
  }

  delete(id) {
    return this.#notes.delete(id);
  }
}

