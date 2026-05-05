import { Sparkles } from 'lucide-react';
import { useInView } from '../../lib/useInView';

function Hero({ onOpenModal }) {
  const [ref, isInView] = useInView();
  return (
    <section id="hero" className="bg-white bg-grid-pattern py-16 md:py-24 px-6 mt-16">
      <div ref={ref} className={`${isInView ? 'animate-fade-in-down' : 'animate-fade-out-up'}`}>
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className=" mb-12 flex justify-center">
          <div className="flex items-center gap-2  border border-black/10 px-4 py-1.5 rounded-full shadow-sm hover:bg-ub-yellow/50 transition-colors cursor-pointer">
            <Sparkles className="w-5.5 h-5.5 text-maroon" />
            <span className="text-black-700 font-semibold text-lg tracking-tight">
               Meet your AI Interviewer
            </span>
          </div>
        </div>

        {/* --- Top Text Group --- */}
        <div className="space-y-4 mb-10 max-w-5xl">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-Geist tracking-tighter text-gray-950 leading-[1.1]">
            Master Your Next
            {/* The Gradient Text Magic */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-maroon to-ub-yellow ml-3 mr-3 animate-gradient-text">
              Interview
            </span>
            with AI-Driven Precision
          </h1>
        </div>

        {/* --- Subtitle --- */}
        <p className="font-Inter text-lg text-gray-600 max-w-4xl leading-relaxed mb-12">
          ALVIN uses Vision Based Intelligence to analyze your performance in real-time. Refine your body language, tone, and technical responses with the University of Batangas' dedicated career readiness system.
        </p>

        {/* --- Call to Action Buttons --- */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-16">
          <button
            onClick={onOpenModal}
            className="bg-maroon text-white px-8 py-3.5 rounded-full font-bold text-lg hover:bg-ub-yellow transition-colors shadow-lg shadow-gray-200"
          >
            Use ALVIN
          </button>
        </div>

        {/* --- Laptop Mockup Image (Simplified Placeholder) --- */}
        <div className="w-full max-w-6xl relative">
          {/* Subtle glow effect behind the laptop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-amber-200/40 rounded-full blur-[100px] -z-10"></div>
          <img
            src="/images/LaptopMockup.png"
            alt="Flowmingo interface running on a laptop mockup"
            className="w-full h-auto object-contain relative z-0 bg-none"
          />
        </div>

      </div>
      </div>
    </section>
  );
}

export default Hero;