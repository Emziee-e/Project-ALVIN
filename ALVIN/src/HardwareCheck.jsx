import { useState } from "react";
import Logo from './assets/alvin-logo.png';

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

export default function HardwareCheck() {
  const [activeNav, setActiveNav] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style>{`
        .mic-indicator-active {
          width: 60% !important;
        }
      `}</style>

      <div className="flex min-h-screen bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="fixed w-64 min-h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col py-8 px-4 z-50">

          {/* Logo */}
          <div className="mb-12 px-4">
            <img src={Logo} alt="Alvin logo" className="w-[100px] mb-[-10px] mx-auto" />
            <div className="text-[#862334] font-[Space_Grotesk,sans-serif] font-black text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
            <p className="font-[Space_Grotesk,sans-serif] uppercase text-[10px] text-[#4a4a4a]">
              By Team Katana
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              {navItems.map((item, i) => (
                <li
                  key={item.label}
                  className={activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}
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

          {/* Sign Out */}
          <div className="mt-auto">
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ml-24 flex-1 pb-12 bg-white">

          {/* Top Header */}
          <header className="fixed top-0 left-64 right-0 z-40 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif] opacity-60">
              <span>Dashboard</span>
              <Icon name="chevron_right" className="text-[10px]" />
              <span className="text-[#862334] font-bold opacity-100">Pre-Interview Lobby</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="bg-transparent border-0 cursor-pointer p-2 text-[#4a4a4a] hover:text-[#862334] transition-colors rounded">
                <Icon name="notifications" />
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Pre-Flight Lobby Content ── */}
          <div className="w-265 pt-24 px-6 py-12 lg:py-20 max-w-6xl mx-auto">

            {/* Page Header */}
            <header className="mb-12">
              <h1 className="text-5xl font-black font-[Space_Grotesk,sans-serif] tracking-tighter uppercase mb-4">
                ALVIN Pre-INTERVIEW Lobby
              </h1>
              <p className="text-lg text-slate-600 font-medium font-[Manrope,sans-serif]">
                Ensure your hardware is ready before the interview session.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              {/* ── Left: Webcam & Indicators ── */}
              <div className="lg:col-span-7 space-y-8">

                {/* Webcam Preview */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  {/* Dark BG placeholder */}
                  <div className="absolute inset-0 bg-slate-900" />

                  {/* Center status */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                    <Icon
                      name={permissionsGranted ? "videocam" : "videocam_off"}
                      className={`text-6xl mb-4 ${permissionsGranted ? "text-green-400 opacity-100" : ""}`}
                    />
                    <p className="font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-widest text-sm">
                      {permissionsGranted ? "Camera Active" : "Waiting for Permissions"}
                    </p>
                  </div>

                  {/* Audio Level Bar */}
                  <div className="absolute bottom-6 left-6 right-6 bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4">
                      <Icon name="mic" className="text-[#e9c400]" />
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-green-400 transition-all duration-300 ${permissionsGranted ? "mic-indicator-active" : "w-0"}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Environment Warning */}
                <div className="bg-[#8e0f28]/10 p-6 flex gap-4 items-start border-l-4 border-[#ff989d]">
                  <Icon name="lightbulb" className="text-[#ff989d] flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#8e0f28] font-[Space_Grotesk,sans-serif]">Camera & Lighting Check</h4>
                    <p className="text-slate-700 text-sm font-[Manrope,sans-serif]">
                      Position your camera to show your face and chest, and ensure good lighting.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right: Controls & Actions ── */}
              <div className="lg:col-span-5 space-y-10">

                {/* Hardware Check */}
                <section className="space-y-6">
                  <h3 className="text-xl font-bold font-[Space_Grotesk,sans-serif] uppercase tracking-tight flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-[#862334] block flex-shrink-0" />
                    Hardware Check
                  </h3>

                  <div className="space-y-4">
                    {/* Video Source */}
                    <div className="p-6 bg-slate-50 rounded-lg flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                          <Icon name="camera" className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs font-[Inter,sans-serif] uppercase text-slate-500 font-bold tracking-tighter">Video Source</p>
                          <p className="font-medium font-[Manrope,sans-serif]">System Default Camera</p>
                        </div>
                      </div>
                      <Icon
                        name={permissionsGranted ? "check_circle" : "error"}
                        className={permissionsGranted ? "text-green-500" : "text-red-500"}
                      />
                    </div>

                    {/* Audio Input */}
                    <div className="p-6 bg-slate-50 rounded-lg flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                          <Icon name="mic" className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs font-[Inter,sans-serif] uppercase text-slate-500 font-bold tracking-tighter">Audio Input</p>
                          <p className="font-medium font-[Manrope,sans-serif]">Built-in Microphone</p>
                        </div>
                      </div>
                      <Icon
                        name={permissionsGranted ? "check_circle" : "error"}
                        className={permissionsGranted ? "text-green-500" : "text-red-500"}
                      />
                    </div>
                  </div>
                </section>

                {/* Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => setPermissionsGranted(true)}
                    className="w-full bg-[#862334] text-white font-[Space_Grotesk,sans-serif] font-bold py-6 px-8 flex items-center justify-center gap-3 transition-all hover:bg-[#ffb003] active:scale-[0.98] uppercase tracking-wider"
                  >
                    <Icon name="key" />
                    ALLOW CAMERA &amp; MIC ACCESS
                  </button>

                  <button
                    disabled={!permissionsGranted}
                    className={`w-full font-[Space_Grotesk,sans-serif] font-black py-6 px-8 uppercase tracking-widest text-lg border transition-all
                      ${permissionsGranted
                        ? "bg-[#862334] text-white border-[#862334] hover:bg-[#ffb003] hover:border-[#ffb003] cursor-pointer active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"}`}
                  >
                    Proceed to Interview
                  </button>

                  <p className="text-center text-xs text-slate-400 font-[Inter,sans-serif] px-8">
                    By entering, you consent to our data processing and automated evaluation. We ensure that your data is safe and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Decorative glow */}
        <div className="fixed bottom-0 right-0 w-1/3 h-1/2 -z-10 pointer-events-none overflow-hidden opacity-5">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#862334] rounded-full blur-[100px]" />
          <div className="absolute top-0 right-20 w-64 h-64 bg-[#e9c400] rounded-full blur-[80px]" />
        </div>

      </div>
    </>
  );
}