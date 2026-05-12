import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

const SignOutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-10 border-blur-xl"
                onClick={(e) => e.stopPropagation()}>
                {/* Close Button - Overlapping */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001]"
                >
                    <X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
                </button>

                {/* Header/Icon */}
                <div className="pt-6 pb-2 flex flex-col items-center">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                        <LogOut className="w-6 h-6 text-maroon" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 font-Geist">Sign Out</h2>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 text-center">
                    <p className="text-sm text-gray-600 mb-6 font-Inter">
                        Are you sure you want to sign out? You will need to log in again to access your dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-white bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 transition-all active:scale-[0.98]"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignOutModal;
