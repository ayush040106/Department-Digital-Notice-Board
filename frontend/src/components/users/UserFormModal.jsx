import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments,
  submitting,
}) {
  const isEditing = Boolean(initialData);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: '',
    enrollmentOrEmployeeId: '',
    isActive: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role: initialData.role || 'faculty',
        department: initialData.department?._id || initialData.department || '',
        enrollmentOrEmployeeId: initialData.enrollmentOrEmployeeId || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'faculty',
        department: departments[0]?._id || '',
        enrollmentOrEmployeeId: '',
        isActive: true,
      });
    }
  }, [isOpen, initialData, departments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      department: form.role === 'admin' ? null : form.department,
      enrollmentOrEmployeeId: form.enrollmentOrEmployeeId.trim(),
      isActive: form.isActive,
    };
    if (form.password.trim()) {
      payload.password = form.password;
    }
    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Account' : 'Create Faculty / Student Account'}
      subtitle="Assign role, department, and portal credentials"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Prof. Aarav Deshmukh"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              College Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@college.edu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.role !== 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department *
              </label>
              <select
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={form.role === 'admin' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {form.role === 'student' ? 'Enrollment No.' : 'Employee ID'}
            </label>
            <input
              type="text"
              value={form.enrollmentOrEmployeeId}
              onChange={(e) =>
                setForm({ ...form, enrollmentOrEmployeeId: e.target.value })
              }
              placeholder={form.role === 'student' ? 'e.g., 2026CSE045' : 'e.g., FAC-CSE-205'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
          </label>
          <input
            type="password"
            required={!isEditing}
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 6 characters"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-medium text-slate-700">Account is active</span>
        </label>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
