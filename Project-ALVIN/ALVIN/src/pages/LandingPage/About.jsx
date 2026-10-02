import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  BrainCircuit,
  TrendingUp,
  FileText
} from 'lucide-react';

function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger animation whenever the section enters the viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Reset when out of view so navigating back triggers the animation again
          setIsVisible(false);
        }
      },
      { threshold: 0.15 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="bg-[#FDFBF7] text-[#111827] min-h-screen lg:h-screen px-6 sm:px-10 lg:px-16 relative overflow-hidden flex items-center justify-center py-12 lg:py-0"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#862334]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#D97706]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl w-full mx-auto relative z-10 my-auto">
        {/* System Purpose & Split Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* Left Column: Balanced Medium Heading & Expanded Space */}
          <div
            className={`lg:col-span-6 space-y-6 transition-all duration-1000 transform ease-out ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
            }`}
          >
            {/* Minimal Mono Label Header */}
            <div className="flex items-center justify-start gap-3 text-xs tracking-widest text-[#862334] font-semibold uppercase font-mono">
              <span>01</span>
              <span className="w-8 h-px bg-[#862334]/40" />
              <span>OVERVIEW · WHAT IS ALVIN?</span>
            </div>

            {/* Core Impact Statement */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-Geist text-[#111827] leading-[1.12] tracking-tight">
              Where students <span className="text-[#862334]">practice AI interviews</span>, get scored on non-verbal cues, and master job readiness.
            </h2>

            {/* Highlighted Stat Badges */}
            <div className="pt-4 flex items-center gap-6 sm:gap-8">
              <div>
                <span className="block text-2xl font-bold font-Geist text-[#862334]">Real-time</span>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider font-mono">Vision Analysis</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <span className="block text-2xl font-bold font-Geist text-[#862334]">Dynamic</span>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider font-mono">AI Avatars</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <span className="block text-2xl font-bold font-Geist text-[#862334]">Instant</span>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider font-mono">Feedback Reports</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Feature Focus (Staggered Animation) */}
          <div
            className={`lg:col-span-6 bg-white border border-[#EAE5D9] rounded-2xl p-6 md:p-8 shadow-xs transition-all duration-1000 delay-200 transform ease-out ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
            }`}
          >
            <h3 className="text-lg font-bold font-Geist text-[#111827] mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#862334]" /> Core System Architecture
            </h3>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-[#FDFBF7] border border-[#EAE5D9] hover:border-[#862334]/30 transition-all">
                <div className="p-3 rounded-lg bg-[#862334]/10 text-[#862334] h-fit">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-sm md:text-base font-Geist">Targeted Resume & Role Matching</h4>
                  <p className="text-[#4B5563] text-xs md:text-sm mt-1 font-Inter">
                    Upload your CV and select a specific target job position. ALVIN customizes interview questions dynamically to reflect actual corporate requirements.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-[#FDFBF7] border border-[#EAE5D9] hover:border-[#862334]/30 transition-all">
                <div className="p-3 rounded-lg bg-[#862334]/10 text-[#862334] h-fit">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-sm md:text-base font-Geist">Vision & Emotional Cue Tracking</h4>
                  <p className="text-[#4B5563] text-xs md:text-sm mt-1 font-Inter">
                    Integrated computer vision analyzes facial expressions, posture, and non-verbal cues during the live AI avatar session to measure confidence and anxiety indicators.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-[#FDFBF7] border border-[#EAE5D9] hover:border-[#862334]/30 transition-all">
                <div className="p-3 rounded-lg bg-[#862334]/10 text-[#862334] h-fit">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-sm md:text-base font-Geist">Objective Analytics & Staff Dashboard</h4>
                  <p className="text-[#4B5563] text-xs md:text-sm mt-1 font-Inter">
                    Receive comprehensive PDF reports evaluating speech clarity and emotion. Department deans and internship officers can track student progression over time.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;