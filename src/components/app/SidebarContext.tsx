"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const Ctx = createContext<{ collapsed: boolean; toggle: () => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void }>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("kd-sidebar") === "1");
  }, []);

  const toggle = () =>
    setCollapsed((v) => {
      const nv = !v;
      localStorage.setItem("kd-sidebar", nv ? "1" : "0");
      return nv;
    });

  return <Ctx.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
