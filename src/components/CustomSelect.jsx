import { useState, useEffect, useRef } from "react";
import "../styles/custom-select.css";

/**
 * CustomSelect — styled dropdown replacing native <select>.
 *
 * Props:
 *   value       — current value (any scalar)
 *   onChange    — (value) => void
 *   options     — [{ value, label }]
 *   placeholder — string shown when no value is selected (optional)
 *   searchable  — show a search input for long lists (default false)
 *   className   — extra class on the wrapper (optional)
 */
export default function CustomSelect({ value, onChange, options, placeholder = "Select…", searchable = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = searchable
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find(o => o.value === value);

  function pick(val) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className={`cs-wrap${className ? ` ${className}` : ""}`} ref={ref}>
      <button
        type="button"
        className={`cs-btn${open ? " is-open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`cs-btn-label${selected ? "" : " cs-placeholder"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="cs-arrow">▾</span>
      </button>

      {open && (
        <div className="cs-menu">
          {searchable && (
            <div className="cs-search-wrap">
              <input
                className="cs-search"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="cs-list">
            {filtered.map(o => (
              <button
                key={String(o.value)}
                type="button"
                className={`cs-item${o.value === value ? " is-selected" : ""}`}
                onClick={() => pick(o.value)}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && <p className="cs-no-results">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
}
