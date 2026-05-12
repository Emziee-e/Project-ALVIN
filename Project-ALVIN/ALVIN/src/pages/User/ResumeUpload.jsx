import { useState } from "react";
import {MessagesSquare,ChevronRight,FileText,UploadCloud,Target,Briefcase,AlertCircle} from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import SignOutModal from '../../Components/SignOutModal';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
  { icon: MessagesSquare, label: "Interview Setup" },
];

export default function ResumeUpload() {
  const [activeNav, setActiveNav] = useState(0);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setError("");
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
    } else if (file) {
      setError("Please upload a PDF file.");
    }
  };

  const handleInitialize = () => {
    if (!fileName) {
      setError("Please upload your resume before proceeding to the interview.");
      return;
    }
    navigate('/user/hardware-check');
  };

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />


      <div className="flex min-h-screen bg-white text-black font-Geist">

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
                 return (
                   <li key={item.label}
                     className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                   >
                     <div
                       className={`flex items-center gap-4 px-4 py-3 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                         ${activeNav === i
                           ? "text-[#862334]"
                           : "text-[#4a4a4a]"}`}
                     >
                       <item.icon size={20} />
                       <span>{item.label}</span>
                     </div>
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

         {/* Modal */}
         <SignOutModal
           isOpen={isSignOutModalOpen}
           onClose={() => setIsSignOutModalOpen(false)}
           onConfirm={handleSignOut}
         />

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 md:left-60 lg:left-64 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif] opacity-60">
              <Link to="/user/dashboard">Dashboard</Link>
              <ChevronRight size={14} />
              <span className="text-[#862334] font-bold opacity-100">Interview Setup</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── SessionSetup Main Content ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 w-full">
            <div className="max-w-[1200px] mx-auto">

              {/* Hero */}
              <div className="mb-12">
                <h2 className="font-Geist text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight mb-4">
                  Get Started!
                </h2>
                <p className="font-Inter text-base md:text-lg text-[#4a4a4a] max-w-2xl leading-relaxed">
                  This information enables the system to generate more relevant and realistic interview questions tailored to your experience.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Resume Upload */}
                <section className="xl:col-span-7 bg-white border border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 md:p-8 rounded-[4px] relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-Geist text-xl font-bold flex items-center gap-2 text-black">
                        <FileText size={20} className="text-[#862334]" />
                        Upload Resume
                      </h3>
                      <span className="text-[10px] font-[Inter,sans-serif] text-[#4a4a4a] uppercase tracking-widest">Step 01 / 02</span>
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`border-2 border-dashed rounded-[4px] py-16 px-6 md:px-12 flex flex-col items-center justify-center text-center cursor-pointer bg-[#f9f9f9] transition-colors duration-300
                        ${dragOver ? "border-[#862334] bg-[#862334]/5" : "border-[#d1d1d1] hover:border-[#862334]"}`}
                    >
                      <div className={`mb-4 p-4 rounded-full transition-colors duration-300 ${dragOver ? "bg-[#862334]/10" : "bg-[#f0f0f0]"}`}>
                        <UploadCloud size={40} className={`transition-colors ${dragOver ? "text-[#862334]" : "text-[#4a4a4a]"}`} />
                      </div>

                      {fileName ? (
                        <>
                          <h4 className="font-[Space_Grotesk,sans-serif] text-lg font-medium mb-1 text-[#862334]">{fileName}</h4>
                          <p className="font-[Manrope,sans-serif] text-sm text-[#4a4a4a] opacity-70">File ready for analysis</p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-Geist text-lg font-medium mb-1 text-black">Drag and drop your PDF resume</h4>
                          <p className="font-Inter text-sm text-[#4a4a4a] opacity-70">
                            Upload your resume to help ALVIN understand your background.<br />
                            <span className="text-[10px] uppercase tracking-wider font-Inter font-bold opacity-60 mt-2 block">PDF Only • Max 5MB</span>
                          </p>
                        </>
                      )}

                      <label className="mt-6 px-6 py-2 bg-[#e5e5e5] hover:bg-[#862334] hover:text-white text-[#4a4a4a] transition-all text-sm font-Geist font-bold rounded-[2px] uppercase tracking-tight cursor-pointer">
                        Select File
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileDrop} />
                      </label>
                    </div>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#862334]/5 rounded-full blur-3xl group-hover:bg-[#862334]/10 transition-colors pointer-events-none" />
                </section>

                {/* Right column */}
                <div className="xl:col-span-5 flex flex-col gap-8">

                  {/* Target Role */}
                  <section className="bg-white border border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 md:p-8 rounded-[4px] flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-Geist text-xl font-bold flex items-center gap-2 text-black">
                        <Target size={20} className="text-[#862334]" />
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
                            className="w-full bg-[#f9f9f9] border border-[#e5e5e5] focus:ring-1 focus:ring-[#862334] focus:outline-none py-4 px-4 text-black placeholder:text-[#d1d1d1] font-Inter transition-all rounded-[2px]"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">
                            <Briefcase size={20} className="text-[#4a4a4a]" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-[#862334]/5 rounded border-l-2 border-[#862334]">
                        <p className="text-xs font-[Manrope,sans-serif] leading-relaxed text-[#4a4a4a]">
                          <strong className="text-[#862334] font-Geist uppercase text-[10px] block mb-1">Recommendation:</strong>
                          Specify your experience level and tech stack to receive more accurate interview simulations.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* CTA */}
                  <section className="bg-[#f9f9f9] border border-[#e5e5e5] p-6 md:p-8 rounded-[4px] relative overflow-hidden">
                    <div className="relative z-10">
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle size={16} className="text-red-500 shrink-0" />
                          <p className="text-[10px] font-Inter font-bold text-red-700 uppercase tracking-tight leading-tight">
                            {error}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleInitialize}
                        className="w-full py-5 bg-maroon hover:bg-[#ffb003] text-white font-Geist font-black text-lg tracking-tight hover:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 rounded-[2px] uppercase"
                      >
                        Initialize Interview
                      </button>
                    </div>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-gradient-to-br from-[#862334] via-transparent to-[#ffb003]" />
                  </section>
                </div>
              </div>

              {/* Supplemental Info */}
              <div className="mt-16 border-t border-[#e5e5e5] pt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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
                    <h5 className="font-Geist text-sm font-bold uppercase tracking-widest mb-4 text-black">{title}</h5>
                    <p className="font-Inter text-sm text-[#4a4a4a] leading-relaxed">{body}</p>
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