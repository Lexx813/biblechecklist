import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import EmojiPickerPopup from "./EmojiPickerPopup";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import ScriptureChip from "../lib/tiptap/scriptureChip";
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
interface BtnProps {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

function Btn({ active, onClick, title, children, style }: BtnProps) {
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
interface ColorPaletteProps {
  colors: string[];
  onSelect: (color: string) => void;
  onClear: () => void;
  onCustom?: () => void;
  currentColor: string | null;
  label: string;
  children: React.ReactNode;
}

function ColorPalette({ colors, onSelect, onClear, currentColor, label, children }: ColorPaletteProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  function handleOpen(e: React.MouseEvent) {
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
    function close(e: MouseEvent) {
      if (!popupRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
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
            name="custom_color"
            type="color"
            style={{ opacity: 0, position: "absolute", pointerEvents: "none", width: 0, height: 0 }}
            onInput={e => { onSelect((e.target as HTMLInputElement).value); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

// ── Mention suggestion list ───────────────────────────────────────────────────
interface MentionUser {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface MentionListProps {
  items: MentionUser[];
  activeIdx: number;
  onSelect: (user: MentionUser) => void;
}

function MentionList({ items, activeIdx, onSelect }: MentionListProps) {
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
              ? <img src={u.avatar_url} alt="" width={28} height={28} loading="lazy" />
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
interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onMention?: (user: MentionUser) => void;
  placeholder?: string;
  minimal?: boolean;
  compact?: boolean;
  disabled?: boolean;
  allowMentions?: boolean;
}

// ── Hoisted to module scope so React doesn't remount these on every parent
// re-render (which would reset their useEffect listeners and break the
// selection bubble entirely). Defined as named functions / arrow components
// outside RichTextEditor's body. ─────────────────────────────────────────────

function BubbleBtn({ active, onClick, title, children }: { active?: boolean; onClick: (e: React.MouseEvent) => void; title?: string; children: React.ReactNode }) {
  return (
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
        background: active ? "#7C3AED" : "transparent",
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
}

function BubbleSep() {
  return <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", margin: "0 2px" }} />;
}

function SelectionBubble({ editor, onLinkClick }: { editor: any; onLinkClick: () => void }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editor) return;
    function update() {
      const { empty } = editor.state.selection;
      if (empty || !editor.isFocused) {
        setPos(null);
        setShowHighlightPalette(false);
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) { setPos(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPos(null); return; }
      setPos({ top: rect.top - 48, left: rect.left + rect.width / 2 });
    }
    function onBlur() {
      setTimeout(() => {
        if (!bubbleRef.current?.contains(document.activeElement)) {
          setPos(null);
          setShowHighlightPalette(false);
        }
      }, 0);
    }
    editor.on("selectionUpdate", update);
    editor.on("blur", onBlur);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("blur", onBlur);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor]);

  if (!pos) return null;

  const activeHighlight = editor.getAttributes("highlight").color || null;

  const cmd = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

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
      <BubbleBtn active={editor.isActive("bold")}      onClick={cmd(() => editor.chain().focus().toggleBold().run())}      title="Bold (Cmd+B)"><strong>B</strong></BubbleBtn>
      <BubbleBtn active={editor.isActive("italic")}    onClick={cmd(() => editor.chain().focus().toggleItalic().run())}    title="Italic (Cmd+I)"><em>I</em></BubbleBtn>
      <BubbleBtn active={editor.isActive("underline")} onClick={cmd(() => editor.chain().focus().toggleUnderline().run())} title="Underline"><span style={{ textDecoration: "underline" }}>U</span></BubbleBtn>
      <BubbleBtn active={editor.isActive("strike")}    onClick={cmd(() => editor.chain().focus().toggleStrike().run())}    title="Strikethrough"><span style={{ textDecoration: "line-through" }}>S</span></BubbleBtn>
      <BubbleSep />
      <BubbleBtn active={editor.isActive("link")} onClick={cmd(onLinkClick)} title="Link">🔗</BubbleBtn>
      <BubbleSep />
      <div style={{ position: "relative" }}>
        <BubbleBtn
          active={!!activeHighlight}
          onClick={cmd(() => setShowHighlightPalette(v => !v))}
          title="Highlight"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>H</span>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: activeHighlight || "#fef08a", display: "inline-block" }} />
          </span>
        </BubbleBtn>
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().setHighlight({ color: c }).run();
                  setShowHighlightPalette(false);
                }}
                title={c}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  background: c,
                  border: activeHighlight === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().unsetHighlight().run();
                setShowHighlightPalette(false);
              }}
              style={{
                gridColumn: "1 / -1",
                marginTop: 2,
                padding: "4px 0",
                background: "transparent",
                color: "#cbd5e1",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
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

type SlashItem = { id: string; label: string; keywords: string; run: () => void };

function SlashPopup({
  open, coords, items, activeIdx, setActiveIdx, onSelect,
}: {
  open: boolean;
  coords: { top: number; left: number } | null;
  items: SlashItem[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onSelect: (item: SlashItem) => void;
}) {
  if (!open || !coords || items.length === 0) return null;
  return createPortal(
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
        minWidth: 240,
        padding: 4,
        background: "#1e1b2e",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        boxShadow: "0 16px 36px rgba(0,0,0,0.32)",
        fontFamily: "var(--font-sans, system-ui)",
      }}
    >
      <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
        Insert
      </div>
      {items.map((it, idx) => {
        const active = idx === activeIdx;
        return (
          <button
            key={it.id}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(it); }}
            onMouseEnter={() => setActiveIdx(idx)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              background: active ? "#7C3AED" : "transparent",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

export default function RichTextEditor({
  content = "",
  onChange,
  onMention,
  placeholder,
  minimal = false,
  compact = false,
  disabled = false,
  allowMentions = false,
}: RichTextEditorProps) {
  const { t } = useTranslation();

  // @mention state
  const [mentionItems, setMentionItems] = useState<MentionUser[]>([]);
  const [mentionActiveIdx, setMentionActiveIdx] = useState(0);
  const mentionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allowMentionsRef = useRef(allowMentions);
  useEffect(() => { allowMentionsRef.current = allowMentions; }, [allowMentions]);

  // Slash command state — opens at cursor when an empty paragraph starts with /
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashActiveIdx, setSlashActiveIdx] = useState(0);
  const [slashCoords, setSlashCoords] = useState<{ top: number; left: number } | null>(null);

  // Distraction-free focus mode — hides the toolbar
  const [focusMode, setFocusMode] = useState(false);
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMode(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusMode]);

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
    ScriptureChip,
  ], [placeholder]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    extensions,
    content: plainToHtml(content),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());

      // Slash command detection: cursor inside a paragraph whose text starts
      // with /<letters>. Doesn't fire on lists, headings, code blocks, or
      // mid-paragraph slashes.
      const { from } = ed.state.selection;
      const $pos = ed.state.doc.resolve(from);
      const parent = $pos.parent;
      if (parent.type.name === "paragraph") {
        const text = parent.textContent;
        const m = text.match(/^\/([a-z]*)$/i);
        if (m) {
          const slashStartPos = from - m[0].length;
          try {
            const c = ed.view.coordsAtPos(slashStartPos);
            setSlashCoords({ top: c.bottom + 4, left: c.left });
          } catch {
            setSlashCoords(null);
          }
          setSlashFilter(m[1]);
          setSlashActiveIdx(0);
          setSlashOpen(true);
          // Suppress @-mention while slash is active
          setMentionItems([]);
          return;
        }
      }
      if (slashOpen) setSlashOpen(false);

      if (!allowMentionsRef.current) return;
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
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [content, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync disabled
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const [showEmoji, setShowEmoji] = useState(false);
  const insertEditorEmoji = useCallback((em: string) => {
    editor?.chain().focus().insertContent(em).run();
    setShowEmoji(false);
  }, [editor]);

  const [linkModal, setLinkModal] = useState<{ open: boolean; value: string }>({ open: false, value: "" });
  const linkInputRef = useRef<HTMLInputElement>(null);

  function openLinkModal() {
    const existing = editor.getAttributes("link").href || "";
    setLinkModal({ open: true, value: existing });
    // Focus the input after the modal renders
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }

  function submitLink(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = linkModal.value.trim();
    if (!trimmed) { editor.chain().focus().unsetLink().run(); }
    else {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
        setLinkModal({ open: false, value: "" });
        return;
      }
      // mailto: links are valid, don't prepend https://
      const href = /^mailto:/i.test(trimmed)
        ? trimmed
        : /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkModal({ open: false, value: "" });
  }

  if (!editor) return null;

  const activeTextColor = editor.getAttributes("textStyle").color || null;
  const activeHighlight = editor.getAttributes("highlight").color || null;

  // ── Slash command items + runner ───────────────────────────────────────
  const SLASH_ITEMS: SlashItem[] = [
    { id: "h1",        label: "Heading 1",       keywords: "h1 heading title",         run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: "h2",        label: "Heading 2",       keywords: "h2 heading subtitle",      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: "h3",        label: "Heading 3",       keywords: "h3 heading section",       run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { id: "bullet",    label: "Bulleted list",   keywords: "ul bullet list unordered", run: () => editor.chain().focus().toggleBulletList().run() },
    { id: "numbered",  label: "Numbered list",   keywords: "ol numbered list ordered", run: () => editor.chain().focus().toggleOrderedList().run() },
    { id: "quote",     label: "Quote",           keywords: "blockquote quote",         run: () => editor.chain().focus().toggleBlockquote().run() },
    { id: "code",      label: "Code block",      keywords: "code pre",                 run: () => editor.chain().focus().toggleCodeBlock().run() },
    { id: "divider",   label: "Divider",         keywords: "hr divider rule line",     run: () => editor.chain().focus().setHorizontalRule().run() },
    {
      id: "scripture",
      label: "Scripture (e.g. Matthew 24:14)",
      keywords: "scripture bible verse jw nwt",
      run: () => {
        const ref = window.prompt("Scripture reference (e.g. Matthew 24:14):");
        if (ref && ref.trim()) editor.chain().focus().insertScriptureChip(ref.trim()).run();
      },
    },
  ];

  function filteredSlashItems(): SlashItem[] {
    const q = slashFilter.toLowerCase().trim();
    if (!q) return SLASH_ITEMS;
    return SLASH_ITEMS.filter((it) =>
      it.label.toLowerCase().includes(q) || it.keywords.toLowerCase().includes(q),
    );
  }

  function runSlashItem(item: SlashItem) {
    // Strip the /trigger text from the document, then run the command
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);
    const text = $pos.parent.textContent;
    const m = text.match(/^\/([a-z]*)$/i);
    if (m) {
      const start = from - m[0].length;
      editor.chain().focus().deleteRange({ from: start, to: from }).run();
    }
    setSlashOpen(false);
    setSlashFilter("");
    item.run();
  }

  // SlashPopup, BubbleBtn, BubbleSep, SelectionBubble are now defined at
  // module scope below the imports — keeping them inline caused React to
  // remount the component (and reset its useEffect listeners) on every parent
  // re-render, which broke the selection bubble entirely.

  // Inline floating bubble — appears above the selection with quick-access
  // formatting buttons and a highlight color picker. The full toolbar above
  // stays for tasks the bubble doesn't cover (headings, lists, alignment, etc).
  // (SelectionBubble hoisted to module scope below imports)

  return (
    <div
      className="mention-wrap"
      style={{ position: "relative" }}
      onKeyDown={(e) => {
        // Slash menu navigation takes precedence
        if (slashOpen) {
          const items = filteredSlashItems();
          if (e.key === "ArrowDown") { e.preventDefault(); setSlashActiveIdx(i => Math.min(i + 1, items.length - 1)); return; }
          if (e.key === "ArrowUp")   { e.preventDefault(); setSlashActiveIdx(i => Math.max(i - 1, 0)); return; }
          if (e.key === "Enter" || e.key === "Tab") {
            const it = items[slashActiveIdx];
            if (it) { e.preventDefault(); runSlashItem(it); return; }
          }
          if (e.key === "Escape") { e.preventDefault(); setSlashOpen(false); return; }
        }
        // @-mention nav
        if (allowMentions && mentionItems.length > 0) {
          if (e.key === "ArrowDown") { e.preventDefault(); setMentionActiveIdx(i => Math.min(i + 1, mentionItems.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setMentionActiveIdx(i => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" || e.key === "Tab") {
            const item = mentionItems[mentionActiveIdx];
            if (item) { e.preventDefault(); insertMention(item); }
          } else if (e.key === "Escape") { setMentionItems([]); }
        }
      }}
    >
      <div
        className={`editor-wrap${disabled ? " editor-wrap--disabled" : ""}${focusMode ? " editor-wrap--focus" : ""}`}
        data-focus-mode={focusMode ? "true" : undefined}
      >
        {!disabled && (
          <div className="editor-toolbar">
            {/* ── Inline formatting ── */}
            <Btn active={editor.isActive("bold")}      onClick={() => editor.chain().focus().toggleBold().run()}      title={t("editor.bold")}     ><BoldIcon /></Btn>
            <Btn active={editor.isActive("italic")}    onClick={() => editor.chain().focus().toggleItalic().run()}    title={t("editor.italic")}   ><ItalicIcon /></Btn>
            <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"            ><UnderlineIcon /></Btn>
            <Btn active={editor.isActive("strike")}    onClick={() => editor.chain().focus().toggleStrike().run()}    title={t("editor.strike")}   ><StrikeIcon /></Btn>

            <div className="editor-sep" />

            {/* ── Headings (always shown) ── */}
            {([1, 2, 3] as const).map(level => (
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

            {/* ── Focus mode toggle ── */}
            <Btn
              active={focusMode}
              onClick={() => setFocusMode((v) => !v)}
              title="Focus mode (hide chrome)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4" />
              </svg>
            </Btn>

            <div className="editor-sep" />

            {/* ── Emoji ── */}
            <div style={{ position: "relative", display: "inline-flex" }}>
              <button
                type="button"
                className={`editor-btn${showEmoji ? " active" : ""}`}
                onMouseDown={e => { e.preventDefault(); setShowEmoji(v => !v); }}
                title="Emoji"
              >
                😊
              </button>
              {showEmoji && (
                <EmojiPickerPopup
                  onSelect={insertEditorEmoji}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>
          </div>
        )}

        <EditorContent
          editor={editor}
          className={`editor-content${compact ? " editor-content--compact" : ""}`}
        />
        <SelectionBubble editor={editor} onLinkClick={openLinkModal} />
        <SlashPopup
          open={slashOpen}
          coords={slashCoords}
          items={filteredSlashItems()}
          activeIdx={slashActiveIdx}
          setActiveIdx={setSlashActiveIdx}
          onSelect={runSlashItem}
        />
        {focusMode && (
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            title="Exit focus mode (Esc)"
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 9998,
              padding: "6px 12px",
              background: "#1e1b2e",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
            }}
          >
            Exit focus · Esc
          </button>
        )}
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
                id="link-modal-url"
                name="url"
                className="link-modal-input"
                type="text"
                placeholder="https://example.com or mailto:you@email.com"
                value={linkModal.value}
                aria-label="URL"
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
