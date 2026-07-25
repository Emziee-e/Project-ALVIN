import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Smartphone, LogOut, MessageSquare, Send } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import EndSessionModal from "../../Components/EndSessionModal";
import Loading from "../../Components/Loading";

export default function LiveSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Data passed from setup flow
  const sessionData = location.state?.sessionData || null;
  const targetRole = location.state?.role || "Software Engineer";
  const candidateName = sessionData?.candidate_name || "Candidate";

  // Dynamic States
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, transcript]);

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

  // ── 1. ALVIN Opening Statement ──
  useEffect(() => {
    if (sessionStarted && messages.length === 0) {
      const openingQuestion = sessionData?.opening_question 
        || "To start off, could you briefly introduce yourself and highlight your relevant experience?";

      const openingMsg = {
        speaker: "ALVIN",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Hello ${candidateName}! Welcome to your mock interview session for the ${targetRole} position. I've thoroughly reviewed your resume, and I'm excited to get to know you better. ${openingQuestion}`,
        isAlvin: true,
      };

      setMessages([openingMsg]);
    }
  }, [sessionStarted]);

  // ── 2. Speech-to-Text (Mic Listener Setup) ──
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser. Switch to Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // Control Mic Listening based on micActive state & session state
  useEffect(() => {
    if (sessionStarted && micActive && !isProcessing && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        // Recognition already running or starting
      }
    } else if ((!micActive || isProcessing) && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [sessionStarted, micActive, isProcessing]);

  // ── 3. Send Candidate Answer to Gemini Chat Endpoint ──
  const handleSendSpokenResponse = async (spokenText) => {
    const textToSend = spokenText || transcript;
    if (!textToSend.trim()) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    const userMsg = {
      speaker: candidateName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend.trim(),
      isAlvin: false,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setTranscript("");
    setIsProcessing(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          history: updatedHistory.map(m => ({ speaker: m.speaker, text: m.text }))
        }),
      });

      if (!response.ok) throw new Error("Failed to get response from ALVIN");

      const data = await response.json();

      const alvinReply = {
        speaker: "ALVIN",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.response,
        isAlvin: true,
      };

      setMessages(prev => [...prev, alvinReply]);
    } catch (err) {
      console.error("Chat API error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera Management
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    if (camActive) {
      startCamera();
    } else if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [camActive]);

  const handleConfirmEnd = () => {
    setIsEndModalOpen(false);
    setIsFinishing(true);
    setCamActive(false);
    setMicActive(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setTimeout(() => {
      navigate('/user/interview-results');
    }, 2000);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f3f3f3; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #862334; border-radius: 10px; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; width: 100%; }
      `}</style>

      <div className="h-screen w-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">
        <div className="mx-auto flex flex-col w-full h-full overflow-hidden">

          {/* Header */}
          <header className="flex-shrink-0 h-[70px] bg-white flex justify-between items-center px-8 border-b border-[#e5e5e5] z-40">
            <div className="hidden md:flex items-center gap-3 text-sm font-[Inter,sans-serif] opacity-100">
              <img src={Logo} alt="Alvin logo" className="w-[55px] mb-[-10px]" />
              <span className="text-[#862334] font-bold pt-2">Live Session • {targetRole}</span>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            
            {/* Start / Countdown Overlay */}
            {!sessionStarted && (
              <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-4xl w-full px-4">
                  {countdown === null ? (
                    <>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-Geist text-[#862334] mb-6 uppercase tracking-tighter text-center">
                        Ready to Begin?
                      </h2>
                      <p className="text-gray-500 font-Inter text-base mb-12 leading-relaxed max-w-xl mx-auto text-center">
                        ALVIN will greet you with an opening statement before starting the interview questions. Speak clearly into your microphone when answering.
                      </p>
                      <div className="max-w-xs mx-auto">
                        <button
                          onClick={handleStartInterview}
                          className="w-full py-4 bg-[#862334] text-white font-black font-Geist uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all cursor-pointer"
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

            {/* Main Stage */}
            <div className="flex-1 flex flex-col gap-5 p-6 min-w-0 overflow-hidden">
              <div className="flex-[3] relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl min-h-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white/20 text-center">
                    <Smartphone className="w-[100px] h-[100px] mx-auto animate-pulse text-[#862334]" />
                    <p className="font-[Space_Grotesk,sans-serif] text-xs uppercase tracking-[0.2em] mt-4 text-white/50">ALVIN AI Interactive Voice</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-3 px-6 py-2.5 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl">
                    <span className={`w-2.5 h-2.5 rounded-full ${sessionStarted ? (isProcessing ? 'bg-amber-500 animate-ping' : isListening ? 'bg-green-500 animate-pulse' : 'bg-[#862334]') : 'bg-gray-300'}`} />
                    <span className="text-[#862334] text-xs font-black tracking-widest uppercase font-[Inter,sans-serif]">
                      {!sessionStarted ? "Session Paused" : isProcessing ? "ALVIN is thinking..." : isListening ? "Listening to you..." : "Mic Paused"}
                    </span>
                  </div>
                </div>

                {/* Candidate Video */}
                <div className="absolute top-8 left-8 w-64 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-slate-800 backdrop-blur-md">
                  {camActive ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                      <VideoOff className="text-white/20 text-4xl" />
                    </div>
                  )}
                </div>

                {/* Spoken Live Speech Overlay */}
                {transcript && (
                  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 max-w-xl w-full px-6 py-3 bg-black/80 backdrop-blur-md rounded-xl text-white text-sm text-center border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-green-400 block mb-1 tracking-widest">Live Voice Capture</span>
                    "{transcript}"
                  </div>
                )}

                {/* Action Controls */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#202124]/90 backdrop-blur-xl px-5 py-3 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  <button
                    onClick={() => setMicActive(m => !m)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 border cursor-pointer ${micActive ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-[#862334] border-[#862334] text-white"}`}
                  >
                    {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button
                    onClick={() => setCamActive(c => !c)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 border cursor-pointer ${camActive ? "bg-transparent border-white/20 text-white hover:bg-white/10" : "bg-[#862334] border-[#862334] text-white"}`}
                  >
                    {camActive ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  {/* Manual Send Answer button for speech */}
                  {sessionStarted && (
                    <button
                      onClick={() => handleSendSpokenResponse(transcript)}
                      disabled={!transcript.trim() || isProcessing}
                      className="px-5 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      <Send size={16} />
                      <span>Submit Answer</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsEndModalOpen(true)}
                    className="ml-2 px-6 h-12 bg-[#862334] text-white font-bold rounded-full hover:bg-black transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <LogOut size={18} className="rotate-180" />
                    <span className="text-xs uppercase tracking-widest hidden sm:inline">End Session</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript Drawer */}
            <div className="w-[400px] flex-shrink-0 bg-[#f9f9f9] flex flex-col border-l border-[#e5e5e5] overflow-hidden">
              <div className="flex-shrink-0 px-8 pt-8 pb-4">
                <h2 className="text-xl font-[Space_Grotesk,sans-serif] font-black text-black tracking-tight">
                  Live Transcript
                </h2>
                <p className="text-[#888888] text-[11px] font-bold uppercase tracking-[0.15em] font-[Inter,sans-serif] mt-1">
                  {sessionStarted ? "Active Session" : "Waiting for start"}
                </p>
              </div>

              {/* Dynamic Transcript Messages */}
              <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar space-y-6 min-h-0">
                {sessionStarted && messages.map((msg, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-black tracking-widest uppercase font-[Inter,sans-serif] ${msg.isAlvin ? "text-[#862334]" : "text-emerald-700"}`}>
                        {msg.speaker}
                      </span>
                      <span className="text-[10px] text-[#aaa] font-bold">{msg.time}</span>
                    </div>
                    <p className={`text-sm leading-relaxed font-semibold p-4 shadow-sm font-[Manrope,sans-serif]
                      ${msg.isAlvin
                        ? "bg-white rounded-2xl rounded-tl-none border-l-4 border-[#862334]"
                        : "bg-emerald-50 rounded-2xl rounded-tr-none border-r-4 border-emerald-500 text-slate-800"}`}
                    >
                      {msg.text}
                    </p>
                  </div>
                ))}

                {/* Gemini Processing State */}
                {isProcessing && (
                  <div className="flex items-center gap-2 px-1 py-2">
                    {[0, 0.1, 0.2].map((delay, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-[#862334] rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                    <span className="text-[10px] font-black text-[#888888] tracking-widest uppercase ml-2 font-[Inter,sans-serif]">
                      ALVIN is analyzing response...
                    </span>
                  </div>
                )}

                {/* Empty State */}
                {!sessionStarted && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <MessageSquare size={48} className="mb-4 text-gray-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Transcript will appear here once the session begins</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
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