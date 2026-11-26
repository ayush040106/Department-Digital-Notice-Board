import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Users, Bell } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import DepartmentFormModal from '../components/departments/DepartmentFormModal';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/departments${isAdmin ? '?includeInactive=true' : ''}`
      );
      setDepartments(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load departments.'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSave = async (payload) => {
    setSubmitting(true);
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, payload);
        toast.success('Department updated successfully.');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created successfully.');
      }
      setFormOpen(false);
      setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save department.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/departments/${deleteTarget._id}`);
      toast.success('Department deleted successfully.');
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete department.'));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = departments.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.headOfDepartment || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 font-display">
            Academic Departments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'Add, edit, or deactivate college departments and track activity.'
              : 'Directory of academic departments participating in the notice board.'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingDept(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by department name, code, or HOD..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading departments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="No academic departments match your current search."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Code</th>
                  <th className="py-3.5 px-5">Department Name</th>
                  <th className="py-3.5 px-5">Head of Department</th>
                  <th className="py-3.5 px-4">Notices</th>
                  <th className="py-3.5 px-4">Members</th>
                  <th className="py-3.5 px-4">Status</th>
                  {isAdmin && <th className="py-3.5 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((dept) => (
                  <tr key={dept._id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-navy-50 text-navy-800 border border-navy-100 text-xs font-bold">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-navy-950">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                          {dept.description}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-700 font-medium">
                      {dept.headOfDepartment || '—'}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold text-navy-900">
                        <Bell className="w-3.5 h-3.5 text-indigo-600" />
                        {dept.activeNotices ?? 0} active
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {dept.totalNotices ?? 0} total
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {dept.facultyCount ?? 0} faculty • {dept.studentCount ?? 0} students
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={
                          dept.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }
                      >
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDept(dept);
                              setFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Department"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(dept)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DepartmentFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingDept(null);
        }}
        onSubmit={handleSave}
        initialData={editingDept}
        submitting={submitting}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteTarget?.name} (${deleteTarget?.code})"? Departments with assigned users or notices cannot be deleted until cleared.`}
        loading={deleting}
      />
    </div>
  );
}
