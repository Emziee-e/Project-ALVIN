import { useState, useEffect, useRef } from "react";
import { MonitorCheck, Mic, VideoOff, ChevronRight, Lightbulb, Camera, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';

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
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({ video: "", audio: "" });



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

      <div className="flex min-h-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">

        {/* Main (no sidebar) */}
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-6 md:px-16 py-3 border-b border-[#e5e5e5]">
            <div className="flex items-center">
              <Link to="/user/dashboard" className="flex items-center">
                <img src={Logo} alt="Alvin logo" className="h-12 mb-[-8px]" />
                <div className="text-maroon text-[1.5rem] font-Geist tracking-[-0.05em] uppercase hidden sm:block">
                  LVIN
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Pre-Flight Lobby Content ── */}
          <div className="flex-1 overflow-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 w-full flex items-center">
            <div className="max-w-[1200px] mx-auto w-full">



              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* ── Left: Webcam & Indicators ── */}
                <div className="lg:col-span-7 space-y-8">

                  {/* Webcam Preview */}
                  <div className="relative h-72 md:h-96 bg-black rounded-lg overflow-hidden shadow-2xl">
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

                  {/* Buttons */}
                    <div className="space-y-3">
                      {!permissionsGranted && (
                      <button
                        onClick={requestPermissions}
                        className="w-full bg-[#862334] text-white font-Geist font-bold py-3 px-6 flex items-center justify-center gap-3 transition-all hover:bg-[#ffb003] active:scale-[0.98] uppercase tracking-wider"
                      >
                        <KeyRound size={18} />
                        ALLOW CAMERA &amp; MIC ACCESS
                      </button>
                    )}

                    <button
                      onClick={() => navigate('/user/live-session')}
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

        {/* Decorative glow */}
        <div className="fixed bottom-0 right-0 w-1/3 h-1/2 -z-10 pointer-events-none overflow-hidden opacity-5">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#862334] rounded-full blur-[100px]" />
          <div className="absolute top-0 right-20 w-64 h-64 bg-[#e9c400] rounded-full blur-[80px]" />
        </div>

      </div>
    </>
  );
}