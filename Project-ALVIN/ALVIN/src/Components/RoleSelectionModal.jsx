import React from 'react';
import { X, Building2, UserCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoleSelectionModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto border">
            <div className="relative w-xl max-w-2xl bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 my-auto border border-blur-xl border-10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4  p-2 rounded-full bg-white shadow-lg"
                >
                    <X className="w-6 h-6 text-maroon" />
                </button>

                <div className="p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-6">
                        What best describes you?
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4 items-stretch">
                        {/* Company / Recruiter Option */}
                        <div className="flex flex-col items-center p-5 border border-black-500 rounded-2xl hover:border-maroon/20 hover:bg-maroon/[0.02] transition-all group">
                            <div className="flex-1 flex flex-col items-center w-full">
                                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Building2 className="w-8 h-8 text-gray-400 group-hover:text-maroon transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                                    Staff
                                </h3>
                            </div>
                            <button
                                onClick={() => navigate('/login/staff')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-maroon text-white px-5 py-2.5 rounded-full font-bold hover:shadow-lg hover:opacity-90 transition-all uppercase text-xs"
                            >
                                Staff Sign In <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Candidate / Job Seeker Option */}
                        <div className="flex flex-col items-center p-5 border border-black-500 rounded-2xl hover:border-ub-yellow/20 hover:bg-black/[0.02] transition-all group">
                            <div className="flex-1 flex flex-col items-center w-full">
                                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <UserCircle2 className="w-8 h-8 text-gray-400 group-hover:text-ub-yellow transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                                    Student
                                </h3>
                            </div>

                            <button
                                onClick={() => navigate('/login/student')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ub-yellow text-white px-5 py-2.5 rounded-full font-bold hover:shadow-lg hover:opacity-90 transition-all uppercase text-xs"
                            >
                                Student Sign In <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionModal;
