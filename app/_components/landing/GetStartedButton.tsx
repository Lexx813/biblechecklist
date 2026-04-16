import Link from "next/link";

/**
 * Server Component: renders a styled Link to /login with hover prefetch.
 */
export function GetStartedButton({ label, className }: { label: string; className?: string }) {
  return (
    <Link href="/login" className={className}>
      {label}
    </Link>
  );
}

export function GetStartedLink({ label, className }: { label: string; className?: string }) {
  return (
    <Link href="/login" className={className}>
      {label}
    </Link>
  );
}
