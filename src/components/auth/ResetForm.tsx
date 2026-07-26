"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Field, BTN_PRIMARY } from "./AuthScaffold";
import { authApi, ApiError } from "@/lib/api";

export function ResetForm() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try { await authApi.forgotPassword(email); setSent(true); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try { await authApi.resetPassword(token!, password); router.push("/login"); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not reset your password."); }
    finally { setBusy(false); }
  };

  // Mode 2: opened from the email link → set a new password.
  if (token) {
    return (
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">Set a new password</h1>
        <p className="mt-2 text-[15px] text-muted">Choose a new password for your account.</p>
        <form className="mt-8 space-y-5" onSubmit={doReset}>
          <Field id="password" label="New password" type="password" placeholder="Enter a new password" autoComplete="new-password" hint="At least 8 characters" value={password} onChange={setPassword} />
          {err && <p className="text-[13px] font-medium text-[#dc2626]">{err}</p>}
          <button type="submit" disabled={busy} className={`${BTN_PRIMARY} mt-2 w-full disabled:opacity-60`}>{busy ? "Saving…" : "Save new password"}</button>
        </form>
      </div>
    );
  }

  // Mode 1: request a reset link.
  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">Reset your password</h1>
      <p className="mt-2 text-[15px] text-muted">Enter the email on your account and we&apos;ll send you a reset link.</p>
      {sent ? (
        <p className="mt-8 rounded-[12px] border border-[#bbe7cf] bg-[#f0fbf5] px-4 py-3 text-[14px] text-[#1e9e5a]">
          ✓ Check your inbox — if an account exists for <b>{email}</b>, a reset link is on its way (expires in 30 min).
        </p>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={requestReset}>
          <Field id="email" label="Email" type="email" placeholder="john@dealership.com" autoComplete="email" value={email} onChange={setEmail} />
          {err && <p className="text-[13px] font-medium text-[#dc2626]">{err}</p>}
          <button type="submit" disabled={busy} className={`${BTN_PRIMARY} mt-2 w-full disabled:opacity-60`}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-6 text-center text-[14px] text-muted">
        Remembered it?{" "}
        <a href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70">Back to sign in</a>
      </p>
    </div>
  );
}
