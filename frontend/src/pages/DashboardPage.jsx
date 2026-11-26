import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Building2,
  Users,
  AlertTriangle,
  FileText,
  Pin,
  ArrowRight,
  Download,
  Plus,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NoticeDetailModal from '../components/notices/NoticeDetailModal';
import { CATEGORY_STYLES, PRIORITY_STYLES } from '../utils/constants';
import { formatDate } from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState(null);
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, latestRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/notices/latest?limit=5'),
      ]);
      setStats(statsRes.data.data);
      setLatestNotices(latestRes.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard statistics.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  if (loading) {
    return <LoadingSpinner label="Loading college notice dashboard..." />;
  }

  const summary = stats?.summary || {};
  const maxCatCount = Math.max(
    1,
    ...(stats?.categoryBreakdown || []).map((item) => item.count)
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-900 rounded-2xl p-6 sm:p-7 text-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-indigo-200 border border-white/15">
            {user?.role === 'admin'
              ? 'College Administration'
              : `${user?.department?.code || ''} • ${user?.department?.name || 'Department Portal'}`}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-2 font-display">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-navy-100/90 mt-1">
            {user?.role === 'admin' &&
              'Monitor college-wide notices, departments, faculty, and student accounts.'}
            {user?.role === 'faculty' &&
              'Publish and manage official notices and PDF circulars for your assigned department.'}
            {user?.role === 'student' &&
              'View your department notices, latest announcements, and downloadable circulars.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/notices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-navy-950 hover:bg-indigo-50 transition-colors"
          >
            {user?.role === 'student' ? (
              <>
                <Bell className="w-4 h-4 text-indigo-600" />
                Browse Notices
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-indigo-600" />
                Manage Notices
              </>
            )}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Notices"
          value={summary.activeNotices ?? 0}
          subtitle={`${summary.totalNotices ?? 0} total published`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Urgent Alerts"
          value={summary.urgentNotices ?? 0}
          subtitle={`${summary.expiredNotices ?? 0} archived / expired`}
          icon={AlertTriangle}
          accent="rose"
        />
        {user?.role === 'admin' ? (
          <>
            <StatCard
              title="Departments"
              value={summary.activeDepartments ?? 0}
              subtitle={`${summary.totalDepartments ?? 0} total configured`}
              icon={Building2}
              accent="indigo"
            />
            <StatCard
              title="Registered Users"
              value={(summary.totalFaculty ?? 0) + (summary.totalStudents ?? 0)}
              subtitle={`${summary.totalFaculty ?? 0} faculty • ${summary.totalStudents ?? 0} students`}
              icon={Users}
              accent="navy"
            />
          </>
        ) : user?.role === 'faculty' ? (
          <>
            <StatCard
              title="My Published Notices"
              value={summary.myNotices ?? 0}
              subtitle="Authored by you"
              icon={FileText}
              accent="indigo"
            />
            <StatCard
              title="Department Students"
              value={summary.totalStudents ?? 0}
              subtitle={`${summary.totalFaculty ?? 0} department faculty`}
              icon={Users}
              accent="navy"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Dept Notices"
              value={summary.totalNotices ?? 0}
              subtitle={`For ${user?.department?.code || 'your dept'}`}
              icon={Bell}
              accent="indigo"
            />
            <StatCard
              title="Department Faculty"
              value={summary.totalFaculty ?? 0}
              subtitle={`${summary.totalStudents ?? 0} enrolled peers`}
              icon={Users}
              accent="navy"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-950 font-display">
                Latest Announcements
              </h3>
              <p className="text-xs text-slate-500">
                Most recent active circulars{' '}
                {user?.role !== 'admin' && user?.department
                  ? `for ${user.department.name}`
                  : 'across all departments'}
              </p>
            </div>
            <Link
              to="/notices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {latestNotices.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No active announcements available right now.
              </div>
            ) : (
              latestNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {notice.isPinned && (
                        <Badge className="bg-indigo-600 text-white border-indigo-600">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </Badge>
                      )}
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
                      <span className="text-xs font-semibold text-navy-700">
                        {notice.department?.code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedNotice(notice)}
                      className="text-left block w-full"
                    >
                      <h4 className="text-sm font-bold text-navy-950 hover:text-indigo-600 transition-colors truncate">
                        {notice.title}
                      </h4>
                    </button>
                    <p className="text-xs text-slate-500">
                      Published {formatDate(notice.publishedDate)} • Valid until{' '}
                      {formatDate(notice.expiryDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {notice.attachment?.fileName && (
                      <button
                        type="button"
                        onClick={() => handleDownload(notice)}
                        disabled={downloadingId === notice._id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedNotice(notice)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-navy-950 font-display">
              Notices by Category
            </h3>
            <p className="text-xs text-slate-500">Distribution across categories</p>
          </div>

          {(stats?.categoryBreakdown || []).length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No category data yet.</p>
          ) : (
            <div className="space-y-3.5">
              {stats.categoryBreakdown.map((item) => {
                const widthPct = Math.round((item.count / maxCatCount) * 100);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.category}</span>
                      <span className="font-bold text-navy-900">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy-800 to-indigo-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {user?.role === 'admin' && (stats?.departmentBreakdown || []).length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-950 font-display">
                Department-Wise Notice Summary
              </h3>
              <p className="text-xs text-slate-500">
                Live notice count and active circular status per academic department
              </p>
            </div>
            <Link
              to="/departments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Manage Departments
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Active Notices</th>
                  <th className="py-3 px-6">Total Notices</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.departmentBreakdown.map((dept) => (
                  <tr key={dept._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{dept.code}</td>
                    <td className="py-3.5 px-6 font-medium text-navy-950">{dept.name}</td>
                    <td className="py-3.5 px-6 font-semibold text-emerald-700">
                      {dept.activeNotices}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{dept.totalNotices}</td>
                    <td className="py-3.5 px-6">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <NoticeDetailModal
        notice={selectedNotice}
        isOpen={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        onDownload={handleDownload}
        downloading={downloadingId === selectedNotice?._id}
      />
    </div>
  );
}
