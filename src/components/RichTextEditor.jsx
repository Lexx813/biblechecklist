import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useTranslation } from "react-i18next";
import "../styles/editor.css";

// Convert legacy plain-text (with \n\n paragraphs) to HTML for initial load
function plainToHtml(text) {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text; // already HTML
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

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

// ── Toolbar button ────────────────────────────────────────────────────────────
function Btn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      className={`editor-btn${active ? " active" : ""}`}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({
  content = "",
  onChange,
  placeholder,
  minimal = false,   // minimal = forum/reply mode (no headings, code block, hr)
  compact = false,   // shorter min-height
  disabled = false,
}) {
  const { t } = useTranslation();

  const extensions = useMemo(() => [
    StarterKit.configure({
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    Placeholder.configure({ placeholder: placeholder || "" }),
  ], [placeholder]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    extensions,
    content: plainToHtml(content),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync content when prop changes (e.g. switching posts / clearing on submit)
  // editor is included so this runs once the editor becomes available on mount
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

  const addLink = () => {
    const url = window.prompt(t("editor.linkPrompt"));
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className={`editor-wrap${disabled ? " editor-wrap--disabled" : ""}`}>
      {!disabled && (
        <div className="editor-toolbar">
          {/* Inline formatting */}
          <Btn active={editor.isActive("bold")}   onClick={() => editor.chain().focus().toggleBold().run()}   title={t("editor.bold")}  ><BoldIcon /></Btn>
          <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title={t("editor.italic")}><ItalicIcon /></Btn>
          <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title={t("editor.strike")}><StrikeIcon /></Btn>

          {/* Headings — full mode only */}
          {!minimal && (
            <>
              <div className="editor-sep" />
              {[1, 2, 3].map(level => (
                <Btn key={level}
                  active={editor.isActive("heading", { level })}
                  onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                  title={`H${level}`}
                >H{level}</Btn>
              ))}
            </>
          )}

          <div className="editor-sep" />

          {/* Lists */}
          <Btn active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title={t("editor.bulletList")} ><BulletIcon /></Btn>
          <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title={t("editor.orderedList")}><OrderedIcon /></Btn>

          <div className="editor-sep" />

          {/* Block elements */}
          <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title={t("editor.blockquote")}><QuoteIcon /></Btn>
          <Btn active={editor.isActive("code")}       onClick={() => editor.chain().focus().toggleCode().run()}       title={t("editor.code")}      ><CodeIcon /></Btn>
          {!minimal && (
            <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title={t("editor.codeBlock")}><CodeBlockIcon /></Btn>
          )}

          <div className="editor-sep" />

          {/* Link */}
          <Btn active={editor.isActive("link")} onClick={addLink} title={t("editor.link")}><LinkIcon /></Btn>
          {editor.isActive("link") && (
            <Btn active={false} onClick={() => editor.chain().focus().unsetLink().run()} title={t("editor.unlink")}><UnlinkIcon /></Btn>
          )}

          {/* HR — full mode only */}
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
  );
}
