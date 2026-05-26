import React from 'react';
import { LogOut, X } from 'lucide-react';

const EndSessionModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-10 border-blur-xl"
      >
        {/* Close Button - Overlapping */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001]"
        >
          <X className="w-5 h-5 text-[#862334] group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Header/Icon Section */}
        <div className="pt-8 pb-2 flex flex-col items-center">
          <div className="w-14 h-14 bg-[#862334]/5 rounded-full flex items-center justify-center mb-4">
            <LogOut className="w-7 h-7 text-[#862334]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0f172a] font-Geist tracking-tight">
            End Session
          </h2>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8 text-center">
          <p className="text-gray-500 text-sm font-Inter leading-relaxed mb-8">
            Are you sure you want to end the session? You will be redirected to the interview results page.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#f8fafc] text-[#64748b] font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-[#862334] text-white font-bold rounded-2xl hover:bg-[#862334]/90 shadow-lg shadow-[#862334]/20 transition-all active:scale-[0.98]"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndSessionModal;
