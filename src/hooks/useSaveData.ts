"use client";

import { useEffect, useState } from "react";

/**
 * Pure helper — given the shape of `navigator.connection`, decide whether the
 * user is on a constrained connection. Exported separately so it can be
 * unit-tested without DOM/Vitest renderHook infrastructure.
 */
export function isSlowConnection(conn: NetworkInformation | undefined): boolean {
  if (!conn) return false;
  if (conn.saveData === true) return true;
  return (
    conn.effectiveType === "slow-2g" ||
    conn.effectiveType === "2g" ||
    conn.effectiveType === "3g"
  );
}

/**
 * Detects whether the current visitor is on a constrained connection — Data
 * Saver toggled on, or an `effectiveType` of "2g"/"slow-2g"/"3g".
 *
 * Used to gate cosmetic animations, eager prefetches, and large image loads
 * so emerging-market users on slow 3G + cheap Android phones get a leaner
 * experience automatically.
 *
 * Returns false on the server and on first render — the real value is set
 * after mount. The gate is applied to non-critical effects only, so the
 * brief mismatch is fine.
 */
export function useSaveData(): boolean {
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!conn) return;
    const update = () => setSaveData(isSlowConnection(conn));
    update();
    conn.addEventListener?.("change", update);
    return () => conn.removeEventListener?.("change", update);
  }, []);

  return saveData;
}

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}
