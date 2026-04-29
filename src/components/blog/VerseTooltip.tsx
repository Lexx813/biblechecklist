import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { verseCacheApi } from "../../api/verseCache";
import { sanitizeRich } from "../../lib/sanitize";

function injectVerseSpans(html: string): string {
  return html.replace(
    /\[([A-Z][a-zA-Z\s]+\d+:\d+(?:-\d+)?)\]/g,
    (_, ref) => `<span class="pr-verse-ref" data-verse-ref="${ref}">${ref}</span>`
  );
}

function TooltipPopup({ verseRef, onClose }: { verseRef: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: verse, isLoading } = useQuery({
    queryKey: ["verse", verseRef],
    queryFn: () => verseCacheApi.getVerse(verseRef),
    staleTime: Infinity,
  });
  const jwUrl = verseCacheApi.buildJwLibraryUrl(verseRef);

  return (
    <div className="pr-verse-tooltip" role="tooltip">
      <div className="pr-verse-tooltip-ref">{verseRef} · NWT</div>
      {isLoading && <div className="pr-verse-tooltip-text">{t("common.loading")}</div>}
      {!isLoading && verse && <div className="pr-verse-tooltip-text">{verse.text}</div>}
      {!isLoading && !verse && <div className="pr-verse-tooltip-text">{t("blog.openInJwLibraryHint")}</div>}
      <a
        className="pr-verse-tooltip-link"
        href={jwUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
      >
        {t("blog.openInJwLibrary")}
      </a>
    </div>
  );
}

interface Props { html: string }

export default function VerseTooltip({ html }: Props) {
  const [activeRef, setActiveRef] = useState<string | null>(null);
  // Re-sanitize AFTER we inject our own spans, not just trust the upstream caller's
  // sanitization to still hold. Belt-and-suspenders against a caller forgetting to
  // pre-sanitize and us then rendering arbitrary HTML through dangerouslySetInnerHTML.
  const processedHtml = useMemo(() => sanitizeRich(injectVerseSpans(html)), [html]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("[data-verse-ref]") as HTMLElement | null;
    if (!target) {
      setActiveRef(null);
      return;
    }
    const ref = target.dataset.verseRef ?? null;
    if (!ref) return;
    setActiveRef(prev => prev === ref ? null : ref);
  }, []);

  return (
    <div onClick={handleClick} style={{ position: "relative" }}>
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      {activeRef && (
        <div className="pr-verse-tooltip-wrap" onClick={e => e.stopPropagation()}>
          <TooltipPopup verseRef={activeRef} onClose={() => setActiveRef(null)} />
        </div>
      )}
    </div>
  );
}
