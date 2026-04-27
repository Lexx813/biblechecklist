import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

// Pastel highlight palette — same set used by RichTextEditor's bubble menu so
// the look is consistent across surfaces.
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa", "#ddd6fe"];

/**
 * Floating bubble that appears when text is selected anywhere inside the
 * BlockEditor's container. Provides bold / italic / underline / strikethrough /
 * highlight (with palette). Operates via document.execCommand against the
 * native browser selection — works across each block's contentEditable.
 *
 * Hoisted to module scope so React doesn't remount on parent re-renders
 * (which would tear down the selectionchange listener mid-selection).
 */
function SelectionBubble({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function update() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setPos(null);
        setShowHighlightPalette(false);
        return;
      }
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPos(null); return; }
      setPos({ top: rect.top - 48, left: rect.left + rect.width / 2 });
    }
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  function exec(cmd: string, value?: string) {
    // Force inline style instead of legacy <font> tag so highlights serialize
    // cleanly through the markdown round-trip.
    try { document.execCommand("styleWithCSS", false, "true"); } catch { /* noop */ }
    try { document.execCommand(cmd, false, value); } catch { /* noop */ }
  }

  if (!pos) return null;

  const Btn = ({ children, onClick, title }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title?: string }) => (
    <button
      type="button"
      onMouseDown={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 28,
        height: 28,
        padding: "0 6px",
        background: "transparent",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
  const Sep = () => <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", margin: "0 2px" }} />;
  const cmd = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

  return createPortal(
    <div
      ref={bubbleRef}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: "4px 6px",
        background: "#1e1b2e",
        color: "#fff",
        borderRadius: 8,
        boxShadow: "0 8px 28px rgba(0,0,0,0.32), 0 1px 0 rgba(255,255,255,0.06) inset",
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "var(--font-sans, system-ui)",
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      <Btn onClick={cmd(() => exec("bold"))} title="Bold (Cmd+B)"><strong>B</strong></Btn>
      <Btn onClick={cmd(() => exec("italic"))} title="Italic (Cmd+I)"><em>I</em></Btn>
      <Btn onClick={cmd(() => exec("underline"))} title="Underline"><span style={{ textDecoration: "underline" }}>U</span></Btn>
      <Btn onClick={cmd(() => exec("strikeThrough"))} title="Strikethrough"><span style={{ textDecoration: "line-through" }}>S</span></Btn>
      <Sep />
      <div style={{ position: "relative" }}>
        <Btn
          onClick={cmd(() => setShowHighlightPalette(v => !v))}
          title="Highlight"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>H</span>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: "#fef08a", display: "inline-block" }} />
          </span>
        </Btn>
        {showHighlightPalette && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1e1b2e",
              borderRadius: 8,
              boxShadow: "0 8px 28px rgba(0,0,0,0.32)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 6,
              display: "grid",
              gridTemplateColumns: "repeat(6, 22px)",
              gap: 4,
            }}
          >
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", c); setShowHighlightPalette(false); }}
                title={c}
                style={{
                  width: 22, height: 22, borderRadius: 4, background: c,
                  border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", padding: 0,
                }}
              />
            ))}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", "transparent"); setShowHighlightPalette(false); }}
              style={{
                gridColumn: "1 / -1", marginTop: 2, padding: "4px 0",
                background: "transparent", color: "#cbd5e1",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4,
                fontSize: 11, cursor: "pointer",
              }}
            >
              Clear highlight
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export type BlockType =
  | "paragraph" | "h2" | "h3" | "pull-quote" | "bible-verse"
  | "bullet" | "numbered" | "divider" | "image" | "video" | "callout";

export type CalloutVariant = "info" | "tip" | "warning" | "highlight";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: string; // callout variant; future: text alignment, caption, etc.
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const CALLOUT_VARIANTS: Array<{ key: CalloutVariant; icon: string }> = [
  { key: "info",      icon: "ℹ️" },
  { key: "tip",       icon: "💡" },
  { key: "warning",   icon: "⚠️" },
  { key: "highlight", icon: "✨" },
];

const SLASH_TYPES: Array<{ type: BlockType; icon: string; labelKey: string; descKey: string }> = [
  { type: "bible-verse", icon: "📖", labelKey: "bibleVerseLabel",  descKey: "bibleVerseDesc" },
  { type: "pull-quote",  icon: "❝",  labelKey: "pullQuoteLabel",   descKey: "pullQuoteDesc" },
  { type: "callout",     icon: "💡", labelKey: "calloutLabel",     descKey: "calloutDesc" },
  { type: "h2",          icon: "H2", labelKey: "headingLabel",     descKey: "headingDesc" },
  { type: "h3",          icon: "H3", labelKey: "subheadingLabel",  descKey: "subheadingDesc" },
  { type: "bullet",      icon: "•",  labelKey: "bulletLabel",      descKey: "bulletDesc" },
  { type: "numbered",    icon: "1.", labelKey: "numberedLabel",    descKey: "numberedDesc" },
  { type: "video",       icon: "▶",  labelKey: "videoLabel",       descKey: "videoDesc" },
  { type: "image",       icon: "🖼", labelKey: "imageLabel",       descKey: "imageDesc" },
  { type: "divider",     icon: "─",  labelKey: "dividerLabel",     descKey: "dividerDesc" },
];

function CE({
  tag: Tag = "div",
  initialContent,
  onTextChange,
  onKeyDown,
  className,
  placeholder,
  refCb,
}: {
  tag?: string;
  initialContent: string;
  onTextChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
  placeholder?: string;
  refCb?: (el: HTMLElement | null) => void;
}) {
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Use innerHTML so inline formatting (highlights, bold/italic spans)
    // round-trips through the contentEditable. Source content comes from
    // markdown which we already DOMPurify-sanitize on the published side.
    if (elRef.current) elRef.current.innerHTML = initialContent;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TagEl = Tag as React.ElementType;
  return (
    <TagEl
      ref={(el: HTMLElement | null) => { elRef.current = el; refCb?.(el); }}
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={(e: React.FormEvent) => onTextChange((e.target as HTMLElement).innerHTML)}
      onKeyDown={onKeyDown}
      data-placeholder={placeholder}
    />
  );
}

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function BlockEditor({ blocks, onChange, onImageUpload }: Props) {
  const { t } = useTranslation();
  const SLASH_OPTIONS = SLASH_TYPES.map(o => ({
    ...o,
    label: t(`blockEditor.${o.labelKey}`),
    desc:  t(`blockEditor.${o.descKey}`),
  }));

  const [slashMenu, setSlashMenu] = useState<{ blockId: string } | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const updateBlock = useCallback((id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
    if (content === "/" && !slashMenu) { setSlashMenu({ blockId: id }); setSlashIdx(0); }
    if (!content.startsWith("/") && slashMenu?.blockId === id) setSlashMenu(null);
  }, [blocks, onChange, slashMenu]);

  const updateBlockMeta = useCallback((id: string, meta: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, meta } : b));
  }, [blocks, onChange]);

  const convertBlock = useCallback((id: string, type: BlockType) => {
    const meta = type === "callout" ? "info" : undefined;
    onChange(blocks.map(b => b.id === id ? { ...b, type, meta, content: b.content === "/" ? "" : b.content } : b));
    setSlashMenu(null);
    setTimeout(() => refs.current[id]?.focus(), 0);
  }, [blocks, onChange]);

  const addBlockAfter = useCallback((id: string, type: BlockType = "paragraph") => {
    const idx = blocks.findIndex(b => b.id === id);
    const meta = type === "callout" ? "info" : undefined;
    const newBlock: Block = { id: uid(), type, content: "", meta };
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    onChange(next);
    setTimeout(() => refs.current[newBlock.id]?.focus(), 0);
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    if (blocks.length === 1) return;
    const idx = blocks.findIndex(b => b.id === id);
    const prev = blocks[idx - 1];
    onChange(blocks.filter(b => b.id !== id));
    if (prev) setTimeout(() => refs.current[prev.id]?.focus(), 0);
  }, [blocks, onChange]);

  const handleKey = useCallback((e: KeyboardEvent, block: Block) => {
    if (slashMenu) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx(i => Math.min(i + 1, SLASH_OPTIONS.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); convertBlock(block.id, SLASH_OPTIONS[slashIdx].type); return; }
      if (e.key === "Escape")    { setSlashMenu(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addBlockAfter(block.id); }
    if (e.key === "Backspace" && !block.content) { e.preventDefault(); removeBlock(block.id); }
  }, [slashMenu, slashIdx, convertBlock, addBlockAfter, removeBlock, SLASH_OPTIONS]);

  const handleDrop = useCallback((targetId: string) => {
    const fromId = dragId.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    const from = blocks.findIndex(b => b.id === fromId);
    const to   = blocks.findIndex(b => b.id === targetId);
    if (from < 0 || to < 0) { setDragOverId(null); return; }
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    dragId.current = null;
    setDragOverId(null);
  }, [blocks, onChange]);

  const handleImageFile = useCallback(async (blockId: string, file: File) => {
    if (!onImageUpload) return;
    setUploading(u => ({ ...u, [blockId]: true }));
    try {
      const url = await onImageUpload(file);
      onChange(blocks.map(b => b.id === blockId ? { ...b, content: url } : b));
    } finally {
      setUploading(u => ({ ...u, [blockId]: false }));
    }
  }, [blocks, onChange, onImageUpload]);

  return (
    <div ref={containerRef} className="be-root">
      <SelectionBubble containerRef={containerRef} />
      {blocks.map((block) => {
        const ceProps = {
          initialContent: block.content,
          onTextChange: (text: string) => updateBlock(block.id, text),
          onKeyDown: (e: React.KeyboardEvent) => handleKey(e as unknown as KeyboardEvent, block),
          refCb: (el: HTMLElement | null) => { refs.current[block.id] = el; },
        };

        return (
          <div
            key={block.id + "-" + block.type}
            className={`be-block${dragOverId === block.id ? " be-block--drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOverId(block.id); }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(block.id)}
          >
            <div
              className="be-handle"
              draggable
              onDragStart={() => { dragId.current = block.id; }}
              onDragEnd={() => { dragId.current = null; setDragOverId(null); }}
            >
              <span className="be-handle-grip" title={t("blockEditor.dragToReorder")}>⠿</span>
              <button
                className="be-delete-btn"
                title={t("blockEditor.deleteBlock")}
                onMouseDown={e => { e.preventDefault(); removeBlock(block.id); }}
              >×</button>
            </div>

            {block.type === "h2" && (
              <CE tag="h2" {...ceProps} className="be-h2" placeholder={t("blockEditor.headingPlaceholder")} />
            )}
            {block.type === "h3" && (
              <CE tag="h3" {...ceProps} className="be-h3" placeholder={t("blockEditor.subheadingPlaceholder")} />
            )}
            {block.type === "pull-quote" && (
              <CE tag="blockquote" {...ceProps} className="be-pullquote" placeholder={t("blockEditor.pullQuotePlaceholder")} />
            )}
            {block.type === "bible-verse" && (
              <div className="be-verse-block">
                <div className="be-verse-label">{t("blockEditor.verseBlockLabel")}</div>
                <CE {...ceProps} className="be-verse-ref" placeholder={t("blockEditor.versePlaceholder")} />
              </div>
            )}
            {(block.type === "paragraph" || block.type === "bullet" || block.type === "numbered") && (
              <div className="be-row">
                {block.type === "bullet"   && <span className="be-bullet">•</span>}
                {block.type === "numbered" && <span className="be-bullet be-numbered">{blocks.filter(b => b.type === "numbered").findIndex(b => b.id === block.id) + 1}.</span>}
                <CE
                  {...ceProps}
                  className="be-para"
                  placeholder={block.type === "bullet" || block.type === "numbered" ? t("blockEditor.listItemPlaceholder") : t("blockEditor.paragraphPlaceholder")}
                />
              </div>
            )}
            {block.type === "divider" && (
              <div className="be-divider-block"><hr className="be-divider" /></div>
            )}
            {block.type === "callout" && (
              <div className={`be-callout be-callout--${block.meta ?? "info"}`}>
                <div className="be-callout-header">
                  {CALLOUT_VARIANTS.map(v => (
                    <button
                      key={v.key}
                      className={`be-callout-pill${(block.meta ?? "info") === v.key ? " be-callout-pill--active" : ""}`}
                      onMouseDown={e => { e.preventDefault(); updateBlockMeta(block.id, v.key); }}
                    >
                      {v.icon} {t(`blockEditor.callout_${v.key}`)}
                    </button>
                  ))}
                </div>
                <CE
                  {...ceProps}
                  className="be-callout-text"
                  placeholder={t("blockEditor.calloutPlaceholder")}
                />
              </div>
            )}
            {block.type === "video" && (
              <div className="be-video-block">
                {block.content && getVideoEmbed(block.content) ? (
                  <div className="be-video-wrap">
                    <iframe
                      src={getVideoEmbed(block.content)!}
                      className="be-video-iframe"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title="video"
                    />
                    <button
                      className="be-image-remove"
                      onClick={() => onChange(blocks.map(b => b.id === block.id ? { ...b, content: "" } : b))}
                      title={t("blockEditor.removeVideo")}
                    >×</button>
                  </div>
                ) : (
                  <div className="be-video-placeholder">
                    <span className="be-video-icon">▶</span>
                    <input
                      className="be-video-url"
                      placeholder={t("blockEditor.videoUrlPlaceholder")}
                      defaultValue={block.content}
                      onBlur={e => {
                        const url = e.target.value.trim();
                        if (url) onChange(blocks.map(b => b.id === block.id ? { ...b, content: url } : b));
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const url = (e.target as HTMLInputElement).value.trim();
                          if (url) onChange(blocks.map(b => b.id === block.id ? { ...b, content: url } : b));
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {block.type === "image" && (
              <div className="be-image-block">
                {block.content ? (
                  <div className="be-image-wrap">
                    <img src={block.content} alt="" className="be-image" />
                    <button
                      className="be-image-remove"
                      onClick={() => onChange(blocks.map(b => b.id === block.id ? { ...b, content: "" } : b))}
                      title={t("blockEditor.removeImage")}
                    >×</button>
                  </div>
                ) : uploading[block.id] ? (
                  <div className="be-image-placeholder">{t("blockEditor.uploading")}</div>
                ) : (
                  <div className="be-image-placeholder">
                    <label className="be-image-upload-btn">
                      {t("blockEditor.uploadImage")}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(block.id, f); }}
                      />
                    </label>
                    <span className="be-image-or">{t("blockEditor.or")}</span>
                    <input
                      className="be-image-url"
                      placeholder={t("blockEditor.pasteImageUrl")}
                      onPaste={e => {
                        const url = e.clipboardData.getData("text").trim();
                        if (url.startsWith("http")) { e.preventDefault(); onChange(blocks.map(b => b.id === block.id ? { ...b, content: url } : b)); }
                      }}
                      onChange={e => {
                        const url = e.target.value.trim();
                        if (url.startsWith("http")) onChange(blocks.map(b => b.id === block.id ? { ...b, content: url } : b));
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {slashMenu?.blockId === block.id && (
              <div className="be-slash-menu">
                {SLASH_OPTIONS.map((opt, i) => (
                  <div
                    key={opt.type}
                    className={`be-slash-item${i === slashIdx ? " be-slash-item--active" : ""}`}
                    onMouseDown={e => { e.preventDefault(); convertBlock(block.id, opt.type); }}
                  >
                    <span className="be-slash-icon">{opt.icon}</span>
                    <span>
                      <span className="be-slash-label">{opt.label}</span>
                      <span className="be-slash-desc">{opt.desc}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        className="be-add-btn"
        onClick={() => addBlockAfter(blocks[blocks.length - 1].id)}
      >{t("blockEditor.addBlock")}</button>
    </div>
  );
}

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(b => {
    if (b.type === "h2")         return `## ${b.content}`;
    if (b.type === "h3")         return `### ${b.content}`;
    if (b.type === "pull-quote") return `> ${b.content}`;
    if (b.type === "bible-verse") return `[${b.content}]`;
    if (b.type === "bullet")     return `- ${b.content}`;
    if (b.type === "numbered")   return `1. ${b.content}`;
    if (b.type === "divider")    return `---`;
    if (b.type === "image")      return `![](${b.content})`;
    if (b.type === "video")      return `[video](${b.content})`;
    if (b.type === "callout")    return `:::${b.meta ?? "info"}\n${b.content}\n:::`;
    return b.content;
  }).join("\n\n");
}

export function markdownToBlocks(md: string): Block[] {
  if (!md.trim()) return [{ id: uid(), type: "paragraph", content: "" }];
  // Pre-process: collapse callout fences into single tokens
  const collapsed = md.replace(/:::(info|tip|warning|highlight)\n([\s\S]*?)\n:::/g, (_m, variant, text) =>
    `\x00callout:${variant}:${text.replace(/\n/g, "\x01")}`
  );
  // Ensure consecutive list items and headings separated by single newlines each become their own block
  const normalized = collapsed
    .replace(/\n(#{1,3} )/g, "\n\n$1")
    .replace(/\n(- )/g, "\n\n$1")
    .replace(/\n(\d+\. )/g, "\n\n$1");
  return normalized.split(/\n\n+/).map(line => {
    const id = uid();
    if (line.startsWith("\x00callout:")) {
      const rest = line.slice(9);
      const colon = rest.indexOf(":");
      const variant = rest.slice(0, colon);
      const content = rest.slice(colon + 1).replace(/\x01/g, "\n");
      return { id, type: "callout" as BlockType, content, meta: variant };
    }
    if (line.startsWith("## "))  return { id, type: "h2" as BlockType,         content: line.slice(3) };
    if (line.startsWith("### ")) return { id, type: "h3" as BlockType,         content: line.slice(4) };
    if (line.startsWith("> ")) {
      // Multiline blockquotes: strip `> ` from every continuation line
      const content = line.split("\n").map(l => l.replace(/^> ?/, "")).join("\n");
      return { id, type: "pull-quote" as BlockType, content };
    }
    if (/^\[.+\]$/.test(line.trim())) return { id, type: "bible-verse" as BlockType, content: line.trim().slice(1, -1) };
    if (line.startsWith("- "))   return { id, type: "bullet" as BlockType,     content: line.slice(2) };
    if (line.startsWith("1. "))  return { id, type: "numbered" as BlockType,   content: line.slice(3) };
    if (line.trim() === "---")   return { id, type: "divider" as BlockType,    content: "" };
    const imgMatch = line.match(/^!\[\]\((.*)\)$/);
    if (imgMatch)                return { id, type: "image" as BlockType,      content: imgMatch[1] };
    const vidMatch = line.match(/^\[video\]\((.*)\)$/);
    if (vidMatch)                return { id, type: "video" as BlockType,      content: vidMatch[1] };
    return { id, type: "paragraph" as BlockType, content: line };
  });
}
