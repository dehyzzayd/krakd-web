"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, OrDivider, SocialRow, BTN_PRIMARY } from "./AuthScaffold";

/** Personal details. The account is actually created at the end of onboarding
 *  (once we also have the dealership name), so we stash these for that step. */
export function SignUpForm() {
  const router = useRouter();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.firstName || !f.lastName) return setErr("Enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setErr("Enter a valid email.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    sessionStorage.setItem("krakd_signup", JSON.stringify(f));
    router.push("/onboarding");
  };

  return (
    <div>
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-ink">Create your account</h1>
      <p className="mt-2 text-[15px] text-muted">Enter your details to get started — no card required.</p>

      <div className="mt-8"><SocialRow /></div>
      <div className="my-7"><OrDivider /></div>

      <form className="space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-4">
          <Field id="firstName" label="First name" placeholder="John" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} />
          <Field id="lastName" label="Last name" placeholder="Francisco" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} />
        </div>
        <Field id="email" label="Email" type="email" placeholder="john@dealership.com" autoComplete="email" value={f.email} onChange={set("email")} />
        <Field id="password" label="Password" type="password" placeholder="Enter your password" autoComplete="new-password" hint="Must be at least 8 characters" value={f.password} onChange={set("password")} />
        {err && <p className="text-[13px] font-medium text-[#dc2626]">{err}</p>}
        <button type="submit" className={`${BTN_PRIMARY} mt-2 w-full`}>Create account</button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70">Log in</a>
      </p>
    </div>
  );
}
