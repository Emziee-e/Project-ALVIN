import React, { useState, useEffect, useMemo } from "react";
import { X, UserPlus, Loader2, Search, Check } from "lucide-react";

/**
 * Props
 * - isOpen, onClose
 * - students:            [{ student_id, display_name, ub_mail, account_status }]
 * - isLoading:           student list is being fetched
 * - loadError:           error message if the fetch failed
 * - existingEnrollments: { [student_id]: "enrolled" | "dropped" | ... }
 * - onEnroll(selectedStudents) => Promise<{ success?: boolean, error?: string }>
 */
export default function EnrollStudentModal({
  isOpen,
  onClose,
  onEnroll,
  students = [],
  isLoading: isLoadingStudents = false,
  loadError = "",
  existingEnrollments = {},
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIds(new Set());
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const getDisabledReason = (student) => {
    const existing = existingEnrollments[student.student_id];
    if (existing) {
      return existing.toLowerCase() === "dropped" ? "Dropped" : "Enrolled";
    }
    return "";
  };

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...students].sort((a, b) =>
      (a.display_name || a.ub_mail || "").localeCompare(
        b.display_name || b.ub_mail || ""
      )
    );
    if (!q) return sorted;
    return sorted.filter(
      (s) =>
        (s.display_name || "").toLowerCase().includes(q) ||
        (s.ub_mail || "").toLowerCase().includes(q)
    );
  }, [students, query]);

  const selectableFiltered = useMemo(
    () => filteredStudents.filter((s) => !existingEnrollments[s.student_id]),
    [filteredStudents, existingEnrollments]
  );

  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((s) => selectedIds.has(s.student_id));

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
        selectableFiltered.forEach((s) => next.delete(s.student_id));
      } else {
        selectableFiltered.forEach((s) => next.add(s.student_id));
      }
      return next;
    });
    if (error) setError("");
  };

  if (!isOpen) return null;

  const selectedCount = selectedIds.size;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCount === 0) {
      setError("Please select at least one student.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const selectedStudents = students.filter((s) =>
        selectedIds.has(s.student_id)
      );
      const result = await onEnroll(selectedStudents);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setSelectedIds(new Set());
        setQuery("");
        onClose();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent closing while processing
    setSelectedIds(new Set());
    setQuery("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#862334]/10 text-[#862334] rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-Geist text-gray-900 leading-tight">
                Enroll Students
              </h2>
              <p className="text-xs text-gray-500">
                Select one or more students to enroll.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 min-h-0 flex-1"
        >
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {/* Student list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
            {/* Select-all row */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200">
              <button
                type="button"
                onClick={toggleAllFiltered}
                disabled={
                  isLoading || isLoadingStudents || selectableFiltered.length === 0
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

            {/* Rows */}
            <div className="overflow-y-auto h-64">
              {isLoadingStudents ? (
                <div className="h-full flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading students...
                </div>
              ) : loadError ? (
                <div className="h-full flex items-center justify-center px-6 text-center text-sm text-red-600">
                  {loadError}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  {students.length === 0
                    ? "No students found."
                    : "No students match your search."}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => {
                    const disabledReason = getDisabledReason(student);
                    const isDisabled = Boolean(disabledReason);
                    const isChecked = selectedIds.has(student.student_id);

                    return (
                      <li key={student.student_id}>
                        <button
                          type="button"
                          disabled={isDisabled || isLoading}
                          onClick={() => toggleStudent(student.student_id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                            isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : isChecked
                              ? "bg-[#862334]/5 cursor-pointer"
                              : "hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked || disabledReason === "Enrolled"}
                            disabled={isDisabled}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {student.display_name || "Unnamed student"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.ub_mail}
                            </p>
                          </div>
                          {isDisabled && (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {disabledReason}
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

          {error && (
            <p className="text-xs text-red-600 font-medium -mt-1">{error}</p>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedCount === 0}
              className="flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-[#862334] text-white rounded-full text-xs font-bold hover:bg-[#701c2b] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                  Enrolling...
                </>
              ) : selectedCount > 0 ? (
                `Enroll ${selectedCount} Student${selectedCount === 1 ? "" : "s"}`
              ) : (
                "Enroll Students"
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