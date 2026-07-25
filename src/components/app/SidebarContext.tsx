"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const Ctx = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("kd-sidebar") === "1");
  }, []);

  const toggle = () =>
    setCollapsed((v) => {
      const nv = !v;
      localStorage.setItem("kd-sidebar", nv ? "1" : "0");
      return nv;
    });

  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
