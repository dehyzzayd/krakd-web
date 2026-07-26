"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, OrDivider, SocialRow, BTN_PRIMARY } from "./AuthScaffold";
import { authApi, setSession, ApiError } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const tokens = await authApi.login({ email, password });
      setSession(tokens);
      router.push("/dashboard");
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
        <Field
          id="password" label="Password" type="password" placeholder="Enter your password" autoComplete="current-password"
          value={password} onChange={setPassword}
          trailing={<a href="/reset" className="text-[13px] font-medium text-muted hover:text-ink">Forgot?</a>}
        />
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
