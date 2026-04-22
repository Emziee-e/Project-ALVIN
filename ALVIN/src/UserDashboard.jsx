import { useState } from "react";
import Logo from './assets/alvin-logo.png';

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
  { icon: "dashboard", label: "Dashboard" },
  { icon: "mic_external_on", label: "Interviews" },
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

export default function UserDashboard() {
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

      <div className="flex h-screen w-290 justify-center bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="fixed w-64 h-1 min-h-screen fixed left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col py-8 px-4 z-50">

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
        <main className="flex-1 ml-24 w-screen pb-50 bg-white">

          {/* Top Header */}
          <header className="fixed top-0 left-64 right-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-8 py-4 border-b border-[#e5e5e5]">
            {/* Search */}
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#862334] text-xl" />
              <input
                type="text"
                placeholder="Search insights..."
                className="bg-[#f9f9f9] border border-[#e5e5e5] text-black pl-10 pr-4 py-2 w-64 text-sm font-[Inter,sans-serif] rounded-[2px] outline-none focus:shadow-[0_0_0_2px_#862334] transition-shadow"
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-6">
              <button className="bg-transparent border-0 cursor-pointer p-2 text-[#4a4a4a] hover:text-[#862334] transition-colors rounded">
                <Icon name="notifications" />
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5]">
                {/* Replace src with real avatar */}
                <div className="w-full h-full bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                  VN
                </div>
              </div>
            </div>
          </header>

          {/* Page inner */}
          <div className="flex-1 pt-24 pb-15 px-12 w-full mx-auto">

            {/* ── Hero ── */}
            <section className="mt-8 mb-16 grid grid-cols-[8fr_4fr] gap-12 items-end max-[1100px]:grid-cols-1">
              <div className="text-left">
                <span className="text-[#862334] font-[Inter,sans-serif] uppercase tracking-[0.3em] text-[10px] font-bold block mb-4">
                  Version 4.2.0
                </span>
                <h2 className="font-[Space_Grotesk,sans-serif] text-[64px] font-bold tracking-[-0.04em] text-black leading-none mb-6 max-[700px]:text-[36px]">
                  Welcome back, <span className="text-[#862334]">Vin!</span>
                </h2>
                <p className="text-[#4a4a4a] font-[Manrope,sans-serif] text-xl max-w-[480px] leading-relaxed">
                  Your interview performance indicates a{" "}
                  <span className="text-[#862334] font-bold">3% improvement</span> since your last session.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button className="group w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-[0.1em] text-sm rounded-[2px] flex items-center justify-between px-8 py-5 transition-all duration-200">
                  START NEW INTERVIEW
                  <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </section>

            {/* ── Analytics Grid ── */}
            <section className="mb-16">
              <div className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">

                {/* Session Volume */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] text-[8px] uppercase tracking-[0.2em] block mb-1">Session Volume</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-[Space_Grotesk,sans-serif] text-[30px] font-bold text-black">24</span>
                  </div>
                  <div className="mt-4 text-xs font-[Inter,sans-serif] text-[#4a4a4a] uppercase tracking-tight">Total Interviews</div>
                  <Icon name="quick_reference_all" className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:opacity-[0.1] text-[120px] pointer-events-none transition-opacity" />
                </div>

                {/* Avg Performance */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] text-[8px] uppercase tracking-[0.2em] block mb-1 text-center">Average Performance Accuracy</span>
                  <span className="font-[Space_Grotesk,sans-serif] text-[30px] font-bold text-black">82%</span>
                  <div className="mt-4 w-full bg-[#f0f0f0] h-1 rounded-[2px]">
                    <div className="bg-[#862334] h-full rounded-[2px]" style={{ width: "82%" }} />
                  </div>
                </div>

                {/* Peak Competency */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] text-[8px] uppercase tracking-[0.2em] block mb-1">Peak Competency</span>
                  <div className="font-[Space_Grotesk,sans-serif] text-xl font-bold text-black mt-2 leading-tight uppercase text-center">
                    Consistent Eye Contact
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-[#862334]/10 text-[#862334] text-[10px] font-bold rounded-full mt-4">
                    ELITE TIER
                  </div>
                </div>

                {/* Priority Focus */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] text-[8px] uppercase tracking-[0.2em] block mb-1">Priority Focus Area</span>
                  <div className="font-[Space_Grotesk,sans-serif] text-xl font-bold text-[#862334] mt-2 uppercase">
                    Filler Words
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[true, true, true, false, false].map((f, i) => (
                      <div key={i} className={`w-1 h-3 ${f ? "bg-[#862334]" : "bg-[#f0f0f0]"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Interview History ── */}
            <div className="flex justify-center items-center">
              <div className="w-full max-w-[1100px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-[Space_Grotesk,sans-serif] text-2xl font-bold uppercase tracking-[-0.02em] text-black">
                    Interview History
                  </h3>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-[5fr_3fr_2fr_2fr] px-6 py-2 text-[10px] font-[Inter,sans-serif] uppercase tracking-[0.2em] text-[#4a4a4a]">
                  <div>Target Role</div>
                  <div>Date</div>
                  <div>Score</div>
                  <div className="text-right">Insight</div>
                </div>

                {/* Rows */}
                {interviews.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[5fr_3fr_2fr_2fr] items-center px-6 py-5 bg-[#f9f9f9] border-b border-[#e5e5e5] hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="flex items-center gap-3 font-[Space_Grotesk,sans-serif] font-medium text-black">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.high ? "bg-[#862334]" : "bg-[#862334]/40"}`} />
                      {row.role}
                    </div>
                    <div className="text-[#4a4a4a] font-[Inter,sans-serif] text-xs">{row.date}</div>
                    <div className={`font-[Space_Grotesk,sans-serif] font-bold ${row.high ? "text-[#862334]" : "text-black"}`}>
                      {row.score}
                    </div>
                    <div className="text-right">
                      <button className="bg-transparent border-0 border-b border-[#d1d1d1] cursor-pointer text-[10px] font-[Inter,sans-serif] uppercase text-[#4a4a4a] pb-[1px] transition-all hover:text-[#862334] hover:border-[#862334]">
                        VIEW FEEDBACK
                      </button>
                    </div>
                  </div>
                ))}
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