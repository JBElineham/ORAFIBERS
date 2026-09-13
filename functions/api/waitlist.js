const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validEmail = (s) => typeof s === "string" && s.length <= 254 && EMAIL.test(s);

// ponytail: no rate limiting beyond the honeypot. If bots get through, put Turnstile on the form.
export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const reply = (ok, status) =>
    wantsJson
      ? Response.json({ ok }, { status })
      : Response.redirect(new URL(ok ? "/?joined=1" : "/?error=1", request.url).href, 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(false, 400);
  }

  if (form.get("company")) return reply(true, 200); // honeypot filled: act like it worked so bots move on

  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!validEmail(email)) return reply(false, 400);

  // Keyed by email, so a repeat signup overwrites instead of duplicating.
  await env.WAITLIST.put(email, JSON.stringify({ at: new Date().toISOString(), country: request.cf?.country ?? null }));
  return reply(true, 200);
}
