import express from "express";
import { MemoryNoteStore } from "./store/memory-note-store.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function errorResponse(code, message, details) {
  return { error: { code, message, ...(details && { details }) } };
}

function validateNote(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push({ field: "title", message: "Title is required." });
    } else if (body.title.trim().length > 200) {
      errors.push({ field: "title", message: "Title must be 200 characters or fewer." });
    }
  }

  if (!partial || Object.hasOwn(body, "content")) {
    if (typeof body.content !== "string") {
      errors.push({ field: "content", message: "Content must be a string." });
    }
  }

  if (partial && !Object.hasOwn(body, "title") && !Object.hasOwn(body, "content")) {
    errors.push({ field: "body", message: "Provide title or content to update." });
  }

  return errors;
}

function parseNonNegativeInteger(value, fallback) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function createApp({ store = new MemoryNoteStore() } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/notes", (request, response) => {
    const errors = validateNote(request.body);
    if (errors.length > 0) {
      return response.status(400).json(errorResponse("VALIDATION_ERROR", "Invalid note.", errors));
    }

    const note = store.create({
      title: request.body.title.trim(),
      content: request.body.content,
    });

    return response.status(201).location(`/notes/${note.id}`).json({ data: note });
  });

  app.get("/notes", (request, response) => {
    const limit = parseNonNegativeInteger(request.query.limit, DEFAULT_LIMIT);
    const offset = parseNonNegativeInteger(request.query.offset, 0);

    if (limit === null || limit < 1 || limit > MAX_LIMIT || offset === null) {
      return response.status(400).json(
        errorResponse(
          "INVALID_PAGINATION",
          `Limit must be between 1 and ${MAX_LIMIT}; offset must be zero or greater.`,
        ),
      );
    }

    const result = store.list({
      limit,
      offset,
      query: typeof request.query.query === "string" ? request.query.query.trim() : "",
    });

    return response.json({ data: result.items, page: result.page });
  });

  app.get("/notes/:id", (request, response) => {
    const note = store.findById(request.params.id);
    if (!note) {
      return response.status(404).json(errorResponse("NOTE_NOT_FOUND", "Note not found."));
    }

    return response.json({ data: note });
  });

  app.patch("/notes/:id", (request, response) => {
    const errors = validateNote(request.body, { partial: true });
    if (errors.length > 0) {
      return response.status(400).json(errorResponse("VALIDATION_ERROR", "Invalid note.", errors));
    }

    const changes = {};
    if (Object.hasOwn(request.body, "title")) changes.title = request.body.title.trim();
    if (Object.hasOwn(request.body, "content")) changes.content = request.body.content;

    const note = store.update(request.params.id, changes);
    if (!note) {
      return response.status(404).json(errorResponse("NOTE_NOT_FOUND", "Note not found."));
    }

    return response.json({ data: note });
  });

  app.delete("/notes/:id", (request, response) => {
    if (!store.delete(request.params.id)) {
      return response.status(404).json(errorResponse("NOTE_NOT_FOUND", "Note not found."));
    }

    return response.status(204).send();
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return response.status(400).json(errorResponse("INVALID_JSON", "Request body contains invalid JSON."));
    }

    console.error(error);
    return response.status(500).json(errorResponse("INTERNAL_ERROR", "An unexpected error occurred."));
  });

  return app;
}

