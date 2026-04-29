import { useState } from "react";
import Logo from '../src/assets/alvin-logo.png';
import OverallStats from "./overallStats";
import RadarChartComponent from "./radarChart";
import StudentLineChart from "./studentLineChart";
import Leaderboard from "./leaderboard";

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

const students = [
  { id: 1, name: "Tristan Jay Mirano", score: 95 },
  { id: 2, name: "Juan Dela Cruz", score: 85 },
  { id: 3, name: "Joshua Hong", score: 91 },
  { id: 4, name: "Vin Vernon Perez", score: 72 },
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

const aiSummary = {
  summary: (
    <>
      Most students show significant improvement in their interview skills, with a focus on enhancing technical depth and providing more specific examples during responses. <br></br>
      <br />25% of students demonstrated low interview scores indicating a need for additional support and resources. <br></br>
    </>
  )
};

export default function StaffDashboard() {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style> {`
                html, body, #root { height: 100%; margin: 0; width: 100%; }
            `}
        </style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-inter">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-12 px-4">
            <img src={Logo} alt="Alvin logo" className="w-[100px] mb-[-10px] mx-auto" />
            <div className="text-[#862334] text-[3rem] font-geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
            <p className="font-geist uppercase text-[10px] text-[#862334]">
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
                    className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-geist uppercase tracking-[0.15em] text-xs rounded-[2px]
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
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-geist font-bold uppercase tracking-widest text-xs rounded-xs flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
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
                <div className="w-full h-full bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-geist">
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
                <h1 className="font-geist text-2xl font-bold tracking-[-0.04em] text-black leading-tight mb-3 md:mb-4 whitespace-nowrap">
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
                  <h3 className="font-geist text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-5">
                    Overall Performance Statistics
                  </h3>
                </div>
                  <OverallStats />
                  <div className="mt-5">
                    <p className="text-[#4a4a4a] font-inter text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl whitespace-nowrap">
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
                  <h3 className="font-geist text-lg sm:text-2xl font-bold uppercase tracking-[-0.02em] text-black">
                    Student Performance Statistics
                  </h3>
                  {/* Search */}
                    <div className="relative w-full sm:w-auto flex items-center gap-2">
                      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#862334] text-lg sm:text-xl" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="bg-[#f9f9f9] border border-[#e5e5e5] text-black pl-10 pr-4 py-2 w-full sm:w-64 text-xs sm:text-sm font-inter rounded-[2px] outline-none focus:shadow-[0_0_0_2px_#862334] transition-shadow"
                      />
                      <button className="p-2 bg-[#862334] text-white rounded-md hover:bg-[#ffb003] transition-all">
                        <Icon name="filter_list" className="text-lg sm:text-xl" />
                      </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-57">
                    <h2 className="font-inter text-xs sm:text-sm md:text-base text-black text-left">
                      <span className="text-[#4a4a4a] font-geist">Name: </span>Juan Dela Cruz
                    </h2>
                  </div>

                  <div className="flex flex-column items-end">
                    <h2 className="text-black font-inter text-xs font-bold sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl">
                      Interview Performance Grade: <span className="text-[#862334] font-bold">85%</span>{" "}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2np md:gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-5">
                    <h2 className="font-inter text-xs sm:text-sm md:text-base text-black text-left">
                      <span className="text-[#4a4a4a] font-geist">Program: </span>BSIT
                    </h2>
                    <h2 className="font-inter text-xs sm:text-sm md:text-base text-black text-left">
                      <span className="text-[#4a4a4a] font-geist">Year Level: </span>3rd Year
                    </h2>
                  </div>
                  <button className="px-6 py-3 border border-[#e5e5e5] bg-[#862334] text-white hover:bg-[#ffb003] transition-all font-bold uppercase text-sm tracking-widest font-geist">
                    Download PDF
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 my-4">
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="font-geist text-sm md:text-base lg:text-lg font-bold uppercase tracking-[-0.02em] text-black text-left mt-4 mb-2">
                      Student Performance Growth
                    </h3>
                    <StudentLineChart />
                  </div>

                  <div className="flex-1 w-full min-w-0">
                    <h3 className="font-geist text-sm md:text-base lg:text-lg font-bold uppercase tracking-[-0.02em] text-black text-left mt-4 mb-2">
                      Performance Overview
                    </h3>
                    <RadarChartComponent />
                  </div>
                </div>

                <div className="text-left mb-12 mt-2">
                  <h3 className="font-geist text-sm md:text-base lg:text-lg font-bold uppercase tracking-[-0.02em] text-black text-left mt-4 mb-4">
                    AI Feedback Summary
                  </h3>
                  <div className="bg-[#862334]/5 p-6 border-l-4 border-[#ffb003]">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon name="smart_toy" filled className="text-[#862334] text-lg" />
                      <h3 className="text-[#862334] font-geist font-bold uppercase text-xs tracking-widest">
                        AI Critique
                      </h3>
                    </div>
                    <p className="text-black/90 italic mb-4 font-inter text-justify">{aiFeedback.critique}</p>
                  </div>

                  {/* Comment Section */}
                  <div className="mt-6">
                    <h3 className="font-geist text-sm md:text-base lg:text-lg font-bold uppercase tracking-[-0.02em] text-black text-left mb-2">
                      Add Your Comment
                    </h3>
                    <textarea
                      className="w-full p-4 border border-[#e5e5e5] rounded-md text-sm font-inter text-black focus:outline-none focus:shadow-[0_0_0_2px_#862334]"
                      placeholder="Write your comment here..."
                      rows="4"
                    ></textarea>
                    <button className="mt-4 px-6 py-2 bg-[#862334] text-white font-bold uppercase text-sm rounded-md hover:bg-[#ffb003] transition-all">
                      Submit Comment
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-8 border-t border-[#aa9f9f]"></div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-10">
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="font-geist text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-5 whitespace-nowrap">
                      Student Perfomance Leaderboard
                    </h3>
                    <div className="mb-8">
                      <Leaderboard players={students} />
                    </div>
                  </div>

                  <div className="flex-1 w-full min-w-0 self-end mt-13 mb-8">
                    <div className="bg-[#862334]/5 p-6 border-l-4 border-[#ffb003]">
                      <div className="flex items-center gap-3 mb-4">
                        <Icon name="smart_toy" filled className="text-[#862334] text-lg" />
                        <h3 className="text-[#862334] font-geist font-bold uppercase text-xs tracking-widest">
                          AI Summary
                        </h3>
                      </div>
                      <p className="text-black/90 italic mb-4 font-inter text-justify">{aiSummary.summary}</p>
                    </div>
                  </div>
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