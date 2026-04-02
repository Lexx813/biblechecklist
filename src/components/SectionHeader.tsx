interface Props {
  label?: string;
  title?: string;
  sub?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

export default function SectionHeader({ label, title, sub, onViewAll, viewAllLabel = "View all" }: Props) {
  return (
    <>
      <div className="home-section-label">{label}</div>
      {onViewAll ? (
        <div className="home-section-row">
          <div>
            <h2 className="home-section-title">{title}</h2>
            <p className="home-section-sub">{sub}</p>
          </div>
          <button className="home-section-link" onClick={onViewAll}>{viewAllLabel}</button>
        </div>
      ) : (
        <>
          <h2 className="home-section-title">{title}</h2>
          <p className="home-section-sub">{sub}</p>
        </>
      )}
    </>
  );
}
