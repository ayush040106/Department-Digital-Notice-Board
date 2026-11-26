import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import UserFormModal from '../components/users/UserFormModal';
import { formatDate } from '../utils/formatters';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    department: 'all',
    status: 'all',
    page: 1,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments?includeInactive=true');
        setDepartments(res.data.data || []);
      } catch {
        // non-blocking
      }
    };
    fetchDepartments();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 15,
      };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.role !== 'all') params.role = filters.role;
      if (filters.department !== 'all') params.department = filters.department;
      if (filters.status !== 'all') params.status = filters.status;

      const res = await api.get('/users', { params });
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch user accounts.'));
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleSave = async (payload) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        toast.success('User account updated successfully.');
      } else {
        await api.post('/users', payload);
        toast.success('User account created successfully.');
      }
      setFormOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save user account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success('User account deleted successfully.');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete user account.'));
    } finally {
      setDeleting(false);
    }
  };

  const roleBadgeStyle = {
    admin: 'bg-navy-50 text-navy-800 border-navy-200',
    faculty: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    student: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 font-display">
            Faculty &amp; Student Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Provision faculty accounts, assign departments, and manage student access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
            }
            placeholder="Search by name, email, or enrollment/employee ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <select
          value={filters.role}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))
          }
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="faculty">Faculty</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={filters.department}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, department: e.target.value, page: 1 }))
          }
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
          }
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching accounts"
          description="Try adjusting your role, department, or search filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">ID Number</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-navy-950">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className={`capitalize ${roleBadgeStyle[u.role] || ''}`}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {u.department ? `${u.department.code} — ${u.department.name}` : 'All (Admin)'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {u.enrollmentOrEmployeeId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {String(u._id) !== String(currentUser?._id) && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-card">
          <p className="text-xs text-slate-500">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> (
            {pagination.total} accounts)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(pagination.pages, prev.page + 1),
                }))
              }
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <UserFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSave}
        initialData={editingUser}
        departments={departments}
        submitting={submitting}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.email})? Accounts that have authored notices should be deactivated instead.`}
        loading={deleting}
      />
    </div>
  );
}
