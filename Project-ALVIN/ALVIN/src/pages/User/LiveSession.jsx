import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, LogOut, Sparkles, AlertCircle, AlertTriangle } from "lucide-react";
import Logo from "/images/Alvin-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import EndSessionModal from "../../Components/EndSessionModal";
import Loading from "../../Components/Loading";

// NavTalk unified WebSocket event types (per docs.navtalk.ai)
const NavTalkMessageType = Object.freeze({
  CONNECTED_SUCCESS: "conversation.connected.success",
  CONNECTED_FAIL: "conversation.connected.fail",
  CONNECTED_CLOSE: "conversation.connected.close",
  CONNECTED_WARNING: "conversation.connected.warning",
  INSUFFICIENT_BALANCE: "conversation.connected.insufficient_balance",
  GPU_FULL: "conversation.connected.gpu_full",
  CONNECTION_LIMIT_EXCEEDED: "conversation.connected.connection_limit_exceeded",
  BACKEND_ERROR: "conversation.connected.backend_error",

  SESSION_CREATED: "realtime.session.created",
  SESSION_UPDATED: "realtime.session.updated",

  WEB_RTC_OFFER: "webrtc.signaling.offer",
  WEB_RTC_ANSWER: "webrtc.signaling.answer",
  WEB_RTC_ICE_CANDIDATE: "webrtc.signaling.iceCandidate",

  SPEECH_STARTED: "realtime.input_audio_buffer.speech_started",
  SPEECH_STOPPED: "realtime.input_audio_buffer.speech_stopped",

  RESPONSE_AUDIO_DELTA: "realtime.response.audio.delta",
  RESPONSE_AUDIO_DONE: "realtime.response.audio.done",

  INPUT_AUDIO_BUFFER_APPEND: "realtime.input_audio_buffer.append",
  INPUT_CONFIG: "realtime.input_config",
});

// Audio must be PCM16 @ 24kHz mono, base64-encoded (per NavTalk spec)
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function base64EncodeAudio(uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Backend config — the browser never sees the raw NavTalk license anymore.
// Set these in your .env (Vite): VITE_API_BASE_URL, VITE_APP_API_KEY
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";

// Fetches a short-lived NavTalk wsUrl for this session from our backend,
// instead of building the WebSocket URL from a license key in the browser.
async function fetchNavTalkWsUrl(sessionId) {
  const body = new FormData();
  body.append("session_id", sessionId);

  const response = await fetch(`${API_BASE_URL}/api/interview/navtalk-connection`, {
    method: "POST",
    headers: { "X-API-Key": APP_API_KEY },
    body,
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      detail = errJson.detail || detail;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(detail);
  }

  const data = await response.json();
  if (!data.ws_url) {
    throw new Error("Backend response missing ws_url.");
  }
  return data.ws_url;
}

export default function LiveSession() {
  const navigate = useNavigate();
  const location = useLocation();

  // Video & Audio Refs
  const navtalkVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);             // WebRTC PeerConnection (created on offer receipt)
  const wsRef = useRef(null);             // WebSocket Connection
  const silenceTimerRef = useRef(null);
  const retryCountRef = useRef(0);        // Retry tracker for gpu_full / cold-start
  const cancelledRef = useRef(false);
  const micActiveRef = useRef(true);      // mirrors micActive state, read inside audio callback
  const rtcConfigRef = useRef({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }); // overwritten by server

  // Mic capture (PCM streaming) refs
  const micAudioContextRef = useRef(null);
  const micProcessorRef = useRef(null);
  const micSourceRef = useRef(null);

  // Session Data
  const sessionData = location.state?.sessionData || null;
  const navtalkSessionId = sessionData?.session_id || "";
  const targetRole = location.state?.role || "Software Engineer";
  const candidateName = sessionData?.candidate_name || "Candidate";
  const openingQuestion = sessionData?.opening_question || location.state?.opening_question || "";
  const navtalkVoice = sessionData?.voice || "cedar";

  // States
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [connectionInitiated, setConnectionInitiated] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [avatarConnected, setAvatarConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing navtalk.Brain runtime...");
  const [disconnectedReason, setDisconnectedReason] = useState(null);
  const [showSilenceWarning, setShowSilenceWarning] = useState(false);

  useEffect(() => {
    if (!sessionData) {
      navigate("/user/resume-upload", { replace: true });
    }
  }, [sessionData, navigate]);

  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  // 5-second silence detection (now driven by server-reported speech + response events)
  const triggerAvatarWarning = useCallback(() => {
    setShowSilenceWarning(true);
  }, []);

  const startFiveSecTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setShowSilenceWarning(false);
    silenceTimerRef.current = setTimeout(() => {
      triggerAvatarWarning();
    }, 5000);
  }, [triggerAvatarWarning]);

  const clearFiveSecTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setShowSilenceWarning(false);
  }, []);

  const handleStartInterview = () => {
    if (!navtalkSessionId) {
      setDisconnectedReason("Missing interview session ID.");
      return;
    }
    cancelledRef.current = false;
    setCountdown(5);
    setConnectionInitiated(true);
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

  // Local webcam & mic preview stream — starts as soon as the button is clicked
  useEffect(() => {
    if (!connectionInitiated) return;

    let isMounted = true;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing local user media:", err));

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [connectionInitiated]);

  // Toggle Mic / Cam Tracks (local preview only — PCM streaming is separately gated by micActiveRef)
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micActive;
      });
    }
  }, [micActive]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = camActive;
      });
    }
  }, [camActive]);

  // Starts capturing mic audio as PCM16 @ 24kHz mono and streaming it over the
  // WebSocket as realtime.input_audio_buffer.append — NOT via the peer connection.
  const startAudioStreaming = useCallback(() => {
    if (!localStreamRef.current || micAudioContextRef.current) return; // already running

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(localStreamRef.current);
      const processor = audioContext.createScriptProcessor(8192, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!micActiveRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputBuffer = event.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputBuffer);
        const base64PCM = base64EncodeAudio(new Uint8Array(pcmData));

        const chunkSize = 4096;
        for (let i = 0; i < base64PCM.length; i += chunkSize) {
          const chunk = base64PCM.slice(i, i + chunkSize);
          wsRef.current.send(
            JSON.stringify({
              type: NavTalkMessageType.INPUT_AUDIO_BUFFER_APPEND,
              data: { audio: chunk },
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      micAudioContextRef.current = audioContext;
      micProcessorRef.current = processor;
      micSourceRef.current = source;
    } catch (err) {
      console.error("Error starting PCM audio streaming:", err);
    }
  }, []);

  const stopAudioStreaming = useCallback(() => {
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      micProcessorRef.current = null;
    }
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    if (micAudioContextRef.current && micAudioContextRef.current.state !== "closed") {
      micAudioContextRef.current.close();
      micAudioContextRef.current = null;
    }
  }, []);

  // Server sends the WebRTC offer first — we create the PeerConnection here,
  // set the remote description, then answer. We never create our own offer
  // in the normal flow.
  const handleOffer = useCallback(async (nav_data) => {
    try {
      const pc = new RTCPeerConnection(rtcConfigRef.current);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (navtalkVideoRef.current && event.streams[0]) {
          navtalkVideoRef.current.srcObject = event.streams[0];
        }
        setAvatarConnected(true);
        retryCountRef.current = 0;
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: NavTalkMessageType.WEB_RTC_ICE_CANDIDATE,
              data: { candidate: event.candidate },
            })
          );
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(nav_data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(
        JSON.stringify({
          type: NavTalkMessageType.WEB_RTC_ANSWER,
          data: { sdp: pc.localDescription },
        })
      );
    } catch (err) {
      console.error("Error handling WebRTC offer:", err);
      setDisconnectedReason("Failed to negotiate WebRTC media offer.");
    }
  }, []);

  const handleIceCandidate = useCallback(async (nav_data) => {
    try {
      if (nav_data?.candidate && pcRef.current && pcRef.current.signalingState !== "closed") {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(nav_data.candidate));
      }
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  }, []);

  const initNavTalkSession = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    stopAudioStreaming();

    let wsUrl;
    try {
      setStatusMessage("Requesting session token...");
      wsUrl = await fetchNavTalkWsUrl(navtalkSessionId);
    } catch (err) {
      if (cancelledRef.current) return;
      console.error("Failed to fetch NavTalk connection URL:", err);
      setDisconnectedReason(err.message || "Failed to prepare live session.");
      return;
    }

    if (cancelledRef.current) return;
    console.log("Connecting to navtalk.Brain via backend-issued session URL");

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelledRef.current) {
        ws.close();
        return;
      }
      console.log("WebSocket open. Waiting for session handshake...");
      setStatusMessage("Warming up navtalk.Brain GPU container...");

      // Configure voice + opening prompt for this session
      ws.send(
        JSON.stringify({
          type: NavTalkMessageType.INPUT_CONFIG,
          data: {
            content: JSON.stringify({
              voice: navtalkVoice,
              prompt: openingQuestion
                ? `You are conducting a live interview for the role of ${targetRole}. Start by asking: "${openingQuestion}"`
                : `You are conducting a live interview for the role of ${targetRole}.`,
            }),
          },
        })
      );
    };

    ws.onmessage = async (messageEvent) => {
      if (cancelledRef.current) return;
      if (typeof messageEvent.data !== "string") return; // ignore binary frames here

      let data;
      try {
        data = JSON.parse(messageEvent.data);
      } catch (e) {
        console.error("Error parsing WS message:", e);
        return;
      }

      const nav_data = data.data || {};

      switch (data.type) {
        case NavTalkMessageType.CONNECTED_SUCCESS:
          console.log("Connected. Session ID:", nav_data.sessionId);
          if (Array.isArray(nav_data.iceServers) && nav_data.iceServers.length > 0) {
            rtcConfigRef.current = { iceServers: nav_data.iceServers };
          }
          break;

        case NavTalkMessageType.CONNECTED_WARNING:
          console.warn("NavTalk connection warning:", data.message);
          break;

        case NavTalkMessageType.CONNECTED_FAIL:
          setDisconnectedReason(data.message || "Connection failed.");
          break;

        case NavTalkMessageType.CONNECTED_CLOSE:
          if (!cancelledRef.current && !avatarConnected) {
            setDisconnectedReason(data.message || "Connection closed.");
          }
          break;

        case NavTalkMessageType.INSUFFICIENT_BALANCE:
          setDisconnectedReason("Insufficient account balance. Please contact support.");
          break;

        case NavTalkMessageType.CONNECTION_LIMIT_EXCEEDED:
          setDisconnectedReason("Too many concurrent sessions. Please try again shortly.");
          break;

        case NavTalkMessageType.BACKEND_ERROR:
          setDisconnectedReason(data.message || "A backend error occurred.");
          break;

        case NavTalkMessageType.GPU_FULL:
          // Explicit GPU-capacity signal from the server — retry with backoff,
          // same idea as the old 4001 handling but based on the real event.
          if (retryCountRef.current < 3 && !cancelledRef.current) {
            retryCountRef.current += 1;
            setStatusMessage(`GPU capacity full. Retrying in 10s (${retryCountRef.current}/3)...`);
            setTimeout(() => {
              if (!cancelledRef.current) initNavTalkSession();
            }, 10000);
          } else {
            setDisconnectedReason("navtalk.Brain is at capacity. Please try again in a few minutes.");
          }
          break;

        case NavTalkMessageType.SESSION_CREATED:
          console.log("Session created.");
          // No conversation history to replay for a fresh interview session.
          break;

        case NavTalkMessageType.SESSION_UPDATED:
          console.log("Session ready — starting audio stream.");
          setStatusMessage("Connecting video stream...");
          startAudioStreaming();
          break;

        case NavTalkMessageType.SPEECH_STARTED:
          clearFiveSecTimer(); // candidate is speaking
          break;

        case NavTalkMessageType.RESPONSE_AUDIO_DELTA:
          clearFiveSecTimer(); // avatar is actively speaking
          break;

        case NavTalkMessageType.RESPONSE_AUDIO_DONE:
          startFiveSecTimer(); // avatar finished — wait for candidate response
          break;

        case NavTalkMessageType.WEB_RTC_OFFER:
          await handleOffer(nav_data);
          break;

        case NavTalkMessageType.WEB_RTC_ICE_CANDIDATE:
          await handleIceCandidate(nav_data);
          break;

        default:
          break;
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    ws.onclose = (event) => {
      console.warn(`WebSocket Closed — Code: ${event.code}, Reason: "${event.reason}"`);
      // Fallback net for close codes not covered by an explicit message type above.
      if (!cancelledRef.current && !avatarConnected && !disconnectedReason) {
        setDisconnectedReason(`Session disconnected (Code ${event.code}). ${event.reason || ""}`.trim());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    navtalkSessionId,
    navtalkVoice,
    openingQuestion,
    targetRole,
    handleOffer,
    handleIceCandidate,
    startAudioStreaming,
    stopAudioStreaming,
    clearFiveSecTimer,
    startFiveSecTimer,
  ]);

  useEffect(() => {
    if (!connectionInitiated) return;

    initNavTalkSession();

    return () => {
      cancelledRef.current = true;
      clearFiveSecTimer();
      stopAudioStreaming();

      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [connectionInitiated, initNavTalkSession, clearFiveSecTimer, stopAudioStreaming]);

  const handleConfirmEnd = () => {
    clearFiveSecTimer();
    stopAudioStreaming();
    setIsEndModalOpen(false);
    setIsFinishing(true);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "User ended session");
      wsRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setTimeout(() => {
      navigate("/user/interview-results", {
        state: { candidateName, targetRole },
      });
    }, 2000);
  };

  if (isFinishing) {
    return <Loading message="Finalizing interview evaluation with Gemini AI..." />;
  }

  return (
    <>
      <div className="h-screen w-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">
        <div className="mx-auto flex flex-col w-full h-full overflow-hidden">
          <header className="flex-shrink-0 h-[70px] bg-white flex justify-between items-center px-8 border-b border-[#e5e5e5] z-40">
            <div className="hidden md:flex items-center gap-3 text-sm font-[Inter,sans-serif]">
              <img src={Logo} alt="Alvin logo" className="w-[55px] mb-[-10px]" />
              <span className="text-[#862334] font-bold pt-2">Live NavTalk WebRTC • {targetRole}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  avatarConnected ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    avatarConnected ? "bg-green-500 animate-pulse" : "bg-amber-500"
                  }`}
                ></span>
                {avatarConnected ? "navtalk.Brain Connected" : "Initializing navtalk.Brain..."}
              </span>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            {disconnectedReason && (
              <div className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                  <AlertCircle className="w-16 h-16 text-[#862334] mx-auto mb-4" />
                  <h3 className="text-xl font-black text-black uppercase mb-2">Session Ended</h3>
                  <p className="text-sm text-gray-600 mb-6">{disconnectedReason}</p>
                  <button
                    onClick={handleConfirmEnd}
                    className="w-full py-3 bg-[#862334] text-white font-bold uppercase rounded-xl hover:bg-black transition-all"
                  >
                    View Interview Results
                  </button>
                </div>
              </div>
            )}

            {!sessionStarted && (
              <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-4xl w-full px-4">
                  {countdown === null ? (
                    <>
                      <h2 className="text-4xl sm:text-5xl font-black text-[#862334] mb-6 uppercase">
                        Ready to Begin?
                      </h2>
                      <button
                        onClick={handleStartInterview}
                        className="px-8 py-4 bg-[#862334] text-white font-black uppercase rounded-xl hover:bg-black transition-all"
                      >
                        Start Video Interview
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-xl font-black text-gray-400 uppercase">Interview starts in</h2>
                      <div className="text-9xl font-black text-[#862334] animate-pulse">{countdown}</div>
                      {!avatarConnected && (
                        <p className="text-xs text-gray-400 uppercase font-semibold">{statusMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-5 p-6 max-w-5xl mx-auto w-full min-w-0 overflow-hidden">
              <div className="flex-[3] relative rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
                {sessionStarted && showSilenceWarning && !disconnectedReason && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                    <AlertTriangle size={20} className="flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      No response detected — Please speak your answer!
                    </span>
                  </div>
                )}

                <div className={`relative w-full h-full ${!sessionStarted ? "hidden" : "block"}`}>
                  <video
                    ref={navtalkVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  {!avatarConnected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white">
                      <Sparkles className="w-12 h-12 animate-spin text-[#862334] mb-3" />
                      <p className="text-xs uppercase text-slate-300 font-bold">{statusMessage}</p>
                    </div>
                  )}
                </div>

                {sessionStarted && (
                  <div className="absolute top-6 left-6 w-56 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-30 bg-slate-900">
                    {camActive ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
                        <VideoOff className="text-white/20 text-3xl" />
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white">
                      {candidateName} (You)
                    </span>
                  </div>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111827]/90 px-5 py-3 rounded-full border border-white/10 shadow-2xl">
                  <button
                    onClick={() => setMicActive((m) => !m)}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                      micActive ? "border-white/20 text-white" : "bg-[#862334] border-[#862334] text-white"
                    }`}
                  >
                    {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button
                    onClick={() => setCamActive((c) => !c)}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                      camActive ? "border-white/20 text-white" : "bg-[#862334] border-[#862334] text-white"
                    }`}
                  >
                    {camActive ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    onClick={() => setIsEndModalOpen(true)}
                    className="ml-2 px-6 h-12 bg-[#862334] text-white font-bold rounded-full hover:bg-black flex items-center gap-2 shadow-lg"
                  >
                    <LogOut size={18} className="rotate-180" />
                    <span className="text-xs uppercase hidden sm:inline">End Session</span>
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