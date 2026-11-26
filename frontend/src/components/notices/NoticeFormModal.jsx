import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES } from '../../utils/constants';
import { toInputDate } from '../../utils/formatters';

export default function NoticeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  departments,
  user,
  submitting,
}) {
  const isEditing = Boolean(initialData);
  const isFaculty = user?.role === 'faculty';

  const defaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return toInputDate(d);
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    category: 'Academic',
    priority: 'Normal',
    publishedDate: toInputDate(new Date()),
    expiryDate: defaultExpiry(),
    isPinned: false,
  });
  const [file, setFile] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setValidationError('');
    setFile(null);
    setRemoveAttachment(false);

    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        department: initialData.department?._id || initialData.department || '',
        category: initialData.category || 'Academic',
        priority: initialData.priority || 'Normal',
        publishedDate: toInputDate(initialData.publishedDate) || toInputDate(new Date()),
        expiryDate: toInputDate(initialData.expiryDate) || defaultExpiry(),
        isPinned: Boolean(initialData.isPinned),
      });
    } else {
      setForm({
        title: '',
        description: '',
        department: isFaculty
          ? user?.department?._id || ''
          : departments[0]?._id || '',
        category: 'Academic',
        priority: 'Normal',
        publishedDate: toInputDate(new Date()),
        expiryDate: defaultExpiry(),
        isPinned: false,
      });
    }
  }, [isOpen, initialData, isFaculty, user, departments]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Only PDF (.pdf) files are allowed as notice attachments.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setValidationError('PDF file size must be 5 MB or less.');
      return;
    }
    setValidationError('');
    setFile(selected);
    setRemoveAttachment(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (form.title.trim().length < 3) {
      setValidationError('Notice title must be at least 3 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      setValidationError('Description must be at least 10 characters.');
      return;
    }
    if (!form.department) {
      setValidationError('Please select a department.');
      return;
    }
    if (new Date(form.expiryDate) < new Date(form.publishedDate)) {
      setValidationError('Expiry date must be on or after the published date.');
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title.trim());
    payload.append('description', form.description.trim());
    payload.append('department', form.department);
    payload.append('category', form.category);
    payload.append('priority', form.priority);
    payload.append('publishedDate', form.publishedDate);
    payload.append('expiryDate', form.expiryDate);
    payload.append('isPinned', String(form.isPinned));

    if (file) {
      payload.append('attachment', file);
    } else if (removeAttachment) {
      payload.append('removeAttachment', 'true');
    }

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Notice' : 'Publish New Notice'}
      subtitle={
        isFaculty
          ? `Publishing to ${user?.department?.name || 'your department'}`
          : 'Create and distribute an official department notice'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {validationError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Notice Title *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Mid-Semester Examination Schedule 2026"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Department *
            </label>
            <select
              value={form.department}
              disabled={isFaculty}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              {NOTICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              {NOTICE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Published Date *
            </label>
            <input
              type="date"
              required
              value={form.publishedDate}
              onChange={(e) => setForm({ ...form, publishedDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expiry Date *
            </label>
            <input
              type="date"
              required
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description *
          </label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Write clear instructions, venue, timings, and eligibility criteria..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            PDF Attachment (Optional, max 5 MB)
          </label>

          {isEditing && initialData?.attachment?.fileName && !file && !removeAttachment && (
            <div className="flex items-center justify-between p-3 mb-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate font-medium text-slate-700">
                  Current: {initialData.attachment.originalName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRemoveAttachment(true)}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          )}

          <label className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-indigo-50/40 hover:border-indigo-300 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-slate-600 truncate">
              {file ? `Selected: ${file.name}` : 'Click to attach a PDF circular or schedule'}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-medium text-slate-700">
            Pin this notice to Latest Announcements
          </span>
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
            {submitting
              ? 'Saving...'
              : isEditing
              ? 'Update Notice'
              : 'Publish Notice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
