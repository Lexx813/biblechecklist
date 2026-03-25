import { useEffect, useMemo, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { useTranslation } from "react-i18next";
import { profileApi } from "../api/profile";
import "../styles/editor.css";
import "../styles/mentions.css";

// Convert legacy plain-text (with \n\n paragraphs) to HTML for initial load
function plainToHtml(text) {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text; // already HTML
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// ── Preset palettes ───────────────────────────────────────────────────────────
const TEXT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
  "#94a3b8", "#475569", "#1e293b",
];
const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff",
  "#fecaca", "#fed7aa", "#f9a8d4",
];

// ── Toolbar icons ─────────────────────────────────────────────────────────────
const BoldIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="currentColor">
    <path d="M3 2h4.5a3 3 0 0 1 0 6H3V2Zm0 6h5a3 3 0 0 1 0 6H3V8Z"/>
  </svg>
);
const ItalicIcon = () => (
  <svg width="11" height="14" viewBox="0 0 11 14" fill="currentColor">
    <path d="M4 2h6M1 12h6M7 2 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
  </svg>
);
const UnderlineIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 2v5a4.5 4.5 0 0 0 9 0V2M1 13h11"/>
  </svg>
);
const StrikeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 7h10M4 4c0-1.1 1.3-2 3-2s3 .9 3 2M4 10c0 1.1 1.3 2 3 2s3-.9 3-2"/>
  </svg>
);
const BulletIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
    <circle cx="1.5" cy="2" r="1.5"/><rect x="4.5" y="1" width="9" height="2" rx="1"/>
    <circle cx="1.5" cy="6" r="1.5"/><rect x="4.5" y="5" width="9" height="2" rx="1"/>
    <circle cx="1.5" cy="10" r="1.5"/><rect x="4.5" y="9" width="9" height="2" rx="1"/>
  </svg>
);
const OrderedIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
    <text x="0" y="3.5" fontSize="4" fontFamily="monospace">1.</text>
    <rect x="5" y="1" width="9" height="2" rx="1"/>
    <text x="0" y="7.5" fontSize="4" fontFamily="monospace">2.</text>
    <rect x="5" y="5" width="9" height="2" rx="1"/>
    <text x="0" y="11.5" fontSize="4" fontFamily="monospace">3.</text>
    <rect x="5" y="9" width="9" height="2" rx="1"/>
  </svg>
);
const QuoteIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
    <path d="M1 1h4v5H3a2 2 0 0 0 2 2v2a4 4 0 0 1-4-4V1Zm8 0h4v5h-2a2 2 0 0 0 2 2v2a4 4 0 0 1-4-4V1Z"/>
  </svg>
);
const CodeIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2 1 6l3 4M10 2l3 4-3 4"/>
  </svg>
);
const CodeBlockIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="1" y="1" width="12" height="10" rx="2"/>
    <path d="M4 4 2.5 6 4 8M10 4l1.5 2L10 8M7 4l-1 4"/>
  </svg>
);
const LinkIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 5.5H4a2.5 2.5 0 0 0 0 5h2M8 5.5h2a2.5 2.5 0 0 1 0 5H8M5 8h4"/>
  </svg>
);
const UnlinkIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 5.5H4a2.5 2.5 0 0 0 0 5h2M8 5.5h2a2.5 2.5 0 0 1 0 5H8M2 2l10 8"/>
  </svg>
);
const HrIcon = () => (
  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="4" x2="13" y2="4"/>
    <line x1="1" y1="1" x2="1" y2="7"/>
    <line x1="13" y1="1" x2="13" y2="7"/>
  </svg>
);
const AlignLeftIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="2" x2="13" y2="2"/><line x1="1" y1="5" x2="9" y2="5"/>
    <line x1="1" y1="8" x2="13" y2="8"/><line x1="1" y1="11" x2="8" y2="11"/>
  </svg>
);
const AlignCenterIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="2" x2="13" y2="2"/><line x1="3" y1="5" x2="11" y2="5"/>
    <line x1="1" y1="8" x2="13" y2="8"/><line x1="4" y1="11" x2="10" y2="11"/>
  </svg>
);
const AlignRightIcon = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="2" x2="13" y2="2"/><line x1="5" y1="5" x2="13" y2="5"/>
    <line x1="1" y1="8" x2="13" y2="8"/><line x1="6" y1="11" x2="13" y2="11"/>
  </svg>
);

// ── Toolbar button ────────────────────────────────────────────────────────────
function Btn({ active, onClick, title, children, style }) {
  return (
    <button
      type="button"
      className={`editor-btn${active ? " active" : ""}`}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      style={style}
    >
      {children}
    </button>
  );
}

// ── Color palette popup ───────────────────────────────────────────────────────
function ColorPalette({ colors, onSelect, onClear, currentColor, label, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popupRef = useRef(null);
  const customRef = useRef(null);

  function handleOpen(e) {
    e.preventDefault();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Flip left if popup would overflow right edge
      const popupWidth = 162;
      const left = rect.left + popupWidth > window.innerWidth ? rect.right - popupWidth : rect.left;
      setPos({ top: rect.bottom + 4, left });
    }
    setOpen(o => !o);
  }

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (!popupRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div style={{ display: "inline-flex" }}>
      <button
        ref={btnRef}
        type="button"
        className={`editor-btn${currentColor ? " active" : ""}`}
        onMouseDown={handleOpen}
        title={label}
      >
        {children}
      </button>
      {open && (
        <div
          ref={popupRef}
          className="editor-color-popup"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          onMouseDown={e => e.preventDefault()}
        >
          <div className="editor-color-swatches">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                className="editor-color-swatch"
                style={{ background: c }}
                title={c}
                onClick={() => { onSelect(c); setOpen(false); }}
              />
            ))}
          </div>
          <div className="editor-color-actions">
            <button type="button" className="editor-color-clear" onClick={() => { onClear(); setOpen(false); }}>
              Clear
            </button>
            <button type="button" className="editor-color-custom" onClick={() => customRef.current?.click()}>
              Custom…
            </button>
          </div>
          <input
            ref={customRef}
            type="color"
            style={{ opacity: 0, position: "absolute", pointerEvents: "none", width: 0, height: 0 }}
            onInput={e => { onSelect(e.target.value); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

// ── Mention suggestion list ───────────────────────────────────────────────────
function MentionList({ items, activeIdx, onSelect }) {
  if (!items.length) return null;
  return (
    <div className="mention-dropdown">
      {items.map((u, i) => (
        <div
          key={u.id}
          className={`mention-option${i === activeIdx ? " mention-option--active" : ""}`}
          onMouseDown={e => { e.preventDefault(); onSelect(u); }}
        >
          <div className="mention-option-avatar">
            {u.avatar_url
              ? <img src={u.avatar_url} alt="" />
              : (u.display_name || "?")[0].toUpperCase()
            }
          </div>
          <span>{u.display_name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({
  content = "",
  onChange,
  onMention,
  placeholder,
  minimal = false,
  compact = false,
  disabled = false,
  allowMentions = false,
}) {
  const { t } = useTranslation();

  // @mention state
  const [mentionItems, setMentionItems] = useState([]);
  const [mentionActiveIdx, setMentionActiveIdx] = useState(0);
  const mentionTimerRef = useRef(null);
  const allowMentionsRef = useRef(allowMentions);
  useEffect(() => { allowMentionsRef.current = allowMentions; }, [allowMentions]);

  const extensions = useMemo(() => [
    StarterKit.configure({
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    Placeholder.configure({ placeholder: placeholder || "" }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ], [placeholder]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    extensions,
    content: plainToHtml(content),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());

      if (!allowMentionsRef.current) return;
      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(Math.max(0, from - 60), from, " ");
      const match = textBefore.match(/@([\w.]*)$/);
      clearTimeout(mentionTimerRef.current);
      if (match) {
        mentionTimerRef.current = setTimeout(async () => {
          const results = await profileApi.searchByName(match[1]);
          setMentionItems(results);
          setMentionActiveIdx(0);
        }, 150);
      } else {
        setMentionItems([]);
      }
    },
    onBlur: () => {
      setTimeout(() => setMentionItems([]), 150);
    },
  });

  // Keyup/input fallback for mention detection
  useEffect(() => {
    if (!editor || !allowMentions) return;
    const el = editor.view.dom;

    function detect() {
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 60), from, " ");
      const match = textBefore.match(/@([\w.]*)$/);
      clearTimeout(mentionTimerRef.current);
      if (match) {
        mentionTimerRef.current = setTimeout(async () => {
          const results = await profileApi.searchByName(match[1]);
          setMentionItems(results);
          setMentionActiveIdx(0);
        }, 150);
      } else {
        setMentionItems([]);
      }
    }

    el.addEventListener("keyup", detect);
    el.addEventListener("input", detect);
    return () => {
      el.removeEventListener("keyup", detect);
      el.removeEventListener("input", detect);
    };
  }, [editor, allowMentions]);

  function insertMention(item) {
    if (!editor) return;
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 60), from, " ");
    const match = textBefore.match(/@([\w.-]*)$/);
    if (!match) return;
    editor.chain()
      .focus()
      .deleteRange({ from: from - match[0].length, to: from })
      .insertContent(`@${item.display_name} `)
      .run();
    setMentionItems([]);
    onMention?.(item);
  }

  // Sync content prop → editor
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = plainToHtml(content);
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, false);
    }
  }, [content, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync disabled
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const [linkModal, setLinkModal] = useState({ open: false, value: "" });
  const linkInputRef = useRef(null);

  function openLinkModal() {
    const existing = editor.getAttributes("link").href || "";
    setLinkModal({ open: true, value: existing });
    // Focus the input after the modal renders
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }

  function submitLink(e) {
    e?.preventDefault();
    const trimmed = linkModal.value.trim();
    if (!trimmed) { editor.chain().focus().unsetLink().run(); }
    else {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
        setLinkModal({ open: false, value: "" });
        return;
      }
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkModal({ open: false, value: "" });
  }

  if (!editor) return null;

  const activeTextColor = editor.getAttributes("textStyle").color || null;
  const activeHighlight = editor.getAttributes("highlight").color || null;

  return (
    <div
      className="mention-wrap"
      style={{ position: "relative" }}
      onKeyDown={allowMentions && mentionItems.length > 0 ? (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setMentionActiveIdx(i => Math.min(i + 1, mentionItems.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setMentionActiveIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter" || e.key === "Tab") {
          const item = mentionItems[mentionActiveIdx];
          if (item) { e.preventDefault(); insertMention(item); }
        } else if (e.key === "Escape") { setMentionItems([]); }
      } : undefined}
    >
      <div className={`editor-wrap${disabled ? " editor-wrap--disabled" : ""}`}>
        {!disabled && (
          <div className="editor-toolbar">
            {/* ── Inline formatting ── */}
            <Btn active={editor.isActive("bold")}      onClick={() => editor.chain().focus().toggleBold().run()}      title={t("editor.bold")}     ><BoldIcon /></Btn>
            <Btn active={editor.isActive("italic")}    onClick={() => editor.chain().focus().toggleItalic().run()}    title={t("editor.italic")}   ><ItalicIcon /></Btn>
            <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"            ><UnderlineIcon /></Btn>
            <Btn active={editor.isActive("strike")}    onClick={() => editor.chain().focus().toggleStrike().run()}    title={t("editor.strike")}   ><StrikeIcon /></Btn>

            <div className="editor-sep" />

            {/* ── Headings (always shown) ── */}
            {[1, 2, 3].map(level => (
              <Btn key={level}
                active={editor.isActive("heading", { level })}
                onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                title={`Heading ${level}`}
              >H{level}</Btn>
            ))}

            <div className="editor-sep" />

            {/* ── Lists ── */}
            <Btn active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title={t("editor.bulletList")} ><BulletIcon /></Btn>
            <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title={t("editor.orderedList")}><OrderedIcon /></Btn>

            <div className="editor-sep" />

            {/* ── Alignment ── */}
            <Btn active={editor.isActive({ textAlign: "left" })}    onClick={() => editor.chain().focus().setTextAlign("left").run()}    title="Align left"   ><AlignLeftIcon /></Btn>
            <Btn active={editor.isActive({ textAlign: "center" })}  onClick={() => editor.chain().focus().setTextAlign("center").run()}  title="Align center" ><AlignCenterIcon /></Btn>
            <Btn active={editor.isActive({ textAlign: "right" })}   onClick={() => editor.chain().focus().setTextAlign("right").run()}   title="Align right"  ><AlignRightIcon /></Btn>

            <div className="editor-sep" />

            {/* ── Block elements ── */}
            <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title={t("editor.blockquote")}><QuoteIcon /></Btn>
            <Btn active={editor.isActive("code")}       onClick={() => editor.chain().focus().toggleCode().run()}       title={t("editor.code")}      ><CodeIcon /></Btn>
            {!minimal && (
              <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title={t("editor.codeBlock")}><CodeBlockIcon /></Btn>
            )}

            <div className="editor-sep" />

            {/* ── Text color ── */}
            <ColorPalette
              colors={TEXT_COLORS}
              currentColor={activeTextColor}
              onSelect={c => editor.chain().focus().setColor(c).run()}
              onClear={() => editor.chain().focus().unsetColor().run()}
              onCustom={() => {}}
              label="Text color"
            >
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>A</span>
                <span style={{ width: 13, height: 3, borderRadius: 2, background: activeTextColor || "currentColor", display: "block" }} />
              </span>
            </ColorPalette>

            {/* ── Highlight ── */}
            <ColorPalette
              colors={HIGHLIGHT_COLORS}
              currentColor={activeHighlight}
              onSelect={c => editor.chain().focus().setHighlight({ color: c }).run()}
              onClear={() => editor.chain().focus().unsetHighlight().run()}
              onCustom={() => {}}
              label="Highlight"
            >
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>H</span>
                <span style={{ width: 13, height: 3, borderRadius: 2, background: activeHighlight || "#fef08a", display: "block" }} />
              </span>
            </ColorPalette>

            <div className="editor-sep" />

            {/* ── Link ── */}
            <Btn active={editor.isActive("link")} onClick={openLinkModal} title={t("editor.link")}><LinkIcon /></Btn>
            {editor.isActive("link") && (
              <Btn active={false} onClick={() => editor.chain().focus().unsetLink().run()} title={t("editor.unlink")}><UnlinkIcon /></Btn>
            )}

            {/* ── HR (full mode only) ── */}
            {!minimal && (
              <Btn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title={t("editor.hr")}><HrIcon /></Btn>
            )}
          </div>
        )}

        <EditorContent
          editor={editor}
          className={`editor-content${compact ? " editor-content--compact" : ""}`}
        />
      </div>

      {allowMentions && mentionItems.length > 0 && (
        <MentionList
          items={mentionItems}
          activeIdx={mentionActiveIdx}
          onSelect={insertMention}
        />
      )}

      {linkModal.open && (
        <div className="link-modal-overlay" onMouseDown={() => setLinkModal({ open: false, value: "" })}>
          <div className="link-modal" onMouseDown={e => e.stopPropagation()}>
            <p className="link-modal-label">Insert link</p>
            <form onSubmit={submitLink}>
              <input
                ref={linkInputRef}
                className="link-modal-input"
                type="url"
                placeholder="https://example.com"
                value={linkModal.value}
                onChange={e => setLinkModal(m => ({ ...m, value: e.target.value }))}
                onKeyDown={e => { if (e.key === "Escape") setLinkModal({ open: false, value: "" }); }}
                autoComplete="off"
              />
              <div className="link-modal-actions">
                <button type="button" className="link-modal-btn link-modal-btn--cancel" onClick={() => setLinkModal({ open: false, value: "" })}>
                  Cancel
                </button>
                <button type="submit" className="link-modal-btn link-modal-btn--apply">
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
