import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Trash2, User, X } from "lucide-react";

const actionContent = {
  deactivate: {
    title: "Deactivate Account",
    message: "This user will no longer be able to access the ALVIN AI Mock Interview platform until the account is activated again.",
    confirmLabel: "Deactivate",
    Icon: AlertTriangle,
    iconClass: "bg-amber-100 text-amber-600",
    buttonClass: "bg-[#8B1C2C] hover:bg-[#711724] focus:ring-[#8B1C2C]",
  },
  activate: {
    title: "Activate Account",
    message: "This user will regain access to the ALVIN AI Mock Interview platform.",
    confirmLabel: "Activate",
    Icon: CheckCircle2,
    iconClass: "bg-emerald-100 text-[#16A34A]",
    buttonClass: "bg-[#16A34A] hover:bg-green-700 focus:ring-[#16A34A]",
  },
  delete: {
    title: "Delete Account",
    message: "This action cannot be undone. Deleting this account will permanently remove the user's account and all associated records from the ALVIN system.",
    confirmLabel: "Delete Account",
    Icon: Trash2,
    iconClass: "bg-red-100 text-[#DC2626]",
    buttonClass: "bg-[#DC2626] hover:bg-red-700 focus:ring-[#DC2626]",
  },
};

/**
 * Reusable confirmation dialog for activate, deactivate, and delete actions.
 * @param {{ isOpen: boolean, action: "activate"|"deactivate"|"delete"|null, account: {name: string, email: string, role: string}|null, onClose: () => void, onConfirm: () => void }} props
 */
export default function AccountActionModal({ isOpen, action, account, onClose, onConfirm }) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement;
    const focusTimer = window.setTimeout(() => cancelButtonRef.current?.focus(), 0);

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

  const { title, message, confirmLabel, Icon, iconClass, buttonClass } = actionContent[action];
  const isDelete = action === "delete";
  const canConfirm = !isDelete || deleteConfirmation === "DELETE";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-action-modal-title"
        className="relative w-full max-w-lg rounded-[18px] border border-gray-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1C2C]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="account-action-modal-title" className="pr-10 font-Geist text-2xl font-bold text-[#8B1C2C]">
          {title}
        </h2>

        <div className="my-6 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#8B1C2C]/10 text-[#8B1C2C]">
            <User className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-[Space_Grotesk,sans-serif] text-sm font-bold text-gray-900">{account.name}</p>
            <p className="truncate font-Inter text-xs text-gray-500">{account.email}</p>
            <span className="mt-1 inline-block rounded-full bg-[#8B1C2C]/10 px-2 py-0.5 font-Inter text-[10px] font-bold uppercase tracking-wider text-[#8B1C2C]">
              {account.role}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-red-100 bg-[#FEF2F2] p-4">
          <p className="font-Inter text-sm leading-6 text-red-800">{message}</p>
        </div>

        {isDelete && (
          <label className="mt-5 block font-Inter text-sm font-semibold text-gray-700">
            Type <span className="font-bold text-[#DC2626]">DELETE</span> to continue
            <input
              autoComplete="off"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder="Type DELETE to continue"
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 font-Inter text-sm outline-none transition focus:border-[#DC2626] focus:ring-2 focus:ring-red-100"
            />
          </label>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-gray-300 bg-white px-5 font-Geist text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`h-11 rounded-xl px-5 font-Geist text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${buttonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
