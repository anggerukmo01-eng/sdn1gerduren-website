export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("Cookie") || "";
  const storedState = cookieHeader.match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];
  if (!state || state !== storedState) {
    return new Response("Invalid state parameter", { status: 403 });
  }
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  const access_token = data.access_token;
  // Decap CMS 3.x requires a two-step postMessage handshake:
  // 1) this popup first posts "authorizing:github" to the admin page,
  // 2) the admin page echoes that message back,
  // 3) only then does this popup post "authorization:github:success:{...}".
  // Posting only the success message (the previous version) is silently
  // ignored by Decap, which is why the callback page stayed blank and
  // /admin never logged in. The token is embedded as JSON and the
  // "<" character is escaped so it cannot break out of the script tag.
  const payload = JSON.stringify(
    access_token
      ? { token: access_token, provider: "github" }
      : { error: data.error || "token_exchange_failed", provider: "github" },
  ).replace(/</g, "\\u003c");
  const status = access_token ? "success" : "error";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Login Decap CMS</title></head><body><p>Login berhasil, jendela ini akan tertutup otomatis. Jika tidak, tutup jendela ini secara manual.</p><script>(function () { function receiveMessage(e) { window.opener.postMessage('authorization:github:${status}:' + '${payload}', e.origin); } window.addEventListener('message', receiveMessage, false); window.opener.postMessage('authorizing:github', '*'); })();</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Set-Cookie": "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}
