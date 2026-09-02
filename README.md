# Notes API

A progressive Node.js project for learning system design. Version 0.2 is an intentionally small monolith with durable SQLite storage.

## Run locally

```bash
npm install
npm test
npm run dev
```

The API listens on `http://localhost:3000` by default.
Notes are saved in `data/notes.db` and survive server restarts. Set `DATABASE_PATH` to use another database file.

## Try it

```bash
curl -X POST http://localhost:3000/notes \
  -H "content-type: application/json" \
  -d '{"title":"Latency","content":"Time required to complete one operation."}'

curl http://localhost:3000/notes
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check process health |
| `POST` | `/notes` | Create a note |
| `GET` | `/notes` | List and search notes |
| `GET` | `/notes/:id` | Read a note |
| `PATCH` | `/notes/:id` | Update a note |
| `DELETE` | `/notes/:id` | Delete a note |

See [`docs/requirements.md`](docs/requirements.md) and [`docs/architecture.md`](docs/architecture.md) before changing the implementation.

