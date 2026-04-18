"use client";

import dynamic from "next/dynamic";
import { useState, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const App = dynamic(() => import("../../src/App"), { ssr: false });

export default function ClientShell() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // useLayoutEffect runs client-only (before paint) and re-runs on navigation,
  // so client-side route changes to /login correctly boot the SPA.
  useLayoutEffect(() => {
    if (
      document.documentElement.hasAttribute("data-authed") ||
      pathname !== "/"
    ) {
      setReady(true);
    }
  }, [pathname]);

  if (!ready) return null;
  return <App />;
}
