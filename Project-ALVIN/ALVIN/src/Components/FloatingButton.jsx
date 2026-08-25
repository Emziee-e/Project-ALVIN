import React, { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function FloatingButton() {
  const [isStarting, setIsStarting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleStartInterview = () => {
    setIsStarting(true);
    setTimeout(() => {
      navigate('/user/resume-upload');
    }, 800);
  };

  return (
    <div
      className="fixed bottom-8 right-8 z-[999999] flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip Card (Minimalist Light Theme) */}
      {!isStarting && (
        <div
          className={`mr-3 bg-white text-[#111111] border border-[#e5e5e5] px-4 py-2.5 rounded-xl
                      transition-all duration-300 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                      flex flex-col justify-center whitespace-nowrap pointer-events-none
                      ${isHovered
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-3'
                      }`}
        >
          <span className="font-Geist text-[15px] text-[#111111] tracking-wide">
            Start Interview
          </span>
          <span className="text-[12px] text-[#862334] font-Geist mt-0.5">
            Upload Resume to Start
          </span>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleStartInterview}
        disabled={isStarting}
        className={`w-14 h-14 sm:w-16 sm:h-16 bg-white border border-[#e5e5e5] rounded-full
                    shadow-[0_4px_20px_rgba(0,0,0,0.12)] flex items-center justify-center
                    transition-all duration-200 relative cursor-pointer
                    ${isStarting
                      ? 'scale-95 opacity-80 cursor-wait pointer-events-none'
                      : 'hover:bg-gray-50 active:scale-95'}`}
      >
        {isStarting ? (
          <Loader2 size={24} className="animate-spin text-[#862334]" />
        ) : (
          <Mic
            size={26}
            className={`relative z-10 text-[#862334] ${isHovered ? 'scale-110' : ''} transition-transform duration-300`}
          />
        )}
      </button>
    </div>
  );
}

export default FloatingButton;