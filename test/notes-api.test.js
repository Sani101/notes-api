import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));

async function jsonRequest(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

test("health endpoint reports the service is running", async () => {
  const { response, body } = await jsonRequest("/health");
  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: "ok" });
});

test("a note can be created, read, updated, listed, and deleted", async () => {
  const created = await jsonRequest("/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Caching", content: "Caches trade freshness for speed." }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.data.title, "Caching");
  const id = created.body.data.id;

  const read = await jsonRequest(`/notes/${id}`);
  assert.equal(read.response.status, 200);
  assert.equal(read.body.data.content, "Caches trade freshness for speed.");

  const updated = await jsonRequest(`/notes/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: "A cache can reduce latency and backend load." }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.content, "A cache can reduce latency and backend load.");

  const listed = await jsonRequest("/notes?query=cache&limit=10");
  assert.equal(listed.response.status, 200);
  assert.equal(listed.body.data.length, 1);
  assert.equal(listed.body.page.total, 1);

  const deleted = await jsonRequest(`/notes/${id}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 204);

  const missing = await jsonRequest(`/notes/${id}`);
  assert.equal(missing.response.status, 404);
});

test("invalid input returns a consistent validation error", async () => {
  const { response, body } = await jsonRequest("/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "", content: 42 }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(body.error.details.length, 2);
});

test("pagination parameters are bounded", async () => {
  const { response, body } = await jsonRequest("/notes?limit=1000");
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_PAGINATION");
});

