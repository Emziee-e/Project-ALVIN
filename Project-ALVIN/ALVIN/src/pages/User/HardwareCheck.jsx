import { useState, useEffect, useRef } from "react";
import { Mic, VideoOff, Lightbulb, Camera, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SignOutModal from '../../Components/SignOutModal';
import { supabase } from '../../lib/supabaseClient';

export default function HardwareCheck() {
  const navigate = useNavigate();
  const location = useLocation();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const videoStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({ video: "", audio: "" });
  
  // FIXED: State for avatarUrl added here
  const [avatarUrl, setAvatarUrl] = useState(null);

  // FIXED: Fetch avatar from Supabase user metadata on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Checks user metadata first (Google OAuth/Supabase Auth), or defaults to null
          const url = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          setAvatarUrl(url);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, []);

  // Preserved session check validation
  useEffect(() => {
    if (!location.state?.sessionData) {
      console.warn("No session data found in HardwareCheck. Redirecting to setup.");
      navigate('/user/resume-upload', { replace: true });
    }
  }, [location.state, navigate]);

  // Preserved user authentication & sign out handling
  const handleSignOut = async () => {
    stopAllTracks();
    await supabase.auth.signOut();
    navigate('/');
  };

  // Preserved media track cleanup handlers
  const stopVideoStream = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
  };

  const stopAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const stopAllTracks = () => {
    stopVideoStream();
    stopAudioStream();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Preserved camera start logic
  const startPreview = async (videoDeviceId) => {
    stopVideoStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: false
      });
      videoStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting video preview:", err);
    }
  };

  // Preserved device enumeration logic
  const getDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      const audioDevices = allDevices.filter(d => d.kind === 'audioinput');

      setDevices({ video: videoDevices, audio: audioDevices });

      setSelectedDevices(prev => ({
        video: prev.video || (videoDevices[0]?.deviceId ?? ""),
        audio: prev.audio || (audioDevices[0]?.deviceId ?? "")
      }));
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  // Preserved permissions logic
  const requestPermissions = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      tempStream.getTracks().forEach(track => track.stop());
      setPermissionsGranted(true);
    } catch (err) {
      console.error("Permission denied:", err);
      setPermissionsGranted(false);
    }
  };

  // Preserved microphone test logic
  const startMicTest = async (audioDeviceId) => {
    stopAudioStream();

    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
      });
      audioStreamRef.current = stream;

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

  useEffect(() => {
    if (permissionsGranted) {
      getDevices();
    }
    return () => {
      stopAllTracks();
    };
  }, [permissionsGranted]);

  useEffect(() => {
    if (permissionsGranted && selectedDevices.video) {
      startPreview(selectedDevices.video);
    }
  }, [selectedDevices.video, permissionsGranted]);

  useEffect(() => {
    if (permissionsGranted && selectedDevices.audio) {
      startMicTest(selectedDevices.audio);
    }
  }, [selectedDevices.audio, permissionsGranted]);

  // Preserved interview navigation & payload state delivery
  const handleProceedToInterview = () => {
    stopAllTracks();
    
    navigate('/user/live-session', { 
      state: { 
        ...location.state,
        selectedDevices 
      } 
    });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <style>{`
        .mic-indicator-active {
          width: 60% !important;
        }
        .mirror-mode {
          transform: scaleX(-1);
        }
      `}</style>

      <div className="flex min-h-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">

        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* Main Section */}
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-8 md:px-24 py-4 border-b border-[#e5e5e5]">
            <div className="flex items-center">
              <Link to="/user/dashboard" className="inline-flex items-center gap-0">
                <img src={Logo} alt="Alvin logo" className="h-9 w-auto flex-shrink-0 block" />
                  <div className="hidden sm:flex h-9 items-center text-[#862334] font-Geist text-[2rem] leading-none tracking-[-0.05em] uppercase whitespace-nowrap">
                    LVIN
                  </div>
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {avatarUrl ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                  VN
                </div>
              )}
            </div>
          </header>

          {/* Pre-Flight Lobby Content */}
          <div className="flex-1 overflow-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 w-full flex items-center">
            <div className="max-w-[1200px] mx-auto w-full">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* Left: Webcam & Waveform */}
                <div className="lg:col-span-7 space-y-8">

                  {/* Webcam Preview */}
                  <div className="relative h-72 md:h-96 bg-black rounded-lg overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-slate-900" />

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover mirror-mode transition-opacity duration-500 ${permissionsGranted ? "opacity-100" : "opacity-0"}`}
                    />

                    {!permissionsGranted && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                        <VideoOff size={40} className="mb-4" />
                        <p className="font-Geist font-bold uppercase tracking-widest text-sm">
                          Waiting for Permissions
                        </p>
                      </div>
                    )}

                    {permissionsGranted && (
                      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest font-Inter">Live Preview</span>
                      </div>
                    )}

                    {permissionsGranted && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[95%] h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center px-6 border border-white/10 shadow-lg">
                        <canvas
                          ref={canvasRef}
                          width={480}
                          height={60}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Environment Warning */}
                  <div className="bg-[#8e0f28]/10 p-4 flex gap-4 items-start border-l-4 border-[#ff989d]">
                    <Lightbulb size={24} className="text-[#ff989d] flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#8e0f28] font-Geist">Camera &amp; Lighting Check</h4>
                      <p className="text-slate-700 text-sm font-Inter">
                        Position your camera to show your face and chest, and ensure good lighting.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Device Dropdowns & Action CTAs */}
                <div className="lg:col-span-5 space-y-10">

                  <section className="space-y-6">
                    <h3 className="text-maroon text-xl font-bold font-Geist uppercase tracking-tight flex items-center gap-3">
                      Hardware Check
                    </h3>

                    <div className="space-y-4">
                      {/* Video Source */}
                      <div className="p-4 bg-slate-50 rounded-lg flex flex-col gap-4 border-b border-slate-200">
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
                      <div className="p-4 bg-slate-50 rounded-lg flex flex-col gap-4 border-b border-slate-200">
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

                  {/* Action Controls */}
                  <div className="space-y-3">
                    {!permissionsGranted && (
                      <button
                        onClick={requestPermissions}
                        className="w-full bg-[#862334] text-white font-Geist font-bold py-3 px-6 flex items-center justify-center gap-3 transition-all hover:bg-[#ffb003] active:scale-[0.98] uppercase tracking-wider cursor-pointer"
                      >
                        <KeyRound size={18} />
                        ALLOW CAMERA &amp; MIC ACCESS
                      </button>
                    )}

                    <button
                      onClick={handleProceedToInterview}
                      disabled={!permissionsGranted}
                      className={`w-full font-Geist font-black py-3 px-6 uppercase tracking-widest text-base border transition-all
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

        {/* Decorative background glow */}
        <div className="fixed bottom-0 right-0 w-1/3 h-1/2 -z-10 pointer-events-none overflow-hidden opacity-5">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#862334] rounded-full blur-[100px]" />
          <div className="absolute top-0 right-20 w-64 h-64 bg-[#e9c400] rounded-full blur-[80px]" />
        </div>

      </div>
    </>
  );
}