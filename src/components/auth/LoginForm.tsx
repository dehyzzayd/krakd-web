"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Field, OrDivider, SocialRow, BTN_PRIMARY } from "./AuthScaffold";
import { authApi, setSession, ApiError } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const tokens = await authApi.login({ email, password });
      setSession(tokens);
      // route by role, honoring an explicit ?next= — but /admin is PLATFORM_ADMIN only
      let dest = "/dashboard";
      try {
        const me = await authApi.me();
        const isAdmin = me.role === "PLATFORM_ADMIN";
        const next = new URLSearchParams(window.location.search).get("next");
        if (next && next.startsWith("/admin")) dest = isAdmin ? next : "/dashboard";
        else if (next && next.startsWith("/")) dest = next;
        else dest = isAdmin ? "/admin" : "/dashboard";
      } catch { /* fall back to dashboard */ }
      router.push(dest);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">Sign in</h1>
      <p className="mt-2 text-[15px] text-muted">Welcome back. Enter your details to continue.</p>

      <div className="mt-8"><SocialRow /></div>
      <div className="my-7"><OrDivider /></div>

      <form className="space-y-5" onSubmit={submit}>
        <Field id="email" label="Email" type="email" placeholder="john@dealership.com" autoComplete="email" value={email} onChange={setEmail} />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-[14px] font-medium text-ink">Password</label>
            <a href="/reset" className="text-[13px] font-medium text-muted hover:text-ink">Forgot?</a>
          </div>
          <div className="relative">
            <input id="password" name="password" type={showPw ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-[12px] bg-[#f4f4f5] px-4 pr-12 text-[15px] text-ink outline-none ring-1 ring-black/[0.04] transition placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-ink/25" />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-muted transition hover:text-ink">
              {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
        {err && <p className="text-[13px] font-medium text-[#dc2626]">{err}</p>}
        <button type="submit" disabled={busy} className={`${BTN_PRIMARY} mt-2 w-full disabled:opacity-60`}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        New to Krakd?{" "}
        <a href="/signup" className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70">Create an account</a>
      </p>
    </div>
  );
}
