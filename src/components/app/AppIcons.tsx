/** Minimal, geometric nav icons — 20px grid, 1.6 stroke, currentColor. */
type P = { className?: string };
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 20 20",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconOverview = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="3" y="3" width="6" height="6" rx="1.4" /><rect x="11" y="3" width="6" height="6" rx="1.4" />
    <rect x="3" y="11" width="6" height="6" rx="1.4" /><rect x="11" y="11" width="6" height="6" rx="1.4" />
  </svg>
);
export const IconInventory = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M3 7l7-3.5L17 7v6l-7 3.5L3 13z" /><path d="M3 7l7 3.5L17 7M10 10.5V17" />
  </svg>
);
export const IconWebsite = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2 2.2 2 11.8 0 14M10 3c-2 2.2-2 11.8 0 14" />
  </svg>
);
export const IconLeads = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <circle cx="7.5" cy="7" r="2.6" /><path d="M3 16.5a4.5 4.5 0 0 1 9 0" />
    <path d="M13.5 5.4a2.6 2.6 0 0 1 0 5M14.5 16.5a4.5 4.5 0 0 0-2.2-3.9" />
  </svg>
);
export const IconInbox = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8l7 4 7-4" />
  </svg>
);
export const IconMarketing = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M4 8v4l9 4V4L4 8z" /><path d="M4 8H3.2A1.2 1.2 0 0 0 2 9.2v1.6A1.2 1.2 0 0 0 3.2 12H4M7 13v2.5" /><path d="M16 8.5a2 2 0 0 1 0 3" />
  </svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="3" y="4.5" width="14" height="12" rx="2" /><path d="M3 8h14M7 3v3M13 3v3" /><circle cx="10" cy="12" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
export const IconReports = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M3 17h14" /><rect x="4.5" y="10" width="3" height="5" rx="0.8" /><rect x="8.5" y="6.5" width="3" height="8.5" rx="0.8" /><rect x="12.5" y="8.5" width="3" height="6.5" rx="0.8" />
  </svg>
);
export const IconAI = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4A2.5 2.5 0 0 1 13.5 13H8l-3.6 3v-3H6a2 2 0 0 1-2-2z" />
    <circle cx="7" cy="8.5" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8.5" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="13" cy="8.5" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M3 6h9M15 6h2M3 14h2M8 14h9" /><circle cx="13.5" cy="6" r="2" /><circle cx="6.5" cy="14" r="2" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <circle cx="9" cy="9" r="5.2" /><path d="m17 17-3.4-3.4" />
  </svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <path d="M6 9a4 4 0 0 1 8 0c0 3 1 4.5 1.5 5H4.5C5 13.5 6 12 6 9z" /><path d="M8.5 17a1.7 1.7 0 0 0 3 0" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p} aria-hidden><path d="M10 4v12M4 10h12" /></svg>
);
export const IconChevron = (p: P) => (
  <svg {...base} {...p} aria-hidden><path d="m6 8 4 4 4-4" /></svg>
);
export const IconPanel = (p: P) => (
  <svg {...base} {...p} aria-hidden>
    <rect x="3" y="4.5" width="14" height="11" rx="2" /><path d="M8 4.5v11" />
  </svg>
);
