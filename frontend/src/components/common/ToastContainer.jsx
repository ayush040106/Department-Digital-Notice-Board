import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const styles = {
    success: 'bg-white border-emerald-200 text-slate-800',
    error: 'bg-white border-red-200 text-slate-800',
    info: 'bg-white border-indigo-200 text-slate-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
  };

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg ${styles[t.type] || styles.info}`}
        >
          {icons[t.type] || icons.info}
          <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
