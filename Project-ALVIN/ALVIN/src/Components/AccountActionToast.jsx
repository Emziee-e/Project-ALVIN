import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/** @param {{ toast: {id: number, title: string, message: string}|null, onClose: () => void }} props */
export default function AccountActionToast({ toast, onClose }) {
  const [closingId, setClosingId] = useState(null);
  const closeTimerRef = useRef(null);
  const autoTimerRef = useRef(null);

  const handleDismiss = useCallback(() => {
    if (!toast) return;
    window.clearTimeout(autoTimerRef.current);
    window.clearTimeout(closeTimerRef.current);
    setClosingId(toast.id);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 260);
  }, [toast, onClose]);

  useEffect(() => {
    if (!toast) return undefined;
    window.clearTimeout(closeTimerRef.current);
    autoTimerRef.current = window.setTimeout(() => {
      handleDismiss();
    }, 2740);

    return () => {
      window.clearTimeout(autoTimerRef.current);
      window.clearTimeout(closeTimerRef.current);
    };
  }, [toast, handleDismiss]);

  if (!toast) return null;

  const isClosing = closingId === toast.id;

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(16px);
          }
        }
        @keyframes toast-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>

      <aside
        key={toast.id}
        role="status"
        aria-live="polite"
        className={`fixed bottom-4 right-4 z-[1100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ${
          isClosing
            ? "motion-safe:animate-[toast-slide-out_260ms_cubic-bezier(0.4,0,1,1)_forwards]"
            : "motion-safe:animate-[toast-slide-in_320ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
        }`}
      >
        <div className="flex gap-3 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#16A34A]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-Geist text-sm font-bold text-gray-900">{toast.title}</p>
            <p className="mt-1 font-Inter text-xs leading-5 text-gray-500">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1C2C] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          key={toast.id}
          className="h-1 origin-left bg-[#16A34A] motion-safe:animate-[toast-progress_3s_linear_forwards]"
        />
      </aside>
    </>
  );
}