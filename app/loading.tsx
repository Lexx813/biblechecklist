export default function Loading() {
  return (
    <div className="nwt-skeleton">
      <nav className="nwt-skeleton-nav">
        <div className="nwt-skeleton-logo" />
        <div className="nwt-skeleton-title" />
      </nav>
      <div className="nwt-skeleton-body">
        <div className="nwt-skeleton-spinner" />
      </div>
    </div>
  );
}
