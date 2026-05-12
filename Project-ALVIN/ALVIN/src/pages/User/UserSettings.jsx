import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, Mic, Settings, Play, Square } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import SignOutModal from '../../Components/SignOutModal';
import { supabase } from '../../lib/supabaseClient';

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
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Mic, label: "Interview History" },
  { icon: Settings, label: "Settings" },
];



export default function UserSettings() {
  const [activeNav, setActiveNav]     = useState(2); // Settings active
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  const [twoFactor, setTwoFactor]     = useState(true);
  const [showPass, setShowPass]       = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [name, setName]               = useState("Vin Perez");
  const [email, setEmail]             = useState("vinperez123@gmail.com");
  const [gender, setGender]           = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

        {/* Modal */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* ── Main ── */}
        <main className="flex-1 md:ml-60 lg:ml-64 pb-24 sm:pb-20 md:pb-0 bg-white w-full min-h-screen">

          {/* Top Header */}
          <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md flex justify-between items-center px-3 sm:px-4 md:px-8 py-3 sm:py-4 border-b border-[#e5e5e5] gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span className="md:hidden font-[Space_Grotesk,sans-serif] font-black text-sm sm:text-base md:text-lg text-[#862334] uppercase tracking-tight truncate">ALVIN</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">

              <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-[9px] sm:text-xs font-bold font-[Space_Grotesk,sans-serif] flex-shrink-0">
                VN
              </div>
            </div>
          </header>

          {/* ── Settings Content ── */}
          <section className="p-3 sm:p-4 md:p-8 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="mb-6 sm:mb-8 md:mb-12">
              <h2 className="text-7xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black font-Geist mb-2 sm:mb-3 md:mb-2 uppercase leading-tight text-left">
                Settings
              </h2>
              <p className="text-left text-gray-600 max-w-2xl text-xs sm:text-sm md:text-base lg:text-lg font-Inter leading-relaxed">
                Set up your personal details and devices.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 auto-rows-max">

              {/* ── Profile Settings (full width) ── */}
              <div className="md:col-span-12 p-3 sm:p-5 md:p-8 relative overflow-hidden bg-white border border-gray-100 shadow-sm rounded-lg w-full">
                <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-[#862334]/5 -mr-8 sm:-mr-16 -mt-8 sm:-mt-16 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start mb-6 sm:mb-8 relative z-10">
                  {/* Avatar */}
                  <div className="relative group flex-shrink-0 self-start">
                    <div className="w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-gray-50 border border-gray-200 flex items-center justify-center relative overflow-hidden rounded">
                      <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                        {avatar ? (
                          <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="person" className="text-slate-500 text-4xl sm:text-5xl" />
                        )}
                      </div>
                      <label
                        className="absolute inset-0 bg-[#862334]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        htmlFor="avatar-upload"
                      >
                        <Icon name="upload" className="text-white text-xl sm:text-2xl" />
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
                      className="w-full border border-[#862334] mt-2 sm:mt-3 px-2 py-1 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold font-Inter text-[#862334] hover:text-[#ffb003] hover:border-[#ffb003] transition-all block whitespace-nowrap rounded"
                    >
                      Upload Avatar
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-black font-Inter px-3 sm:px-4 py-2 sm:py-3 focus:ring-1 focus:ring-[#862334] outline-none text-xs sm:text-sm rounded"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-black font-Inter px-3 sm:px-4 py-2 sm:py-3 focus:ring-1 focus:ring-[#862334] outline-none text-xs sm:text-sm rounded"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Gender</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-black font-Inter px-3 sm:px-4 py-2 sm:py-3 focus:ring-1 focus:ring-[#862334]  outline-none text-xs sm:text-sm rounded"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-[#862334] text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 font-Geist font-black uppercase hover:bg-[#ffb003] transition-all active:scale-95 text-xs sm:text-sm rounded">
                    Save Profile
                  </button>
                </div>
              </div>

              {/* ── Hardware & Calibration ── */}
              <div className="md:col-span-7 p-3 sm:p-5 md:p-8 bg-white border border-gray-100 shadow-sm rounded-lg">
                <h3 className="text-base sm:text-lg md:text-xl font-black font-Geist tracking-tighter mb-4 sm:mb-6 md:mb-8 border-b border-gray-100 pb-3 sm:pb-4 text-black uppercase">
                  Hardware &amp; Calibration
                </h3>

                <div className="space-y-6 sm:space-y-8 md:space-y-10">
                  {/* Devices */}
                  <div className="space-y-3 sm:space-y-4 md:space-y-6">
                    <h4 className="font-Geist font-bold text-black uppercase tracking-tight text-xs sm:text-sm">
                      Default Input Devices
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Microphone</label>
                        <select
                          value={mic}
                          onChange={e => setMic(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 text-black font-Inter text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-3 focus:ring-1 focus:ring-[#862334] outline-none rounded"
                        >
                          <option>Microphone Array (Intel Smart Sound Technology for Digital Microphones)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Camera</label>
                        <select
                          value={camera}
                          onChange={e => setCamera(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 text-black font-Inter text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-3 focus:ring-1 focus:ring-[#862334] outline-none rounded"
                        >
                          <option>Integrated RGB HD Camera</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mic Sensitivity */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-Geist font-bold text-black uppercase tracking-tight text-xs sm:text-sm">
                        Mic Sensitivity
                      </h4>
                      <button
                        onClick={isTestingMic ? stopMicTest : startMicTest}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded font-Geist text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isTestingMic
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-[#862334] text-white hover:bg-[#ffb003]"
                        }`}
                      >
                        {isTestingMic ? (
                          <>
                            <Square size={12} fill="currentColor" />
                            Stop Test
                          </>
                        ) : (
                          <>
                            <Play size={12} fill="currentColor" />
                            Test Microphone
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative w-full h-16 sm:h-20 bg-gray-50 border border-gray-100 overflow-hidden rounded">
                      {!isTestingMic && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-Geist">
                            Ready to Test
                          </span>
                        </div>
                      )}
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        width={600}
                        height={100}
                      />
                    </div>

                    <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-Inter">
                      Set your microphone level so your voice stays clear and balanced.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Security ── */}
              <div className="h-125 md:col-span-5 p-3 sm:p-5 md:p-8 bg-white border border-gray-100 shadow-sm rounded-lg">
                <h3 className="text-base sm:text-lg md:text-xl font-black font-Geist tracking-tighter mb-4 sm:mb-6 md:mb-8 border-b border-gray-100 pb-3 sm:pb-4 text-black uppercase">
                  Security
                </h3>

                <div className="space-y-5 sm:space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        defaultValue="********"
                        className="w-full bg-gray-50 border border-gray-100 text-black font-Inter px-3 sm:px-4 py-2 sm:py-3 pr-10 focus:ring-1 focus:ring-[#862334] outline-none text-xs sm:text-sm rounded"
                      />
                      <button
                        onClick={() => setShowPass(p => !p)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      >
                        <Icon name={showPass ? "visibility_off" : "visibility"} className="text-xs sm:text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-gray-50 border border-gray-100 text-black font-Inter px-3 sm:px-4 py-2 sm:py-3 pr-10 focus:ring-1 focus:ring-[#862334] outline-none text-xs sm:text-sm rounded placeholder:text-gray-400"
                      />
                      <button
                        onClick={() => setShowNewPass(p => !p)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      >
                        <Icon name={showNewPass ? "visibility_off" : "visibility"} className="text-xs sm:text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-gray-50 border border-gray-100 text-black font-Inter px-3 sm:px-4 py-2 sm:py-3 pr-10 focus:ring-1 focus:ring-[#862334] outline-none text-xs sm:text-sm rounded placeholder:text-gray-400"
                      />
                      <button
                        onClick={() => setShowConfirmPass(p => !p)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      >
                        <Icon name={showConfirmPass ? "visibility_off" : "visibility"} className="text-xs sm:text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Change Password Button */}
                  <button className="w-full bg-[#862334] text-white px-4 sm:px-6 py-2 sm:py-3 font-Geist font-black uppercase tracking-tighter hover:bg-[#ffb003] transition-all active:scale-95 text-xs sm:text-sm rounded">
                    Change Password
                  </button>
                </div>
              </div>

              {/* ── Danger Zone ── */}
              <div className="md:col-span-12 mt-6 sm:mt-8 md:mt-2 pt-6 sm:pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 sm:gap-6">
                <div className="flex-1">
                  <h4 className="text-lg sm:text-xl font-black font-Geist tracking-tighter text-red-600 uppercase text-left">
                    Terminate Account
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm pt-2 sm:pt-3 font-Inter max-w-md leading-relaxed text-left">
                    This will permanently delete all your data and interview history. This action cannot be undone.
                  </p>
                </div>
                <button className="flex-shrink-0 px-6 sm:px-8 py-2 sm:py-3 bg-transparent border-2 border-red-600 text-red-600 font-Geist font-black uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-all rounded text-xs sm:text-sm whitespace-nowrap">
                  TERMINATE
                </button>
              </div>

            </div>
            </div>
          </section>

          <footer className="h-12 sm:h-16 md:h-24 md:h-32 pb-8 md:pb-0" />
        </main>

      </div>
    </>
  );
}