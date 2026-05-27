import { useState, useEffect, useRef } from "react";
import {MonitorCheck,Mic,VideoOff,ChevronRight,Lightbulb,Camera,CheckCircle,AlertCircle,KeyRound} from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import SignOutModal from '../../Components/SignOutModal';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
  { icon: MonitorCheck, label: "Hardware Setup" },
];

export default function HardwareCheck() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [activeNav, setActiveNav] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({ video: "", audio: "" });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  /* Camera Access Function */
  const startPreview = async (videoDeviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting preview:", err);
    }
  };

  const getDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      const audioDevices = allDevices.filter(d => d.kind === 'audioinput');

      setDevices({ video: videoDevices, audio: audioDevices });

      let currentVideoId = selectedDevices.video;
      if (videoDevices.length > 0 && !currentVideoId) {
        currentVideoId = videoDevices[0].deviceId;
        setSelectedDevices(prev => ({ ...prev, video: currentVideoId }));
      }
      if (audioDevices.length > 0 && !selectedDevices.audio) {
        setSelectedDevices(prev => ({ ...prev, audio: audioDevices[0].deviceId }));
      }

      if (currentVideoId) {
        startPreview(currentVideoId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionsGranted(true);
      // Stop the initial stream
      stream.getTracks().forEach(track => track.stop());
      getDevices();
    } catch (err) {
      console.error("Permission denied:", err);
      setPermissionsGranted(false);
    }
  };

  useEffect(() => {
    if (permissionsGranted) {
      getDevices();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [permissionsGranted]);

  useEffect(() => {
    if (permissionsGranted && selectedDevices.video) {
      startPreview(selectedDevices.video);
    }
  }, [selectedDevices.video]);
/*                            */

/* Microphone Waveform Visualization */
  useEffect(() => {
    if (permissionsGranted && selectedDevices.audio) {
      startMicTest(selectedDevices.audio);
    }
  }, [selectedDevices.audio, permissionsGranted]);

  const startMicTest = async (audioDeviceId) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
      });

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      source.connect(analyzerRef.current);

      drawWaveform();
    } catch (err) {
      console.error("Error accessing microphone for test:", err);
    }
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

      const barCount = 60;
      const barWidth = 4;
      const gap = 3;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const value = dataArray[dataIndex];
        const percent = value / 255;
        const height = Math.max(6, percent * (canvas.height * 0.85));

        ctx.fillStyle = '#862334';

        const xRight = centerX + (i * (barWidth + gap));
        const xLeft = centerX - (i * (barWidth + gap));

        if (xRight < canvas.width) {
          ctx.beginPath();
          ctx.roundRect(xRight, centerY - height/2, barWidth, height, 4);
          ctx.fill();
        }
        if (xLeft > 0) {
          ctx.beginPath();
          ctx.roundRect(xLeft, centerY - height/2, barWidth, height, 4);
          ctx.fill();
        }
      }
    };

    renderFrame();
  };

  /*                            */

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <style>{`
        .mic-indicator-active {
          width: 60% !important;
        }
        .mirror-mode {
          transform: scaleX(-1);
        }
      `}</style>

      <div className="flex min-h-screen bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="fixed w-64 min-h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex flex-col py-8 px-4 z-50">

          {/* Logo */}
          <div className="mb-6 px-4 flex flex-col items-center">
            <img src={Logo} alt="Alvin logo" className=" mb-[-10px] h-24" />
            <div className=" text-center text-maroon text-[2.25rem] font-Geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
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

          {/* Sign Out */}
          <div className="mt-auto">
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-[Geist] font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200"
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
              <Link to="/user/resume-upload">Interview Setup</Link>
              <ChevronRight size={14} />
              <span className="text-[#862334] font-bold opacity-100">Hardware Setup</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Pre-Flight Lobby Content ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 w-full">
            <div className="max-w-[1200px] mx-auto">

            {/* Page Header */}
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-Geist tracking-tighter uppercase mb-4 text-black">
                Interview Setup
              </h1>
              <p className="text-lg text-[#4a4a4a] font-medium font-Inter">
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

                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover mirror-mode transition-opacity duration-500 ${permissionsGranted ? "opacity-100" : "opacity-0"}`}
                  />

                  {/* Center status (Shown only when no stream) */}
                  {!permissionsGranted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                      <VideoOff size={40} className="mb-4" />
                      <p className="font-Geist font-bold uppercase tracking-widest text-sm">
                        Waiting for Permissions
                      </p>
                    </div>
                  )}

                  {/* Top Badge */}
                  {permissionsGranted && (
                    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] text-white font-bold uppercase tracking-widest font-Inter">Live Preview</span>
                    </div>
                  )}

                  {/* Mic Waveform (Bottom) */}
                  {permissionsGranted && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[95%] h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center px-6 border border-white/10 shadow-lg">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={80}
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>

                {/* Environment Warning */}
                <div className="bg-[#8e0f28]/10 p-6 flex gap-4 items-start border-l-4 border-[#ff989d]">
                  <Lightbulb size={24} className="text-[#ff989d] flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#8e0f28] font-Geist">Camera & Lighting Check</h4>
                    <p className="text-slate-700 text-sm font-Inter">
                      Position your camera to show your face and chest, and ensure good lighting.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right: Controls & Actions ── */}
              <div className="lg:col-span-5 space-y-10">

                {/* Hardware Check */}
                <section className="space-y-6">
                  <h3 className="text-maroon text-xl font-bold font-Geist uppercase tracking-tight flex items-center gap-3">
                    Hardware Check
                  </h3>

                  <div className="space-y-4">
                    {/* Video Source */}
                    <div className="p-6 bg-slate-50 rounded-lg flex flex-col gap-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                            <Camera size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-Inter uppercase text-slate-500 font-bold tracking-tighter">Video Source</p>
                          </div>
                        </div>
                        {permissionsGranted ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <AlertCircle size={20} className="text-red-500" />
                        )}
                      </div>
                      <select
                        disabled={!permissionsGranted}
                        value={selectedDevices.video}
                        onChange={(e) => setSelectedDevices(prev => ({ ...prev, video: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm font-Inter outline-none focus:ring-1 focus:ring-maroon disabled:opacity-50"
                      >
                        {devices.video.length > 0 ? (
                          devices.video.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                          ))
                        ) : (
                          <option>No camera found</option>
                        )}
                      </select>
                    </div>

                    {/* Audio Input */}
                    <div className="p-6 bg-slate-50 rounded-lg flex flex-col gap-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                            <Mic size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-xs font-Inter uppercase text-slate-500 font-bold tracking-tighter">Audio Input</p>
                          </div>
                        </div>
                        {permissionsGranted ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <AlertCircle size={20} className="text-red-500" />
                        )}
                      </div>
                      <select
                        disabled={!permissionsGranted}
                        value={selectedDevices.audio}
                        onChange={(e) => setSelectedDevices(prev => ({ ...prev, audio: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm font-Inter outline-none focus:ring-1 focus:ring-maroon disabled:opacity-50"
                      >
                        {devices.audio.length > 0 ? (
                          devices.audio.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>
                          ))
                        ) : (
                          <option>No microphone found</option>
                        )}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Buttons */}
                <div className="space-y-4">
                  {!permissionsGranted && (
                    <button
                      onClick={requestPermissions}
                      className="w-full bg-[#862334] text-white font-Geist font-bold py-6 px-8 flex items-center justify-center gap-3 transition-all hover:bg-[#ffb003] active:scale-[0.98] uppercase tracking-wider"
                    >
                      <KeyRound size={20} />
                      ALLOW CAMERA &amp; MIC ACCESS
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/user/live-session')}
                    disabled={!permissionsGranted}
                    className={`w-full font-Geist font-black py-6 px-8 uppercase tracking-widest text-lg border transition-all
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