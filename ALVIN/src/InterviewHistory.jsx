import { useState } from "react";
import Logo from './assets/alvin-logo.png';

const Icon = ({ name, filled = false, className = "" }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    {name}
  </span>
);

const navItems = [
  { icon: "dashboard", label: "Dashboard"  },
  { icon: "mic_external_on", label: "Interview History" },
  { icon: "settings", label: "Settings"   },
];

const interviews = [
  { role: "Software Engineer", date: "Oct 24, 2023", score: 92, icon: "terminal",    primary: true  },
  { role: "Data Scientist", date: "Oct 22, 2023", score: 78, icon: "palette",     primary: false },
  { role: "Cybersecurity Analyst", date: "Oct 18, 2023", score: 85, icon: "leaderboard", primary: false },
  { role: "Cloud Engineer", date: "Oct 15, 2023", score: 95, icon: "psychology",  primary: false },
  { role: "UI/UX Designer", date: "Oct 12, 2023", score: 62, icon: "database",    primary: false },
];

const TOTAL    = 10;
const PER_PAGE = 5;
const PAGES    = Math.ceil(TOTAL / PER_PAGE);

export default function InterviewHistory() {
  const [activeNav,   setActiveNav]   = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page,        setPage]        = useState(1);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style> {`
                html, body, #root { height: 100%; margin: 0; width: 100%; }
            `}
        </style>

      <div className="flex min-h-screen bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed w-64 min-h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5]
          flex flex-col py-8 px-4 z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}>
          <div className="mb-12 px-4">
            <img src={Logo} alt="Alvin logo" className="w-[100px] mb-[-10px] mx-auto" />
            <div className="text-[#862334] font-[Space_Grotesk,sans-serif] font-black text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
            <p className="font-[Space_Grotesk,sans-serif] uppercase text-[10px] text-[#4a4a4a]">
              By Team Katana
            </p>
          </div>

          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              {navItems.map((item, i) => (
                <li key={item.label} className={activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}>
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); setActiveNav(i); setSidebarOpen(false); }}
                    className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-[Space_Grotesk,sans-serif] uppercase tracking-[0.15em] text-xs rounded-[2px]
                      ${activeNav === i ? "text-[#862334]" : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto">
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="md:ml-64 flex-1 pb-20 md:pb-0 bg-white min-w-0">

          {/* ── Top Header ── */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md flex justify-between items-center px-4 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-3">
              <span className="md:hidden font-[Space_Grotesk,sans-serif] font-black text-lg text-[#862334] uppercase tracking-tight">
                ALVIN AI
              </span>
              <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif]">
                <span className="text-[#862334] font-bold pt-2 ">Interview History</span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 rounded-full border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Page Content ── */}
          <div className="pt-8 pb-16 px-4 md:px-8 max-w-6xl mx-auto">

            {/* Editorial Header */}
            <div className="mb-10 md:mb-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-end">
              <div>
                <h1 className="text-left font-[Space_Grotesk,sans-serif] text-5xl md:text-7xl font-bold text-black tracking-tighter leading-none mb-4">
                  Interview <span className="text-[#862334]">History</span>
                </h1>
                <p className="text-left font-[Manrope,sans-serif] text-gray-600 text-base md:text-lg max-w-md opacity-80">
                  Track your previous interviews and how your performance has improved over time.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <span className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 block">Total Sessions</span>
                  <p className="font-[Space_Grotesk,sans-serif] text-3xl font-bold text-[#862334]">{TOTAL}</p>
                </div>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Target Role", "Date", "Readiness Score", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-4 md:px-6 py-4 font-[Space_Grotesk,sans-serif] text-xs md:text-sm uppercase tracking-widest text-gray-500 font-bold ${i === 3 ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {interviews.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {/* Role */}
                        <td className="px-4 md:px-6 py-4 md:py-6">
                          <p className="font-bold text-black text-sm md:text-base truncate">{row.role}</p>
                        </td>
                        {/* Date */}
                        <td className="px-4 md:px-6 py-4 md:py-6 text-gray-500 font-[Inter,sans-serif] text-xs md:text-sm whitespace-nowrap">
                          {row.date}
                        </td>
                        {/* Score */}
                        <td className="px-4 md:px-6 py-4 md:py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 md:w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden flex-shrink-0">
                              <div
                                className="bg-[#862334] h-full rounded-full"
                                style={{ width: `${row.score}%` }}
                              />
                            </div>
                            <span className="font-bold text-[#862334] text-sm whitespace-nowrap">{row.score}%</span>
                          </div>
                        </td>
                        {/* Action */}
                        <td className="px-4 md:px-6 py-4 md:py-6 text-right">
                          <button className="bg-[#862334] text-white hover:bg-[#ffb003] transition-all duration-300 px-3 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded active:scale-95 whitespace-nowrap font-[Space_Grotesk,sans-serif]">
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Pagination ── */}
            <div className="mt-6 md:mt-8 flex justify-between items-center px-1 flex-wrap gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30"
                >
                  <Icon name="chevron_left" className="text-lg" /> Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#862334] text-sm">{page}</span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-gray-500 text-sm">{PAGES}</span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(PAGES, p + 1))}
                  disabled={page === PAGES}
                  className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30"
                >
                  Next <Icon name="chevron_right" className="text-lg" />
                </button>
              </div>
              <span className="hidden sm:block font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-400">
                Viewing {PER_PAGE} of {TOTAL} interviews
              </span>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}