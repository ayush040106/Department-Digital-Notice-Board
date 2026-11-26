import {
  Calendar,
  Clock,
  FileText,
  Pin,
  Pencil,
  Trash2,
  Eye,
  Download,
  User as UserIcon,
} from 'lucide-react';
import Badge from '../common/Badge';
import { CATEGORY_STYLES, PRIORITY_STYLES } from '../../utils/constants';
import { formatDate, isNoticeExpired } from '../../utils/formatters';

export default function NoticeCard({
  notice,
  canManage,
  onView,
  onEdit,
  onDelete,
  onDownload,
  downloadingId,
}) {
  const expired = isNoticeExpired(notice.expiryDate);

  return (
    <article
      className={`bg-white rounded-2xl border transition-all shadow-card hover:shadow-card-hover flex flex-col justify-between p-5 ${
        notice.isPinned && !expired
          ? 'border-indigo-200 ring-1 ring-indigo-100'
          : 'border-slate-200/80'
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {notice.isPinned && (
              <Badge className="bg-indigo-600 text-white border-indigo-600">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
            <Badge className={CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.General}>
              {notice.category}
            </Badge>
            {notice.priority !== 'Normal' && (
              <Badge className={PRIORITY_STYLES[notice.priority]}>{notice.priority}</Badge>
            )}
          </div>
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

        <button
          type="button"
          onClick={() => onView(notice)}
          className="text-left group w-full"
        >
          <h3 className="text-base font-bold text-navy-950 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {notice.title}
          </h3>
        </button>

        <p className="text-xs font-semibold text-indigo-700 mt-1.5">
          {notice.department?.code} — {notice.department?.name}
        </p>

        <p className="text-sm text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
          {notice.description}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Published: {formatDate(notice.publishedDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Expires: {formatDate(notice.expiryDate)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 truncate">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{notice.createdBy?.name || 'Faculty'}</span>
          </span>
          {notice.attachment?.fileName && (
            <button
              type="button"
              onClick={() => onDownload(notice)}
              disabled={downloadingId === notice._id}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              {downloadingId === notice._id ? 'Downloading...' : 'PDF'}
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onView(notice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-navy-800 bg-navy-50 hover:bg-navy-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Read Notice
          </button>

          {canManage && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(notice)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Edit notice"
                aria-label="Edit notice"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(notice)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete notice"
                aria-label="Delete notice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
