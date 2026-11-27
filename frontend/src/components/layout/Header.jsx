import { Menu, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';

export default function Header({ onMenuClick, pageTitle }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 truncate">
            ABESEC Ghaziabad
          </p>
          <h2 className="text-base sm:text-lg font-bold text-navy-950 truncate leading-tight">
            {pageTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user?.department && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-50 border border-navy-100 text-navy-800 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{user.department.code}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-navy-950 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              {ROLE_LABELS[user?.role]}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-800 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
