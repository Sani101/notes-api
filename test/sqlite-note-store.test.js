import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { SqliteNoteStore } from "../src/store/sqlite-note-store.js";

test("notes survive closing and reopening the database", () => {
  const directory = mkdtempSync(join(tmpdir(), "notes-api-"));
  const filename = join(directory, "notes.db");

  try {
    const firstStore = new SqliteNoteStore(filename);
    const created = firstStore.create({ title: "Durability", content: "Saved on disk." });
    firstStore.close();

    const secondStore = new SqliteNoteStore(filename);
    const restored = secondStore.findById(created.id);
    secondStore.close();

    assert.equal(restored.title, "Durability");
    assert.equal(restored.content, "Saved on disk.");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("SQLite store supports search, updates, and deletion", () => {
  const store = new SqliteNoteStore(":memory:");

  try {
    const first = store.create({ title: "Indexes", content: "Speed up selected reads." });
    store.create({ title: "Queues", content: "Decouple background work." });

    const result = store.list({ limit: 10, offset: 0, query: "INDEX" });
    assert.equal(result.page.total, 1);
    assert.equal(result.items[0].id, first.id);

    const updated = store.update(first.id, { content: "Indexes exchange write cost for read speed." });
    assert.equal(updated.content, "Indexes exchange write cost for read speed.");

    assert.equal(store.delete(first.id), true);
    assert.equal(store.findById(first.id), null);
  } finally {
    store.close();
  }
});

