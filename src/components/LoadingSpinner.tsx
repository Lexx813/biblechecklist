export default function LoadingSpinner({ className = "" }) {
  return (
    <div className={`spinner-wrap ${className}`}>
      <div className="spinner" />
    </div>
  );
}
