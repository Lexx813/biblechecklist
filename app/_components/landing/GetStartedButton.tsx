"use client";

/**
 * Thin client island: clicking triggers the SPA auth flow by pushing
 * to /login which the ClientShell picks up.
 */
export function GetStartedButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={() => {
        window.location.href = "/login";
      }}
    >
      {label}
    </button>
  );
}

export function GetStartedLink({ label, className }: { label: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={() => {
        window.location.href = "/login";
      }}
    >
      {label}
    </button>
  );
}
