export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
        <div className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
      </div>
    </div>
  );
}