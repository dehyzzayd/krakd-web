---
name: browser-truth-testing
description: "Guardrails for web auth, cookies, sessions, CORS, and env-dependent behavior — and the rule that curl/programmatic tests do NOT prove a browser flow works. Use when: cookies, Set-Cookie, secure/sameSite/httpOnly, sessions, JWT in cookies, login/signup/OTP/password-reset flows, CORS, fetch credentials, next start vs next dev, NODE_ENV-conditional code, 'works in curl but not the browser'."
---

# Browser-truth testing & cookie/session gotchas

A green `curl` is **not** proof a browser flow works. curl and most programmatic HTTP clients ignore browser security semantics — so bugs in anything cookie/session/CORS/auth-related slip straight through a passing curl test. Reason about the browser, or test in one.

## The rule that got violated (never again)

**A cookie was set `secure: true` based on `NODE_ENV`. `next start` runs in production mode, so on `http://localhost` the cookie was `secure` — the browser silently dropped it, and OTP verify saw no cookie. curl passed because curl ignores the `secure` flag.** Result: "works in my test, broken for the user."

## Cookie checklist (auth/session/OTP/CSRF cookies)

- **`secure`**: key it to the *actual request protocol*, NOT `NODE_ENV`.
  ```ts
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  res.cookies.set(name, value, { secure: proto === "https", httpOnly: true, sameSite: "lax", path: "/", maxAge });
  ```
  Why: `next start` (and many prod-mode local runs) make `NODE_ENV==="production"` true on `http://localhost`, so a `NODE_ENV`-gated `secure` cookie is unsendable in the local browser.
- **`httpOnly: true`** for anything the client JS shouldn't read (session/OTP/refresh tokens).
- **`sameSite`**: `lax` is the safe default for same-site POST fetch. `none` REQUIRES `secure` (so `none` breaks on http). Cross-site cookies need `sameSite: "none"; secure: true` + HTTPS.
- **`path`** and **`maxAge`/`expires`** set intentionally.
- Client `fetch` must send/receive cookies: `credentials: "same-origin"` (same-origin) or `"include"` (cross-origin, and then CORS must allow credentials).

## Environment gotchas

- **`next start` = production mode locally** → any `if (NODE_ENV === "production")` branch runs on your http localhost. Test both `dev` and `start`, or make the branch depend on the real signal (protocol, header), not the mode.
- `NEXT_PUBLIC_*` are **baked at build time** — changing them requires a **redeploy/rebuild**, not just an env edit.
- Same-origin (`/api/...`) avoids CORS and cookie-sending headaches entirely — prefer it over cross-origin API calls when you can.

## When you can't open a real browser

You often can't (headless, CI, this tool). Then **explicitly reason about the browser delta** before declaring success — don't trust the curl green. Ask:

- Does this rely on a **cookie** the browser must store/return? Check `secure` vs the URL scheme, `sameSite`, `httpOnly`, and `credentials` on the fetch. curl with `-c/-b` ignores `secure` and `sameSite` — it will pass where the browser fails.
- Is it **cross-origin**? Then there's a CORS preflight + `Access-Control-Allow-Credentials` the browser enforces and curl skips.
- **Mixed content** (https page → http API) is blocked by the browser, not curl.
- **Redirects / OAuth / SameSite on top-level navigation** behave differently than a fetch.

If any of these apply, either drive a real browser (Playwright/headless Chrome with a real cookie store), or state the assumption and the browser-specific risk in the summary instead of claiming it "works."

## Quick self-check before saying "it works"

1. Did I test the thing the user actually uses (a browser), or only curl?
2. For cookies: is `secure` tied to protocol, not mode? Does `credentials` send them?
3. For env: does this behave the same under `next dev` and `next start` / on http and https?
4. If I only have curl, did I name the browser-specific risks rather than overclaiming?
