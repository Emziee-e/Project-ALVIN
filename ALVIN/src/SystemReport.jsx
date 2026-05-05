import { useState } from "react";
import Logo from '../src/assets/alvin-logo.png';
import BarCharts from './barChart';

const Icon = ({ name, className = "", fill = false }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
  >
    {name}
  </span>
);

const navItems = [
  { icon: "people", label: "User Management" },
  { icon: "assessment", label: "System Report" },
  { icon: "person", label: "Avatar Management" },
];

export default function SystemReport() {
  const [activeNav, setActiveNav] = useState(1);

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

      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .custom-btn {
          background-color: #862334 !important;
          color: #ffffff !important;
          transition: background-color 0.2s ease;
        }
        .custom-btn:hover {
          background-color: #ffb003 !important;
        }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar (Shared with UserDashboard) ── */}
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
                    className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-[Space_Grotesk,sans-serif] uppercase tracking-[0.15em] text-[10px] rounded-[2px]
                      ${activeNav === i
                        ? "text-[#862334]"
                        : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                  >
                    <Icon name={item.icon} />
                    <span className="hidden sm:inline">{item.label}</span>
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
              <section className="text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-8 md:mb-12">
                <div className="w-full md:w-auto">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-[Space_Grotesk,sans-serif] font-black tracking-tighter uppercase text-black mb-2 md:mb-4">
                    System <span className="italic">Reports</span>
                  </h2>
                  <p className="text-gray-600 font-[Manrope,sans-serif] text-sm md:text-base lg:text-lg leading-relaxed max-w-lg opacity-80">
                    Monitor system performance and user engagement metrics.
                  </p>
                </div>
              </section>

              {/* Total Users Graph Section */}
              <div className="bg-white p-6 md:p-8 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-tight text-black">Total Number of Users</h3>
                  </div>
                  <div className="flex gap-2">
                  </div>
                </div>

                {/* User Count Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg">
                    <p className="font-[Inter,sans-serif] text-xs uppercase tracking-[0.2em] text-gray-600 mb-3">Daily Users</p>
                    <h4 className="text-3xl md:text-4xl font-[Space_Grotesk,sans-serif] font-bold text-black mb-1">10</h4>
                    <p className="text-xs text-gray-500">Last 24 hours</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg">
                    <p className="font-[Inter,sans-serif] text-xs uppercase tracking-[0.2em] text-gray-600 mb-3">Weekly Users</p>
                    <h4 className="text-3xl md:text-4xl font-[Space_Grotesk,sans-serif] font-bold text-black mb-1">20</h4>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg">
                    <p className="font-[Inter,sans-serif] text-xs uppercase tracking-[0.2em] text-gray-600 mb-3">Monthly Users</p>
                    <h4 className="text-3xl md:text-4xl font-[Space_Grotesk,sans-serif] font-bold text-black mb-1">40</h4>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                </div>

                {/* User Growth Chart - Using BarChart Component */}
                <BarCharts />
              </div>

              {/* KPI Cards Grid - Bottom Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                {/* Active Users */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 rounded-lg relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col items-center justify-center text-center">
                  <div className="absolute top-4 right-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#862334] animate-pulse"></span>
                      <span className="w-2 h-2 rounded-full bg-[#862334] opacity-40"></span>
                    </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 text-[#862334]/5 group-hover:text-[#862334]/10 transition-colors">
                    <Icon name="people" className="text-9xl" fill={true} />
                  </div>
                  <p className="font-[Inter,sans-serif] text-xs uppercase tracking-[0.2em] text-gray-600 mb-4 relative z-10">Active Users Right Now</p>
                  <h3 className="text-4xl md:text-5xl font-[Space_Grotesk,sans-serif] font-bold text-[#862334] mb-2 relative z-10">8</h3>
                  <p className="text-sm font-[Manrope,sans-serif] text-gray-500 relative z-10">Currently online</p>
                </div>

                {/* Conducted Interviews */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 rounded-lg relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col items-center justify-center text-center">
                  <div className="absolute -right-8 -top-8 text-[#862334]/5 group-hover:text-[#862334]/10 transition-colors">
                    <Icon name="record_voice_over" className="text-9xl" />
                  </div>
                  <p className="font-[Inter,sans-serif] text-xs uppercase tracking-[0.2em] text-gray-600 mb-4 relative z-10">Conducted Interviews</p>
                  <h3 className="text-4xl md:text-5xl font-[Space_Grotesk,sans-serif] font-bold text-black mb-2 relative z-10">212</h3>
                  <p className="text-sm font-[Manrope,sans-serif] text-gray-500 relative z-10">Total completed</p>
                </div>

                {/* Average Performance Score */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8 rounded-lg relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col items-center justify-center text-center">
                  <div className="absolute -right-8 -bottom-8 text-[#862334]/5 group-hover:text-[#862334]/10 transition-colors">
                    <Icon name="assessment" className="text-9xl" />
                  </div>
                  <p className="font-[Inter,sans-serif] text-xs uppercase tracking-[0.2em] text-gray-600 mb-4 relative z-10">Average User Performance Score</p>
                  <div className="flex items-end gap-2 justify-center mb-4 relative z-10">
                    <h3 className="text-4xl md:text-5xl font-[Space_Grotesk,sans-serif] font-bold text-[#862334]">82.5%</h3>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 relative z-10">
                    <div className="bg-[#862334] h-full rounded-full" style={{ width: "82.5%" }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 relative z-10">Out of 100</p>
                </div>
              </div>
            </div>
          </div>
        </main>

      </div>
    </>
  );
}
