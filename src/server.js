import { createApp } from "./app.js";
import { mkdirSync } from "node:fs";
import { SqliteNoteStore } from "./store/sqlite-note-store.js";

const port = Number(process.env.PORT ?? 3000);
const databasePath = process.env.DATABASE_PATH ?? "data/notes.db";

mkdirSync("data", { recursive: true });
const store = new SqliteNoteStore(databasePath);
const app = createApp({ store });

const server = app.listen(port, () => {
  console.log(`Notes API listening on http://localhost:${port}`);
  console.log(`Data is stored in ${databasePath}`);
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

