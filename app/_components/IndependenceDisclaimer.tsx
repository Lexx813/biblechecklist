/**
 * Above-the-fold trust banner that makes the project's independence from the
 * Watch Tower Society explicit on every YMYL surface (blog posts, book guides,
 * study topics, song pages). YMYL trust signals belong in a prominent
 * `role="note"` block — not a `<small>` tag.
 */
export default function IndependenceDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Independence disclaimer"
      className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <strong className="font-semibold">Independent project.</strong>{" "}
      JW Study is not affiliated with, endorsed by, or sponsored by the Watch Tower Bible and Tract Society of Pennsylvania or jw.org. All scriptural references link to the official New World Translation at{" "}
      <a
        href="https://www.jw.org/en/library/bible/"
        rel="noopener noreferrer"
        target="_blank"
        className="underline decoration-amber-700/60 underline-offset-2 hover:decoration-amber-700 dark:decoration-amber-200/60 dark:hover:decoration-amber-100"
      >
        jw.org
      </a>
      .
    </div>
  );
}
