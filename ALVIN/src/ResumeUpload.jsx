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

export default function ResumeUpload() {
  const [activeNav, setActiveNav] = useState(0);
  const [role, setRole] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file && file.type === "application/pdf") setFileName(file.name);
  };

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

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
              <span className="text-[#862334] font-bold opacity-100">New Session Setup</span>
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

          {/* ── SessionSetup Main Content ── */}
          <div className="w-260 pt-24 pb-12 px-6 mx-auto">
            <div className="mx-auto">

              {/* Hero */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-end mt-8">
                <div className="lg:col-span-8">
                  <h2 className="font-[Space_Grotesk,sans-serif] text-5xl md:text-7xl font-bold text-black tracking-tight mb-6 mx-auto pr-15">
                    Catalyze Your <span className="text-[#862334]"> Next Phase.</span>
                  </h2>
                  <p className="font-[Manrope,sans-serif] text-lg text-[#4a4a4a] max-w-xl leading-relaxed">
                    This information enables the system to generate more relevant and realistic interview questions tailored to your experience.
                  </p>
                </div>
                <div className="lg:col-span-4 hidden lg:flex justify-end">
                  <div className="inline-flex flex-col items-end">
                    <span className="font-[Inter,sans-serif] text-[10px] text-[#862334] uppercase tracking-[0.3em] mb-2 font-bold">STATUS</span>
                    <div className="flex items-center gap-2">
                      <span className="h-1 w-12 bg-[#862334] block" />
                      <span className="font-[Space_Grotesk,sans-serif] text-2xl font-light italic text-black">READY_TO_BOOT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Resume Upload */}
                <section className="lg:col-span-7 bg-white border border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 rounded-[4px] relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-[Space_Grotesk,sans-serif] text-xl font-bold flex items-center gap-2 text-black">
                        <Icon name="description" className="text-[#862334]" />
                        Upload Resume
                      </h3>
                      <span className="text-[10px] font-[Inter,sans-serif] text-[#4a4a4a] uppercase tracking-widest">Step 01 / 02</span>
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`border-2 border-dashed rounded-[4px] p-12 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f9f9f9] transition-colors duration-300
                        ${dragOver ? "border-[#862334] bg-[#862334]/5" : "border-[#d1d1d1] hover:border-[#862334]"}`}
                    >
                      <div className={`mb-4 p-4 rounded-full transition-colors duration-300 ${dragOver ? "bg-[#862334]/10" : "bg-[#f0f0f0]"}`}>
                        <Icon name="upload_file" className={`text-4xl transition-colors ${dragOver ? "text-[#862334]" : "text-[#4a4a4a]"}`} />
                      </div>

                      {fileName ? (
                        <>
                          <h4 className="font-[Space_Grotesk,sans-serif] text-lg font-medium mb-1 text-[#862334]">{fileName}</h4>
                          <p className="font-[Manrope,sans-serif] text-sm text-[#4a4a4a] opacity-70">File ready for analysis</p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-[Space_Grotesk,sans-serif] text-lg font-medium mb-1 text-black">Drag and drop your PDF resume</h4>
                          <p className="font-[Manrope,sans-serif] text-sm text-[#4a4a4a] opacity-70">Upload your resume to help ALVIN understand your background, skills, and career path.</p>
                        </>
                      )}

                      <label className="mt-6 px-6 py-2 bg-[#e5e5e5] hover:bg-[#862334] hover:text-white text-[#4a4a4a] transition-all text-sm font-[Inter,sans-serif] font-bold rounded-[2px] uppercase tracking-tight cursor-pointer">
                        Select File
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileDrop} />
                      </label>
                    </div>

                    <div className="mt-6 flex gap-4">
                      {["Max 5MB", "PDF Only"].map(label => (
                        <div key={label} className="flex items-center gap-2 text-[10px] font-[Inter,sans-serif] text-[#4a4a4a]/60">
                          <Icon name="check_circle" className="text-xs" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#862334]/5 rounded-full blur-3xl group-hover:bg-[#862334]/10 transition-colors pointer-events-none" />
                </section>

                {/* Right column */}
                <div className="lg:col-span-5 flex flex-col gap-8">

                  {/* Target Role */}
                  <section className="bg-white border border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-8 rounded-[4px] flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-[Space_Grotesk,sans-serif] text-xl font-bold flex items-center gap-2 text-black">
                        <Icon name="target" className="text-[#862334]" />
                        Destination
                      </h3>
                      <span className="text-[10px] font-[Inter,sans-serif] text-[#4a4a4a] uppercase tracking-widest">Step 02 / 02</span>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="role" className="block font-[Inter,sans-serif] text-xs text-[#4a4a4a] uppercase tracking-widest mb-3 font-bold">
                          Target Job Role
                        </label>
                        <div className="relative">
                          <input
                            id="role"
                            type="text"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            placeholder="e.g., Junior Software Engineer"
                            className="w-full bg-[#f9f9f9] border border-[#e5e5e5] focus:ring-1 focus:ring-[#862334] focus:outline-none py-4 px-4 text-black placeholder:text-[#d1d1d1] font-[Manrope,sans-serif] transition-all rounded-[2px]"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">
                            <Icon name="work" className="text-[#4a4a4a]" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-[#862334]/5 rounded border-l-2 border-[#862334]">
                        <p className="text-xs font-[Manrope,sans-serif] leading-relaxed text-[#4a4a4a]">
                          <strong className="text-[#862334] uppercase text-[10px] block mb-1">Recommendation:</strong>
                          Specify your experience level and tech stack to receive more accurate interview simulations.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* CTA */}
                  <section className="bg-[#f9f9f9] border border-[#e5e5e5] p-8 rounded-[4px] relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="font-[Inter,sans-serif] text-[10px] text-[#4a4a4a] uppercase tracking-widest mb-6 font-bold">Finalize Protocol</p>
                      <button className="w-full py-5 bg-[#862334] hover:bg-[#ffb003] text-white font-[Space_Grotesk,sans-serif] font-black text-lg tracking-tight hover:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 rounded-[2px] uppercase">
                        Initialize Interview
                      </button>
                    </div>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-gradient-to-br from-[#862334] via-transparent to-[#ffb003]" />
                  </section>
                </div>
              </div>

              {/* Supplemental Info */}
              <div className="mt-20 border-t border-[#e5e5e5] pt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    title: "Machine Learning Analysis",
                    body: "ALVIN uses machine learning models to analyze your resume, understand your career path, and identify key skills based on your experience and target role.",
                  },
                  {
                    title: "Real-time Feedback",
                    body: "During the interview, ALVIN reviews your answers in real time, tracking your tone, pacing, and accuracy to give clear performance feedback.",
                  },
                  {
                    title: "Privacy Protection",
                    body: "Your resume is processed only within the current session. ALVIN does not permanently store your unencrypted files, keeping your data private.",
                  },
                ].map(({ title, body }) => (
                  <div key={title}>
                    <h5 className="font-[Space_Grotesk,sans-serif] text-sm font-bold uppercase tracking-widest mb-4 text-black">{title}</h5>
                    <p className="font-[Manrope,sans-serif] text-sm text-[#4a4a4a] leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </main>

        {/* Decorative glow */}
        <div
          className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10"
          style={{ background: "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)" }}
        />
      </div>
    </>
  );
}