// Client for the Krakd platform API (krakd-api / NestJS).
// Base URL is env-driven so the same build points at localhost or the deployed API.

// Same-origin by default — the API lives in this Next app under /api/v1.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api/v1";

const TOKEN_KEY = "krakd_token";
const REFRESH_KEY = "krakd_refresh";

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(t: { accessToken: string; refreshToken?: string }) {
  window.localStorage.setItem(TOKEN_KEY, t.accessToken);
  if (t.refreshToken) window.localStorage.setItem(REFRESH_KEY, t.refreshToken);
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

/** Snapshot the current tokens (used to restore an admin session after impersonating a client). */
export function snapshotSession(): { accessToken: string; refreshToken?: string } | null {
  if (typeof window === "undefined") return null;
  const accessToken = window.localStorage.getItem(TOKEN_KEY);
  if (!accessToken) return null;
  return { accessToken, refreshToken: window.localStorage.getItem(REFRESH_KEY) ?? undefined };
}

// Refresh the access token using the stored refresh token. Shared in-flight
// promise so concurrent 401s trigger a single refresh, not a storm.
let refreshing: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (refreshing) return refreshing;
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken }) });
      if (!res.ok) return false;
      setSession(await res.json());
      return true;
    } catch { return false; }
  })();
  const ok = await refreshing;
  refreshing = null;
  return ok;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const run = () => fetch(`${API_URL}${path}`, {
    ...opts,
    credentials: "same-origin", // send/receive the OTP cookie
    headers: {
      "content-type": "application/json",
      ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  let res = await run();
  // access token expired → silently refresh once and retry (keeps the session alive)
  if (res.status === 401 && !path.startsWith("/auth/") && typeof window !== "undefined" && window.localStorage.getItem(REFRESH_KEY)) {
    if (await refreshSession()) res = await run();
    else clearSession();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.message as string)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(", ") : msg, data);
  }
  return data as T;
}

type Tokens = { accessToken: string; refreshToken: string; tokenType: string };

export const authApi = {
  register: (body: {
    dealershipName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    accessCode?: string;
    vertical?: string;
  }) => apiFetch<Tokens>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch<Tokens>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => apiFetch<{ userId: string; dealershipId: string; role: string; email: string }>("/auth/me"),

  forgotPassword: (email: string) =>
    apiFetch<{ ok: true }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ ok: true }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  sendOtp: (email: string) =>
    apiFetch<{ ok: true }>("/auth/send-otp", { method: "POST", body: JSON.stringify({ email }) }),

  verifyOtp: (code: string) =>
    apiFetch<{ ok: true }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ code }) }),

  updateAiSettings: (body: Record<string, unknown>) =>
    apiFetch("/ai/settings", { method: "PATCH", body: JSON.stringify(body) }),
};
