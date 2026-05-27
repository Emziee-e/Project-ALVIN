import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, Settings, Play, Square } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

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
  { icon: LayoutDashboard, label: "Dashboard", path: "/staff/dashboard" },
  { icon: Settings, label: "Settings", path: "/staff/settings" },
];

export default function StaffSettings() {
  const [activeNav, setActiveNav]     = useState(1); // Settings active
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const [name, setName]               = useState("Alvin Mercado");
  const [email, setEmail]             = useState("alvin.mercado@ub.edu.ph");
  const [mic, setMic]                 = useState("Microphone Array (Intel Smart Sound Technology for Digital Microphones)");
  const [camera, setCamera]           = useState("Integrated RGB HD Camera");
  const [avatar, setAvatar]           = useState(null);

  // Mic Testing State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      source.connect(analyzerRef.current);

      setIsTestingMic(true);
      drawWaveform();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopMicTest = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsTestingMic(false);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyzerRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const barCount = 30;
      const barWidth = 4;
      const gap = 4;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const value = dataArray[dataIndex];
        const percent = value / 255;
        const height = Math.max(6, percent * (canvas.height * 0.7));

        // Use alternating branding colors
        ctx.fillStyle = i % 2 === 0 ? '#862334' : '#862334';

        // Draw bars symmetrically from center
        const xRight = centerX + (i * (barWidth + gap));
        const xLeft = centerX - (i * (barWidth + gap));

        // Symmetrical rounded bars
        if (xRight < canvas.width) {
          ctx.beginPath();
          ctx.roundRect(xRight, centerY - height/2, barWidth, height, 10);
          ctx.fill();
        }
        if (xLeft > 0) {
          ctx.beginPath();
          ctx.roundRect(xLeft, centerY - height/2, barWidth, height, 10);
          ctx.fill();
        }
      }
    };

    renderFrame();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        .audio-level-anim { width: 50% !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 0.25rem; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #fff; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 0.125rem; }
        html, body, #root { height: 100%; margin: 0; width: 100%; }

        /* Responsive font scaling */
        @media (max-width: 640px) { html { font-size: 14px; } }
        @media (max-width: 480px) { html { font-size: 13px; } }

        /* Smooth overflow handling */
        body { overflow-x: hidden; }

        /* Better input scaling */
        input, select, textarea { font-size: 1rem; }

        /* Prevent zoom issues */
        @media (max-width: 768px) {
          input, select, button { font-size: 16px !important; }
        }
      `}</style>

      <div className="flex min-h-screen w-screen bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-4 px-4 flex flex-col items-center">
            <img src={Logo} alt="Alvin logo" className=" mb-[-10px] h-24" />
            <div className=" text-center text-maroon text-[2.25rem] font-Geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 mt-2">
            <ul className="flex flex-col gap-1 list-none p-0">
              {navItems.map((item, i) => (
                <li key={item.label}
                  className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                      ${activeNav === i
                        ? "text-[#862334]"
                        : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
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
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-3">
              <span className="md:hidden font-[Space_Grotesk,sans-serif] font-black text-lg text-[#862334] uppercase tracking-tight">ALVIN</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-geist">
                AL
              </div>
            </div>
          </header>

          {/* ── Settings Content ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8 lg:px-12 py-8">
            <div className="max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="mb-6 sm:mb-8 md:mb-12">
              <h2 className="text-7xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black font-Geist mb-2 sm:mb-3 md:mb-2 uppercase leading-tight text-left">
                Settings
              </h2>
              <p className="text-left text-gray-600 max-w-2xl text-xs sm:text-sm md:text-base lg:text-lg font-Inter leading-relaxed">
                Manage your staff account and profile details.
              </p>
            </div>

            {/* Profile Section */}
            <div className="w-full">
                {/* ── Profile Settings ── */}
                <div className="p-4 sm:p-6 md:p-10 relative overflow-hidden bg-white border border-gray-100 shadow-sm rounded-lg">
                  <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-[#862334]/5 -mr-16 sm:-mr-32 -mt-16 sm:-mt-32 rounded-full blur-3xl pointer-events-none" />

                  <h3 className="text-lg sm:text-xl font-black font-Geist tracking-tighter mb-6 border-b border-gray-100 pb-4 text-black uppercase relative z-10">
                    Account Details
                  </h3>

                  <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start relative z-10">
                    {/* Avatar Section */}
                    <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                      <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 bg-gray-50 border border-gray-200 flex items-center justify-center relative overflow-hidden rounded-xl">
                        <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                          {avatar ? (
                            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="person" className="text-slate-500 text-6xl" />
                          )}
                        </div>
                        <label
                          className="absolute inset-0 bg-[#862334]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          htmlFor="avatar-upload"
                        >
                          <Icon name="upload" className="text-white text-3xl" />
                        </label>
                        <input
                          type="file"
                          id="avatar-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <button
                        onClick={() => document.getElementById('avatar-upload').click()}
                        className="w-full border border-[#862334] mt-4 px-4 py-2 text-xs uppercase tracking-widest font-bold font-Inter text-[#862334] hover:bg-[#862334] hover:text-white transition-all block whitespace-nowrap rounded-lg"
                      >
                        Change Avatar
                      </button>
                    </div>

                    {/* Fields Section */}
                    <div className="flex-1 grid grid-cols-1 gap-6 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-gray-500 font-Geist">Full Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-black font-Inter px-4 py-3 focus:ring-1 focus:ring-[#862334] outline-none text-sm rounded-lg transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-gray-500 font-Geist">Email Address</label>
                          <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full bg-gray-100 border border-gray-200 text-gray-500 font-Inter px-4 py-3 outline-none text-sm rounded-lg cursor-not-allowed"
                          />
                        </div>
                      </div>
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