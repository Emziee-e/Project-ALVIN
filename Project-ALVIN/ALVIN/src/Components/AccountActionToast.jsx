import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

/** @param {{ toast: {id: number, title: string, message: string}|null, onClose: () => void }} props */
export default function AccountActionToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <aside role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[1100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl motion-safe:animate-[toast-fade_220ms_ease-out]">
      <div className="flex gap-3 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#16A34A]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-Geist text-sm font-bold text-gray-900">{toast.title}</p>
          <p className="mt-1 font-Inter text-xs leading-5 text-gray-500">{toast.message}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss notification" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1C2C]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div key={toast.id} className="h-1 origin-left bg-[#16A34A] motion-safe:animate-[toast-progress_3s_linear_forwards]" />
    </aside>
  );
}
