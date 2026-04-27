import { useState } from "react";
import Logo from '../src/assets/alvin-logo.png';
import OverallStats from "./overallStats";
import RadarChartComponent from "./radarChart";
import StudentLineChart from "./studentLineChart";

// Tailwind requires these custom values — add to tailwind.config.js:
// theme: { extend: { colors: { primary: '#862334', accent: '#ffb003' }, fontFamily: { grotesk: ['Space Grotesk', 'sans-serif'], manrope: ['Manrope', 'sans-serif'], inter: ['Inter', 'sans-serif'] } } }

const Icon = ({ name, className = "" }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

const navItems = [
  { icon: "settings", label: "Settings" },
];

const interviews = [
  { role: "Senior Product Manager", date: "OCT 24, 2024", score: "88%", high: true },
  { role: "UX Designer (L6)",       date: "OCT 21, 2024", score: "75%", high: false },
  { role: "Technical Program Lead",  date: "OCT 18, 2024", score: "91%", high: true },
];

const assets = [
  { name: "Sarah_Resume_2024_PM.pdf",          modified: "Modified: Oct 20" },
  { name: "Design_Portfolio_CaseStudies.pdf",  modified: "Modified: Sep 28" },
];

const aiFeedback = {
  critique: (
    <>
      Juan demonstrates strong communication skills with clear articulation. Eye contact was maintained throughout the interview.
      Consider improving on technical depth and providing more specific examples during responses. <br></br>
      <br></br>Juan shows a good performance growth, with an overall performance grade of 85%. Continued focus on technical knowledge and interview practice will help further enhance performance.
    </>
  )
};

export default function StaffDashboard() {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style> {`
                html, body, #root { height: 100%; margin: 0; width: 100%; }
            `}
        </style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-12 px-4">
            <img src={Logo} alt="Alvin logo" className="w-[100px] mb-[-10px] mx-auto" />
            <div className="text-[#862334] text-[3rem] font-[Space_Grotesk,sans-serif] text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
            <p className="font-[Space_Grotesk,sans-serif] uppercase text-[10px] text-[#4a4a4a] text-[#862334]">
              By Team Katana
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none">
              {navItems.map((item, i) => (
                <li key={item.label}
                  className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                >
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); setActiveNav(i); }}
                    className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-[Space_Grotesk,sans-serif] uppercase tracking-[0.15em] text-xs rounded-[2px]
                      ${activeNav === i
                        ? "text-[#862334]"
                        : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sign Out CTA */}
          <div className="mt-auto">
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 md:left-60 lg:left-64 z-40 bg-white/85 backdrop-blur-md flex items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">

            {/* Right actions */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-shrink-0 ml-auto">
              <button className="hidden sm:flex bg-transparent border-0 cursor-pointer p-2 text-[#4a4a4a] hover:text-[#862334] transition-colors rounded">
                <Icon name="notifications" />
              </button>
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#e5e5e5] flex-shrink-0">
                <div className="w-full h-full bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                  AL
                </div>
              </div>
            </div>
          </header>

          {/* Page inner */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full">

            {/* ── Hero ── */}
            <section className="mb-8 md:mb-5 grid grid-cols-1 lg:grid-cols-[8fr_4fr] gap-6 md:gap-12 items-start lg:items-end">
              <div className="text-left">
                <h1 className="font-[Space_Grotesk,sans-serif] text-2xl font-bold tracking-[-0.04em] text-black leading-tight mb-3 md:mb-4 whitespace-nowrap">
                  Welcome back, <span className="text-[#862334]">Dean Alvin!</span>
                </h1>
              </div>
            </section>

            {/* Divider */}
            <div className="mb-8 border-t border-[#aa9f9f]"></div>

            {/* ── Overall Performance Statistics ── */}
            <div className="flex justify-center items-center mb-10">
              <div className="w-full max-w-[1100px]">
                <div className="flex items-center justify-between ">
                  <h3 className="font-[Space_Grotesk,sans-serif] text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-5">
                    Overall Performance Statistics
                  </h3>
                </div>
                  <OverallStats />
                  <div className="mt-5">
                    <p className="text-[#4a4a4a] font-[Manrope,sans-serif] text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl whitespace-nowrap">
                       Students maintained an <span className="text-[#862334] font-bold">average performance</span> across several interview sessions.{" "}
                    </p>
                  </div>
                </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-[#aa9f9f]"></div>

            {/* ── Student Performance Report── */}
            <div className="flex justify-center items-center">
              <div className="w-full max-w-[1100px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                  <h3 className="font-[Space_Grotesk,sans-serif] text-lg sm:text-2xl font-bold uppercase tracking-[-0.02em] text-black">
                    Student Performance Statistics
                  </h3>
                  {/* Search */}
                    <div className="relative w-full sm:w-auto">
                      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#862334] text-lg sm:text-xl" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="bg-[#f9f9f9] border border-[#e5e5e5] text-black pl-10 pr-4 py-2 w-full sm:w-64 text-xs sm:text-sm font-[Inter,sans-serif] rounded-[2px] outline-none focus:shadow-[0_0_0_2px_#862334] transition-shadow"
                      />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-40 mb-5">
                  <h2 className="font-[Space_Grotesk, sans-serif] text-base sm:text-lg md:text-xl text-black text-left">
                  <span className="text-[#4a4a4a] font-[Manrope,sans-serif] text-sm sm:text-base">Name: </span>Juan Dela Cruz
                </h2>
                  <h2 className="text-black font-[Manrope,sans-serif] text-xs font-bold sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl">
                    Interview Performance Grade: <span className="text-[#862334] font-bold">85%</span>{" "}
                  </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-4">
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="font-[Space_Grotesk,sans-serif] text-sm md:text-base lg:text-lg font-bold uppercase tracking-[-0.02em] text-black text-left mt-4 mb-2">
                      Performance Overview 
                    </h3>
                    <RadarChartComponent />
                  </div>

                  <div className="flex-1 w-full min-w-0">
                    <h3 className="font-[Space_Grotesk,sans-serif] text-l font-bold uppercase tracking-[-0.02em] text-black text-left mt-4 mb-4">
                        AI Feedback Summary
                    </h3>
                      <div className="bg-[#862334]/5 p-6 border-l-4 border-[#ffb003]">
                          <div className="flex items-center gap-3 mb-4">
                            <Icon name="smart_toy" filled className="text-[#862334] text-lg" />
                            <h4 className="text-[#862334] font-[Space_Grotesk,sans-serif] font-bold uppercase text-xs tracking-widest">
                              AI Critique
                            </h4>
                          </div>
                          <p className="text-black/90 italic mb-4 font-[Manrope,sans-serif] text-justify">{aiFeedback.critique}</p>
                      </div>
                  </div>
                </div>

                <div className="text-left mb-12">
                  <h3 className="font-[Space_Grotesk,sans-serif] text-sm md:text-base lg:text-lg font-bold uppercase tracking-[-0.02em] text-black text-left mt-4 mb-4">
                    Student Performance Growth
                  </h3>
                  <StudentLineChart />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Decorative glow */}
        <div className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10"
          style={{ background: "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)" }}
        />
      </div>
    </>
  );
}