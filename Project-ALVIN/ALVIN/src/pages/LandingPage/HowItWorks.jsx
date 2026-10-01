import { useInView } from "../../lib/useInView";

const steps = [
  {
    step: "01",
    title: "Upload Your Resume",
    description:
      "Our AI analyzes your background and skills to generate personalized interview questions tailored specifically to your experience.",
  },
  {
    step: "02",
    title: "Practice with AI",
    description:
      "Engage in realistic interview simulations. ALVIN asks questions, listens to your responses, and adapts in real-time.",
  },
  {
    step: "03",
    title: "Get Instant Feedback",
    description:
      "Receive detailed analysis on your answers, communication style, and areas for improvement immediately after each session.",
  },
  {
    step: "04",
    title: "Track & Improve",
    description:
      "Monitor your progress over time. See how you're improving and focus on areas that need more attention.",
  },
];

function HowItWorks() {
  const [ref, isInView] = useInView();

  return (
    <section id="how-it-works" className="relative py-16 md:py-24 lg:py-32 bg-[#F5F0E6] text-[#111827] overflow-hidden border-t border-[#EAE5D9]">

      {/* Soft Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 pointer-events-none rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, transparent 70%)"
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">

          {/* Geist Mono Label Header */}
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-[#862334] mb-4 font-semibold">
            <span>02</span>
            <span className="w-6 h-px bg-[#862334]/40" />
            <span>HOW IT WORKS</span>
          </div>

          <h2 className="font-Geist text-3xl md:text-4xl lg:text-5xl font-black text-[#111827] mt-2 mb-6 text-balance tracking-tight">
            Your Path to <span className="text-[#862334]">Interview Success</span>
          </h2>

          <p className="font-Inter text-base sm:text-lg text-[#4B5563] text-pretty leading-relaxed max-w-2xl mx-auto">
            Getting started with ALVIN is simple. Follow these four steps
            and start acing your interviews.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative" ref={ref}>

          {/* Waveform Line precisely connecting directly into Step 04 box */}
          <div className="hidden lg:flex absolute top-[16px] left-[12.5%] right-[6.5%] h-[32px] items-center justify-between pointer-events-none z-10">
            <svg
              className="w-full h-full text-[#862334]/45 overflow-visible"
              viewBox="0 0 1080 40"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20 Q 225 35, 250 20 T 300 20 T 350 20 T 400 20 Q 425 2, 450 20 T 500 20 T 550 20 T 600 20 Q 625 38, 650 20 T 700 20 T 750 20 T 800 20 Q 825 5, 850 20 T 900 20 T 950 20 T 1000 20 L 1080 20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 1080,
                  strokeDashoffset: isInView ? 0 : 1080,
                  transition: "stroke-dashoffset 2.4s cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              />
            </svg>
          </div>

          {/* 4-Column Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 relative z-20">
            {steps.map((item, index) => {
              const lineSyncDelay = index * 550;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Step Badge */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-[#F5F0E6] border-2 flex items-center justify-center mb-6 relative z-20 shadow-2xs transition-all duration-800 ${
                      isInView
                        ? "opacity-100 translate-x-0 border-[#862334]"
                        : "opacity-0 -translate-x-8 border-[#862334]/20"
                    }`}
                    style={{
                      transitionDelay: `${lineSyncDelay}ms`,
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  >
                    <span className="text-base font-bold font-mono text-[#862334]">
                      {item.step}
                    </span>
                  </div>

                  {/* Content Box */}
                  <div
                    className={`max-w-xs flex flex-col items-center transition-all duration-800 ${
                      isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    }`}
                    style={{
                      transitionDelay: `${lineSyncDelay + 150}ms`,
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  >
                    <h3 className="text-lg font-bold font-Geist text-[#111827] mb-3">
                      {item.title}
                    </h3>

                    <p className="font-Inter text-[#4B5563] text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;