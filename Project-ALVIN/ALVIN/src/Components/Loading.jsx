import React from 'react';

const Loading = ({ isExiting }) => {
    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-grid-pattern bg-white ${isExiting ? 'animate-slide-up' : ''}`}>
            <div className="flex flex-col items-center gap-8">
                <div className="relative w-65 h-65 animate-spin-horizontal">
                    <img
                        src="/images/Alvin-logo.png"
                        alt="ALVIN Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        </div>
    );
};

export default Loading;


