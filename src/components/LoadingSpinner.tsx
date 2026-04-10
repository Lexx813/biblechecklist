export default function LoadingSpinner({ className = "" }) {
  return (
    <div className={`spinner-wrap ${className}`} role="status" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
}
