import React from 'react';
import { Check, Sparkles, Activity } from 'lucide-react';

function Hero() {
  return (
    <section className="relative w-full min-h-screen bg-[#FDFBF7] text-[#111827] px-6 sm:px-12 pt-16 sm:pt-20 pb-12 flex items-center justify-center overflow-x-hidden">

      {/* ── 1. Fading Grid Background Pattern ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(234, 229, 217, 0.75) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(234, 229, 217, 0.75) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)'
        }}
      />

      {/* Ambient Radial Backlight Glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#862334]/5 blur-[140px] pointer-events-none rounded-full animate-fade-in" />

      {/* ── 2. Centered Grid Container ── */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">

        {/* ── LEFT COLUMN: Core Content ── */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6 lg:space-y-7">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#862334]/5 border border-[#862334]/20 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#862334] animate-fade-in-up [animation-delay:100ms]">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
            AI-Powered Learning for Career Readiness
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-Geist font-black tracking-tight leading-[1.08] text-[#111827] animate-fade-in-up [animation-delay:250ms]">
            Master Your Next{' '}
            <span className="inline-block whitespace-nowrap">
              <span className="relative inline-block text-[#D97706]">
                AI-Driven
                {/* Animated Brush Underline Accent */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 sm:h-4 text-[#D97706]"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 9.5C50 3.5 150 2.5 197.5 8.5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="animate-draw-underline"
                  />
                </svg>
              </span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#862334] to-[#B8324B]">
                Interview.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-lg 2xl:text-xl text-[#4B5563] font-Inter leading-relaxed max-w-xl 2xl:max-w-2xl animate-fade-in-up [animation-delay:400ms]">
            A real-time vision & speech intelligence platform built for University of Batangas students to practice, receive automated feedback, and refine communication skills.
          </p>

        </div>

        {/* ── RIGHT COLUMN: Graphic Display ── */}
        <div className="lg:col-span-6 relative flex justify-center items-center py-6 animate-fade-in-up [animation-delay:550ms]">

          <div className="relative flex items-center justify-center p-8 sm:p-12">

            {/* 3D Monitor Mockup */}
            <div className="relative z-10 scale-90 sm:scale-100 lg:scale-100 xl:scale-110 flex flex-col items-center transition-transform">

              <div className="w-20 h-5 bg-slate-300 rounded-t-xl border-t-2 border-x-2 border-slate-100 flex items-center justify-center gap-2 shadow-xs relative z-20">
                <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>

              <div className="w-72 sm:w-80 h-48 sm:h-56 bg-slate-200 border-[6px] border-slate-100 rounded-3xl p-2.5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="w-full h-full bg-slate-800 rounded-2xl p-2.5 grid grid-cols-12 gap-2 shadow-inner border border-slate-700/50">
                  <div className="col-span-5 bg-slate-100/95 rounded-xl p-2 flex flex-col gap-1.5 justify-center shadow-xs">
                    <div className="w-full h-2 bg-slate-300 rounded-full" />
                    <div className="w-3/4 h-2 bg-slate-300 rounded-full" />
                    <div className="w-full h-2 bg-[#862334]/30 rounded-full" />
                    <div className="w-1/2 h-2 bg-slate-300 rounded-full" />
                  </div>

                  <div className="col-span-7 grid grid-cols-2 gap-1.5">
                    <div className="bg-slate-600 rounded-xl flex items-end justify-center p-1 border border-slate-500/40">
                      <div className="w-5 h-5 rounded-full bg-slate-300/80 mb-0.5" />
                    </div>
                    <div className="bg-slate-600 rounded-xl flex items-end justify-center p-1 border border-slate-500/40">
                      <div className="w-5 h-5 rounded-full bg-slate-300/80 mb-0.5" />
                    </div>
                    <div className="bg-[#D97706] rounded-xl flex items-end justify-center p-1 border-2 border-amber-300 shadow-xs">
                      <div className="w-5 h-5 rounded-full bg-amber-100 mb-0.5" />
                    </div>
                    <div className="bg-[#862334] rounded-xl flex items-end justify-center p-1 border border-[#B8324B]">
                      <div className="w-5 h-5 rounded-full bg-white/90 mb-0.5" />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-300 rounded-full border border-slate-400" />
              </div>

              <div className="w-16 h-6 bg-slate-300 border-x border-slate-400/30 shadow-xs" />
              <div className="w-36 h-3 bg-slate-300 rounded-full border-t border-slate-100 shadow-lg" />

            </div>

            {/* Floating Widgets */}
            <div className="absolute -top-4 -left-12 sm:-left-20 bg-white/95 backdrop-blur-md border border-gray-200/90 p-3.5 rounded-2xl shadow-xl animate-float flex items-center gap-3 z-30">
              <div className="w-9 h-9 rounded-xl bg-[#862334]/10 border border-[#862334]/20 flex items-center justify-center text-[#862334]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Confidence Level</div>
                <div className="text-lg font-black text-[#111827] font-Geist">88% <span className="text-xs text-emerald-600 font-bold ml-0.5">ELITE</span></div>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-10 sm:-right-16 bg-white/95 backdrop-blur-md border border-gray-200/90 p-4 rounded-2xl shadow-xl animate-float-delayed z-30 w-52 space-y-2">
              <div className="text-[9px] uppercase font-bold text-gray-400 tracking-widest pb-1 border-b border-gray-100">
                Real-time Metrics
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Eye Contact
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded">Good</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Pace & Pitch
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded">Optimal</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-amber-500" /> Filler Words
                </span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded">Focus</span>
              </div>
            </div>

            <div className="absolute -top-2 -right-8 sm:-right-12 bg-white/95 border border-gray-200/90 px-3.5 py-2 rounded-xl shadow-lg animate-float flex items-center gap-1.5 z-20">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="text-xs font-bold text-[#111827] font-Geist">92% Match Score</span>
            </div>

          </div>

        </div>

      </div>

      {/* ── CSS Animations for Entrance & Underline Stroke ── */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drawUnderline {
          from {
            stroke-dashoffset: 210;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .animate-draw-underline {
          stroke-dasharray: 210;
          stroke-dashoffset: 210;
          animation: drawUnderline 1.2s cubic-bezier(0.65, 0, 0.35, 1) 0.8s forwards;
        }
      `}</style>
    </section>
  );
}

export default Hero;