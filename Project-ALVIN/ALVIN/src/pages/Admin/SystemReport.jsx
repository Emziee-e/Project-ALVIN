import { useState } from "react";
import { Users, FileBarChart, UserCircle, Mic, TrendingUp, LayoutGrid, Calendar, Clock, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '/images/Alvin-logo.png';
import BarCharts from './barChart';

const navItems = [
  { icon: Users, label: "User Management" },
  { icon: FileBarChart, label: "System Report" },
  { icon: UserCircle, label: "Avatar Management" },
];

export default function SystemReport() {
  const [activeNav, setActiveNav] = useState(1);
  const [reportType, setReportType] = useState("Weekly");

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-6 px-4 flex flex-col items-center">
            <img src={Logo} alt="Alvin logo" className="mb-[-10px] h-24" />
            <div className="text-center text-maroon text-[2.25rem] font-Geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none">
              {navItems.map((item, i) => {
                const isUserMgmt = i === 0;
                const isSystemReport = i === 1;
                const isAvatarMgmt = i === 2;
                let navLink = '#';

                if (isUserMgmt) navLink = '/admin/users';
                if (isSystemReport) navLink = '/admin/reports';
                if (isAvatarMgmt) navLink = '/admin/avatars';

                return (
                  <li key={item.label}
                    className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                  >
                    <Link
                      to={navLink}
                      onClick={() => setActiveNav(i)}
                      className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                        ${activeNav === i
                          ? "text-[#862334]"
                          : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto">
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header (Shared with UserDashboard) */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif] opacity-100">
              <span className="text-[#862334] font-bold opacity-100">System Report</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* Content Canvas */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 space-y-8 max-w-7xl mx-auto">

              {/* Page Header */}
              <section className="text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div className="w-full md:w-auto">
                  <h2 className="text-left font-Geist text-4xl md:text-6xl font-black tracking-tight text-black uppercase mb-2">
                    System Reports
                  </h2>
                  <p className="text-gray-500 font-[Inter,sans-serif] text-sm md:text-base opacity-80">
                    Monitor system performance and user engagement metrics.
                  </p>
                </div>
              </section>

              {/* KPI Cards Grid - Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Interviews */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">Total Interviews</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Mic className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-black font-[Geist,Inter]">12,842</h3>
                </div>

                {/* Avg. Performance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">Avg. Performance</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <FileBarChart className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-black font-[Geist,Inter]">94.8%</h3>
                </div>

                {/* Active Users */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">Active Users</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-black font-[Geist,Inter]">3,205</h3>
                </div>
              </div>

              {/* KPI Cards Grid - Middle Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Daily Users */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">Daily Users</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-4 font-[Geist,Inter]">10</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Clock className="w-4 h-4" />
                    <span>Last 24 hours</span>
                  </div>
                </div>

                {/* Weekly Users */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">Weekly Users</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-4 font-[Geist,Inter]">20</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Last 7 days</span>
                  </div>
                </div>

                {/* Monthly Users */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">Monthly Users</p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-4 font-[Geist,Inter]">40</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>Last 30 days</span>
                  </div>
                </div>
              </div>

              {/* Total Users Graph Section */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-12">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold font-[Geist,Inter] text-black">
                      {reportType} Interview Volume
                    </h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#862334]"></span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Volume</span>
                    </div>
                    <div className="relative group">
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="appearance-none bg-white text-gray-700 text-[10px] font-Inter font-bold py-2 px-4 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer uppercase tracking-wider transition-all hover:bg-gray-50"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-hover:text-gray-600" />
                    </div>
                  </div>
                </div>
                <BarCharts reportType={reportType} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}