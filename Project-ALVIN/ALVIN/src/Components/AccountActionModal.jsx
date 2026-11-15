import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Trash2, User, X } from "lucide-react";

const actionContent = {
  deactivate: {
    title: "Deactivate Account",
    message:
      "This user will no longer be able to access the ALVIN AI Mock Interview platform until the account is activated again.",
    confirmLabel: "Deactivate",
    Icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600",
    buttonClass:
      "bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 focus:ring-maroon",
  },
  activate: {
    title: "Activate Account",
    message:
      "This user will regain access to the ALVIN AI Mock Interview platform.",
    confirmLabel: "Activate",
    Icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-[#16A34A]",
    buttonClass:
      "bg-[#16A34A] hover:bg-green-700 shadow-lg hover:shadow-green-600/20 focus:ring-[#16A34A]",
  },
  delete: {
    title: "Delete Account",
    message:
      "This action cannot be undone. Deleting this account will permanently remove the user's account and all associated records from the ALVIN system.",
    confirmLabel: "Delete Account",
    Icon: Trash2,
    iconClass: "bg-red-50 text-maroon",
    buttonClass:
      "bg-[#DC2626] hover:bg-red-700 shadow-lg hover:shadow-red-600/20 focus:ring-[#DC2626]",
  },
};

/**
 * Reusable confirmation dialog for activate, deactivate, and delete actions.
 * @param {{ isOpen: boolean, action: "activate"|"deactivate"|"delete"|null, account: {name: string, email: string, role: string}|null, onClose: () => void, onConfirm: () => void }} props
 */
export default function AccountActionModal({
  isOpen,
  action,
  account,
  onClose,
  onConfirm,
}) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement;
    const focusTimer = window.setTimeout(
      () => cancelButtonRef.current?.focus(),
      0
    );

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const items = Array.from(focusable);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !action || !account) return null;

  const { title, message, confirmLabel, Icon, iconClass, buttonClass } =
    actionContent[action];
  const isDelete = action === "delete";
  const canConfirm = !isDelete || deleteConfirmation === "DELETE";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-action-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100"
      >
        {/* Close Button - Overlapping (matches SignOutModal) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001] cursor-pointer focus:outline-none focus:ring-2 focus:ring-maroon"
        >
          <X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Header/Icon */}
        <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${iconClass}`}
          >
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2
            id="account-action-modal-title"
            className="text-xl font-bold text-gray-900 font-Geist"
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 text-center mb-4 font-Inter leading-relaxed">
            {message}
          </p>

          {/* Target Account Card */}
          <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 text-left">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#862334]/10 text-[#862334]">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-Geist text-sm font-bold text-gray-900">
                {account.name}
              </p>
              <p className="truncate font-Inter text-xs text-gray-500">
                {account.email}
              </p>
              <span className="mt-1 inline-block rounded-full bg-[#862334]/10 px-2 py-0.5 font-Inter text-[10px] font-bold uppercase tracking-wider text-[#862334]">
                {account.role === "career_advisor"
                  ? "Career Advisor"
                  : account.role}
              </span>
            </div>
          </div>

          {isDelete && (
            <label className="mb-5 block text-left font-Inter text-xs font-semibold text-gray-700">
              Type <span className="font-bold text-[#DC2626]">DELETE</span> to
              confirm
              <input
                autoComplete="off"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE"
                className="mt-1.5 h-10 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 font-Inter text-sm text-gray-900 outline-none transition focus:border-[#DC2626] focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${buttonClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}