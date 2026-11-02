export default function Loading() {
  return (
    <div className="wrap py-24" role="status" aria-label="Loading">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-panel" />
      <div className="mt-4 h-5 w-1/2 animate-pulse rounded-xl bg-panel" />
    </div>
  );
}
