import { useState } from "react";
import { Users, FileBarChart, UserCircle, LogOut, ChevronDown, Play, Pause, CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '/images/Alvin-logo.png';

const navItems = [
  { icon: Users, label: "User Management" },
  { icon: FileBarChart, label: "System Report" },
  { icon: UserCircle, label: "Avatar Management" },
];

const footerLinks = [
  { icon: "terminal",    label: "System Logs" },
  { icon: "help_center", label: "Support"     },
];

const avatarModels = [
  {
    id: 1,
    name: "Alvin 1",
    placeholder: "A1",
    selected: true,
  },
  {
    id: 2,
    name: "Alvin 2",
    placeholder: "A2",
    selected: false,
  },
  {
    id: 3,
    name: "Alvin 3",
    placeholder: "A3",
    selected: false,
  },
  {
    id: 4,
    name: "Alvin 4",
    placeholder: "A4",
    selected: false,
  },
];

const voiceClips = [
  { label: "Standard Greeting",  duration: "0:04s", primary: true  },
  { label: "Technical Analysis", duration: "0:12s", primary: false },
];

const compatStats = [
  { label: "Lip-Sync Precision", value: "99.8%",   accent: true  },
  { label: "Emotion Mapping",    value: "Enabled",  accent: false },
  { label: "Edge Processing",    value: "Active",   accent: false },
];

const mobileNav = [
  { icon: "group",       label: "Accounts" },
  { icon: "monitoring",  label: "Stats"    },
  { icon: "psychology",  label: "Models",  fab: true },
  { icon: "terminal",    label: "Logs"     },
  { icon: "settings",    label: "System"   },
];

export default function AvatarManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(2); // Avatars active
  const [models,      setModels]      = useState(avatarModels);
  const [playing,     setPlaying]     = useState(null);
  const [voice,       setVoice]       = useState("Nova-Seraph (Alt-Alto)");
  const [pitch,       setPitch]       = useState(60);
  const [latency,     setLatency]     = useState(45);

  const selectModel = (id) =>
    setModels(prev => prev.map(m => ({ ...m, selected: m.id === id })));

  const selected = models.find(m => m.selected);

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
            <img src={Logo} alt="Alvin logo" className="mb-[-10px] h-24" />
            <div className="text-center text-maroon text-[2.25rem] font-Geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
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

          {/* Sign Out CTA */}
          <div className="mt-auto">
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen min-w-0">

          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif] opacity-100">
              <span className=" text-[#862334] font-bold opacity-100">Avatar Management</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="px-4 md:px-6 lg:px-8 py-8 md:py-10 flex-1">

            {/* Hero */}
            <section className="text-left mb-8 md:mb-12">
              <h2 className="font-[Geist,Inter] text-4xl md:text-6xl font-black tracking-tighter text-black uppercase mb-2">
                Avatar Management
              </h2>
              <p className="text-gray-500 font-[Inter,sans-serif] text-sm md:text-base opacity-80">
                Manage AI avatars and voice settings. Choose a primary avatar and voice model.Selected models will be applied to all users.
              </p>
            </section>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">

              {/* ── Left: Avatar Gallery ── */}
              <div className="lg:col-span-8 space-y-6">
                {/* Gallery header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-[Geist,Inter] text-xl md:text-2xl font-bold uppercase tracking-tight">
                    Avatar Models
                  </h3>
                </div>

                {/* Avatar Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {models.map(model => (
                    <div
                      key={model.id}
                      onClick={() => selectModel(model.id)}
                      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 rounded-lg
                        ${model.selected
                          ? "border-2 border-[#862334] shadow-[0_0_40px_rgba(134,35,52,0.15)]"
                          : "border border-gray-200 hover:border-[#862334]/50"}`}
                    >
                      {/* Avatar placeholder */}
                      <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 relative">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className={`text-6xl font-[Space_Grotesk,sans-serif] font-black transition-all duration-700
                            ${model.selected ? "text-[#862334]" : "text-gray-400 group-hover:text-[#862334]/60"}`}
                          >
                            {model.placeholder}
                          </div>
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      </div>

                      {/* Card footer */}
                      <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full">
                        <div className="flex justify-between items-end gap-2">
                          <div className="min-w-0">
                            {model.selected && (
                              <span className="text-[#862334] font-[Inter,sans-serif] text-[10px] uppercase tracking-widest mb-1 block bg-white/90 px-1.5 py-0.5 w-fit rounded-sm font-bold">
                                Active Selection
                              </span>
                            )}
                            <h4 className="text-lg md:text-2xl font-[Geist,Inter] font-bold text-white truncate uppercase">
                              {model.name}
                            </h4>
                          </div>
                          {model.selected ? (
                            <div className="bg-[#862334] text-white p-2 flex-shrink-0 rounded-full">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); selectModel(model.id); }}
                              className="bg-white/90 text-black px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-[Geist,Inter] font-bold uppercase tracking-widest hover:bg-[#862334] hover:text-white transition-all flex-shrink-0 whitespace-nowrap rounded-sm"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Voice Matrix ── */}
              <div className="lg:col-span-4 space-y-6">

                {/* Voice panel */}
                <div className="bg-gray-50 border border-gray-200 p-5 md:p-8 rounded-lg">
                  <h3 className="font-[Geist,Inter] text-xl md:text-2xl font-bold uppercase tracking-tight mb-6 md:mb-8">
                    Voice Models
                  </h3>

                  <div className="space-y-5 md:space-y-6">
                    {/* Voice select */}
                    <div className="space-y-2">
                      <label className="text-xs font-[Inter,sans-serif] uppercase tracking-widest text-[#862334] block font-bold">
                        Primary Voice
                      </label>
                      <div className="relative">
                        <select
                          value={voice}
                          onChange={e => setVoice(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-black py-3 md:py-4 pl-4 pr-12 focus:ring-1 focus:ring-[#862334] appearance-none font-[Manrope,sans-serif] outline-none text-sm rounded cursor-pointer"
                        >
                          <option>ALVIN VOICE 1 (Alt-Alto)</option>
                          <option>ALVIN VOICE 2 (Deep Bass)</option>
                          <option>ALVIN VOICE 3 (Neutral Mid)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-4 h-4" />
                      </div>
                    </div>

                    {/* Preview clips */}
                    <div className="bg-white p-4 md:p-6 space-y-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-[Inter,sans-serif] font-bold text-sm tracking-widest uppercase">Preview Clips</span>
                      </div>
                      <div className="space-y-2">
                        {voiceClips.map((clip, i) => (
                          <div
                            key={i}
                            onClick={() => setPlaying(playing === i ? null : i)}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group rounded"
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                              <button
                                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0
                                  ${clip.primary || playing === i
                                    ? "border border-[#862334] text-[#862334] hover:bg-[#862334] hover:text-white"
                                    : "border border-gray-300 text-gray-500 hover:border-[#862334] hover:text-[#862334]"}`}
                              >
                                {playing === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <div>
                                <p className="text-sm font-bold text-black font-[Geist,Inter]">{clip.label}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-[Inter,sans-serif]">{clip.duration}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <button className="w-full bg-[#862334] text-white py-4 md:py-5 font-[Geist,Inter] font-bold text-sm uppercase tracking-[0.2em] hover:bg-[#ffb003] hover: transition-all shadow-[0_10px_30px_rgba(134,35,52,0.2)] rounded-sm">
                      Update Voice Model
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </>
  );
}