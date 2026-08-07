import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, LogOut, Sparkles, AlertCircle } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import EndSessionModal from "../../Components/EndSessionModal";
import Loading from "../../Components/Loading";

export default function LiveSession() {
  const navigate = useNavigate();
  const location = useLocation();

  // Video Refs
  const tavusVideoRef = useRef(null);
  const tavusAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const dailyCallRef = useRef(null);

  // Data passed from setup flow
  const sessionData = location.state?.sessionData || null;
  const conversationUrl = sessionData?.conversation_url || sessionData?.data?.conversation_url || null;
  const conversationId = sessionData?.conversation_id || sessionData?.data?.conversation_id || null;
  const targetRole = location.state?.role || "Software Engineer";
  const candidateName = sessionData?.candidate_name || "Candidate";

  // States
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [avatarConnected, setAvatarConnected] = useState(false);

  // Countdown controller
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

  // Join Tavus WebRTC Room natively via Daily JS SDK
  useEffect(() => {
    if (!sessionStarted || !conversationUrl) return;

    // Create Daily Call Object (Headless WebRTC mode)
    const call = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: true,
    });

    dailyCallRef.current = call;

    // Listen for incoming media tracks from Tavus AI Avatar
    call.on("track-started", (event) => {
      if (event.participant && !event.participant.local) {
        setAvatarConnected(true);

        // Attach Tavus Video Stream
        if (event.track.kind === "video" && tavusVideoRef.current) {
          tavusVideoRef.current.srcObject = new MediaStream([event.track]);
        }
        // Attach Tavus Audio Stream
        if (event.track.kind === "audio" && tavusAudioRef.current) {
          tavusAudioRef.current.srcObject = new MediaStream([event.track]);
        }
      }

      // Render local candidate stream in PiP
      if (event.participant?.local && event.track.kind === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([event.track]);
      }
    });

    // Handle Call Ended
    call.on("left-meeting", () => {
      handleConfirmEnd();
    });

    // Join room
    call.join({ url: conversationUrl }).catch((err) => {
      console.error("Error joining Tavus WebRTC call:", err);
    });

    return () => {
      if (dailyCallRef.current) {
        dailyCallRef.current.leave();
        dailyCallRef.current.destroy();
      }
    };
  }, [sessionStarted, conversationUrl]);

  // Toggle Mute/Unmute
  useEffect(() => {
    if (dailyCallRef.current) {
      dailyCallRef.current.setLocalAudio(micActive);
    }
  }, [micActive]);

  // Toggle Video On/Off
  useEffect(() => {
    if (dailyCallRef.current) {
      dailyCallRef.current.setLocalVideo(camActive);
    }
  }, [camActive]);

  const handleConfirmEnd = () => {
    setIsEndModalOpen(false);
    setIsFinishing(true);

    if (dailyCallRef.current) {
      dailyCallRef.current.leave();
    }

    setTimeout(() => {
      navigate('/user/interview-results', {
        state: {
          conversationId: conversationId,
          candidateName: candidateName,
          targetRole: targetRole
        }
      });
    }, 2000);
  };

  if (isFinishing) {
    return <Loading message="Finalizing interview evaluation with Gemini AI..." />;
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <style>{`
        html, body, #root { height: 100%; overflow: hidden; margin: 0; width: 100%; }
      `}</style>

      {/* Hidden Audio Tag for Tavus Avatar Voice */}
      <audio ref={tavusAudioRef} autoPlay />

      <div className="h-screen w-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">
        <div className="mx-auto flex flex-col w-full h-full overflow-hidden">

          {/* Header */}
          <header className="flex-shrink-0 h-[70px] bg-white flex justify-between items-center px-8 border-b border-[#e5e5e5] z-40">
            <div className="hidden md:flex items-center gap-3 text-sm font-[Inter,sans-serif]">
              <img src={Logo} alt="Alvin logo" className="w-[55px] mb-[-10px]" />
              <span className="text-[#862334] font-bold pt-2">Live Tavus Native WebRTC • {targetRole}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Direct WebRTC Connected
              </span>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            
            {/* Start / Countdown Overlay */}
            {!sessionStarted && (
              <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-4xl w-full px-4">
                  {countdown === null ? (
                    <>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-Geist text-[#862334] mb-6 uppercase tracking-tighter">
                        Ready to Begin?
                      </h2>
                      <p className="text-gray-500 font-Inter text-base mb-12 leading-relaxed max-w-xl mx-auto">
                        You are about to enter a live video interview with <strong>ALVIN</strong>. Make sure your camera and microphone are turned on.
                      </p>
                      <button
                        onClick={handleStartInterview}
                        className="px-8 py-4 bg-[#862334] text-white font-black font-Geist uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all shadow-xl"
                      >
                        Start Video Interview
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-xl font-black font-Geist text-gray-400 uppercase tracking-widest">
                        Interview starts in
                      </h2>
                      <div className="text-9xl font-black font-Geist text-[#862334] leading-none animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Stage */}
            <div className="flex-1 flex flex-col gap-5 p-6 min-w-0 overflow-hidden">
              <div className="flex-[3] relative rounded-2xl overflow-hidden bg-slate-950 shadow-2xl min-h-0 border border-slate-800">
                
                {/* 1. Tavus Native Avatar Video Element */}
                {sessionStarted && conversationUrl ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={tavusVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    {!avatarConnected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white">
                        <Sparkles className="w-12 h-12 animate-spin text-[#862334] mb-3" />
                        <p className="text-xs uppercase tracking-widest text-slate-400">Connecting to Tavus AI Avatar Stream...</p>
                      </div>
                    )}
                  </div>
                ) : sessionStarted && !conversationUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-white mb-2 uppercase">Missing Conversation Link</h3>
                    <button
                      onClick={() => navigate('/user/setup')}
                      className="px-6 py-2.5 bg-[#862334] text-white text-xs font-bold uppercase rounded-lg hover:bg-black"
                    >
                      Return to Setup
                    </button>
                  </div>
                ) : null}

                {/* 2. Candidate PiP Video Overlay */}
                {sessionStarted && (
                  <div className="absolute top-6 left-6 w-56 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-30 bg-slate-900">
                    {camActive ? (
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
                        <VideoOff className="text-white/20 text-3xl" />
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-medium">
                      {candidateName} (You)
                    </span>
                  </div>
                )}

                {/* 3. Action Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111827]/90 backdrop-blur-xl px-5 py-3 rounded-full border border-white/10 shadow-2xl">
                  <button
                    onClick={() => setMicActive(m => !m)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border ${micActive ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-[#862334] border-[#862334] text-white"}`}
                  >
                    {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button
                    onClick={() => setCamActive(c => !c)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border ${camActive ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-[#862334] border-[#862334] text-white"}`}
                  >
                    {camActive ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    onClick={() => setIsEndModalOpen(true)}
                    className="ml-2 px-6 h-12 bg-[#862334] text-white font-bold rounded-full hover:bg-black flex items-center gap-2 shadow-lg"
                  >
                    <LogOut size={18} className="rotate-180" />
                    <span className="text-xs uppercase tracking-widest hidden sm:inline">End Session</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {isEndModalOpen && (
        <EndSessionModal
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onConfirm={handleConfirmEnd}
        />
      )}
    </>
  );
}