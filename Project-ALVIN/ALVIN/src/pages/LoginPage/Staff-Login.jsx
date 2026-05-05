import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from '../../lib/useInView';
import TermsOfUse from '../../Components/TermsOfUse';

const StaffLogin = () => {
    const [ref, isInView] = useInView();
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-grid-pattern">
            {/* Top Left Logo Link */}
            <Link
                to="/"
                className="fixed top-10 left-30 flex items-center gap-2 group transition-all"
            >
                <img src="/images/Alvin-logo.png" alt="ALVIN Logo" className="w-10 h-10 object-contain" />
                <span className="font-Geist text-2xl tracking-tight text-maroon ">ALVIN</span>
            </Link>

            <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100" ref={ref}>
                {/* Header Section with Logo Area */}
                <div className={`pt-8 pb-4 flex flex-col items-center transition-all duration-1000 ${isInView ? 'animate-smooth-fade-in-up' : 'animate-smooth-fade-out-down'}`} style={{ animationDelay: '0ms' }}>
                    <div className="w-20 h-20  flex items-center justify-center mb-1">
                        {/* Placeholder for the blue UB icon in image */}
                        <img src="../images/Alvin-logo.png" alt="Logo" className="w-15 h-15" />
                    </div>
                    <h1 className="font-Geist text-2xl font-bold text-gray-900">Staff Sign in</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Access your  account
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        {/* Google Button */}
                        <Link
                            to="/staff/dashboard"
                            className={`w-full bg-maroon text-white py-3.5 rounded-2xl font-Geist flex items-center justify-center gap-3 hover:bg-maroon/90 hover:shadow-lg transition-all active:scale-[0.98] transition-all duration-1000 no-underline ${isInView ? 'animate-smooth-fade-in-up' : 'animate-smooth-fade-out-down'}`}
                            style={{ animationDelay: '40ms' }}
                        >
                            <Mail className="w-5 h-5 text-white" />
                            Log in using UB Mail
                        </Link>
                    </form>
                </div>

                {/* Footer Disclaimer */}
                <div className={`bg-gray-50 py-4 px-8 border-t border-gray-100 text-center transition-all duration-1000 ${isInView ? 'animate-smooth-fade-in-up' : 'animate-smooth-fade-out-down'}`} style={{ animationDelay: '70ms' }}>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        By logging in, you agree to our{' '}
                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                setIsTermsOpen(true);
                            }}
                            className="text-maroon font-bold hover:underline not-italic cursor-pointer"
                        >
                            Terms of Use
                        </span>
                        {' '} and{' '}
                        <span className="text-maroon font-bold hover:underline not-italic cursor-pointer">
                            Privacy Policy
                        </span>.
                    </p>
                </div>
            </div>

            <TermsOfUse
                isOpen={isTermsOpen}
                onClose={() => setIsTermsOpen(false)}
            />

        </div>


    );
};

export default StaffLogin;
