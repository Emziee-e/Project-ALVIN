import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import Logo from "/images/Alvin-logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import EndSessionModal from "../../Components/EndSessionModal";
import Loading from "../../Components/Loading";

const NavTalkMessageType = Object.freeze({
  CONNECTED_SUCCESS: "conversation.connected.success",
  CONNECTED_FAIL: "conversation.connected.fail",
  CONNECTED_CLOSE: "conversation.connected.close",
  CONNECTED_WARNING: "conversation.connected.warning",
  INSUFFICIENT_BALANCE: "conversation.connected.insufficient_balance",
  GPU_FULL: "conversation.connected.gpu_full",
  CONNECTION_LIMIT_EXCEEDED:
    "conversation.connected.connection_limit_exceeded",
  BACKEND_ERROR: "conversation.connected.backend_error",

  SESSION_CREATED: "realtime.session.created",
  SESSION_UPDATED: "realtime.session.updated",
  INPUT_CONFIG: "realtime.input_config",
  REALTIME_STATUS: "realtime.status",

  WEB_RTC_OFFER: "webrtc.signaling.offer",
  WEB_RTC_ANSWER: "webrtc.signaling.answer",
  WEB_RTC_ICE_CANDIDATE: "webrtc.signaling.iceCandidate",

  SPEECH_STARTED: "realtime.input_audio_buffer.speech_started",
  SPEECH_STOPPED: "realtime.input_audio_buffer.speech_stopped",
  INPUT_AUDIO_TRANSCRIPTION_COMPLETED:
    "realtime.conversation.item.input_audio_transcription.completed",

  RESPONSE_AUDIO_DELTA: "realtime.response.audio.delta",
  RESPONSE_AUDIO_TRANSCRIPT_DELTA: "realtime.response.audio_transcript.delta",
  RESPONSE_AUDIO_DONE: "realtime.response.audio.done",

  INPUT_AUDIO_BUFFER_APPEND: "realtime.input_audio_buffer.append",
});

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));

    view.setInt16(
      i * 2,
      s < 0 ? s * 0x8000 : s * 0x7fff,
      true
    );
  }

  return buffer;
}

function base64EncodeAudio(uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function fetchNavTalkWsUrl(sessionId) {
  const body = new FormData();
  body.append("session_id", sessionId);

  const response = await fetch(
    `${API_BASE_URL}/api/interview/navtalk-connection`,
    {
      method: "POST",
      headers: {
        "X-API-Key": APP_API_KEY,
      },
      body,
    }
  );

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;

    try {
      const errorJson = await response.json();
      detail = errorJson.detail || detail;
    } catch {
      // Ignore invalid error JSON.
    }

    throw new Error(detail);
  }

  const data = await response.json();

  if (!data.ws_url) {
    throw new Error("Backend response missing ws_url.");
  }

  return data.ws_url;
}

async function postBackend(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": APP_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;

    try {
      const errorJson = await response.json();
      detail = errorJson.detail || detail;
    } catch {
      // Ignore invalid error JSON.
    }

    throw new Error(detail);
  }

  return response.json();
}

function extractText(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    return (
      value.text ||
      value.transcript ||
      value.content ||
      value.message ||
      value.value ||
      ""
    )
      .toString()
      .trim();
  }

  return "";
}

function extractCandidateText(data) {
  const candidates = [
    data?.data?.transcript,
    data?.data?.text,
    data?.data?.content,
    data?.data?.input?.transcript,
    data?.data?.audio?.transcript,
    data?.transcript,
    data?.text,
    data?.content,
  ];

  for (const candidate of candidates) {
    const text = extractText(candidate);

    if (text) {
      return text;
    }
  }

  return "";
}


function extractNavTalkSessionId(message) {
  const candidates = [
    message?.session_id,
    message?.sessionId,
    message?.roomId,
    message?.room_id,
    message?.data?.session_id,
    message?.data?.sessionId,
    message?.data?.roomId,
    message?.data?.room_id,
    message?.data?.session?.id,
    message?.data?.session?.session_id,
  ];

  for (const value of candidates) {
    if (value) return String(value);
  }

  return "";
}

// --- SDP normalization -----------------------------------------------------
// The RTCPeerConnection SDP parser (Chrome/Firefox/Safari) is strict about
// line endings: every line MUST end with CRLF ("\r\n"). SDP that has passed
// through JSON re-serialization on a backend, a proxy, or a logging layer
// often gets its line endings collapsed to bare "\n" or, in some cases, has
// lines concatenated together entirely. That produces errors like:
//   "Failed to parse SessionDescription. a=setup:actpass Invalid SDP line."
// where the parser reads one attribute line and then finds the next line's
// content still attached to it because no proper CRLF separated them.
//
// This normalizer is defensive: it splits on any line-ending variant,
// drops empty lines that can appear from bad joins, and rejoins with a
// strict CRLF plus a trailing CRLF (required at the end of an SDP body).
function normalizeSdp(sdp) {
  if (typeof sdp !== "string") return sdp;

  return sdp
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\r\n")
    .concat("\r\n");
}
// ----------------------------------------------------------------------------

function extractSDP(data) {
  const candidates = [
    data?.data?.sdp,
    data?.data?.offer?.sdp,
    data?.data?.answer?.sdp,
    data?.sdp,
    data?.offer?.sdp,
    data?.answer?.sdp,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return normalizeSdp(candidate.trim());
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      typeof candidate.sdp === "string" &&
      candidate.sdp.trim()
    ) {
      return normalizeSdp(candidate.sdp.trim());
    }
  }

  return "";
}

function extractIceCandidate(data) {
  const candidates = [
    data?.data?.candidate,
    data?.candidate,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === "string") {
      return {
        candidate,
      };
    }

    if (typeof candidate === "object") {
      return candidate;
    }
  }

  return null;
}

export default function LiveSession() {
  const navigate = useNavigate();
  const location = useLocation();

  const sessionData = location.state?.sessionData || null;

  const navtalkSessionId = sessionData?.session_id || "";

  const targetRole =
    location.state?.role ||
    sessionData?.role ||
    "Software Engineer";

  const candidateName =
    sessionData?.candidate_name ||
    "Candidate";

  const openingMessage =
    sessionData?.opening_message ||
    location.state?.opening_message ||
    "";

  const openingQuestion =
    sessionData?.opening_question ||
    location.state?.opening_question ||
    "";

  const navtalkVoice =
    sessionData?.voice ||
    "cedar";

  const navtalkVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  const localStreamRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const navtalkSessionIdRef = useRef("");
  const mqttModeRegisteredRef = useRef(false);
  const backendSyncTimerRef = useRef(null);

  const silenceTimerRef = useRef(null);
  const pendingSilenceStartTimeoutRef = useRef(null);
  const responseTranscriptLengthRef = useRef(0);
  const responseTranscriptTextRef = useRef("");
  const avatarSpeakingGateRef = useRef(false);
  const avatarGateFailsafeTimeoutRef = useRef(null);

  const retryCountRef = useRef(0);

  const cancelledRef = useRef(false);

  const micActiveRef = useRef(true);

  const rtcConfigRef = useRef({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  const micAudioContextRef = useRef(null);
  const micProcessorRef = useRef(null);
  const micSourceRef = useRef(null);
  const startAudioStreamingRef = useRef(() => {});

  const openingSentRef = useRef(false);
  const openingResponseTriggeredRef = useRef(false);
  const sessionReadyRef = useRef(false);
  const candidateSpeakingRef = useRef(false);
  const generatingQuestionRef = useRef(false);

  const conversationHistoryRef = useRef([]);

  const currentQuestionRef = useRef(openingQuestion);

  const candidateAnswerBufferRef = useRef("");

  const remoteStreamRef = useRef(null);

  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);

  const [connectionInitiated, setConnectionInitiated] =
    useState(false);

  const [sessionStarted, setSessionStarted] =
    useState(false);

  const [countdown, setCountdown] = useState(null);

  const [isEndModalOpen, setIsEndModalOpen] =
    useState(false);

  const [isFinishing, setIsFinishing] =
    useState(false);

  const [avatarConnected, setAvatarConnected] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("Initializing navtalk.Brain runtime...");

  const [disconnectedReason, setDisconnectedReason] =
    useState(null);

  const [showSilenceWarning, setShowSilenceWarning] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(openingQuestion);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    if (!sessionData) {
      navigate("/user/resume-upload", {
        replace: true,
      });
    }
  }, [sessionData, navigate]);

  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (pendingSilenceStartTimeoutRef.current) {
      clearTimeout(pendingSilenceStartTimeoutRef.current);
      pendingSilenceStartTimeoutRef.current = null;
    }

    setShowSilenceWarning(false);
  }, []);

  const armAvatarSpeakingGate = useCallback(() => {
    avatarSpeakingGateRef.current = true;

    if (avatarGateFailsafeTimeoutRef.current) {
      clearTimeout(avatarGateFailsafeTimeoutRef.current);
    }

    // Failsafe: if audio.done never arrives for this turn (dropped
    // event, generation failure, etc.), don't leave the candidate's
    // mic muted for the rest of the interview.
    avatarGateFailsafeTimeoutRef.current = setTimeout(() => {
      avatarGateFailsafeTimeoutRef.current = null;
      avatarSpeakingGateRef.current = false;
    }, 25000);
  }, []);

  const disarmAvatarSpeakingGate = useCallback(
    (delayMs = 0) => {
      if (avatarGateFailsafeTimeoutRef.current) {
        clearTimeout(avatarGateFailsafeTimeoutRef.current);
        avatarGateFailsafeTimeoutRef.current = null;
      }

      setTimeout(() => {
        avatarSpeakingGateRef.current = false;
      }, delayMs);
    },
    []
  );

  const registerNavTalkSession = useCallback(
    async (remoteNavTalkSessionId) => {
      if (!remoteNavTalkSessionId || mqttModeRegisteredRef.current) {
        return false;
      }

      for (let attempt = 1; attempt <= 5; attempt += 1) {
        if (cancelledRef.current) return false;

        try {
          const result = await postBackend(
            "/api/interview/navtalk-started",
            {
              session_id: navtalkSessionId,
              navtalk_session_id: remoteNavTalkSessionId,
            }
          );

          if (result?.ok) {
            navtalkSessionIdRef.current = remoteNavTalkSessionId;
            mqttModeRegisteredRef.current = true;
            sessionReadyRef.current = true;

            setStatusMessage(
              "Transparent Mode connected. Starting interview..."
            );

            console.log(
              "Transparent Mode MQTT session registered:",
              remoteNavTalkSessionId
            );

            if (localStreamRef.current) {
              console.log(
                "Starting PCM audio after Transparent Mode registration..."
              );
              startAudioStreamingRef.current();
            } else {
              console.log(
                "PCM audio waiting for microphone stream..."
              );
            }

            return true;
          }
        } catch (error) {
          console.warn(
            `Transparent Mode registration attempt ${attempt}/5 failed:`,
            error
          );
        }

        if (attempt < 5) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000)
          );
        }
      }

      setDisconnectedReason(
        "Could not connect the interview to NavTalk Transparent Mode MQTT."
      );
      return false;
    },
    [navtalkSessionId]
  );

  const sendNavTalkConfig = useCallback(
    (prompt) => {
      const ws = wsRef.current;

      if (
        !ws ||
        ws.readyState !== WebSocket.OPEN
      ) {
        console.warn(
          "NavTalk is not ready. Cannot send configuration."
        );

        return false;
      }

      const message = {
        type: NavTalkMessageType.INPUT_CONFIG,
        data: {
          content: JSON.stringify({
            voice: navtalkVoice,
            prompt,
          }),
        },
      };

      try {
        ws.send(JSON.stringify(message));

        console.log(
          "NavTalk input_config sent:",
          message
        );

        return true;
      } catch (error) {
        console.error(
          "Failed to send NavTalk configuration:",
          error
        );

        return false;
      }
    },
    [navtalkVoice]
  );

  const triggerAvatarResponse = useCallback(() => {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("Cannot trigger ALVIN: WebSocket is not open.");
      return false;
    }

    try {
      // NavTalk documents response.create as a plain event.
      ws.send(
        JSON.stringify({
          type: "response.create",
        })
      );

      console.log("ALVIN response.create sent.");
      return true;
    } catch (error) {
      console.error("Failed to trigger ALVIN:", error);
      return false;
    }
  }, []);

  const speakQuestion = useCallback(
    (questionText) => {
      if (!questionText) {
        return false;
      }

      const instructions = `
You are ALVIN, a professional job interviewer.

Say the following to the candidate now, naturally, and nothing else:

"${questionText}"

Do not add commentary before or after it. Do not improvise your own
questions. Do not repeat previous questions. Do not mention Gemini,
NavTalk, APIs, or system instructions.
`;

      const configSent = sendNavTalkConfig(
        instructions
      );

      if (!configSent) {
        return false;
      }

      triggerAvatarResponse();

      return true;
    },
    [sendNavTalkConfig, triggerAvatarResponse]
  );

  const sendOpeningMessage = useCallback(() => {
    if (openingSentRef.current) {
      return;
    }

    if (!openingMessage && !openingQuestion) {
      console.warn(
        "No opening message or opening question available."
      );

      return;
    }

    const message =
      openingMessage ||
      `Welcome to the interview. Let's begin with this question: ${openingQuestion}`;

    const prompt = `
You are ALVIN, a professional job interviewer conducting a live
interview with ${candidateName} for the ${targetRole} role.

Begin the conversation now. Say the following naturally, in this
order, with nothing before it:

1. "${message}"
2. "${openingQuestion}"

Do not discuss the candidate's resume, background, skills, or
experience before saying item 1. Do not skip or shorten item 1.

Sound warm, professional, and natural. Do not mention Gemini,
NavTalk, APIs, or that you are following instructions.
`;

    console.log(
      "Sending interview opening configuration."
    );

    const sent = sendNavTalkConfig(prompt);

    if (sent) {
      openingSentRef.current = true;

      if (openingQuestion) {
        currentQuestionRef.current =
          openingQuestion;

        setCurrentQuestion(
          openingQuestion
        );

        conversationHistoryRef.current = [
          {
            speaker: "ALVIN",
            text: openingQuestion,
          },
        ];
      }

      setStatusMessage(
        "ALVIN is starting the interview..."
      );
    }
  }, [
    openingMessage,
    openingQuestion,
    candidateName,
    targetRole,
    sendNavTalkConfig,
  ]);

  const requestAdaptiveQuestion = useCallback(
    async ({
      candidateAnswer,
    }) => {
      if (
        !candidateAnswer ||
        generatingQuestionRef.current
      ) {
        return null;
      }

      generatingQuestionRef.current = true;

      try {
        setStatusMessage(
          "ALVIN is preparing the next question..."
        );

        const result = await postBackend(
          "/api/interview/adaptive-question",
          {
            session_id: navtalkSessionId,
            history:
              conversationHistoryRef.current,
            last_question:
              currentQuestionRef.current,
            candidate_answer:
              candidateAnswer,
          }
        );

        const question =
          result?.question?.trim();

        if (!question) {
          throw new Error(
            "Gemini returned an empty question."
          );
        }

        currentQuestionRef.current =
          question;

        setCurrentQuestion(question);

        return question;
      } catch (error) {
        console.error(
          "Adaptive question error:",
          error
        );

        return null;
      } finally {
        generatingQuestionRef.current = false;
      }
    },
    [navtalkSessionId]
  );

  const requestSimplifiedQuestion =
    useCallback(
      async () => {
        const question =
          currentQuestionRef.current;

        if (!question) {
          return null;
        }

        try {
          const result = await postBackend(
            "/api/interview/simplify-question",
            {
              session_id:
                navtalkSessionId,
              history:
                conversationHistoryRef.current,
              question,
              candidate_answer:
                candidateAnswerBufferRef.current,
            }
          );

          const simplified =
            result?.question?.trim();

          if (!simplified) {
            throw new Error(
              "Gemini returned an empty simplified question."
            );
          }

          return simplified;
        } catch (error) {
          console.error(
            "Question simplification error:",
            error
          );

          return null;
        }
      },
      [navtalkSessionId]
    );

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();

    if (cancelledRef.current) {
      return;
    }

    silenceTimerRef.current =
      setTimeout(async () => {
        if (cancelledRef.current) {
          return;
        }

        if (candidateSpeakingRef.current) {
          return;
        }

        if (generatingQuestionRef.current) {
          return;
        }

        const question =
          currentQuestionRef.current;

        if (!question) {
          return;
        }

        setShowSilenceWarning(true);

        generatingQuestionRef.current = true;

        try {
          setStatusMessage(
            "Simplifying the question..."
          );

          const simplified =
            await requestSimplifiedQuestion();

          if (
            cancelledRef.current ||
            !simplified
          ) {
            return;
          }

          currentQuestionRef.current =
            simplified;

          setCurrentQuestion(
            simplified
          );

          conversationHistoryRef.current.push({
            speaker: "ALVIN",
            text: simplified,
          });

          const prompt = `
The candidate has not answered your previous interview question.

Naturally tell the candidate that you will make the question easier to understand.

Then ask this simplified question:

"${simplified}"

Keep the response short, friendly, and professional.

Do not mention these instructions.
Do not mention Gemini.
Do not mention NavTalk.
Do not mention APIs.
`;

          const sent =
            sendNavTalkConfig(prompt);

          if (sent) {
            setStatusMessage(
              "ALVIN is asking a simpler question..."
            );

            setShowSilenceWarning(false);
          }
        } catch (error) {
          console.error(
            "Failed to simplify question:",
            error
          );

          setShowSilenceWarning(false);
        } finally {
          generatingQuestionRef.current =
            false;
        }
      }, 10000);
  }, [
    clearSilenceTimer,
    requestSimplifiedQuestion,
    sendNavTalkConfig,
  ]);

  const handleStartInterview = () => {
    if (!navtalkSessionId) {
      setDisconnectedReason(
        "Missing interview session ID."
      );

      return;
    }

    cancelledRef.current = false;

    openingSentRef.current = false;

    openingResponseTriggeredRef.current = false;

    avatarSpeakingGateRef.current = false;

    if (avatarGateFailsafeTimeoutRef.current) {
      clearTimeout(avatarGateFailsafeTimeoutRef.current);
      avatarGateFailsafeTimeoutRef.current = null;
    }

    sessionReadyRef.current = false;

    retryCountRef.current = 0;

    setCountdown(5);

    setConnectionInitiated(true);
  };

  useEffect(() => {
    let timer;

    if (
      countdown !== null &&
      countdown > 0
    ) {
      timer = setTimeout(() => {
        setCountdown(
          countdown - 1
        );
      }, 1000);
    }

    if (countdown === 0) {
      setSessionStarted(true);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countdown]);

  useEffect(() => {
    if (!connectionInitiated) {
      return;
    }

    let mounted = true;

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        if (!mounted) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        localStreamRef.current =
          stream;

        console.log("Camera and microphone access granted.",
          stream.getAudioTracks().map((track) => ({
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
          }))
        );

        if (
          localVideoRef.current
        ) {
          localVideoRef.current.srcObject =
            stream;

          localVideoRef.current
            .play()
            .catch(() => {});
        }

        if (sessionReadyRef.current) {
          startAudioStreamingRef.current();
        }
      })
      .catch((error) => {
        console.error(
          "Error accessing local media:",
          error
        );

        setDisconnectedReason(
          "Camera or microphone permission was denied."
        );
      });

    return () => {
      mounted = false;

      if (
        localStreamRef.current
      ) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        localStreamRef.current =
          null;
      }
    };
  }, [connectionInitiated]);

  useEffect(() => {
    if (
      localStreamRef.current
    ) {
      localStreamRef.current
        .getAudioTracks()
        .forEach((track) => {
          track.enabled =
            micActive;
        });
    }
  }, [micActive]);

  useEffect(() => {
    if (
      localStreamRef.current
    ) {
      localStreamRef.current
        .getVideoTracks()
        .forEach((track) => {
          track.enabled =
            camActive;
        });
    }
  }, [camActive]);

  const startAudioStreaming =
    useCallback(() => {
      if (
        !localStreamRef.current
      ) {
        console.warn(
          "Cannot start audio streaming: local stream unavailable."
        );

        return;
      }

      if (
        micAudioContextRef.current
      ) {
        return;
      }

      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        const audioContext =
          new AudioContextClass({
            sampleRate: 24000,
          });

        audioContext.resume().catch((error) => {
          console.warn("AudioContext resume failed:", error);
        });

        const source =
          audioContext.createMediaStreamSource(
            localStreamRef.current
          );

        const processor =
          audioContext.createScriptProcessor(
            8192,
            1,
            1
          );

        processor.onaudioprocess =
          (event) => {
            if (
              !micActiveRef.current ||
              avatarSpeakingGateRef.current
            ) {
              return;
            }

            const ws =
              wsRef.current;

            if (
              !ws ||
              ws.readyState !==
                WebSocket.OPEN
            ) {
              return;
            }

            const input =
              event.inputBuffer.getChannelData(
                0
              );

            const pcm =
              floatTo16BitPCM(
                input
              );

            const base64 =
              base64EncodeAudio(
                new Uint8Array(pcm)
              );

            const chunkSize =
              4096;

            for (
              let i = 0;
              i < base64.length;
              i += chunkSize
            ) {
              const chunk =
                base64.slice(
                  i,
                  i + chunkSize
                );

              try {
                ws.send(
                  JSON.stringify({
                    type:
                      NavTalkMessageType.INPUT_AUDIO_BUFFER_APPEND,
                    data: {
                      audio: chunk,
                    },
                  })
                );
              } catch {
                return;
              }
            }
          };

        source.connect(processor);

        processor.connect(
          audioContext.destination
        );

        micAudioContextRef.current =
          audioContext;

        micProcessorRef.current =
          processor;

        micSourceRef.current =
          source;

        console.log(
          "PCM audio streaming started."
        );
      } catch (error) {
        console.error(
          "Error starting PCM audio streaming:",
          error
        );
      }
    }, []);

  useEffect(() => {
    startAudioStreamingRef.current = startAudioStreaming;
  }, [startAudioStreaming]);

  const stopAudioStreaming =
    useCallback(() => {
      if (
        micProcessorRef.current
      ) {
        try {
          micProcessorRef.current.disconnect();
        } catch {}

        micProcessorRef.current =
          null;
      }

      if (
        micSourceRef.current
      ) {
        try {
          micSourceRef.current.disconnect();
        } catch {}

        micSourceRef.current =
          null;
      }

      if (
        micAudioContextRef.current
      ) {
        try {
          if (
            micAudioContextRef.current
              .state !== "closed"
          ) {
            micAudioContextRef.current.close();
          }
        } catch {}

        micAudioContextRef.current =
          null;
      }
    }, []);

  const attachRemoteStream =
    useCallback((stream) => {
      if (!stream) {
        return;
      }

      remoteStreamRef.current =
        stream;

      const video =
        navtalkVideoRef.current;

      if (!video) {
        return;
      }

      if (
        video.srcObject !== stream
      ) {
        video.srcObject = stream;
      }

      video.muted = false;
      video.autoplay = true;
      video.playsInline = true;

      setAvatarConnected(true);

      setStatusMessage(
        "ALVIN is connected."
      );

      const playVideo = async () => {
        try {
          await video.play();
          console.log(
            "NavTalk avatar video playing."
          );
        } catch (error) {
          if (
            error?.name !==
            "AbortError"
          ) {
            console.warn(
              "Avatar autoplay failed:",
              error
            );
          }
        }
      };

      playVideo();
    }, []);

  const handleOffer =
    useCallback(
      async (navData) => {
        try {
          console.log(
            "Processing NavTalk WebRTC offer."
          );

          // extractSDP already runs the SDP through normalizeSdp(),
          // guaranteeing strict CRLF line endings before it ever
          // reaches setRemoteDescription.
          const sdp =
            extractSDP({
              data: navData,
            });

          if (!sdp) {
            console.error(
              "NavTalk WebRTC offer did not contain a valid SDP:",
              navData
            );

            throw new Error(
              "NavTalk WebRTC offer is missing SDP."
            );
          }

          if (
            !sdp
              .trim()
              .startsWith("v=")
          ) {
            console.error(
              "Invalid SDP received from NavTalk:",
              sdp
            );

            throw new Error(
              "NavTalk returned an invalid WebRTC SDP."
            );
          }

          if (
            pcRef.current
          ) {
            try {
              pcRef.current.close();
            } catch {}
          }

          const pc =
            new RTCPeerConnection(
              rtcConfigRef.current
            );

          pcRef.current = pc;

          pc.ontrack = (event) => {
            console.log(
              "NavTalk remote track received."
            );

            if (
              event.streams &&
              event.streams[0]
            ) {
              attachRemoteStream(
                event.streams[0]
              );

              return;
            }

            const stream =
              remoteStreamRef.current ||
              new MediaStream();

            stream.addTrack(
              event.track
            );

            attachRemoteStream(
              stream
            );
          };

          pc.onicecandidate =
            (event) => {
              if (
                !event.candidate
              ) {
                return;
              }

              const ws =
                wsRef.current;

              if (
                !ws ||
                ws.readyState !==
                  WebSocket.OPEN
              ) {
                return;
              }

              try {
                ws.send(
                  JSON.stringify({
                    type:
                      NavTalkMessageType.WEB_RTC_ICE_CANDIDATE,
                    data: {
                      candidate:
                        event.candidate,
                    },
                  })
                );
              } catch (error) {
                console.error(
                  "Failed to send ICE candidate:",
                  error
                );
              }
            };

          pc.onconnectionstatechange =
            () => {
              console.log(
                "WebRTC connection state:",
                pc.connectionState
              );

              if (
                pc.connectionState ===
                "connected"
              ) {
                setAvatarConnected(
                  true
                );

                setStatusMessage(
                  "ALVIN is connected."
                );
              }

              if (
                pc.connectionState ===
                  "failed" ||
                pc.connectionState ===
                  "disconnected"
              ) {
                console.warn(
                  "WebRTC connection state:",
                  pc.connectionState
                );
              }
            };

          await pc.setRemoteDescription(
            {
              type: "offer",
              sdp,
            }
          );

          console.log(
            "NavTalk remote SDP accepted."
          );

          const answer =
            await pc.createAnswer();

          await pc.setLocalDescription(
            answer
          );

          const ws =
            wsRef.current;

          if (
            !ws ||
            ws.readyState !==
              WebSocket.OPEN
          ) {
            throw new Error(
              "WebSocket closed before WebRTC answer could be sent."
            );
          }

          // Normalize the outbound answer SDP too. pc.localDescription.sdp
          // from the browser is already well-formed, but this keeps the
          // send path consistent and defends against any transport that
          // might re-flatten line endings before it reaches NavTalk.
          ws.send(
            JSON.stringify({
              type:
                NavTalkMessageType.WEB_RTC_ANSWER,
              data: {
                sdp: {
                  type: "answer",
                  sdp: normalizeSdp(
                    pc.localDescription
                      ?.sdp || ""
                  ),
                },
              },
            })
          );

          console.log(
            "WebRTC answer sent to NavTalk."
          );
        } catch (error) {
          console.error(
            "WebRTC connection failed.",
            error
          );

          setDisconnectedReason(
            error?.message ||
              "Failed to establish the avatar video connection."
          );
        }
      },
      [attachRemoteStream]
    );

  const handleIceCandidate =
    useCallback(
      async (navData) => {
        try {
          const candidate =
            extractIceCandidate({
              data: navData,
            });

          if (!candidate) {
            return;
          }

          const pc =
            pcRef.current;

          if (!pc) {
            console.warn(
              "Received ICE candidate before PeerConnection exists."
            );

            return;
          }

          if (
            pc.signalingState ===
            "closed"
          ) {
            return;
          }

          await pc.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );
        } catch (error) {
          console.error(
            "Error adding ICE candidate:",
            error
          );
        }
      },
      []
    );

  const initNavTalkSession =
    useCallback(async () => {
      cancelledRef.current =
        false;

      openingSentRef.current =
        false;

      openingResponseTriggeredRef.current =
        false;
      mqttModeRegisteredRef.current = false;
      navtalkSessionIdRef.current = "";

      avatarSpeakingGateRef.current = false;

      if (avatarGateFailsafeTimeoutRef.current) {
        clearTimeout(
          avatarGateFailsafeTimeoutRef.current
        );
        avatarGateFailsafeTimeoutRef.current = null;
      }

      sessionReadyRef.current =
        false;

      setAvatarConnected(false);

      if (
        wsRef.current
      ) {
        try {
          wsRef.current.close();
        } catch {}

        wsRef.current = null;
      }

      if (
        pcRef.current
      ) {
        try {
          pcRef.current.close();
        } catch {}

        pcRef.current = null;
      }

      remoteStreamRef.current =
        null;

      stopAudioStreaming();

      let wsUrl;

      try {
        setStatusMessage(
          "Requesting NavTalk session..."
        );

        wsUrl =
          await fetchNavTalkWsUrl(
            navtalkSessionId
          );
      } catch (error) {
        if (
          cancelledRef.current
        ) {
          return;
        }

        console.error(
          "Failed to fetch NavTalk connection URL:",
          error
        );

        setDisconnectedReason(
          error?.message ||
            "Failed to prepare live session."
        );

        return;
      }

      if (
        cancelledRef.current
      ) {
        return;
      }

      console.log(
        "Connecting to NavTalk..."
      );

      const ws =
        new WebSocket(wsUrl);

      ws.binaryType =
        "arraybuffer";

      wsRef.current = ws;

      ws.onopen = () => {
        if (
          cancelledRef.current
        ) {
          try {
            ws.close();
          } catch {}

          return;
        }

        console.log(
          "NavTalk WebSocket connected."
        );

        setStatusMessage(
          "Configuring ALVIN..."
        );

        console.log(
          "Waiting for Transparent Mode MQTT registration."
        );
      };

      ws.onmessage =
        async (messageEvent) => {
          if (
            cancelledRef.current
          ) {
            return;
          }

          if (
            typeof messageEvent.data !==
            "string"
          ) {
            return;
          }

          let message;

          try {
            message =
              JSON.parse(
                messageEvent.data
              );
          } catch (error) {
            console.error(
              "Failed to parse NavTalk message:",
              error
            );

            return;
          }

          const type =
            message?.type;

          const navData =
            message?.data || {};

          console.log(
            "NavTalk event:",
            type,
            message
          );

          switch (type) {
            case NavTalkMessageType.CONNECTED_SUCCESS: {
              console.log(
                "NavTalk connection successful."
              );

              if (
                Array.isArray(
                  navData.iceServers
                ) &&
                navData.iceServers
                  .length > 0
              ) {
                rtcConfigRef.current = {
                  iceServers:
                    navData.iceServers,
                };
              }

              const remoteSessionId =
                extractNavTalkSessionId(message);

              if (!remoteSessionId) {
                console.error(
                  "NavTalk connected.success did not contain a session ID:",
                  message
                );
                setDisconnectedReason(
                  "NavTalk did not return a Transparent Mode session ID."
                );
                break;
              }

              console.log(
                "NavTalk session ID received:",
                remoteSessionId
              );

              await registerNavTalkSession(
                remoteSessionId
              );

              break;
            }

            case NavTalkMessageType.CONNECTED_WARNING: {
              console.warn(
                "NavTalk warning:",
                message?.message ||
                  navData?.message ||
                  ""
              );

              break;
            }

            case NavTalkMessageType.CONNECTED_FAIL: {
              setDisconnectedReason(
                message?.message ||
                  navData?.message ||
                  "NavTalk connection failed."
              );

              break;
            }

            case NavTalkMessageType.INSUFFICIENT_BALANCE: {
              setDisconnectedReason(
                "NavTalk account has insufficient balance."
              );

              break;
            }

            case NavTalkMessageType.CONNECTION_LIMIT_EXCEEDED: {
              setDisconnectedReason(
                "NavTalk connection limit has been exceeded."
              );

              break;
            }

            case NavTalkMessageType.BACKEND_ERROR: {
              setDisconnectedReason(
                message?.message ||
                  "NavTalk backend error."
              );

              break;
            }

            case NavTalkMessageType.GPU_FULL: {
              if (
                retryCountRef.current <
                  3 &&
                !cancelledRef.current
              ) {
                retryCountRef.current +=
                  1;

                const retryNumber =
                  retryCountRef.current;

                setStatusMessage(
                  `NavTalk GPU is busy. Retrying in 10 seconds (${retryNumber}/3)...`
                );

                setTimeout(() => {
                  if (
                    !cancelledRef.current
                  ) {
                    initNavTalkSession();
                  }
                }, 10000);
              } else {
                setDisconnectedReason(
                  "NavTalk is currently at capacity. Please try again later."
                );
              }

              break;
            }

            case NavTalkMessageType.SESSION_CREATED: {
              console.log(
                "NavTalk realtime session created."
              );

              const remoteSessionId =
                extractNavTalkSessionId(message);

              if (!remoteSessionId) {
                console.error(
                  "NavTalk SESSION_CREATED did not contain a session ID:",
                  message
                );
                setDisconnectedReason(
                  "NavTalk did not return a Transparent Mode session ID."
                );
                break;
              }

              setStatusMessage(
                "Starting Transparent Mode..."
              );

              await registerNavTalkSession(
                remoteSessionId
              );

              break;
            }

            case NavTalkMessageType.SESSION_UPDATED: {
              console.log(
                "NavTalk realtime session ready."
              );

              sessionReadyRef.current = true;

              setStatusMessage(
                "NavTalk session ready. Connecting avatar..."
              );

              startAudioStreaming();

              break;
            }

            case NavTalkMessageType.REALTIME_STATUS: {
              console.log("NavTalk realtime status:", navData);
              break;
            }

            case NavTalkMessageType.SPEECH_STARTED: {
              candidateSpeakingRef.current =
                true;

              clearSilenceTimer();

              break;
            }

            case NavTalkMessageType.SPEECH_STOPPED: {
              candidateSpeakingRef.current =
                false;

              // Note: the transcript is NOT available yet at this
              // point — it arrives separately via
              // INPUT_AUDIO_TRANSCRIPTION_COMPLETED below. Trying to
              // extract it here (as this code used to) always
              // returned nothing.

              break;
            }

            case NavTalkMessageType.INPUT_AUDIO_TRANSCRIPTION_COMPLETED: {
              const candidateText =
                extractCandidateText(message)?.trim();

              if (!candidateText || candidateText.length < 2) {
                console.warn(
                  "NavTalk transcription event had no usable text:",
                  message
                );
                break;
              }

              candidateSpeakingRef.current = false;
              candidateAnswerBufferRef.current = candidateText;
              clearSilenceTimer();

              console.log(
                "Candidate transcript received by browser:",
                candidateText
              );

              if (
                cancelledRef.current ||
                generatingQuestionRef.current
              ) {
                break;
              }

              (async () => {
                const nextQuestion =
                  await requestAdaptiveQuestion({
                    candidateAnswer: candidateText,
                  });

                if (
                  cancelledRef.current ||
                  !nextQuestion
                ) {
                  return;
                }

                console.log(
                  "Gemini next question:",
                  nextQuestion
                );

                setStatusMessage(
                  "ALVIN is asking the next question..."
                );

                // Transparent Mode speaks through MQTT.
                avatarSpeakingGateRef.current = true;
              })();

              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_DELTA: {
              avatarSpeakingGateRef.current = true;
              clearSilenceTimer();

              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_TRANSCRIPT_DELTA: {
              avatarSpeakingGateRef.current = true;
              clearSilenceTimer();

              const deltaText =
                (typeof navData?.delta ===
                  "string" &&
                  navData.delta) ||
                extractCandidateText({
                  data: navData,
                }) ||
                "";

              if (deltaText) {
                responseTranscriptLengthRef.current +=
                  deltaText.length;

                responseTranscriptTextRef.current +=
                  deltaText;
              }

              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_DONE: {
              candidateSpeakingRef.current =
                false;

              candidateAnswerBufferRef.current =
                "";

              // Diagnostic: log exactly what the avatar generated for
              // this turn, so we can see whether it's the expected
              // opening line, empty/degenerate output, or something
              // else entirely — instead of inferring from event shape.
              console.log(
                "NavTalk response transcript:",
                JSON.stringify(
                  responseTranscriptTextRef.current
                )
              );

              // audio.done means the model finished GENERATING the
              // response — the buffered audio still takes time to
              // actually play back to the candidate over WebRTC.
              // Starting the silence countdown immediately here was
              // causing it to run while the avatar was still visibly
              // speaking. Estimate remaining playback time from how
              // much transcript text was generated and delay the
              // countdown start to roughly match.
              const ESTIMATED_CHARS_PER_SECOND = 15;
              const MIN_PLAYBACK_BUFFER_MS = 800;
              const MAX_PLAYBACK_BUFFER_MS = 9000;

              const estimatedPlaybackMs =
                Math.min(
                  MAX_PLAYBACK_BUFFER_MS,
                  Math.max(
                    MIN_PLAYBACK_BUFFER_MS,
                    (responseTranscriptLengthRef.current /
                      ESTIMATED_CHARS_PER_SECOND) *
                      1000
                  )
                );

              responseTranscriptLengthRef.current = 0;
              responseTranscriptTextRef.current = "";

              // Unmute mic transmission once this turn's audio has
              // actually finished playing back — same estimated delay
              // used for the silence timer below. This is what
              // protects EVERY turn (not just the opening) from the
              // avatar hearing and reacting to its own voice.
              disarmAvatarSpeakingGate(
                estimatedPlaybackMs
              );

              setStatusMessage(
                "ALVIN is listening..."
              );

              break;
            }

            case NavTalkMessageType.WEB_RTC_OFFER: {
              await handleOffer(
                navData
              );

              break;
            }

            case NavTalkMessageType.WEB_RTC_ICE_CANDIDATE: {
              await handleIceCandidate(
                navData
              );

              break;
            }

            default: {
              break;
            }
          }
        };

      ws.onerror = (error) => {
        console.error(
          "NavTalk WebSocket error:",
          error
        );
      };

      ws.onclose = (event) => {
        console.warn(
          `NavTalk WebSocket closed: ${event.code} ${event.reason || ""}`
        );

        if (
          !cancelledRef.current &&
          !disconnectedReason
        ) {
          setDisconnectedReason(
            `NavTalk session disconnected (Code ${event.code}).`
          );
        }
      };
    },
    [
      navtalkSessionId,
      stopAudioStreaming,
      startAudioStreaming,
      sendOpeningMessage,
      triggerAvatarResponse,
      registerNavTalkSession,
      disarmAvatarSpeakingGate,
      speakQuestion,
      requestAdaptiveQuestion,
      handleOffer,
      handleIceCandidate,
      clearSilenceTimer,
      startSilenceTimer,
      disconnectedReason,
    ]);

  useEffect(() => {
    if (!connectionInitiated || !sessionStarted) {
      return;
    }

    let active = true;

    const syncBackendSession = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/interview/session/${navtalkSessionId}`,
          {
            headers: {
              "X-API-Key": APP_API_KEY,
            },
          }
        );

        if (!response.ok || !active) return;

        const data = await response.json();

        if (data.current_question) {
          currentQuestionRef.current = data.current_question;
          setCurrentQuestion(data.current_question);
        }

        if (Array.isArray(data.history)) {
          conversationHistoryRef.current = data.history;
        }

        setShowSilenceWarning(
          Boolean(data.silence_warning)
        );

        if (data.silence_warning) {
          setStatusMessage(
            "ALVIN is simplifying the question..."
          );
        } else if (data.current_question) {
          setStatusMessage(
            "ALVIN is listening..."
          );
        }
      } catch (error) {
        console.warn(
          "Backend interview sync failed:",
          error
        );
      }
    };

    syncBackendSession();
    backendSyncTimerRef.current = setInterval(
      syncBackendSession,
      1000
    );

    return () => {
      active = false;

      if (backendSyncTimerRef.current) {
        clearInterval(
          backendSyncTimerRef.current
        );
        backendSyncTimerRef.current = null;
      }
    };
  }, [
    connectionInitiated,
    sessionStarted,
    navtalkSessionId,
  ]);

  useEffect(() => {
    if (!connectionInitiated) {
      return;
    }

    initNavTalkSession();

    return () => {
      cancelledRef.current =
        true;

      clearSilenceTimer();

      stopAudioStreaming();

      sessionReadyRef.current =
        false;
      mqttModeRegisteredRef.current = false;
      navtalkSessionIdRef.current = "";

      if (backendSyncTimerRef.current) {
        clearInterval(backendSyncTimerRef.current);
        backendSyncTimerRef.current = null;
      }

      openingSentRef.current =
        false;

      if (
        wsRef.current
      ) {
        try {
          wsRef.current.close(
            1000,
            "Component unmounted"
          );
        } catch {}

        wsRef.current = null;
      }

      if (
        pcRef.current
      ) {
        try {
          pcRef.current.close();
        } catch {}

        pcRef.current = null;
      }

      remoteStreamRef.current =
        null;
    };
  }, [
    connectionInitiated,
    initNavTalkSession,
    clearSilenceTimer,
    stopAudioStreaming,
  ]);

  const handleConfirmEnd =
    () => {
      clearSilenceTimer();

      stopAudioStreaming();

      setIsEndModalOpen(false);

      setIsFinishing(true);

      cancelledRef.current =
        true;

      if (
        localStreamRef.current
      ) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        localStreamRef.current =
          null;
      }

      if (
        wsRef.current
      ) {
        try {
          wsRef.current.close(
            1000,
            "User ended session"
          );
        } catch {}

        wsRef.current =
          null;
      }

      if (
        pcRef.current
      ) {
        try {
          pcRef.current.close();
        } catch {}

        pcRef.current =
          null;
      }

      setTimeout(() => {
        navigate(
          "/user/interview-results",
          {
            state: {
              candidateName,
              targetRole,
            },
          }
        );
      }, 2000);
    };

  if (isFinishing) {
    return (
      <Loading message="Finalizing interview evaluation with Gemini AI..." />
    );
  }

  return (
    <>
      <div className="h-screen w-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">
        <div className="mx-auto flex flex-col w-full h-full overflow-hidden">
          <header className="flex-shrink-0 h-[70px] bg-white flex justify-between items-center px-8 border-b border-[#e5e5e5] z-40">
            <div className="hidden md:flex items-center gap-3 text-sm font-[Inter,sans-serif]">
              <img
                src={Logo}
                alt="Alvin logo"
                className="w-[55px] mb-[-10px]"
              />

              <span className="text-[#862334] font-bold pt-2">
                Live NavTalk WebRTC •{" "}
                {targetRole}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  avatarConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    avatarConnected
                      ? "bg-green-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />

                {avatarConnected
                  ? "ALVIN Connected"
                  : "Connecting ALVIN..."}
              </span>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            {disconnectedReason && (
              <div className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                  <AlertCircle className="w-16 h-16 text-[#862334] mx-auto mb-4" />

                  <h3 className="text-xl font-black text-black uppercase mb-2">
                    NavTalk Connection Failed
                  </h3>

                  <p className="text-sm text-gray-600 mb-6">
                    {disconnectedReason}
                  </p>

                  <button
                    onClick={
                      handleConfirmEnd
                    }
                    className="w-full py-3 bg-[#862334] text-white font-bold uppercase rounded-xl hover:bg-black transition-all"
                  >
                    End Interview
                  </button>
                </div>
              </div>
            )}

            {!sessionStarted && (
              <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-4xl w-full px-4">
                  {countdown ===
                  null ? (
                    <>
                      <h2 className="text-4xl sm:text-5xl font-black text-[#862334] mb-6 uppercase">
                        Ready to Begin?
                      </h2>

                      <p className="text-gray-500 mb-8">
                        ALVIN will conduct your{" "}
                        {targetRole} interview.
                      </p>

                      <button
                        onClick={
                          handleStartInterview
                        }
                        className="px-8 py-4 bg-[#862334] text-white font-black uppercase rounded-xl hover:bg-black transition-all"
                      >
                        Start Video Interview
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-xl font-black text-gray-400 uppercase">
                        Interview starts in
                      </h2>

                      <div className="text-9xl font-black text-[#862334] animate-pulse">
                        {countdown}
                      </div>

                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        {statusMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-5 p-6 max-w-5xl mx-auto w-full min-w-0 overflow-hidden">
              <div className="flex-[3] relative rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
                {sessionStarted &&
                  showSilenceWarning &&
                  !disconnectedReason && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                      <AlertTriangle
                        size={20}
                        className="flex-shrink-0"
                      />

                      <span className="text-xs font-bold uppercase tracking-wide">
                        No response detected —
                        simplifying the question...
                      </span>
                    </div>
                  )}

                <div
                  className={`relative w-full h-full ${
                    !sessionStarted
                      ? "hidden"
                      : "block"
                  }`}
                >
                  <video
                    ref={navtalkVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                  />

                  {!avatarConnected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white">
                      <Sparkles className="w-12 h-12 animate-spin text-[#862334] mb-3" />

                      <p className="text-xs uppercase text-slate-300 font-bold text-center px-4">
                        {statusMessage}
                      </p>
                    </div>
                  )}
                </div>

                {sessionStarted && (
                  <div className="absolute top-6 left-6 w-56 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-30 bg-slate-900">
                    {camActive ? (
                      <video
                        ref={(node) => {
                          localVideoRef.current = node;

                          if (
                            node &&
                            localStreamRef.current &&
                            node.srcObject !==
                              localStreamRef.current
                          ) {
                            node.srcObject =
                              localStreamRef.current;

                            node
                              .play()
                              .catch(() => {});
                          }
                        }}
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
                      {candidateName}{" "}
                      (You)
                    </span>
                  </div>
                )}

              {sessionStarted &&
                currentQuestion && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[90%]">
                    <div className="bg-black/60 backdrop-blur-md text-white rounded-xl px-5 py-3 text-center">
                      <p className="text-[10px] uppercase text-white/60 font-bold mb-1">
                        Current Question
                      </p>

                      <p className="text-sm font-medium">
                        {currentQuestion}
                      </p>
                    </div>
                  </div>
                )}
                {sessionStarted && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111827]/90 px-5 py-3 rounded-full border border-white/10 shadow-2xl">
                    <button
                      onClick={() =>
                        setMicActive(
                          (value) =>
                            !value
                        )
                      }
                      className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                        micActive
                          ? "border-white/20 text-white"
                          : "bg-[#862334] border-[#862334] text-white"
                      }`}
                    >
                      {micActive ? (
                        <Mic
                          size={20}
                        />
                      ) : (
                        <MicOff
                          size={20}
                        />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setCamActive(
                          (value) =>
                            !value
                        )
                      }
                      className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                        camActive
                          ? "border-white/20 text-white"
                          : "bg-[#862334] border-[#862334] text-white"
                      }`}
                    >
                      {camActive ? (
                        <Video
                          size={20}
                        />
                      ) : (
                        <VideoOff
                          size={20}
                        />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setIsEndModalOpen(
                          true
                        )
                      }
                      className="ml-2 px-6 h-12 bg-[#862334] text-white font-bold rounded-full hover:bg-black flex items-center gap-2 shadow-lg"
                    >
                      <LogOut
                        size={18}
                        className="rotate-180"
                      />

                      <span className="text-xs uppercase hidden sm:inline">
                        End Session
                      </span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {isEndModalOpen && (
        <EndSessionModal
          isOpen={
            isEndModalOpen
          }
          onClose={() =>
            setIsEndModalOpen(
              false
            )
          }
          onConfirm={
            handleConfirmEnd
          }
        />
      )}
    </>
  );
}