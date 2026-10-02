import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInView } from '../../lib/useInView';
import TermsOfUse from '../../Components/TermsOfUse';
import { supabase } from '../../lib/supabaseClient';

const Login = () => {
    const [ref, isInView] = useInView();
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const navigate = useNavigate();

    const handleGoogleLogin = async (e) => {
        e.preventDefault();

        // Prevents extra intermediate history states before OAuth redirect
        window.history.replaceState(null, '', window.location.pathname);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/user/dashboard`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            console.error('Login error:', error.message);
            alert("Login failed: " + error.message);
        } else {
            navigate('/user/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FDFBF7]">

            {/* Standard Soft Grid Overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(134, 35, 52, 0.12) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(134, 35, 52, 0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 90%)'
                }}
            />

            {/* Gradient Lighting & Atmospheric Accent Color Grading */}
            <div
                className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-60"
                style={{
                    background: "radial-gradient(circle, rgba(134, 35, 52, 0.25) 0%, rgba(134, 35, 52, 0.08) 50%, transparent 75%)"
                }}
            />
            <div
                className="absolute bottom-[-10%] right-[15%] w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none opacity-50"
                style={{
                    background: "radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, rgba(217, 119, 6, 0.05) 55%, transparent 80%)"
                }}
            />
            <div
                className="absolute top-[40%] left-[-10%] w-[450px] h-[450px] rounded-full blur-[130px] pointer-events-none opacity-30"
                style={{
                    background: "radial-gradient(circle, rgba(134, 35, 52, 0.15) 0%, transparent 70%)"
                }}
            />

            {/* Minimalist Seamless Login Box */}
            <div
                className="w-full max-w-[440px] bg-[#FDFBF7]/70 backdrop-blur-2xl rounded-3xl shadow-[0_15px_35px_rgba(134,35,52,0.05)] overflow-hidden border border-[#EAE5D9] relative z-10"
                ref={ref}
            >
                {/* Header Section */}
                <div className={`pt-10 pb-4 flex flex-col items-center transition-all duration-1000 ${isInView ? 'animate-smooth-fade-in-up' : 'animate-smooth-fade-out-down'}`}>
                    <div className="w-20 h-20 flex items-center justify-center mb-1">
                        <img src="../images/Alvin-logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="font-Geist text-2xl font-black text-[#111827] tracking-tight">Log in</h1>
                    <p className="text-gray-500 mt-1 text-sm font-Inter">Access your account</p>
                </div>

                {/* Login Action */}
                <div className="px-8 pb-8">
                    <button
                        onClick={handleGoogleLogin}
                        className={`w-full bg-[#862334] text-white py-3.5 rounded-2xl font-Geist font-semibold flex items-center justify-center gap-3 hover:bg-[#701c2b] shadow-lg shadow-[#862334]/20 hover:shadow-xl hover:shadow-[#862334]/30 transition-all active:scale-[0.98] duration-1000 ${isInView ? 'animate-smooth-fade-in-up' : 'animate-smooth-fade-out-down'}`}
                        style={{ animationDelay: '40ms' }}
                    >
                        <Mail className="w-5 h-5 text-white" />
                        Log in using UB Mail
                    </button>
                </div>

                {/* Footer Disclaimer */}
                <div className={`bg-[#F5F0E6]/40 py-4 px-8 border-t border-[#EAE5D9] text-center transition-all duration-1000 ${isInView ? 'animate-smooth-fade-in-up' : 'animate-smooth-fade-out-down'}`} style={{ animationDelay: '70ms' }}>
                    <p className="text-xs text-gray-500 leading-relaxed font-Inter">
                        By logging in, you agree to our{' '}
                        <span onClick={() => setIsTermsOpen(true)} className="text-[#862334] font-bold hover:underline cursor-pointer">
                            Terms of Use
                        </span>
                        {' '} and {' '}
                        <span className="text-[#862334] font-bold hover:underline cursor-pointer">
                            Privacy Policy
                        </span>
                    </p>
                </div>
            </div>

            <TermsOfUse isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </div>
    );
};

export default Login;