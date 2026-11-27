export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 mt-auto">
      <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-navy-950">
            Developed &amp; Maintained By: Ayush Tiwari
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-indigo-700 font-medium">CSE (AI-ML), Section A</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span>Full Stack Development Team</span>
        </div>
        <p className="text-slate-500 font-medium shrink-0">
          ©️ 2026 ABESEC Ghaziabad. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
