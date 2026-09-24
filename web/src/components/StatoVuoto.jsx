export default function StatoVuoto({ titolo, children }) {
  return (
    <div
      data-testid="stato-vuoto"
      className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
    >
      <p className="text-lg font-semibold text-slate-700">{titolo}</p>
      {children && <div className="mt-2 text-slate-500">{children}</div>}
    </div>
  )
}
