import React from "react";
import { Link } from "react-router-dom";

const Error404 = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#FAF9F6] px-4 overflow-hidden select-none">
      {/* Hero-Sized Background Grid Layer (80px x 80px Fullscreen) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(134, 35, 52, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(134, 35, 52, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
        }}
      />

      {/* Main Content Card */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <img
          src="/images/Alvin-logo.png"
          alt="ALVIN Logo"
          className="h-24 md:h-32 mx-auto mb-2 object-contain"
        />

        <div className="font-Geist text-9xl md:text-10xl font-black mb-4 text-[#FFB003] drop-shadow-xs">
          404
        </div>

        <h1 className="font-Geist text-4xl md:text-5xl text-[#862334] font-bold mb-4">
          Page Not Found
        </h1>

        <p className="font-Inter text-base md:text-lg text-[#862334]/80 max-w-md mx-auto mb-10 leading-relaxed font-medium">
          Oops! The page you're looking for doesn't exist. Let's get you back on track.
        </p>

        <Link
          to="/"
          className="inline-block px-8 py-3 bg-[#862334] hover:bg-[#6e1c2a] text-white font-semibold rounded-xl text-base transition-all duration-200 shadow-md shadow-[#862334]/20 active:scale-95"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default Error404;