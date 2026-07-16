import { useState, useEffect, useRef } from "react";
import Logo from '/images/Alvin-logo.png';
import OverallStats from "./OverallStats";
import StudentLineChart from "./StudentLineChart";
import RadarChartComponent from "./RadarChart";
import Leaderboard from "./LeaderBoard";
import { LayoutDashboard, Settings, Users, FileBarChart, Mic, TrendingUp, } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

const Icon = ({ name, className = "" }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/staff/dashboard" },
  { icon: Settings, label: "Settings", path: "/staff/settings" },
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
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(
    navItems.findIndex(item => item.path === location.pathname) !== -1
      ? navItems.findIndex(item => item.path === location.pathname)
      : 0
  );
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) setActiveNav(index);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-inter text-black font-[Manrope,sans-serif]">

        {/* Modal */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/*── Main ──*/}
        <main className={`flex-1 w-full bg-white overflow-hidden flex flex-col h-screen transition-all duration-300`}>

          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-4">
              <a href="#hero" className="flex items-center">
                <img src="/images/Alvin-logo.png" alt="alvin logo" className="h-10 w-auto object-contain" />
                <span className="font-Geist text-4xl font-GeistSans text-maroon leading-none">
                  LVIN
                </span>
              </a>
            </div>

            {/* Right actions */}
            <div className="relative flex items-center gap-3 sm:gap-4 md:gap-6 flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#e5e5e5] flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[#862334]/30 transition-all p-0 bg-transparent"
              >
                <div className="w-full h-full bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-geist">
                  AL
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e5e5e5] rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#e5e5e5] mb-1">
                    <p className="text-xs font-bold text-[#862334] uppercase tracking-wider">Dean Alvin</p>
                    <p className="text-[10px] text-[#4a4a4a] truncate">alvin@ub.edu.ph</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsSignOutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[#4a4a4a] hover:bg-[#f0f0f0] hover:text-[#862334] transition-colors border-none cursor-pointer"
                  >
                    <Icon name="logout" className="text-lg" />
                    <span className="font-geist uppercase tracking-widest text-[10px] font-bold">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Page inner */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full py-8">

            {/* ── Welcome Hero ── */}
            <div className="mb-12">
              <h1 className="font-geist text-3xl md:text-4xl font-bold tracking-[-0.04em] text-black leading-tight mb-2">
                Welcome <span className="text-[#862334]">Dean Alvin!</span>
              </h1>
              <p className="text-[#4a4a4a] font-inter text-sm md:text-base">
                Here's an overview of your students' interview performance
              </p>
            </div>
            
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                
                {/* Total Interviews */}
                <div className="bg-white p-5 h-auto rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider font-[Geist,Inter]">Total Mock Interviews</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Mic className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-black text-black font-[Geist,Inter]">12,842</h3>
                    <span className="text-emerald-600 text-xs font-bold font-inter">+12% this week</span>
                  </div>
                </div>

                {/* Job Readiness Rate */}
                <div className="bg-white p-5 h-auto rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider font-[Geist,Inter]">Job Readiness Rate</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <FileBarChart className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-black text-black font-[Geist,Inter]">78.4%</h3>
                    <span className="text-gray-400 text-xs font-inter">Scored 80%+ on last attempt</span>
                  </div>
                </div>

                {/* Avg. Skill Improvement */}
                <div className="bg-white p-5 h-auto rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider font-[Geist,Inter]">Avg. Improvement</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-black text-black font-[Geist,Inter]">+16.2%</h3>
                    <span className="text-gray-400 text-xs font-inter">Between 1st & latest attempt</span>
                  </div>
                </div>

                {/* Requires Coaching */}
                <div className="bg-white p-5 h-auto rounded-xl border border-rose-100 shadow-sm relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[#862334] text-xs font-bold uppercase tracking-wider font-[Geist,Inter]">Requires Coaching</p>
                    <div className="p-2 bg-rose-100 text-[#862334] rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-black text-[#862334] font-[Geist,Inter]">48</h3>
                    <span className="text-gray-500 text-xs font-bold font-inter">Students scoring below 60%</span>
                  </div>
                </div>
              </div>

            {/* ── Leaderboard Section ── */}
            <div className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-lg border border-[#e5e5e5] p-8">
                  <div className="mb-6">
                    <h2 className="font-geist text-xl md:text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-1">
                      Top Performers
                    </h2>
                    <p className="text-sm text-[#4a4a4a] font-inter">
                      Students ranked by interview performance score
                    </p>
                  </div>
                  <Leaderboard players={students} />
                </div>

                <div className="bg-gradient-to-br from-[#862334]/5 to-[#ffb003]/5 rounded-lg border border-[#e5e5e5] p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#862334] text-white">
                        <Icon name="smart_toy" className="text-lg" />
                      </div>
                      <h3 className="text-[#862334] font-geist font-bold uppercase text-sm tracking-widest">
                        AI Insights
                      </h3>
                    </div>
                    <p className="text-black/90 font-inter text-sm leading-relaxed mb-6">
                      {aiSummary.summary}
                    </p>
                  </div>
                  <button className="mt-4 w-full px-4 py-3 bg-[#862334] text-white font-bold uppercase text-xs rounded-md hover:bg-[#ffb003] transition-all tracking-wider">
                    View Full Report
                  </button>
                </div>
              </div>
            </div>

            {/* ── Detailed Analysis Section ── */}
            <div className="mb-12">
              <div className="bg-white rounded-lg border border-[#e5e5e5] p-8">
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-geist text-xl md:text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-1">
                        Student Detailed Analysis
                      </h2>
                      <p className="text-sm text-[#4a4a4a] font-inter">
                        Performance metrics and feedback for individual students
                      </p>
                    </div>
                    <div className="relative w-full sm:w-auto flex items-center">
                      <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] text-lg" />
                      <input
                        type="text"
                        placeholder="SEARCH USERS"
                        className="w-full sm:w-72 bg-white border border-[#e5e7eb] text-[#9ca3af] pl-11 pr-4 py-2 text-xs font-geist tracking-widest rounded-lg outline-none focus:border-[#862334] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Student Summary Card */}
                  <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 mb-10 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                      <div className="flex items-center gap-6">
                        {/* Avatar / Initial Circle */}
                        <div className="w-16 h-16 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334] text-2xl font-bold border-2 border-[#862334]/20">
                          JD
                        </div>

                        <div>
                          <p className="text-[#862334] font-geist font-bold text-xs uppercase tracking-widest mb-1">Featured Student</p>
                          <h3 className="font-geist text-2xl font-bold text-black mb-3">Juan Dela Cruz</h3>

                          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <div className="flex items-center gap-2">
                              <Icon name="school" className="text-[#4a4a4a] text-lg" />
                              <p className="font-inter text-sm text-[#4a4a4a]">
                                <span className="font-bold">Program:</span> BSIT
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Icon name="calendar_today" className="text-[#4a4a4a] text-lg" />
                              <p className="font-inter text-sm text-[#4a4a4a]">
                                <span className="font-bold">Year Level:</span> 3rd Year
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-2">
                        <div className="text-center md:text-right px-4">
                          <p className="font-inter text-[10px] text-[#4a4a4a] uppercase font-bold tracking-[0.2em] mb-0">
                            PERFORMANCE GRADE
                          </p>
                          <p className="font-geist text-4xl font-black text-[#862334] leading-tight">85%</p>
                        </div>
                        <button className="flex items-center gap-3 px-6 py-2.5 bg-[#862334] text-white font-bold uppercase text-[10px] tracking-wider rounded-lg hover:bg-[#a12a3f] transition-all shadow-lg shadow-[#862334]/20">
                          <Icon name="download" className="text-base" />
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white rounded-lg border border-[#e5e5e5] p-6">
                    <h3 className="font-geist text-base font-bold uppercase tracking-[-0.02em] text-black mb-4">
                      Performance Growth
                    </h3>
                    <StudentLineChart />
                  </div>

                  <div className="bg-white rounded-lg border border-[#e5e5e5] p-6">
                    <h3 className="font-geist text-base font-bold uppercase tracking-[-0.02em] text-black mb-4">
                      Skills Assessment
                    </h3>
                    <RadarChartComponent />
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="bg-gradient-to-r from-[#862334]/5 to-[#ffb003]/5 rounded-lg border border-[#e5e5e5] p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#862334] text-white">
                      <Icon name="smart_toy" className="text-base" />
                    </div>
                    <h3 className="text-[#862334] font-geist font-bold uppercase text-sm tracking-widest">
                      AI Feedback Analysis
                    </h3>
                  </div>
                  <p className="text-black/90 font-inter text-sm leading-relaxed">{aiFeedback.critique}</p>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="font-geist text-base font-bold uppercase tracking-[-0.02em] text-black mb-4">
                    Your Observations
                  </h3>
                  <textarea
                    className="w-full p-4 border border-[#e5e5e5] rounded-lg text-sm font-inter text-black focus:outline-none focus:shadow-[0_0_0_2px_#862334] resize-none"
                    placeholder="Add your comments and observations about this student's performance..."
                    rows="4"
                  ></textarea>
                  <button className="mt-4 px-6 py-2 bg-[#862334] text-white font-bold uppercase text-xs rounded-md hover:bg-[#ffb003] transition-all">
                    Submit Comment
                  </button>
                </div>
              </div>
            </div>

            {/* ── Overall Performance Section ── */}
            <div className="mb-12">
              <div className="bg-white rounded-lg border border-[#e5e5e5] p-8">
                <div className="mb-6">
                  <h2 className="font-geist text-xl md:text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-1">
                    Overall Performance Trend
                  </h2>
                  <p className="text-sm text-[#4a4a4a] font-inter">
                    Aggregate performance metrics across all student evaluations
                  </p>
                </div>
                <OverallStats />
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