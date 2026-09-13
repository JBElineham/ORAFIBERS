import assert from "node:assert/strict";
import { validEmail, onRequestPost } from "./waitlist.js";

assert.ok(validEmail("sari@orafibres.com"));
for (const bad of ["", "no-at.com", "a@b", "a b@c.com", "x".repeat(250) + "@a.co", null]) assert.ok(!validEmail(bad), bad);

const store = new Map();
const env = { WAITLIST: { put: async (k, v) => store.set(k, v) } };
const post = (fields) => {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return onRequestPost({ request: new Request("https://x.test/api/waitlist", { method: "POST", body, headers: { accept: "application/json" } }), env });
};

assert.equal((await post({ email: "  Sari@OraFibres.com " })).status, 200);
assert.ok(store.has("sari@orafibres.com"));
assert.equal((await post({ email: "nope" })).status, 400);
assert.equal((await post({ email: "bot@spam.com", company: "x" })).status, 200);
assert.ok(!store.has("bot@spam.com"));

console.log("waitlist ok");
