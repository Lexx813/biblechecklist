import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/custom-select.css";

/**
 * CustomSelect, styled dropdown replacing native <select>.
 *
 * Props:
 *   value      , current value (any scalar)
 *   onChange   , (value) => void
 *   options    , [{ value, label }]
 *   placeholder, string shown when no value is selected (optional)
 *   searchable , show a search input for long lists (default false)
 *   className  , extra class on the wrapper (optional)
 */

interface Option {
  value: string | number;
  label: string;
}

interface Props {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder, searchable = false, className = "" }: Props) {
  const { t } = useTranslation();
  const ph = placeholder ?? t("common.select", "Select…");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = searchable
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find(o => o.value === value);

  function pick(val: string | number) {
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
          {selected ? selected.label : ph}
        </span>
        <span className="cs-arrow">▾</span>
      </button>

      {open && (
        <div className="cs-menu">
          {searchable && (
            <div className="cs-search-wrap">
              <input
                className="cs-search"
                placeholder={t("common.search")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                aria-label={t("common.searchOptions")}
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
            {filtered.length === 0 && <p className="cs-no-results">{t("common.noResults")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
