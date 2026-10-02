import React from 'react';
import { Brain, MessageSquare, BarChart3, Code2, Shield, Check } from "lucide-react";
import { useInView } from "../../lib/useInView";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Feedback",
    description:
      "Real-time technical analysis evaluating your software engineering answers, system design rationale, and code explanations.",
  },
  {
    icon: MessageSquare,
    title: "Dynamic Tech Interviews",
    description:
      "Simulate real technical screeners with adaptive follow-up questions on algorithms, scalability, and edge cases.",
  },
  {
    icon: BarChart3,
    title: "Technical Readiness",
    description:
      "Track your readiness score across data structures, system design, and behavioral tech questions.",
  },
  {
    icon: Code2,
    title: "Software Role Prep",
    description:
      "Practice with questions curated specifically for modern software engineering and developer tracks.",
  },
  {
    icon: Shield,
    title: "Judgment-Free Zone",
    description:
      "Practice technical concepts and fail safely before facing actual engineering managers and interviewers.",
  },
];

export function Features() {
  const [ref, isInView] = useInView();

  return (
    <section id="features" className="py-16 md:py-24 bg-[#FDFBF7] text-[#111827] relative overflow-hidden border-t border-[#EAE5D9]">

      {/* Background Soft Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#862334]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-[#862334] mb-3 font-semibold">
            <span>03</span>
            <span className="w-6 h-px bg-[#862334]/40" />
            <span>FEATURES</span>
          </div>
          <h2 className="font-Geist text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight">
            Key Features of <span className="text-[#862334]">ALVIN</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">

          {/* Feature 1: AI-Powered Responses */}
          <div className={`md:col-span-7 bg-white border border-[#EAE5D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#862334]/30 transition-all duration-500 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#862334]/10 text-[#862334] flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-Geist text-xl font-bold text-[#111827]">
                {features[0].title}
              </h3>
              <p className="font-Inter text-xs text-[#4B5563] leading-relaxed max-w-xl">
                {features[0].description}
              </p>
            </div>

            <div className="mt-6 bg-[#FDFBF7] border border-[#EAE5D9] rounded-xl p-3.5 font-mono text-[11px] space-y-2">
              <div className="flex justify-between items-center text-[#862334] font-bold">
                <span>CODE ANALYSIS · ACTIVE</span>
                <span className="bg-[#862334]/10 px-2 py-0.5 rounded text-[10px]">94% ACCURACY</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-gray-700 font-sans text-xs shadow-2xs">
                "Good runtime complexity explanation. Remember to account for cache invalidation."
              </div>
            </div>
          </div>

          {/* Feature 2: Natural Conversations */}
          <div className={`md:col-span-5 bg-white border border-[#EAE5D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#862334]/30 transition-all duration-500 delay-75 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#862334]/10 text-[#862334] flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-Geist text-xl font-bold text-[#111827]">
                {features[1].title}
              </h3>
              <p className="font-Inter text-xs text-[#4B5563] leading-relaxed">
                {features[1].description}
              </p>
            </div>

            <div className="mt-6 border-l-2 border-[#862334] bg-[#FDFBF7] p-3 rounded-r-xl border-y border-r border-[#EAE5D9] space-y-1 text-[11px] font-mono">
              <span className="text-[#862334] font-bold block">Follow-up Generated:</span>
              <p className="text-gray-600 italic">"How would this database design scale under 100k writes/sec?"</p>
            </div>
          </div>

          {/* Feature 3: Performance Analytics */}
          <div className={`md:col-span-4 bg-white border border-[#EAE5D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#862334]/30 transition-all duration-500 delay-150 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#862334]/10 text-[#862334] flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-Geist text-xl font-bold text-[#111827]">
                {features[2].title}
              </h3>
              <p className="font-Inter text-xs text-[#4B5563] leading-relaxed">
                {features[2].description}
              </p>
            </div>

            {/* Richer progress visual to fill vertical space nicely */}
            <div className="mt-6 bg-[#FDFBF7] border border-[#EAE5D9] p-3 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold text-[11px]">System Design</span>
                <span className="text-[#862334] font-bold text-[11px]">92%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#862334] h-full w-[92%]" />
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                <span className="text-gray-600 font-semibold text-[11px]">Algorithms</span>
                <span className="text-[#862334] font-bold text-[11px]">84%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#862334] h-full w-[84%]" />
              </div>
            </div>
          </div>

          {/* Feature 4: Tech-Specific Prep */}
          <div className={`md:col-span-4 bg-white border border-[#EAE5D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#862334]/30 transition-all duration-500 delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#862334]/10 text-[#862334] flex items-center justify-center mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-Geist text-xl font-bold text-[#111827]">
                {features[3].title}
              </h3>
              <p className="font-Inter text-xs text-[#4B5563] leading-relaxed">
                {features[3].description}
              </p>
            </div>

            <div className="mt-6 space-y-2 font-mono text-xs">
              <div className="bg-[#862334] text-white px-3 py-2 rounded-xl flex items-center justify-between font-semibold shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Frontend & React</span>
                </div>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">350+ Qs</span>
              </div>
              <div className="bg-[#FDFBF7] border border-[#EAE5D9] text-gray-700 px-3 py-2 rounded-xl flex items-center justify-between">
                <span>Backend & Node.js</span>
                <span className="text-[10px] text-gray-400">280+ Qs</span>
              </div>
              <div className="bg-[#FDFBF7] border border-[#EAE5D9] text-gray-700 px-3 py-2 rounded-xl flex items-center justify-between opacity-60">
                <span>System Design</span>
                <span className="text-[10px] text-gray-400">190+ Qs</span>
              </div>
            </div>
          </div>

          {/* Feature 5: Safe Environment */}
          <div className={`md:col-span-4 bg-white border border-[#EAE5D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#862334]/30 transition-all duration-500 delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#862334]/10 text-[#862334] flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-Geist text-xl font-bold text-[#111827]">
                {features[4].title}
              </h3>
              <p className="font-Inter text-xs text-[#4B5563] leading-relaxed">
                {features[4].description}
              </p>
            </div>

            {/* Richer security card filling vertical space equal to adjacent cards */}
            <div className="mt-6 space-y-2 bg-[#FDFBF7] border border-[#EAE5D9] p-3 rounded-xl font-mono text-[11px]">
              <div className="flex items-center gap-2 text-[#862334]">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold uppercase text-[10px]">100% Private Practice</span>
              </div>
              <p className="text-gray-500 font-sans text-[11px] leading-snug">
                Zero recordings shared. Fail safely and iterate until interview ready.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default Features;