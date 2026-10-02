import React, { useState, useEffect } from 'react';

const Loading = ({ isExiting }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return Math.min(prev + (Math.floor(Math.random() * 6) + 4), 100);
            });
        }, 80);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-white select-none ${isExiting ? 'animate-slide-up' : ''}`}>
            {/* ── HERO GRID BACKGROUND SVG ── */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                    <defs>
                        <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hero-grid)" />
                </svg>
            </div>

            {/* ── LOADER CONTENT (VERTICALLY & HORIZONTALLY CENTERED) ── */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3 sm:gap-4 my-auto">
                {/* ── ROTATING LOGO ── */}
                <div className="relative w-72 h-72 sm:w-[380px] sm:h-[380px] animate-spin-horizontal flex items-center justify-center">
                    <img
                        src="/images/Alvin-logo.png"
                        alt="ALVIN Logo"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* ── SCALED MINIMALIST PROGRESS BAR ── */}
                <div className="w-72 sm:w-[380px] space-y-2">
                    {/* Header text with dynamic percentage */}
                    <div className="flex justify-between items-center text-sm font-semibold tracking-wide text-gray-500">
                        <span className="flex items-center gap-2 uppercase text-xs font-bold tracking-wider text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-[#862334] animate-ping" />
                            Loading...
                        </span>
                        <span className="font-mono text-[#862334] font-bold text-base">
                            {progress}%
                        </span>
                    </div>

                    {/* Transparent Minimal Track */}
                    <div className="relative h-2.5 w-full bg-gray-200/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#862334] to-[#D97706] rounded-full transition-all duration-150 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Loading;