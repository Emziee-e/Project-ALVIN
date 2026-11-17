import React, { useState, useEffect, useMemo } from "react";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";

/**
 * Props
 * - isOpen, onClose
 * - students:  [{ id, name, email, account_status }]  (existing student accounts)
 * - isLoading: student list is still loading
 * - loadError: error message if the list failed to load
 * - onAddCareerAdvisors(selectedStudents) => Promise<{ error?: string }>
 */
export default function AddCareerAdvisorModal({
  isOpen,
  onClose,
  onAddCareerAdvisors,
  students = [],
  isLoading: isLoadingStudents = false,
  loadError = "",
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIds(new Set());
      setError("");
      setIsLoading(false);
      setIsConfirming(false);
    }
  }, [isOpen]);

  // Drop selections for people who are no longer in the list
  // (e.g. already promoted after a partially successful attempt)
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(students.map((s) => s.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [students]);

  const isSelectable = (student) =>
    String(student.account_status || "active").toLowerCase() === "active";

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...students].sort((a, b) =>
      (a.name || a.email || "").localeCompare(b.name || b.email || "")
    );
    if (!q) return sorted;
    return sorted.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
    );
  }, [students, query]);

  const selectableFiltered = useMemo(
    () => filteredStudents.filter(isSelectable),
    [filteredStudents]
  );

  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((s) => selectedIds.has(s.id));

  const toggleStudent = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (error) setError("");
  };

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        selectableFiltered.forEach((s) => next.delete(s.id));
      } else {
        selectableFiltered.forEach((s) => next.add(s.id));
      }
      return next;
    });
    if (error) setError("");
  };

  if (!isOpen) return null;

  const selectedCount = selectedIds.size;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedCount === 0) {
      setError("Please select at least one person.");
      return;
    }

    // First press: show the confirmation step instead of promoting right away
    if (!isConfirming) {
      setError("");
      setIsConfirming(true);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const selected = students.filter((s) => selectedIds.has(s.id));
      const result = await onAddCareerAdvisors(selected);
      if (result?.error) {
        setError(result.error);
        setIsConfirming(false); // back to the list so they can review what's left
        return;
      }

      setSelectedIds(new Set());
      setQuery("");
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setSelectedIds(new Set());
    setQuery("");
    setError("");
    setIsConfirming(false);
    onClose();
  };

  const selectedPeople = students.filter((s) => selectedIds.has(s.id));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#862334]/10 text-[#862334] rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-Geist text-gray-900 leading-tight">
                Add Career Advisors
              </h2>
              <p className="text-xs text-gray-500">
                Select users to move from Student to Career Advisor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 min-h-0 flex-1"
        >
          {!isConfirming && (
          <>
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {/* List */}
          <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200">
              <button
                type="button"
                onClick={toggleAllFiltered}
                disabled={
                  isLoading ||
                  isLoadingStudents ||
                  selectableFiltered.length === 0
                }
                className="flex items-center gap-3 text-xs font-semibold text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Checkbox checked={allFilteredSelected} />
                {query.trim() ? "Select all results" : "Select all"}
                <span className="font-normal text-gray-400">
                  ({selectableFiltered.length})
                </span>
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={isLoading}
                  className="text-xs font-medium text-[#862334] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="overflow-y-auto h-64">
              {isLoadingStudents ? (
                <div className="h-full flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading users...
                </div>
              ) : loadError ? (
                <div className="h-full flex items-center justify-center px-6 text-center text-sm text-red-600">
                  {loadError}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="h-full flex items-center justify-center px-6 text-center text-sm text-gray-500">
                  {students.length === 0
                    ? "No student accounts yet. Users appear here after they log in for the first time."
                    : "No users match your search."}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => {
                    const disabled = !isSelectable(student);
                    const checked = selectedIds.has(student.id);

                    return (
                      <li key={student.id}>
                        <button
                          type="button"
                          disabled={disabled || isLoading}
                          onClick={() => toggleStudent(student.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                            disabled
                              ? "opacity-50 cursor-not-allowed"
                              : checked
                              ? "bg-[#862334]/5 cursor-pointer"
                              : "hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          <Checkbox checked={checked} disabled={disabled} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {student.name || "Unnamed user"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.email}
                            </p>
                          </div>
                          {disabled && (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Inactive
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          </>
          )}

          {isConfirming && (
            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">
                  Move {selectedCount} user{selectedCount === 1 ? "" : "s"} to
                  Career Advisor?
                </p>
                <p>
                  Their student profile will be replaced by a career advisor
                  profile, so they will no longer have student access. Removing
                  them as a career advisor later restores a new, empty student
                  profile (previous student data is not recovered).
                </p>
              </div>
              <ul className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-y-auto max-h-56">
                {selectedPeople.map((person) => (
                  <li key={person.id} className="px-3.5 py-2.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {person.name || "Unnamed user"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {person.email}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 font-medium -mt-1">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={isConfirming ? () => setIsConfirming(false) : handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isConfirming ? "Back" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedCount === 0}
              className="flex items-center justify-center min-w-[150px] px-5 py-2.5 bg-[#862334] text-white rounded-full text-xs font-bold hover:bg-[#701c2b] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : isConfirming ? (
                `Confirm & Add ${selectedCount}`
              ) : selectedCount > 0 ? (
                `Add ${selectedCount} Advisor${selectedCount === 1 ? "" : "s"}`
              ) : (
                "Add Advisors"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Checkbox({ checked, disabled = false }) {
  return (
    <span
      aria-hidden="true"
      className={`w-[18px] h-[18px] shrink-0 rounded-md border flex items-center justify-center transition-colors ${
        checked ? "bg-[#862334] border-[#862334]" : "bg-white border-gray-300"
      } ${disabled ? "opacity-60" : ""}`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
  );
}