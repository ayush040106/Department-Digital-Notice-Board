import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Bell,
  Download,
  Eye,
  Pencil,
  Trash2,
  RotateCcw,
  Pin,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import NoticeCard from '../components/notices/NoticeCard';
import NoticeDetailModal from '../components/notices/NoticeDetailModal';
import NoticeFormModal from '../components/notices/NoticeFormModal';
import { CATEGORY_STYLES, NOTICE_CATEGORIES, PRIORITY_STYLES } from '../utils/constants';
import { formatDate, isNoticeExpired } from '../utils/formatters';

export default function NoticesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notices, setNotices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');

  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    category: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    mine: false,
    page: 1,
  });

  const [detailNotice, setDetailNotice] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const canCreate = isAdmin || isFaculty;

  const canManageNotice = (notice) => {
    if (isAdmin) return true;
    if (isFaculty) {
      return (
        String(notice.createdBy?._id || notice.createdBy) === String(user?._id) &&
        String(notice.department?._id || notice.department) ===
          String(user?.department?._id)
      );
    }
    return false;
  };

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

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 9,
        status: filters.status,
      };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (isAdmin && filters.department !== 'all') params.department = filters.department;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (isFaculty && filters.mine) params.mine = 'true';

      const res = await api.get('/notices', { params });
      setNotices(res.data.data.notices || []);
      setPagination(res.data.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch notices.'));
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, isFaculty, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotices();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchNotices]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      category: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      mine: false,
      page: 1,
    });
  };

  const handleSaveNotice = async (formData) => {
    setSubmitting(true);
    try {
      if (editingNotice) {
        await api.put(`/notices/${editingNotice._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Notice updated successfully.');
      } else {
        await api.post('/notices', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Notice published successfully.');
      }
      setFormOpen(false);
      setEditingNotice(null);
      fetchNotices();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save notice.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/notices/${deleteTarget._id}`);
      toast.success('Notice deleted successfully.');
      setDeleteTarget(null);
      fetchNotices();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete notice.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (notice) => {
    try {
      setDownloadingId(notice._id);
      const res = await api.get(`/notices/${notice._id}/attachment`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = notice.attachment?.originalName || 'notice-attachment.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to download PDF attachment.'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950 font-display">
            {isAdmin
              ? 'All Department Notices'
              : `${user?.department?.name || 'Department'} Notice Board`}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin && 'Create, monitor, and manage circulars across every department.'}
            {isFaculty &&
              `Publish official circulars for ${user?.department?.code || 'your department'} and manage your posts.`}
            {user?.role === 'student' &&
              `Showing official notices published for ${user?.department?.code || 'your'} students.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-navy-900 text-white'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
              title="Card View"
              aria-label="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-navy-900 text-white'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setEditingNotice(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publish Notice
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Search &amp; Filters ({pagination.total} notices)
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
              placeholder="Search notices by title or keyword..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {isAdmin ? (
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
          ) : (
            <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 flex items-center truncate">
              Dept: {user?.department?.code || 'Assigned'}
            </div>
          )}

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))
            }
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {NOTICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
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
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">From:</span>
            <input
              type="date"
              aria-label="Filter from published date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))
              }
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Published To:</span>
            <input
              type="date"
              aria-label="Filter to published date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))
              }
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {isFaculty && (
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-navy-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.mine}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, mine: e.target.checked, page: 1 }))
                }
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show only notices published by me
            </label>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching department notices..." />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices matched your filters"
          description="Try clearing your search or date filters, or check back later for new department announcements."
          action={
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Clear All Filters
            </button>
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {notices.map((notice) => (
            <NoticeCard
              key={notice._id}
              notice={notice}
              canManage={canManageNotice(notice)}
              onView={setDetailNotice}
              onEdit={(n) => {
                setEditingNotice(n);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              downloadingId={downloadingId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Notice Title</th>
                  <th className="py-3.5 px-4">Dept</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Published</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {notices.map((notice) => {
                  const expired = isNoticeExpired(notice.expiryDate);
                  return (
                    <tr key={notice._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          {notice.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailNotice(notice)}
                            className="font-semibold text-navy-950 hover:text-indigo-600 text-left truncate"
                          >
                            {notice.title}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          By {notice.createdBy?.name || 'Faculty'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-700 text-xs">
                        {notice.department?.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            className={
                              CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.General
                            }
                          >
                            {notice.category}
                          </Badge>
                          {notice.priority !== 'Normal' && (
                            <Badge className={PRIORITY_STYLES[notice.priority]}>
                              {notice.priority}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(notice.publishedDate)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(notice.expiryDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={
                            expired
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }
                        >
                          {expired ? 'Expired' : 'Active'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailNotice(notice)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            title="View Notice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {notice.attachment?.fileName && (
                            <button
                              type="button"
                              onClick={() => handleDownload(notice)}
                              disabled={downloadingId === notice._id}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {canManageNotice(notice) && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNotice(notice);
                                  setFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Edit Notice"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(notice)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50"
                                title="Delete Notice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-card">
          <p className="text-xs text-slate-500">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> (
            {pagination.total} notices)
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

      <NoticeDetailModal
        notice={detailNotice}
        isOpen={Boolean(detailNotice)}
        onClose={() => setDetailNotice(null)}
        onDownload={handleDownload}
        downloading={downloadingId === detailNotice?._id}
      />

      <NoticeFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingNotice(null);
        }}
        onSubmit={handleSaveNotice}
        initialData={editingNotice}
        departments={departments}
        user={user}
        submitting={submitting}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteNotice}
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Any attached PDF will also be removed permanently.`}
        loading={deleting}
      />
    </div>
  );
}
