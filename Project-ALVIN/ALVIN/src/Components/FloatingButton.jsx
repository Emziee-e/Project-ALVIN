import React, { useEffect, useId, useState } from "react";
import { Mic, Loader2, PauseCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function FloatingButton({
  disabled = false,
  paused = false,
  disabledReason = "Paused by Career Advisor",
}) {
  const [isStarting, setIsStarting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const tooltipId = useId();

  // Pause wins even if the caller passes conflicting props.
  const isDisabled = Boolean(disabled || paused);

  useEffect(() => {
    if (isDisabled) setIsStarting(false);
  }, [isDisabled]);

  const handleStartInterview = (event) => {
    if (isDisabled || isStarting) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    setIsStarting(true);
    window.setTimeout(() => navigate("/user/resume-upload"), 800);
  };

  const stopDisabledInteraction = (event) => {
    if (!isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className="fixed bottom-8 right-8 z-50 flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClickCapture={stopDisabledInteraction}
      onPointerDownCapture={stopDisabledInteraction}
      data-interview-paused={String(isDisabled)}
    >
      {!isStarting && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`mr-3 bg-white text-[#111111] border border-[#e5e5e5] px-4 py-2.5 rounded-xl
                      transition-all duration-300 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                      flex flex-col justify-center whitespace-nowrap pointer-events-none
                      ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"}`}
        >
          <span className="font-Geist text-[15px] text-[#111111] tracking-wide">
            {isDisabled ? "Interviews Paused" : "Start Interview"}
          </span>
          <span className={`text-[12px] font-Geist mt-0.5 ${
            isDisabled ? "text-gray-500 font-semibold" : "text-[#862334]"
          }`}>
            {isDisabled ? disabledReason : "Upload Resume to Start"}
          </span>
        </div>
      )}

      <span
        className={`relative inline-flex rounded-full ${isDisabled ? "cursor-not-allowed" : ""}`}
        title={isDisabled ? disabledReason : "Start Interview"}
      >
        <button
          type="button"
          onClick={handleStartInterview}
          disabled={isDisabled || isStarting}
          aria-disabled={isDisabled || isStarting}
          aria-label={isDisabled ? "Interviews Paused" : "Start Interview"}
          aria-describedby={!isStarting ? tooltipId : undefined}
          title={isDisabled ? disabledReason : "Start Interview"}
          data-testid="floating-interview-button"
          className={`w-14 h-14 sm:w-16 sm:h-16 border rounded-full
                      shadow-[0_4px_20px_rgba(0,0,0,0.12)] flex items-center justify-center
                      transition-all duration-200 relative
                      ${isDisabled
                        ? "!bg-gray-200 !border-gray-300 !text-gray-400 !opacity-100 grayscale cursor-not-allowed"
                        : isStarting
                        ? "bg-white border-[#e5e5e5] scale-95 opacity-80 cursor-wait"
                        : "bg-white border-[#e5e5e5] hover:bg-gray-50 active:scale-95 cursor-pointer"}`}
          style={isDisabled ? { pointerEvents: "none" } : undefined}
        >
          {isStarting ? (
            <Loader2 size={24} className="animate-spin text-[#862334]" />
          ) : isDisabled ? (
            <PauseCircle size={26} className="text-gray-400" />
          ) : (
            <Mic
              size={26}
              className={`relative z-10 text-[#862334] ${
                isHovered ? "scale-110" : ""
              } transition-transform duration-300`}
            />
          )}
        </button>

        {isDisabled && (
          <span
            aria-hidden="true"
            className="absolute inset-0 z-10 rounded-full cursor-not-allowed"
            onClick={stopDisabledInteraction}
            onPointerDown={stopDisabledInteraction}
            style={{ pointerEvents: "auto" }}
          />
        )}
      </span>
    </div>
  );
}

export default FloatingButton;

