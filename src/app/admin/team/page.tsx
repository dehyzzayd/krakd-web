"use client";

const ROLES = [
  ["Super Admin", "All accounts, permissions, billing overrides, audit logs and system configuration."],
  ["Operations / Product", "Client profiles, onboarding, services, tasks, notes and platform troubleshooting."],
  ["Ads Manager", "Campaigns, budgets, channel status, performance and approved budget changes."],
  ["Finance", "Subscriptions, invoices, failed payments, credits, refunds and domain charges."],
  ["Support", "Client profiles, activity, safe troubleshooting and notes; no sensitive financial changes."],
];

export default function AdminTeam() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-6">
      <h1 className="text-[22px] font-bold tracking-tight text-n900">Team & access</h1>
      <p className="text-[13px] text-n500">Role-based internal access. Sensitive actions (refunds, overrides, suspensions) require elevated permission and are audited.</p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-n200 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-n500"><th className="px-4 py-3">Role</th><th className="px-4 py-3">Recommended access</th></tr></thead>
          <tbody>{ROLES.map(([r, a]) => <tr key={r} className="border-b border-n100 last:border-0"><td className="px-4 py-3 font-semibold text-n900">{r}</td><td className="px-4 py-3 text-n600">{a}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-4 text-[12px] text-n400">Security baseline: least-privilege access, audit logs, session timeout, optional 2FA, and strict separation of internal notes from client-visible data. Staff accounts are provisioned by a Super Admin.</p>
    </div>
  );
}
