import { useState, useEffect } from 'react';
import { UserCircle, ShieldCheck, Building2, Save, RotateCcw } from 'lucide-react';
import api, { getErrorMessage, resetDemoData } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_LABELS } from '../utils/constants';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    enrollmentOrEmployeeId: user?.enrollmentOrEmployeeId || '',
    department: user?.department?._id || '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      enrollmentOrEmployeeId: user?.enrollmentOrEmployeeId || '',
      department: user?.department?._id || '',
      currentPassword: '',
      newPassword: '',
    });
  }, [user]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data.data || []);
      } catch {
        // non-blocking
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        enrollmentOrEmployeeId: form.enrollmentOrEmployeeId.trim(),
      };
      if (user?.role === 'student' && form.department) {
        payload.department = form.department;
      }
      if (form.newPassword.trim()) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      await updateProfile(payload);
      toast.success('Profile updated successfully.');
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-900 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-md">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-navy-950 font-display">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {ROLE_LABELS[user?.role]}
            </span>
            {user?.department && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100">
                <Building2 className="w-3.5 h-3.5" />
                {user.department.code} — {user.department.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-5"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-navy-950 font-display">
            Account Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {user?.role === 'student' ? 'Enrollment Number' : 'Employee ID'}
            </label>
            <input
              type="text"
              value={form.enrollmentOrEmployeeId}
              onChange={(e) =>
                setForm({ ...form, enrollmentOrEmployeeId: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        {user?.role !== 'admin' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Department
            </label>
            <select
              disabled={user?.role !== 'student'}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
            {user?.role === 'faculty' && (
              <p className="text-[11px] text-slate-500 mt-1">
                Faculty department assignments are managed by the Administrator.
              </p>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Change Password (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Required to change password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                minLength={6}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy-950">Local Demo Data</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            All departments, notices, and accounts are persisted in browser localStorage.
            Reset anytime to restore the default college sample dataset.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetDemoData();
            toast.success('Demo dataset restored to initial state.');
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-navy-800 bg-navy-50 hover:bg-navy-100 border border-navy-200 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}
