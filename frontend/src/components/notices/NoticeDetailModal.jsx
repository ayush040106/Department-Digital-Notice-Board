import { Calendar, Clock, Download, FileText, Pin, User as UserIcon, Building2 } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { CATEGORY_STYLES, PRIORITY_STYLES } from '../../utils/constants';
import { formatDate, formatFileSize, isNoticeExpired } from '../../utils/formatters';

export default function NoticeDetailModal({
  notice,
  isOpen,
  onClose,
  onDownload,
  downloading,
}) {
  if (!notice) return null;

  const expired = isNoticeExpired(notice.expiryDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={notice.title}
      subtitle={`${notice.department?.code || ''} — ${notice.department?.name || ''}`}
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {notice.isPinned && (
            <Badge className="bg-indigo-600 text-white border-indigo-600">
              <Pin className="w-3 h-3" />
              Pinned Announcement
            </Badge>
          )}
          <Badge className={CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.General}>
            {notice.category}
          </Badge>
          <Badge className={PRIORITY_STYLES[notice.priority] || PRIORITY_STYLES.Normal}>
            Priority: {notice.priority}
          </Badge>
          <Badge
            className={
              expired
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }
          >
            {expired ? 'Expired' : 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Department:</strong> {notice.department?.name} ({notice.department?.code})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Published By:</strong> {notice.createdBy?.name || 'Administrator'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Published Date:</strong> {formatDate(notice.publishedDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Expiry Date:</strong> {formatDate(notice.expiryDate)}
            </span>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Notice Details
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-white p-4 rounded-xl border border-slate-200/70">
            {notice.description}
          </p>
        </div>

        {notice.attachment?.fileName && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-950 truncate">
                  {notice.attachment.originalName}
                </p>
                <p className="text-xs text-slate-500">
                  PDF Document {notice.attachment.size ? `• ${formatFileSize(notice.attachment.size)}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDownload(notice)}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
