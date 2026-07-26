// Client for the Krakd platform API (krakd-api / NestJS).
// Base URL is env-driven so the same build points at localhost or the deployed API.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";

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

export async function apiFetch<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
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
  }) => apiFetch<Tokens>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch<Tokens>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => apiFetch<{ userId: string; dealershipId: string; role: string; email: string }>("/auth/me"),
};
