export default function Navbar() {
  return (
    <header className="flex w-full items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workers Analyzer
        </p>
        <h1 className="text-xl font-semibold text-slate-900">Buste paga</h1>
      </div>
      <p className="text-sm text-slate-500">Estrazione documenti payroll</p>
    </header>
  );
}
