import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Smartphone, MoreVertical, LayoutDashboard, Settings, LogOut, MessageSquare, Play, Square, Signal, Camera } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import EndSessionModal from "../../Components/EndSessionModal";
import Loading from "../../Components/Loading";

const transcript = [
  {
    speaker: "ALVIN",
    time: "14:02:10",
    text: "Can you briefly introduce yourself and walk me through your background?",
    isAlvin: true,
  },
  {
    speaker: "YOU",
    time: "14:02:45",
    text: "I’m a full-stack developer with a strong focus on backend systems and scalable architectures. I recently worked at DataCore Solutions, where I contributed to building APIs that handled high-volume requests. I’ve worked with technologies like Node.js, PostgreSQL, and Docker, and I’m particularly interested in designing efficient systems that can scale reliably.",
    isAlvin: false,
  },
  {
    speaker: "ALVIN",
    time: "14:03:12",
    text: "Tell me about yourself and what makes you a good fit for this role?",
    isAlvin: true,
  },
];

const metrics = [
  { label: "Confidence Score", value: "94%", accent: true },
  { label: "Sentiment", value: "Positive", accent: false },
  { label: "Clarity", value: "High", accent: false },
  { label: "Keywords", value: "Innovation, Scale", accent: false },
];

export default function LiveSession() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    let id;
    if (sessionStarted && countdown === 0) {
      id = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(id);
  }, [sessionStarted, countdown]);

  const handleStartInterview = () => {
    setCountdown(5);
  };

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setSessionStarted(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    if (camActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [camActive]);

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const handleConfirmEnd = () => {
    setIsEndModalOpen(false);
    setIsFinishing(true);

    // Turn off camera and mic
    setCamActive(false);
    setMicActive(false);

    // Close the camera stream explicitly
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Simulate a brief loading state before navigation
    setTimeout(() => {
      navigate('/user/interview-results');
    }, 2000);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f3f3f3; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #862334; border-radius: 10px; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; width: 100%; }
      `}</style>

      <div className="h-screen w-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">
        <div className="mx-auto flex flex-col w-full h-full overflow-hidden">

          {/* ── Top Header (Tallened to 70px) ── */}
          <header className="flex-shrink-0 h-[70px] bg-white flex justify-between items-center px-8 border-b border-[#e5e5e5] z-40">
            <div className="hidden md:flex items-center gap-3 text-sm font-[Inter,sans-serif] opacity-100">
              <img src={Logo} alt="Alvin logo" className="w-[55px] mb-[-10px]" />
              <span className="text-[#862334] font-bold pt-2 ">Live Session</span>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            {/* Start Overlay / Countdown Overlay */}
            {!sessionStarted && (
              <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-4xl w-full px-4">
                  {countdown === null ? (
                    <>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-Geist text-maroon mb-6 uppercase tracking-tighter text-center">
                        Ready to Begin?
                      </h2>
                      <p className="text-gray-500 font-Inter text-base mb-12 leading-relaxed max-w-xl mx-auto text-center">
                        The AI interviewer is ready. Please ensure you are in a quiet environment and your camera is properly positioned.
                      </p>
                      <div className="max-w-xs mx-auto">
                        <button
                          onClick={handleStartInterview}
                          className="w-full py-4 bg-[#862334] text-white font-black font-Geist uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all"
                        >
                          Start Interview
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-xl font-black font-Geist text-gray-400 uppercase tracking-widest">
                        Interview starts in
                      </h2>
                      <div className="text-9xl font-black font-Geist text-[#862334] leading-none animate-pulse">
                        {countdown}
                      </div>
                      <p className="text-gray-400 font-Inter text-xs uppercase tracking-widest font-bold">
                        Prepare yourself...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Left: Video + Metrics */}
            <div className="flex-1 flex flex-col gap-5 p-6 min-w-0 overflow-hidden">

              {/* Video Feed */}
              <div className="flex-[3] relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl min-h-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white/10 text-center">
                    <Smartphone className="w-[100px] h-[100px] mx-auto" />
                    <p className="font-[Space_Grotesk,sans-serif] text-xs uppercase tracking-[0.2em] mt-4">ALVIN AI Interface</p>
                  </div>
                </div>

                {/* Listening badge (Enlarged) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-3 px-6 py-2.5 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl">
                    <span className={`w-2.5 h-2.5 rounded-full ${sessionStarted ? 'bg-[#862334] animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-[#862334] text-xs font-black tracking-widest uppercase font-[Inter,sans-serif]">
                      {sessionStarted ? "ALVIN is listening..." : "Session Paused"}
                    </span>
                  </div>
                </div>

              {/* Candidate PiP (Top Left - Larger) */}
                <div className="absolute top-8 left-8 w-64 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-slate-800 backdrop-blur-md">
                  {camActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                      <VideoOff className="text-white/20 text-4xl" />
                    </div>
                  )}

                  {/*Status Indicators overlay*/}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
                    <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] text-white font-bold font-[Inter,sans-serif] flex items-center gap-2 border border-white/10">
                      <div className={`w-1.5 h-1.5 rounded-full ${camActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                      YOU
                    </div>
                    {!micActive && (
                      <div className="bg-maroon text-white p-1 rounded-lg backdrop-blur-sm shadow-lg">
                        <MicOff size={12} />
                      </div>
                    )}
                  </div>
                </div>

                {/* REC Timer */}
                <div className="absolute top-6 right-6 z-20">
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-xs font-black text-white font-[Inter,sans-serif] tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    LIVE
                  </div>
                </div>

                {/* ── Buttons ── */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#202124]/90 backdrop-blur-xl px-5 py-3 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  {/* Network Indicator */}
                  <div className="flex items-center gap-2 pr-4 mr-2 border-r border-white/10">
                    <div className="flex gap-0.5 items-end h-3">
                      <div className="w-1 h-[20%] bg-green-500 rounded-full"></div>
                      <div className="w-1 h-[40%] bg-green-500 rounded-full"></div>
                      <div className="w-1 h-[70%] bg-green-500 rounded-full"></div>
                      <div className="w-1 h-[100%] bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest hidden md:block">Stable</span>
                  </div>

                  <button
                    onClick={() => setMicActive(m => !m)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 border
                      ${micActive
                        ? "bg-transparent border-white/20 text-white hover:bg-white/10"
                        : "bg-[#862334] border-[#862334] text-white hover:bg-black"}`}
                  >
                    {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button
                    onClick={() => setCamActive(c => !c)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 border
                      ${camActive
                        ? "bg-transparent border-white/20 text-white hover:bg-white/10"
                        : "bg-[#862334] border-[#862334] text-white hover:bg-black"}`}
                  >
                    {camActive ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    onClick={() => setIsEndModalOpen(true)}
                    className="ml-2 px-6 h-12 bg-[#862334] text-white font-bold rounded-full hover:bg-black transition-all flex items-center gap-2 shadow-lg"
                  >
                    <LogOut size={18} className="rotate-180" />
                    <span className="text-xs uppercase tracking-widest hidden sm:inline">End Session</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Transcript Panel (Widened to 400px) */}
            <div className="w-[400px] flex-shrink-0 bg-[#f9f9f9] flex flex-col border-l border-[#e5e5e5] overflow-hidden">
              <div className="flex-shrink-0 px-8 pt-8 pb-4">
                <h2 className="text-xl font-[Space_Grotesk,sans-serif] font-black text-black tracking-tight">
                  Live Transcript
                </h2>
                <p className="text-[#888888] text-[11px] font-bold uppercase tracking-[0.15em] font-[Inter,sans-serif] mt-1">
                  {sessionStarted ? "Active" : "Waiting for start"}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar space-y-8 min-h-0">
                {sessionStarted && transcript.map((msg, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-black tracking-widest uppercase font-[Inter,sans-serif] ${msg.isAlvin ? "text-[#862334]" : "text-[#888888]"}`}>
                        {msg.speaker}
                      </span>
                      <span className="text-[10px] text-[#aaa] font-bold">{msg.time}</span>
                    </div>
                    <p className={`text-sm leading-relaxed font-semibold p-4 shadow-sm font-[Manrope,sans-serif]
                      ${msg.isAlvin
                        ? "bg-white rounded-2xl rounded-tl-none border-l-4 border-[#862334]"
                        : "bg-[#eee]/50 rounded-2xl rounded-tr-none border-r-4 border-[#ddd]"}`}
                    >
                      {msg.text}
                    </p>
                  </div>
                ))}

                {sessionStarted && (
                  <div className="flex items-center gap-2 px-1">
                    {[0, 0.1, 0.2].map((delay, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-[#862334] rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                    <span className="text-[10px] font-black text-[#888888] tracking-widest uppercase ml-2 font-[Inter,sans-serif]">
                      Processing response...
                    </span>
                  </div>
                )}

                {!sessionStarted && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <MessageSquare size={48} className="mb-4 text-gray-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Transcript will appear here once the session begins</p>
                  </div>
                )}
              </div>

      <EndSessionModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirm={handleConfirmEnd}
      />

      {isFinishing && <Loading />}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}