import { useState } from "react";
import { LayoutDashboard, Mic, Settings, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '/images/Alvin-logo.png';
import SignOutModal from '../../Components/SignOutModal';
import { supabase } from "../../lib/supabaseClient";


const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Mic, label: "Interview History" },
  { icon: Settings, label: "Settings" },
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

export default function StaffDashboard() {
  const [activeNav, setActiveNav] = useState(0);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <>
      <style> {`
                html, body, #root { height: 100%; margin: 0; width: 100%; }
            `}
        </style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-6 px-4 flex flex-col items-center">
            <img src={Logo} alt="Alvin logo" className=" mb-[-10px] h-24" />
            <div className=" text-center text-maroon text-[2.25rem] font-Geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none">
              {navItems.map((item, i) => {
                const isDashboard = i === 0;
                const isInterviews = i === 1;
                const isSettings = i === 2;
                let navLink = '#';

                if (isDashboard) navLink = '/user/dashboard';
                if (isInterviews) navLink = '/user/interviews';
                if (isSettings) navLink = '/user/settings';

                return (
                  <li key={item.label}
                    className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                  >
                    {isDashboard || isInterviews || isSettings ? (
                      <Link
                        to={navLink}
                        onClick={(e) => { setActiveNav(i); }}
                        className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                          ${activeNav === i
                            ? "text-[#862334]"
                            : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <a
                        href="#"
                        onClick={e => { e.preventDefault(); setActiveNav(i); }}
                        className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                          ${activeNav === i
                            ? "text-[#862334]"
                            : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto">
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 md:left-60 lg:left-64 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            {/* Search */}
            <div className="relative w-40 sm:w-48 md:w-56 lg:w-64 flex-shrink-0">

            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#e5e5e5] flex-shrink-0">
                <div className="w-full h-full bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                  VN
                </div>
              </div>
            </div>
          </header>

          {/* Page inner */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 w-full">

            {/* ── Hero ── */}
            <section className="mb-8 md:mb-12 grid grid-cols-1 lg:grid-cols-[8fr_4fr] gap-6 md:gap-12 items-start lg:items-end">
              <div className="text-left">
                <h2 className="font-[Geist,Inter] text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-black leading-tight mb-3 md:mb-4">
                  Welcome back, <span className="text-maroon">Vin!</span>
                </h2>
                <p className="text-[#4a4a4a] font-[Inter] text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl">
                  Your interview performance indicates a{" "}
                  <span className="text-maroon font-bold">3% improvement</span> since your last session.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full lg:w-auto">
                <button
                  onClick={() => navigate('/user/resume-upload')}
                  className="group w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-[Geist,Inter] font-bold uppercase tracking-[0.1em] text-xs sm:text-sm rounded-[2px] flex items-center justify-center sm:justify-between px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 lg:py-5 transition-all duration-200 gap-2"
                >
                  <span>START NEW INTERVIEW</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </section>

            {/* ── Analytics Grid ── */}
            <section className="mb-16">
              <div className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">

                {/* Session Volume */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1">Session Volume</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-[Geist] text-[30px] font-bold text-black">24</span>
                  </div>
                  <div className="mt-4 text-xs font-[Inter] text-[#4a4a4a] uppercase tracking-tight">Total Interviews</div>

                </div>

                {/* Avg Performance */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1 text-center w-full">Average Performance Accuracy</span>
                  <span className="font-[Geist] text-[30px] font-bold text-black">82%</span>
                  <div className="mt-4 w-full bg-[#f0f0f0] h-1 rounded-[2px]">
                    <div className="bg-[#862334] h-full rounded-[2px]" style={{ width: "82%" }} />
                  </div>
                </div>

                {/* Peak Competency */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1 text-center w-full">Peak Competency</span>
                  <div className="font-[Geist] text-xl font-bold text-black mt-2 leading-tight uppercase text-center">
                    Consistent Eye Contact
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-[#862334]/10 text-[#862334] text-[10px] font-bold rounded-full mt-4">
                    ELITE TIER
                  </div>
                </div>

                {/* Priority Focus */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1 text-center w-full">Priority Focus Area</span>
                  <div className="font-[Geist] text-xl font-bold text-[#862334] mt-2 uppercase">
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

            {/* ── Interview History & Staff Comment ── */}
            <div className="flex justify-center items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-[Geist] text-2xl font-bold uppercase tracking-[-0.02em] text-black">
                    Interview History
                  </h3>
                </div>

                {/* Table */}
                <div className="grid grid-cols-[5fr_3fr_2fr_2fr] px-6 py-2 text-[10px] font-[Geist,Inter] uppercase tracking-[0.2em] text-[black]">
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

              {/* Staff Comment Section */}
              <div className="w-80 flex-shrink-0">
                <h3 className="font-[Geist] text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-8">
                  Staff Comment
                </h3>

                <div className="p-6 bg-[#f9f9f9] border border-[#e5e5e5] rounded-[2px] hover:border-[#862334] transition-colors h-fit">
                  <div className="flex gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#862334] flex-shrink-0 mt-1" />
                    <h4 className="font-[Space_Grotesk,sans-serif] font-bold text-sm text-black">General Performance Feedback</h4>
                  </div>
                  <p className="font-[Inter] text-xs text-[#4a4a4a] leading-relaxed">
                    Your overall performance demonstrates consistent improvement with an 82% average accuracy across all sessions. You excel in communication and eye contact, which are critical competencies. Focus on reducing filler words and maintaining a steady pace when explaining complex topics to further strengthen your interview presence.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Decorative glow */}
        <div className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10"
          style={{ background: "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)" }}
        />

        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />
      </div>
    </>
  );
}