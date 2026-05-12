"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../src/lib/supabase";
import MobileTabBar from "../../src/components/MobileTabBar";
import { buildPath } from "../../src/lib/router";

// Standalone Next.js route prefixes (everything else falls through to the SPA
// at /[[...slug]], which renders its own MobileTabBar inside AuthedApp).
const STANDALONE_PREFIXES = [
  "/about",
  "/ai",
  "/blog",
  "/books",
  "/forum",
  "/messianic-prophecies",
  "/plans",
  "/promo",
  "/share",
  "/songs",
  "/study-topics",
  "/es/songs",
];

function isStandalonePath(pathname: string): boolean {
  return STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// Map the standalone path to a key that MobileTabBar's TAB_ACTIVE_MAP knows.
function pathToCurrentPage(pathname: string): string {
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/forum")) return "forum";
  if (pathname.startsWith("/books")) return "bookDetail";
  if (pathname.startsWith("/plans")) return "readingPlans";
  if (pathname.startsWith("/study-topics")) return "studyTopics";
  if (pathname.startsWith("/about")) return "about";
  return "more";
}

export default function AuthedMobileTabBar() {
  const pathname = usePathname() ?? "";
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setIsModerator(false);
      return;
    }
    supabase
      .from("profiles")
      .select("is_admin, is_moderator")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data?.is_admin);
        setIsModerator(!!data?.is_moderator);
      });
  }, [userId]);

  if (!isStandalonePath(pathname)) return null;
  if (!userId) return null;

  const navigate = (page: string, params: Record<string, unknown> = {}) => {
    const url = page === "home" ? "/" : buildPath(page, params);
    window.location.href = url;
  };

  return (
    <>
      <MobileTabBar
        navigate={navigate}
        currentPage={pathToCurrentPage(pathname)}
        userId={userId}
        isAdmin={isAdmin}
        isModerator={isModerator}
      />
      <div
        aria-hidden="true"
        className="hidden h-[var(--mobile-tabbar-h)] max-[1100px]:block"
      />
    </>
  );
}
