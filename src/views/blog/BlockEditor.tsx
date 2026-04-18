import { useState, useRef, useCallback, KeyboardEvent } from "react";

export type BlockType = "paragraph" | "h2" | "h3" | "pull-quote" | "bible-verse" | "bullet";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const SLASH_OPTIONS: Array<{ type: BlockType; icon: string; label: string; desc: string }> = [
  { type: "bible-verse", icon: "📖", label: "Bible Verse",  desc: "Insert verse reference" },
  { type: "pull-quote",  icon: "❝",  label: "Pull Quote",   desc: "Highlight a key thought" },
  { type: "h2",          icon: "H2", label: "Heading",      desc: "Section heading" },
  { type: "bullet",      icon: "•",  label: "Bullet List",  desc: "Bulleted item" },
];

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlockEditor({ blocks, onChange }: Props) {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string } | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  const refs = useRef<Record<string, HTMLElement | null>>({});

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

  return (
    <div className="be-root">
      {blocks.map((block) => (
        <div key={block.id} className="be-block">
          <div className="be-handle">
            <span className="be-handle-grip" title="Drag to reorder">⠿</span>
          </div>

          {block.type === "h2" && (
            <h2
              className="be-h2"
              contentEditable
              suppressContentEditableWarning
              ref={el => { refs.current[block.id] = el; }}
              onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
              onKeyDown={e => handleKey(e, block)}
              data-placeholder="Heading…"
            >{block.content}</h2>
          )}

          {block.type === "h3" && (
            <h3
              className="be-h3"
              contentEditable
              suppressContentEditableWarning
              ref={el => { refs.current[block.id] = el; }}
              onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
              onKeyDown={e => handleKey(e, block)}
              data-placeholder="Subheading…"
            >{block.content}</h3>
          )}

          {block.type === "pull-quote" && (
            <blockquote
              className="be-pullquote"
              contentEditable
              suppressContentEditableWarning
              ref={el => { refs.current[block.id] = el; }}
              onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
              onKeyDown={e => handleKey(e, block)}
              data-placeholder="A memorable thought…"
            >{block.content}</blockquote>
          )}

          {block.type === "bible-verse" && (
            <div className="be-verse-block">
              <div className="be-verse-label">📖 Bible Reference</div>
              <div
                className="be-verse-ref"
                contentEditable
                suppressContentEditableWarning
                ref={el => { refs.current[block.id] = el; }}
                onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
                onKeyDown={e => handleKey(e, block)}
                data-placeholder="e.g. John 3:16"
              >{block.content}</div>
            </div>
          )}

          {(block.type === "paragraph" || block.type === "bullet") && (
            <div className="be-row">
              {block.type === "bullet" && <span className="be-bullet">•</span>}
              <div
                className="be-para"
                contentEditable
                suppressContentEditableWarning
                ref={el => { refs.current[block.id] = el; }}
                onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
                onKeyDown={e => handleKey(e, block)}
                data-placeholder={block.type === "bullet" ? "List item…" : "Write something… or type / for commands"}
              >{block.content}</div>
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
      ))}
      <button
        className="be-add-btn"
        onClick={() => addBlockAfter(blocks[blocks.length - 1].id)}
      >+ Add block</button>
    </div>
  );
}

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(b => {
    if (b.type === "h2") return `## ${b.content}`;
    if (b.type === "h3") return `### ${b.content}`;
    if (b.type === "pull-quote") return `> ${b.content}`;
    if (b.type === "bible-verse") return `[${b.content}]`;
    if (b.type === "bullet") return `- ${b.content}`;
    return b.content;
  }).join("\n\n");
}

export function markdownToBlocks(md: string): Block[] {
  if (!md.trim()) return [{ id: uid(), type: "paragraph", content: "" }];
  return md.split(/\n\n+/).map(line => {
    const id = uid();
    if (line.startsWith("## ")) return { id, type: "h2" as BlockType, content: line.slice(3) };
    if (line.startsWith("### ")) return { id, type: "h3" as BlockType, content: line.slice(4) };
    if (line.startsWith("> ")) return { id, type: "pull-quote" as BlockType, content: line.slice(2) };
    if (/^\[.+\]$/.test(line.trim())) return { id, type: "bible-verse" as BlockType, content: line.trim().slice(1, -1) };
    if (line.startsWith("- ")) return { id, type: "bullet" as BlockType, content: line.slice(2) };
    return { id, type: "paragraph" as BlockType, content: line };
  });
}
