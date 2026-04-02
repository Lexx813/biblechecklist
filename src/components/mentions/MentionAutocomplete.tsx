// @ts-nocheck
import { useState, useRef } from "react";
import { profileApi } from "../../api/profile";
import "../../styles/mentions.css";

export default function MentionAutocomplete({
  value,
  onChange,
  onKeyDown,
  placeholder,
  rows = 3,
  disabled,
  className,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const taRef = useRef(null);
  const timerRef = useRef(null);

  function detectMentionFragment(text, cursorPos) {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@([\w.-]*)$/);
    return match ? match[1] : null;
  }

  function handleChange(e) {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(e);

    clearTimeout(timerRef.current);
    const fragment = detectMentionFragment(text, cursor);
    if (fragment !== null) {
      timerRef.current = setTimeout(async () => {
        const results = await profileApi.searchByName(fragment);
        setSuggestions(results);
        setActiveIdx(0);
      }, 200);
    } else {
      setSuggestions([]);
    }
  }

  function insertMention(displayName) {
    const cursor = taRef.current.selectionStart;
    const text = value;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const mentionStart = before.lastIndexOf("@");
    const newText = before.slice(0, mentionStart) + "@" + displayName + " " + after;
    onChange({ target: { value: newText } });
    setSuggestions([]);
    setTimeout(() => {
      const pos = mentionStart + displayName.length + 2;
      taRef.current?.setSelectionRange(pos, pos);
      taRef.current?.focus();
    }, 0);
  }

  function handleKeyDown(e) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (suggestions[activeIdx]) {
          e.preventDefault();
          insertMention(suggestions[activeIdx].display_name);
          return;
        }
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }
    if (onKeyDown) onKeyDown(e);
  }

  return (
    <div className="mention-wrap">
      <textarea
        ref={taRef}
        name="content"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={rows}
        disabled={disabled}
      />
      {suggestions.length > 0 && (
        <div className="mention-dropdown">
          {suggestions.map((u, i) => (
            <div
              key={u.id}
              className={`mention-option${i === activeIdx ? " mention-option--active" : ""}`}
              onMouseDown={e => { e.preventDefault(); insertMention(u.display_name); }}
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
      )}
    </div>
  );
}
