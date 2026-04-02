// @ts-nocheck
export default function EmptyState({ icon, title, sub, btnLabel, onBtn }) {
  return (
    <div className="home-empty">
      <div className="home-empty-icon">{icon}</div>
      <p className="home-empty-title">{title}</p>
      <p className="home-empty-sub">{sub}</p>
      {btnLabel && <button className="home-empty-btn" onClick={onBtn}>{btnLabel}</button>}
    </div>
  );
}
