import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

export type BlockType = "paragraph" | "h2" | "h3" | "pull-quote" | "bible-verse" | "bullet" | "numbered" | "divider" | "image";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const SLASH_TYPES: Array<{ type: BlockType; icon: string; labelKey: string; descKey: string }> = [
  { type: "bible-verse", icon: "📖", labelKey: "bibleVerseLabel",  descKey: "bibleVerseDesc" },
  { type: "pull-quote",  icon: "❝",  labelKey: "pullQuoteLabel",   descKey: "pullQuoteDesc" },
  { type: "h2",          icon: "H2", labelKey: "headingLabel",     descKey: "headingDesc" },
  { type: "h3",          icon: "H3", labelKey: "subheadingLabel",  descKey: "subheadingDesc" },
  { type: "bullet",      icon: "•",  labelKey: "bulletLabel",      descKey: "bulletDesc" },
  { type: "numbered",    icon: "1.", labelKey: "numberedLabel",    descKey: "numberedDesc" },
  { type: "divider",     icon: "─",  labelKey: "dividerLabel",     descKey: "dividerDesc" },
  { type: "image",       icon: "🖼", labelKey: "imageLabel",       descKey: "imageDesc" },
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
    if (elRef.current) elRef.current.innerText = initialContent;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TagEl = Tag as React.ElementType;
  return (
    <TagEl
      ref={(el: HTMLElement | null) => { elRef.current = el; refCb?.(el); }}
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={(e: React.FormEvent) => onTextChange((e.target as HTMLElement).innerText)}
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
  const SLASH_OPTIONS = SLASH_TYPES.map(o => ({ ...o, label: t(`blockEditor.${o.labelKey}`), desc: t(`blockEditor.${o.descKey}`) }));
  const [slashMenu, setSlashMenu] = useState<{ blockId: string } | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const updateBlock = useCallback((id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
    if (content === "/" && !slashMenu) {
      setSlashMenu({ blockId: id });
      setSlashIdx(0);
    }
    if (!content.startsWith("/") && slashMenu?.blockId === id) {
      setSlashMenu(null);
    }
  }, [blocks, onChange, slashMenu]);

  const convertBlock = useCallback((id: string, type: BlockType) => {
    onChange(blocks.map(b => b.id === id ? { ...b, type, content: b.content === "/" ? "" : b.content } : b));
    setSlashMenu(null);
    setTimeout(() => refs.current[id]?.focus(), 0);
  }, [blocks, onChange]);

  const addBlockAfter = useCallback((id: string, type: BlockType = "paragraph") => {
    const idx = blocks.findIndex(b => b.id === id);
    const newBlock: Block = { id: uid(), type, content: "" };
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(block.id);
    }
    if (e.key === "Backspace" && !block.content) {
      e.preventDefault();
      removeBlock(block.id);
    }
  }, [slashMenu, slashIdx, convertBlock, addBlockAfter, removeBlock]);

  const handleDrop = useCallback((targetId: string) => {
    const fromId = dragId.current;
    if (!fromId || fromId === targetId) { setDragOverId(null); return; }
    const from = blocks.findIndex(b => b.id === fromId);
    const to = blocks.findIndex(b => b.id === targetId);
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
    <div className="be-root">
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
              <div className="be-divider-block">
                <hr className="be-divider" />
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
    return b.content;
  }).join("\n\n");
}

export function markdownToBlocks(md: string): Block[] {
  if (!md.trim()) return [{ id: uid(), type: "paragraph", content: "" }];
  return md.split(/\n\n+/).map(line => {
    const id = uid();
    if (line.startsWith("## "))  return { id, type: "h2" as BlockType,        content: line.slice(3) };
    if (line.startsWith("### ")) return { id, type: "h3" as BlockType,        content: line.slice(4) };
    if (line.startsWith("> "))   return { id, type: "pull-quote" as BlockType, content: line.slice(2) };
    if (/^\[.+\]$/.test(line.trim())) return { id, type: "bible-verse" as BlockType, content: line.trim().slice(1, -1) };
    if (line.startsWith("- "))   return { id, type: "bullet" as BlockType,    content: line.slice(2) };
    if (line.startsWith("1. "))  return { id, type: "numbered" as BlockType,  content: line.slice(3) };
    if (line.trim() === "---")   return { id, type: "divider" as BlockType,   content: "" };
    const imgMatch = line.match(/^!\[\]\((.+)\)$/);
    if (imgMatch)                return { id, type: "image" as BlockType,     content: imgMatch[1] };
    return { id, type: "paragraph" as BlockType, content: line };
  });
}
