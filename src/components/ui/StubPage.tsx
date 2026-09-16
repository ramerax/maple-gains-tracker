export function StubPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="rounded-xl border border-border bg-panel px-6 py-4 text-center">
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="mt-1 text-xs text-text-muted">Stub — content built in Phase 4</p>
      </div>
    </div>
  );
}
