import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Building2,
  Users,
  UserCircle,
  GraduationCap,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'faculty', 'student'] },
    { to: '/notices', label: 'Notice Board', icon: Bell, roles: ['admin', 'faculty', 'student'] },
    { to: '/departments', label: 'Departments', icon: Building2, roles: ['admin', 'faculty', 'student'] },
    { to: '/users', label: 'User Accounts', icon: Users, roles: ['admin'] },
    { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'faculty', 'student'] },
  ].filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-navy-950 text-white flex flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight font-display">
                CampusPulse
              </h1>
              <p className="text-[11px] text-navy-200 font-medium">Digital Notice Board</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-navy-200 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-300">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-navy-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-navy-900/50">
          <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-3">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">
              {ROLE_LABELS[user?.role] || user?.role}
            </p>
            {user?.department && (
              <p className="text-[11px] text-navy-200 mt-1 truncate">
                Dept: {user.department.code} — {user.department.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
