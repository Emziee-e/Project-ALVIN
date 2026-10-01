import React, { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";

export default function EnrollStudentModal({ isOpen, onClose, onEnroll }) {
  const [studentInput, setStudentInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentInput.trim()) {
      setError("Please enter a student number or email.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await onEnroll(studentInput.trim());

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Success: Reset state and close modal
        setIsLoading(false);
        setStudentInput("");
        onClose();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent closing while processing
    setStudentInput("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#862334]/10 text-[#862334] rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-Geist text-gray-900 leading-tight">
                Enroll Student
              </h2>
              <p className="text-xs text-gray-500">
                Enter the student's ID number or email to enroll.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Student Number / Email
            </label>
            <input
              type="text"
              placeholder="e.g. 2023-1003 or student@ubian.edu.ph"
              value={studentInput}
              onChange={(e) => {
                setStudentInput(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            {error && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{error}</p>
            )}
          </div>

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
              disabled={isLoading}
              className="flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-[#862334] text-white rounded-full text-xs font-bold hover:bg-[#701c2b] transition-all shadow-xs disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                  Enrolling...
                </>
              ) : (
                "Enroll Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}