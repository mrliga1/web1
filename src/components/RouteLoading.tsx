export default function RouteLoading() {
  return (
    <section className="mx-auto min-h-[65vh] w-full max-w-7xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Đang tải nội dung">
      <p role="status" className="mb-6 text-sm font-medium text-primary">Đang tải nội dung…</p>
      <div aria-hidden="true" className="animate-pulse space-y-5">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-100" />
        <div className="grid gap-6 lg:grid-cols-[7fr_3fr]">
          <div className="h-72 rounded-xl bg-slate-100" />
          <div className="h-72 rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    </section>
  );
}
