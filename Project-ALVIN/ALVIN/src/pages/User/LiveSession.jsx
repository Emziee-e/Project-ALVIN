import { supabase } from "../../lib/supabaseClient";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import useInterviewLockdown from "../../lib/useInterviewLockdown";

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
  INPUT_TEXT: "realtime.input_text",
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
  RESPONSE_AUDIO_TRANSCRIPT_DONE: "realtime.response.audio_transcript.done",
  RESPONSE_AUDIO_DONE: "realtime.response.audio.done",

  INPUT_AUDIO_BUFFER_APPEND: "realtime.input_audio_buffer.append",
});

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";
// Set VITE_FIRST_MESSAGE_INCLUDES_Q01=true when the NavTalk Console First
// Message already contains the greeting AND the opening question. The client
// then never sends its own Q01; it just opens the answer window once the
// First Message has finished playing.
const FIRST_MESSAGE_INCLUDES_Q01 =
  import.meta.env.VITE_FIRST_MESSAGE_INCLUDES_Q01 === "true";
// When the NavTalk Console First Message is EMPTY (the default), NavTalk plays
// nothing on its own, so the client starts the interview itself: ALVIN speaks
// the greeting immediately followed by Q01, in ONE turn. Set
// VITE_CONSOLE_HAS_FIRST_MESSAGE=true only if you typed a greeting into the
// Console; the older "wait for the Console greeting, then speak Q01" flow is
// then used instead.
const CONSOLE_HAS_FIRST_MESSAGE =
  FIRST_MESSAGE_INCLUDES_Q01 ||
  import.meta.env.VITE_CONSOLE_HAS_FIRST_MESSAGE === "true";
const CLIENT_SPEAKS_OPENING = !CONSOLE_HAS_FIRST_MESSAGE;
// Used only if no active avatar name is available.
const DEFAULT_OPENING_GREETING =
  "Hello! Welcome to your interview. I'll be conducting your interview today. Let's get started.";
const CV_ANALYSIS_ENABLED =
  import.meta.env.VITE_ENABLE_CV_ANALYSIS === "true";

const CANDIDATE_FINALIZATION_GRACE_MS = 150;
const CANDIDATE_LOCAL_SILENCE_MS = 900;
const CANDIDATE_TRANSCRIPT_SETTLE_MS = 1800;
const CANDIDATE_SPEECH_RMS_THRESHOLD = 0.012;

// If the candidate says nothing for this long after a question finishes playing,
// ALVIN restates the SAME question in simpler words.
const NO_ANSWER_SIMPLIFY_MS = 15000;
// How many times one question may be simplified before ALVIN stops prompting.
const MAX_SIMPLIFICATIONS_PER_QUESTION = 2;
// Thinking time vs. reply speed.
// NavTalk's server ends the candidate's turn after a short pause, so ALVIN starts
// talking and the rest of the answer is lost. To prevent that the client takes over
// end-of-answer detection:
//   1. While the candidate pauses for less than the HOLD below, dead-quiet audio is
//      withheld, so "uhm..." and thinking pauses do not end the turn.
//   2. When the pause reaches the HOLD, the client decides the answer is finished
//      and IMMEDIATELY sends a burst of digital silence. NavTalk's turn detection
//      therefore ends the turn right away instead of waiting its own silence timer
//      in real time (which is what made ALVIN feel slow to react).
// The hold adapts to how much has been said: a pause after only a few words is
// probably thinking; a pause after a long answer is probably the end.
// Reply delay after you stop talking ~= this hold + ALVIN's own response time.
// Raise a value for more thinking time, lower it for a snappier reply.
const THINKING_HOLD_SHORT_ANSWER_MS = 3000; // under ~4s of speech so far
const THINKING_HOLD_NORMAL_MS = 2000; // 4s - 12s of speech so far
const THINKING_HOLD_LONG_ANSWER_MS = 1200; // over ~12s of speech so far
// Length of the synthetic silence sent when the client decides the answer is over.
// Sent instantly (not in real time). Kept short: long stretches of pure silence make
// speech-to-text models invent words.
const ANSWER_END_SILENCE_INJECT_MS = 1200;
// "Speech" for end-of-answer detection is judged RELATIVE to the microphone's own
// noise floor (the quietest recent level), so soft and loud microphones both work.
const MIC_LEVEL_HISTORY_CHUNKS = 40; // ~13 s of recent levels
// Upper limit for the adaptive speech level, so a very noisy room (e.g. a fan) can
// raise the bar above the old fixed level but never so far that speech is missed.
const ENDPOINT_MAX_SPEECH_RMS = 0.05;
// Microphone noise suppression (fan, air conditioner, hum). Set
// VITE_MIC_NOISE_SUPPRESSION=false to turn it off.
const MIC_NOISE_SUPPRESSION_ENABLED =
  import.meta.env.VITE_MIC_NOISE_SUPPRESSION !== "false";
const ENDPOINT_NOISE_FLOOR_FACTOR = 3; // speech = at least 3x the noise floor
const ENDPOINT_MIN_SPEECH_RMS = 0.003; // never treat anything below this as speech

function getThinkingHoldMs(speechMsSoFar) {
  if (speechMsSoFar < 4000) return THINKING_HOLD_SHORT_ANSWER_MS;
  if (speechMsSoFar < 12000) return THINKING_HOLD_NORMAL_MS;
  return THINKING_HOLD_LONG_ANSWER_MS;
}

// Console diagnostics: how long after the candidate's last speech did each stage happen?
function describeAnswerTiming(lastSpeechAt, endSignalAt) {
  const now = performance.now();
  const parts = [];
  if (lastSpeechAt > 0) {
    parts.push(`${Math.round(now - lastSpeechAt)} ms after your last speech`);
  }
  if (endSignalAt > 0) {
    parts.push(`${Math.round(now - endSignalAt)} ms after the end-of-answer signal`);
  }
  return parts.join(", ");
}

// Detect when NavTalk WebRTC audio has actually stopped playing.
const AVATAR_AUDIO_RMS_THRESHOLD = 0.0015;
const AVATAR_END_SILENCE_MS = 800;
// The NavTalk Console greeting has natural pauses between sentences, so use a
// longer silence window before deciding that the greeting is truly over.
const CONSOLE_GREETING_END_SILENCE_MS = 1500;
// Give NavTalk time to apply the roadmap config before the opening realtime.input_text.
const Q01_CONFIG_TO_RESPONSE_DELAY_MS = 300;
// If NavTalk never acknowledges the config, send the opening text turn anyway.
const Q01_CONFIG_ACK_TIMEOUT_MS = 2500;
// If ALVIN produces no audio/transcript this long after the opening text turn,
// retry once using a text user message that explicitly asks for Q01.
const Q01_SPEECH_WATCHDOG_MS = 4000;
// If no greeting audio is ever detected, still start Q01 after this long.
const Q01_FAILSAFE_AFTER_READY_MS = 20000;
// Do not start speaking until the avatar's WebRTC stream is attached, otherwise
// the first words of the greeting can be lost. Give up waiting after this long.
const Q01_AVATAR_WAIT_MS = 4000;
const AVATAR_POST_DONE_MIN_WAIT_MS = 350;
const AVATAR_PLAYBACK_CHECK_MS = 100;
const AVATAR_ESTIMATED_CHARS_PER_SECOND = 15;
const AVATAR_MIN_TURN_MS = 1200;
const CLOSING_GRACE_MS = 4000;

// ---------------------------------------------------------------------------
// Microphone noise suppression (streaming spectral subtraction)
//
// A steady background sound such as a fan has a stable spectrum. This learns that
// spectrum continuously from the quietest recent frames in each frequency band
// (minimum statistics, no voice-activity detector needed) and attenuates whatever
// matches it, plus a gentle cut of low-frequency rumble. Speech is louder than the
// learned noise in its own bands, so it passes through.
//
// Streaming: takes N samples in, returns N samples out (delayed by HOP samples).
// ---------------------------------------------------------------------------
class SpectralNoiseSuppressor {
  constructor(sampleRate = 24000, options = {}) {
    this.sampleRate = sampleRate;
    this.N = 512; // frame size (~21 ms at 24 kHz)
    this.H = this.N / 2; // hop (50% overlap)
    this.bins = this.N / 2 + 1;
    this.overSubtraction = options.overSubtraction ?? 1.5;
    this.minGain = options.minGain ?? 0.12; // about -18 dB maximum attenuation
    this.noiseBias = options.noiseBias ?? 5.0; // min-statistics underestimates the mean
    this.bypassGain = options.bypassGain ?? false; // test hook: pass audio through unchanged

    const N = this.N;
    this.window = new Float64Array(N);
    for (let n = 0; n < N; n += 1) {
      this.window[n] = Math.sin((Math.PI * (n + 0.5)) / N); // sine window, 50% overlap
    }
    this.cosT = new Float64Array(N / 2);
    this.sinT = new Float64Array(N / 2);
    for (let i = 0; i < N / 2; i += 1) {
      this.cosT[i] = Math.cos((2 * Math.PI * i) / N);
      this.sinT[i] = Math.sin((2 * Math.PI * i) / N);
    }
    this.rev = new Uint16Array(N);
    const bitsCount = Math.log2(N);
    for (let i = 0; i < N; i += 1) {
      let r = 0;
      for (let b = 0; b < bitsCount; b += 1) r |= ((i >> b) & 1) << (bitsCount - 1 - b);
      this.rev[i] = r;
    }

    this.re = new Float64Array(N);
    this.im = new Float64Array(N);
    this.smoothedPower = new Float64Array(this.bins);
    this.noise = new Float64Array(this.bins);
    this.gainPrev = new Float64Array(this.bins).fill(1);
    this.gain = new Float64Array(this.bins);
    this.curMin = new Float64Array(this.bins).fill(Infinity);
    this.subMins = [];
    this.SUB_FRAMES = 24; // ~0.26 s per sub-window
    this.SUB_COUNT = 8; // noise memory ~2 s
    this.WARMUP_FRAMES = 60; // lighter suppression while the noise profile forms
    this.frameInSub = 0;
    this.framesSeen = 0;

    this.pending = new Float32Array(0);
    this.acc = new Float64Array(N);
    this.ready = new Float32Array(this.H); // primes the constant latency
    this.frameOut = new Float64Array(N);
  }

  _fft(re, im, inverse) {
    const N = this.N;
    const rev = this.rev;
    for (let i = 0; i < N; i += 1) {
      const j = rev[i];
      if (j > i) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1;
      const step = N / size;
      for (let start = 0; start < N; start += size) {
        for (let k = 0, t = 0; k < half; k += 1, t += step) {
          const wr = this.cosT[t];
          const wi = inverse ? this.sinT[t] : -this.sinT[t];
          const a = start + k;
          const b = a + half;
          const xr = re[b] * wr - im[b] * wi;
          const xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr; im[b] = im[a] - xi;
          re[a] += xr; im[a] += xi;
        }
      }
    }
    if (inverse) {
      for (let i = 0; i < N; i += 1) { re[i] /= N; im[i] /= N; }
    }
  }

  _processFrame(frame, out) {
    const N = this.N;
    const bins = this.bins;
    const re = this.re;
    const im = this.im;

    for (let n = 0; n < N; n += 1) {
      re[n] = frame[n] * this.window[n];
      im[n] = 0;
    }
    this._fft(re, im, false);

    const first = this.framesSeen === 0;
    for (let k = 0; k < bins; k += 1) {
      const p = re[k] * re[k] + im[k] * im[k];
      this.smoothedPower[k] = first ? p : 0.6 * this.smoothedPower[k] + 0.4 * p;
      if (this.smoothedPower[k] < this.curMin[k]) this.curMin[k] = this.smoothedPower[k];
    }

    this.frameInSub += 1;
    this.framesSeen += 1;
    if (this.frameInSub >= this.SUB_FRAMES) {
      this.subMins.push(Float64Array.from(this.curMin));
      if (this.subMins.length > this.SUB_COUNT) this.subMins.shift();
      this.curMin.set(this.smoothedPower);
      this.frameInSub = 0;
    }

    for (let k = 0; k < bins; k += 1) {
      let m = this.curMin[k];
      for (let s = 0; s < this.subMins.length; s += 1) {
        if (this.subMins[s][k] < m) m = this.subMins[s][k];
      }
      this.noise[k] = m * this.noiseBias;
    }

    const warm = Math.min(1, this.framesSeen / this.WARMUP_FRAMES);
    const alpha = this.overSubtraction * (0.4 + 0.6 * warm);
    const floorPower = this.minGain * this.minGain;
    const binHz = this.sampleRate / N;

    for (let k = 0; k < bins; k += 1) {
      const ratio = this.noise[k] / Math.max(this.smoothedPower[k], 1e-20);
      const g2 = 1 - alpha * ratio;
      let g = g2 <= floorPower ? this.minGain : Math.sqrt(g2);
      // fast attack (don't clip word starts), slower release (don't chop word ends)
      g = g > this.gainPrev[k] ? 0.75 * g + 0.25 * this.gainPrev[k] : 0.4 * g + 0.6 * this.gainPrev[k];
      this.gainPrev[k] = g;
    }
    // smooth across frequency to avoid "musical noise"
    for (let k = 0; k < bins; k += 1) {
      const lo = this.gainPrev[Math.max(0, k - 1)];
      const hi = this.gainPrev[Math.min(bins - 1, k + 1)];
      let g = 0.25 * lo + 0.5 * this.gainPrev[k] + 0.25 * hi;
      const hz = k * binHz;
      if (hz < 70) g = Math.min(g, 0.05); // fan/handling rumble
      else if (hz < 110) g *= 0.5;
      this.gain[k] = this.bypassGain ? 1 : g;
    }

    for (let k = 0; k < bins; k += 1) {
      re[k] *= this.gain[k];
      im[k] *= this.gain[k];
      if (k > 0 && k < N / 2) {
        re[N - k] *= this.gain[k];
        im[N - k] *= this.gain[k];
      }
    }
    this._fft(re, im, true);
    for (let n = 0; n < N; n += 1) out[n] = re[n] * this.window[n];
  }

  // Takes a Float32Array, returns a Float32Array of the same length.
  process(input) {
    const N = this.N;
    const H = this.H;
    const combined = new Float32Array(this.pending.length + input.length);
    combined.set(this.pending, 0);
    combined.set(input, this.pending.length);

    const emitted = [];
    let pos = 0;
    while (combined.length - pos >= N) {
      this._processFrame(combined.subarray(pos, pos + N), this.frameOut);
      for (let n = 0; n < N; n += 1) this.acc[n] += this.frameOut[n];
      const chunk = new Float32Array(H);
      for (let n = 0; n < H; n += 1) chunk[n] = this.acc[n];
      emitted.push(chunk);
      this.acc.copyWithin(0, H);
      this.acc.fill(0, N - H);
      pos += H;
    }
    this.pending = combined.slice(pos);

    let total = this.ready.length;
    for (const c of emitted) total += c.length;
    const queue = new Float32Array(total);
    queue.set(this.ready, 0);
    let off = this.ready.length;
    for (const c of emitted) { queue.set(c, off); off += c.length; }

    const out = new Float32Array(input.length);
    if (queue.length >= input.length) {
      out.set(queue.subarray(0, input.length));
      this.ready = queue.slice(input.length);
    } else {
      out.set(queue, input.length - queue.length);
      this.ready = new Float32Array(0);
    }
    return out;
  }
}
// END SpectralNoiseSuppressor

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

// NavTalk's `data.delta` can arrive with its whitespace stripped, which makes word
// boundaries ambiguous ("deliver" + "ables" is ONE word, "Hello" + "world" is two).
// `raw_data` is the provider's original event, so prefer its delta when it is the same
// text with the original spacing.
function pickTranscriptDelta(message, navData) {
  const cleaned = typeof navData?.delta === "string" ? navData.delta : "";
  const raw = typeof message?.raw_data?.delta === "string" ? message.raw_data.delta : "";
  if (raw && (!cleaned || raw.trim() === cleaned.trim())) return raw;
  return cleaned;
}

// Join the streamed fragments of one spoken turn. If any fragment carries its own
// leading/trailing space the feed preserves spacing, so concatenate exactly (this is
// what keeps "deliver" + "ables" together). Only a feed with no spacing at all falls
// back to guessing word boundaries.
function joinTranscriptDeltas(deltas) {
  const list = Array.isArray(deltas) ? deltas : [];
  if (list.some((piece) => /^\s|\s$/.test(piece))) return list.join("");
  return list.reduce((text, piece) => appendTranscriptDelta(text, piece), "");
}

// NavTalk's `audio_transcript.done` event carries the complete transcript. When it differs
// from the text built out of streamed fragments, decide what to correct.
function planFinalTranscriptUpgrade({ turn, finalText, currentQuestion, newTurnStarted, roadmap }) {
  const finalClean = String(finalText || "").trim();
  if (!finalClean || finalClean === (turn?.text || "")) return { apply: false };

  const plan = {
    apply: true,
    finalText: finalClean,
    // Do not overwrite the subtitle if ALVIN has already started its next turn.
    subtitle: newTurnStarted ? null : finalClean,
    question: "",
  };

  // Re-extract the question only if this turn set it and nothing has changed it since.
  if (!turn?.closing && turn?.question && currentQuestion === turn.question) {
    const corrected = formatQuestionForDisplay(extractDisplayedQuestion(finalClean), roadmap);
    if (corrected && corrected !== turn.question) plan.question = corrected;
  }
  return plan;
}

function appendTranscriptDelta(existingText, deltaText) {
  const existing = String(existingText || "");
  const delta = String(deltaText || "");

  if (!delta) return existing;
  if (!existing) return delta;

  const prev = existing.slice(-1);
  const next = delta.charAt(0);

  // NavTalk/OpenAIRealtime transcript deltas can arrive without the whitespace
  // that was present in natural speech. Preserve explicit whitespace when it
  // exists; otherwise add a boundary between word-like chunks.
  if (/\s/.test(prev) || /\s/.test(next)) {
    return existing + delta;
  }

  // No space before punctuation / closing marks.
  if (/^[,.;:!?%)\]}]/.test(delta)) {
    return existing + delta;
  }

  // No space after opening punctuation.
  if (/[([{]$/.test(existing)) {
    return existing + delta;
  }

  // Keep apostrophe contractions/possessives together.
  if (/^[’']/.test(delta) || /[’']$/.test(existing)) {
    return existing + delta;
  }

  // If both sides look like text tokens, NavTalk likely omitted a word boundary.
  if (/[A-Za-z0-9]$/.test(existing) && /^[A-Za-z0-9]/.test(delta)) {
    return existing + " " + delta;
  }

  // A word right after a comma / semicolon / colon needs a space ("Design,how" -> "Design, how").
  // Only before LETTERS, so numbers like "3,000" and "10:30" are left alone.
  if (/[,;:]$/.test(existing) && /^[A-Za-z]/.test(delta)) {
    return existing + " " + delta;
  }

  // A new capitalized word after sentence punctuation needs a space.
  if (/[.!?]$/.test(existing) && /^[A-Z]/.test(delta)) {
    return existing + " " + delta;
  }

  return existing + delta;
}

function parseGeminiRoadmap(navtalkPrompt) {
  const prompt = String(navtalkPrompt || "");
  const roadmap = [];

  const regex =
    /Q(\d{2}):\s*(.+?)(?:\r?\n)Intent:\s*(.*?)(?=\r?\n\r?\nQ\d{2}:|\r?\n\r?\n#|$)/gs;

  let match;
  while ((match = regex.exec(prompt)) !== null) {
    roadmap.push({
      id: `Q${match[1]}`,
      question: match[2].trim(),
      intent: match[3].trim(),
    });
  }

  return roadmap;
}

function normalizeQuestionForMatch(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Letters and digits only, lower-cased. Ignores every spacing/punctuation quirk.
function compactForMatch(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Clean a spoken question for the on-screen subtitle (and for pairing with the
// candidate's answer). Streamed transcripts can arrive with broken spacing
// ("yourself.What", "I ' m", double spaces), so:
//  1. If ALVIN said a Gemini roadmap question word for word, show the roadmap's
//     original, perfectly formatted text.
//  2. Otherwise repair spacing and capitalization.
function formatQuestionForDisplay(rawText, roadmap) {
  const raw = String(rawText || "");
  if (!raw.trim()) return "";

  const compactSpoken = compactForMatch(raw);
  if (compactSpoken && roadmap?.length) {
    for (const item of roadmap) {
      const compactQuestion = compactForMatch(item.question);
      if (compactQuestion.length >= 12 && compactSpoken.includes(compactQuestion)) {
        return String(item.question).trim();
      }
    }
  }

  return cleanSpokenText(raw);
}

// Repair spacing and capitalisation of anything ALVIN says. Streamed transcripts can
// arrive with broken spacing ("yourself.What", "I ' m", double spaces).
function cleanSpokenText(rawText) {
  const text = String(rawText || "")
    .replace(/\s+/g, " ") // collapse spaces and line breaks
    .replace(/\s*(?:—|--)\s*/g, " — ") // "deliverables—how" -> "deliverables — how"
    .replace(/\s+([,.;:!?%)\]}])/g, "$1") // no space before punctuation
    .replace(/([(\[{])\s+/g, "$1") // no space after an opening bracket
    .replace(/([,;:!?])(?=[A-Za-z])/g, "$1 ") // space after , ; : ! ?
    .replace(/([.])(?=[A-Z][a-z])/g, "$1 ") // "yourself.What" -> "yourself. What"
    .replace(/(\w)\s+(['’])\s*(s|t|re|ve|ll|d|m)\b/gi, "$1$2$3") // "I ' m" -> "I'm"
    .trim();

  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Everything ALVIN says is shown as the subtitle. Split it into a lead-in (greeting,
// short bridge, scenario set-up) and the question itself so the question stands out.
function splitSubtitleParts(spokenText) {
  const cleaned = cleanSpokenText(spokenText);
  if (!cleaned) return { lead: "", question: "" };

  const question = cleanSpokenText(extractDisplayedQuestion(cleaned));
  if (question) {
    const at = cleaned.lastIndexOf(question);
    if (at > 0) {
      return { lead: cleaned.slice(0, at).trim(), question: cleaned.slice(at).trim() };
    }
  }
  return { lead: "", question: cleaned };
}

function findClosestGeminiQuestion(spokenQuestion, roadmap) {
  const spokenTokens = new Set(
    normalizeQuestionForMatch(spokenQuestion)
      .split(" ")
      .filter((word) => word.length > 2)
  );

  if (!spokenTokens.size || !roadmap?.length) return null;

  let best = null;

  for (const item of roadmap) {
    const candidateTokens = new Set(
      normalizeQuestionForMatch(item.question)
        .split(" ")
        .filter((word) => word.length > 2)
    );

    if (!candidateTokens.size) continue;

    let overlap = 0;
    for (const token of spokenTokens) {
      if (candidateTokens.has(token)) overlap += 1;
    }

    const union = new Set([...spokenTokens, ...candidateTokens]).size;
    const score = union ? overlap / union : 0;

    if (!best || score > best.score) {
      best = { ...item, score };
    }
  }

  return best;
}

// ALVIN's fixed closing line (see "Ending the Interview" in the backend prompt).
const CLOSING_LINE =
  "That concludes our interview. Thank you for your time, and best of luck.";

// True when what ALVIN has said so far this turn (`spoken`) is clearly the start of the text
// we expect him to say (`expected`), or a short lead-in followed by the start of it. This lets
// the subtitle show the complete line at once instead of building it up word by word.
function spokenMatchesExpected(spoken, expected) {
  const said = compactForMatch(spoken);
  const planned = compactForMatch(expected);
  if (said.length < 12 || planned.length < 12) return false;

  const at = said.indexOf(planned.slice(0, 12));
  if (at < 0) return false;

  const rest = said.slice(at);
  return planned.startsWith(rest) || rest.startsWith(planned);
}

const CLOSING_REGEX =
  /(that concludes|this concludes|concludes (our|the) interview|end of (our|the) interview|interview is (now )?(complete|over|finished)|thank you for (your time|joining|coming)|best of luck|good luck)/i;

// Closing statements never contain a question mark. That guard prevents a
// false positive from muting the mic in the middle of the interview.
function isClosingStatement(text) {
  const t = String(text || "").trim();
  return !!t && !t.includes("?") && CLOSING_REGEX.test(t);
}

const PROMPT_START =
  /^(please\s+)?(tell|describe|walk|explain|share|give|talk|introduce|discuss|outline|take me|think of|can you|could you|how|what|why|when|where|which|who)\b/i;

function extractDisplayedQuestion(alvinText) {
  const text = String(alvinText || "").trim();
  if (!text) return "";

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  // 1. The last sentence containing a question mark.
  for (let i = sentences.length - 1; i >= 0; i -= 1) {
    if (sentences[i].includes("?")) return sentences[i];
  }

  // 2. Imperative prompts ("Tell me about...", "Describe...").
  for (let i = sentences.length - 1; i >= 0; i -= 1) {
    if (PROMPT_START.test(sentences[i])) {
      return sentences.slice(i).join(" ");
    }
  }

  // 3. Last resort: show the whole turn so the UI never stays stuck.
  return text.length >= 30 ? text : "";
}

// NavTalk transcribes each spoken turn ASYNCHRONOUSLY, so the transcript of an answer
// can arrive after ALVIN has already started replying (or started the closing
// statement). Such a late transcript is still the candidate's answer and must not be
// thrown away, otherwise the last answer of the interview can vanish.
const LATE_TRANSCRIPT_WINDOW_MS = 15000;
const END_SESSION_TRANSCRIPT_WAIT_MS = 6000;

function shouldAcceptCandidateTranscript({
  answerWindowOpen,
  interviewEnded,
  closingPending,
  transcriptOwed,
  msSinceAcceptedSpeechStart,
}) {
  const lateButOwed =
    transcriptOwed && msSinceAcceptedSpeechStart < LATE_TRANSCRIPT_WINDOW_MS;
  if (lateButOwed) return true;
  return answerWindowOpen && !interviewEnded && !closingPending;
}

// Resolves true once no transcript is owed any more, or false after maxMs.
async function waitForOwedTranscripts({
  getOwed,
  getMsSinceSpeechStart,
  sleep,
  maxMs = END_SESSION_TRANSCRIPT_WAIT_MS,
}) {
  let waited = 0;
  while (
    getOwed() > 0 &&
    getMsSinceSpeechStart() < LATE_TRANSCRIPT_WINDOW_MS &&
    waited < maxMs
  ) {
    await sleep(100);
    waited += 100;
  }
  return getOwed() <= 0;
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
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
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

  return { wsUrl: data.ws_url, avatarName: data.avatar_name || "" };
}

async function postBackend(path, payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": APP_API_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
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
    "";

  const navtalkAiPrompt =
    sessionData?.navtalk_ai_prompt ||
    "";

  const navtalkVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const cvCanvasRef = useRef(null);
  const cvRequestInFlightRef = useRef(false);

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

  const remoteAudioContextRef = useRef(null);
  const remoteAudioAnalyserRef = useRef(null);
  const remoteAudioSourceRef = useRef(null);
  const remoteAudioMonitorFrameRef = useRef(null);
  const avatarPlaybackCheckTimeoutRef = useRef(null);
  const avatarAudioActiveRef = useRef(false);
  const avatarLastAudioAtRef = useRef(0);
  const avatarTurnStartedAtRef = useRef(0);
  const avatarMinimumPlaybackEndAtRef = useRef(0);

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
  const realtimePromptReadyRef = useRef(false);
  const consoleGreetingFinishedRef = useRef(false);
  const q01TriggeredRef = useRef(false);
  const q01PromptRestoredRef = useRef(false);
  const pendingQ01ResponseRef = useRef(false);
  const q01SpeechStartedRef = useRef(false);
  const q01AttemptsRef = useRef(0);
  // Exact text ALVIN was told to say for the opening turn (greeting + Q01, or
  // Q01 alone). Reused by the text-turn fallback so both paths stay identical.
  const q01SpeechTextRef = useRef("");
  const q01ConfigSentAtRef = useRef(0);
  // The [INTERVIEW CONTROL] text sent via realtime.input_text for the opening turn.
  const q01ControlTextRef = useRef("");
  // True until the opening turn's transcript has been checked against Q01.
  const q01VerifyPendingRef = useRef(false);
  // Name of the active avatar (from the backend avatar_config table).
  const avatarNameRef = useRef((sessionData?.avatar_name || "").trim());
  // "No answer after 15s -> simplify" bookkeeping.
  const noAnswerTimerRef = useRef(null);
  const simplifyCountRef = useRef(0);
  const simplifyingRef = useRef(false);
  const candidateSpokeThisAnswerRef = useRef(false);
  // Milliseconds of actual speech in the current answer (drives the adaptive hold).
  const candidateSpeechMsRef = useRef(0);
  // Set once the client has declared the current answer finished (and sent silence).
  const answerEndSignalledRef = useRef(false);
  // Recent microphone levels (for the adaptive noise floor) and the last time the
  // candidate was judged to be speaking by the adaptive detector.
  const micRmsHistoryRef = useRef([]);
  const endpointLastSpeechAtRef = useRef(0);
  // Spoken turns whose transcript NavTalk still owes us, and when the latest one began.
  const transcriptOwedRef = useRef(0);
  // ALVIN's spoken turn: the streamed fragments, NavTalk's final transcript (if it arrives
  // before audio.done), and the last finished turn (so the final transcript can correct it).
  const responseDeltasRef = useRef([]);
  const finalTranscriptRef = useRef("");
  const lastAlvinTurnRef = useRef({ text: "", question: "", closing: false, finalized: true });
  const lastAcceptedSpeechStartAtRef = useRef(0);
  const answerEndSentAtRef = useRef(0);
  const armNoAnswerTimerRef = useRef(() => {});
  const q01WatchdogTimerRef = useRef(null);
  const realtimeStatusCountRef = useRef(0);
  const q01ResponseTimerRef = useRef(null);
  const flushPendingQ01ResponseRef = useRef(() => {});
  // The Console First Message is produced by NavTalk itself and may not emit the
  // same realtime.response.audio.done lifecycle as model-generated turns.
  // Detect its actual WebRTC playback instead so Q01 can be triggered without
  // waiting for candidate speech.
  const consoleGreetingAudioSeenRef = useRef(false);
  const consoleGreetingLastAudioAtRef = useRef(0);
  // Candidate speech is accepted only after a real interview question has
  // completely finished playing. The Console greeting never opens an answer window.
  const candidateAnswerEnabledRef = useRef(false);
  // Lets the closing/playback callbacks request the normal finalization flow
  // without creating a dependency-order cycle with handleConfirmEnd.
  const autoEndInterviewRef = useRef(() => {});
  const interviewEndedRef = useRef(false);
  const interviewEndedAtRef = useRef(0);
  const closingPendingRef = useRef(false);
  const closingGraceTimerRef = useRef(null);
  const sessionReadyRef = useRef(false);
  const candidateSpeakingRef = useRef(false);
  const candidateSpeechStopTimerRef = useRef(null);
  const candidateAnswerFinalizeTimerRef = useRef(null);
  const candidateVadSpeakingRef = useRef(false);
  const candidatePendingTranscriptRef = useRef("");
  const candidateLastTranscriptAtRef = useRef(0);
  const candidateLastAudioAtRef = useRef(0);
  const candidateLocalSpeakingRef = useRef(false);
  const generatingQuestionRef = useRef(false);
  const speakingSyncRequestRef = useRef(null);

  const conversationHistoryRef = useRef([]);
  const pendingTranscriptRequestsRef = useRef(new Set());
  const transcriptQueueRef = useRef(Promise.resolve());
  const answerQuestionRef = useRef("");

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

  const [statusMessage, setStatusMessageRaw] =
    useState("Initializing navtalk.Brain runtime...");

  // The active avatar's name (from the avatar_config table). It is known from the session
  // start response and confirmed when the NavTalk connection is created.
  const [avatarName, setAvatarName] = useState(
    (sessionData?.avatar_name || "").trim()
  );

  // Any status line that says "ALVIN" shows the active avatar's name instead, e.g.
  // "Lauren is listening...". Falls back to "ALVIN" if no avatar name is known.
  const setStatusMessage = useCallback((message) => {
    setStatusMessageRaw(
      typeof message === "string"
        ? message.replace(/\bALVIN\b/g, () => avatarNameRef.current || "ALVIN")
        : message
    );
  }, []);

  const [disconnectedReason, setDisconnectedReason] =
    useState(null);

  const [finalizationError, setFinalizationError] =
    useState(null);

  const [showSilenceWarning, setShowSilenceWarning] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(openingQuestion);

  const [interviewComplete, setInterviewComplete] =
    useState(false);

  const [liveConfidence, setLiveConfidence] =
    useState(null);

  // Integrity monitoring: fullscreen + tab/window switch detection.
  // After MAX_VIOLATIONS warnings the interview ends automatically.
  const MAX_VIOLATIONS = 3;
  const lockdown = useInterviewLockdown({
    active:
      sessionStarted &&
      !isFinishing &&
      !interviewComplete &&
      !finalizationError &&
      !disconnectedReason,
    maxViolations: MAX_VIOLATIONS,
    onLimitReached: () => autoEndInterviewRef.current(),
  });

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // What ALVIN is saying right now, live and in full, shown as the on-screen subtitle.
  // (currentQuestion above stays the extracted question used to pair answers.)
  const [avatarSubtitle, setAvatarSubtitle] = useState("");
  const subtitleParts = useMemo(
    () => splitSubtitleParts(avatarSubtitle),
    [avatarSubtitle]
  );
  const subtitleScrollRef = useRef(null);
  // The full line ALVIN is expected to say this turn (known before he finishes saying it),
  // whether it has been shown yet, and a line that must be shown for the very next turn.
  const expectedSubtitleRef = useRef("");
  const subtitleLockedRef = useRef(false);
  const nextTurnSubtitleRef = useRef("");
  useEffect(() => {
    const el = subtitleScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [avatarSubtitle]);

  // Renew the server-side NavTalk queue lease during the live interview.
  useEffect(() => {
    if (!navtalkSessionId || isFinishing) return;
    const heartbeat = () => postBackend('/api/interview/queue/status', {
      session_id: navtalkSessionId,
    }).catch((error) => console.warn('Queue heartbeat failed:', error));
    heartbeat();
    const interval = setInterval(heartbeat, 20000);
    return () => clearInterval(interval);
  }, [navtalkSessionId, isFinishing]);

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

  const syncCandidateSpeaking = useCallback(
    (speaking) => {
      if (!navtalkSessionId) {
        return;
      }

      const requestId = Symbol("candidate-speaking");

      speakingSyncRequestRef.current = requestId;

      postBackend(
        "/api/interview/candidate-speaking",
        {
          session_id: navtalkSessionId,
          speaking,
        }
      ).catch((error) => {
        if (
          speakingSyncRequestRef.current === requestId
        ) {
          console.warn(
            "Candidate speaking sync failed:",
            error
          );
        }
      });
    },
    [navtalkSessionId]
  );

  // Serialize transcript writes so ALVIN and candidate lines arrive in order.
  const enqueueTranscript = useCallback(
    (speaker, text, question) => {
      if (!navtalkSessionId || !text) return Promise.resolve();

      const task = transcriptQueueRef.current
        .catch(() => {})
        .then(() =>
          postBackend("/api/interview/native-transcript", {
            session_id: navtalkSessionId,
            speaker,
            text,
            ...(question ? { question } : {}),
          })
        )
        .catch((error) =>
          console.warn(`Failed to store ${speaker} transcript:`, error)
        );

      transcriptQueueRef.current = task;
      pendingTranscriptRequestsRef.current.add(task);
      task.finally(() => pendingTranscriptRequestsRef.current.delete(task));
      return task;
    },
    [navtalkSessionId]
  );

  // Send any unfinished candidate answer before ending the session.
  const flushCandidateAnswer = useCallback(() => {
    if (candidateAnswerFinalizeTimerRef.current) {
      clearTimeout(candidateAnswerFinalizeTimerRef.current);
      candidateAnswerFinalizeTimerRef.current = null;
    }

    const text = candidateAnswerBufferRef.current.trim();
    if (!text) return Promise.resolve();

    simplifyCountRef.current = 0; // answered: the next question starts fresh
    candidateAnswerBufferRef.current = "";
    candidatePendingTranscriptRef.current = "";
    candidateSpeakingRef.current = false;
    candidateLocalSpeakingRef.current = false;
    syncCandidateSpeaking(false);

    return enqueueTranscript(
      "Candidate",
      text,
      answerQuestionRef.current || currentQuestionRef.current
    );
  }, [enqueueTranscript, syncCandidateSpeaking]);

  const clearSilenceTimer = useCallback(() => {
    // Any candidate or avatar activity cancels the 15s no-answer countdown.
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }

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

  const cancelClosing = useCallback(() => {
    if (!closingPendingRef.current) return;

    closingPendingRef.current = false;

    if (closingGraceTimerRef.current) {
      clearTimeout(closingGraceTimerRef.current);
      closingGraceTimerRef.current = null;
    }

    setStatusMessage("ALVIN is listening...");
    console.log("Closing cancelled: candidate is still answering.");
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
            "/api/interview/navtalk-native-started",
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
              "NavTalk realtime AI connected. Starting interview..."
            );

            console.log(
              "NavTalk native AI session registered:",
              remoteNavTalkSessionId
            );

            if (localStreamRef.current) {
              console.log(
                "Starting PCM audio for NavTalk realtime AI..."
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
        "Could not register the NavTalk realtime AI session."
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
        q01ConfigSentAtRef.current = performance.now();

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

  // Queue the opening turn. Instead of swapping the system prompt and sending an
  // empty response.create (which lets the model improvise), we inject an explicit
  // [INTERVIEW CONTROL] message with realtime.input_text + reply:1. The roadmap
  // prompt is never replaced, so Q02/Q03 rules stay in force for the whole session.
  const speakQuestion = useCallback(
    (questionText, { withGreeting = false } = {}) => {
      if (!questionText) {
        return false;
      }

      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn("Cannot start Q01: WebSocket is not open.");
        return false;
      }

      // Introduce the interviewer by the ACTIVE avatar's name (avatar_config),
      // not a hard-coded one. Same wording as the backend's opening_message.
      const avatarName = (avatarNameRef.current || "").trim();
      const personalizedGreeting = avatarName
        ? `Hello! Welcome to your interview. I'm ${avatarName}, and I'll be conducting your interview today. Let's get started.`
        : openingMessage || DEFAULT_OPENING_GREETING;

      // Exactly what ALVIN must say this turn.
      q01SpeechTextRef.current = withGreeting
        ? `${personalizedGreeting} ${questionText}`
        : questionText;

      q01ControlTextRef.current = withGreeting
        ? `[INTERVIEW CONTROL]
The interview is starting now. In ONE continuous turn, say exactly the following, word for word, without pausing for the candidate to reply:

"${q01SpeechTextRef.current}"

Do not wait for the candidate to speak first.
Do not paraphrase, replace, reorder, or add any other question.
Do not add thanks, praise, commentary, or a second greeting.
After saying it, stop and wait for the candidate's answer.`
        : `[INTERVIEW CONTROL]
The greeting is complete. Ask the application's first interview question now.

Say exactly this question and nothing else:
"${questionText}"

Do not wait for the candidate to speak first.
Do not paraphrase, replace, or add another question.
Do not add thanks, praise, commentary, or another greeting.`;

      // The roadmap prompt is not modified by this approach, so there is no
      // one-turn directive to undo later.
      q01PromptRestoredRef.current = true;

      // Wait for NavTalk to finish applying the roadmap config (session.updated /
      // READY ack), with a timeout, before injecting the text turn.
      pendingQ01ResponseRef.current = true;
      if (q01ResponseTimerRef.current) {
        clearTimeout(q01ResponseTimerRef.current);
      }
      q01ResponseTimerRef.current = setTimeout(() => {
        flushPendingQ01ResponseRef.current?.("config ack timeout");
      }, Q01_CONFIG_ACK_TIMEOUT_MS);

      return true;
    },
    [openingMessage]
  );

  const flushPendingQ01Response = useCallback(
    (reason) => {
      if (!pendingQ01ResponseRef.current || cancelledRef.current) return;

      pendingQ01ResponseRef.current = false;
      if (q01ResponseTimerRef.current) {
        clearTimeout(q01ResponseTimerRef.current);
        q01ResponseTimerRef.current = null;
      }

      const sendAttempt = (mode) => {
        if (cancelledRef.current || q01SpeechStartedRef.current) return;

        q01AttemptsRef.current += 1;
        const ws = wsRef.current;

        if (!ws || ws.readyState !== WebSocket.OPEN) {
          console.warn("[Q01] Cannot send: WebSocket not open.");
          return;
        }

        const controlText = q01ControlTextRef.current;
        if (!controlText) {
          console.error("[Q01] No opening control text was prepared.");
          return;
        }

        try {
          ws.send(
            JSON.stringify({
              type: NavTalkMessageType.INPUT_TEXT,
              data: { content: controlText, reply: 1 },
            })
          );
          q01VerifyPendingRef.current = true;

          console.group("[PROACTIVE GEMINI Q01]");
          console.log(`Sent realtime.input_text reply=1 (${mode}, ${reason}).`);
          console.log("[EXPECTED GEMINI Q01]", openingQuestion);
          console.log("[EXPECTED SPEECH]", q01SpeechTextRef.current);
          console.groupEnd();
        } catch (error) {
          console.error("[Q01] realtime.input_text failed:", error);
        }

        if (q01WatchdogTimerRef.current) {
          clearTimeout(q01WatchdogTimerRef.current);
        }
        q01WatchdogTimerRef.current = setTimeout(() => {
          if (q01SpeechStartedRef.current || cancelledRef.current) return;

          if (q01AttemptsRef.current < 2) {
            console.warn("[Q01] No speech yet; retrying realtime.input_text once.");
            sendAttempt("retry");
          } else {
            console.error(
              "[Q01] ALVIN still did not speak after 2 attempts; falling back to candidate-triggered start."
            );

            // Don't leave the interview deadlocked with the microphone gated.
            // Open the answer window so that when the candidate speaks,
            // NavTalk's own turn detection makes ALVIN reply, and the Startup
            // Contract in the roadmap prompt makes that reply Q01.
            avatarSpeakingGateRef.current = false;
            avatarTurnStartedAtRef.current = 0;
            candidateAnswerEnabledRef.current = true;
            setStatusMessage(
              "ALVIN is listening. Say hello to begin the interview."
            );
          }
        }, Q01_SPEECH_WATCHDOG_MS);
      };

      q01SpeechStartedRef.current = false;
      q01AttemptsRef.current = 0;

      // Send only once (a) the roadmap config has had a moment to apply and
      // (b) the avatar's WebRTC stream is attached, so the first words are not
      // lost. Never wait longer than Q01_AVATAR_WAIT_MS.
      const waitStartedAt = performance.now();
      const waitThenSend = () => {
        if (cancelledRef.current) return;
        const now = performance.now();
        const configSettled =
          now - q01ConfigSentAtRef.current >= Q01_CONFIG_TO_RESPONSE_DELAY_MS;
        const avatarReady = Boolean(remoteStreamRef.current);
        if (
          (configSettled && avatarReady) ||
          now - waitStartedAt >= Q01_AVATAR_WAIT_MS
        ) {
          sendAttempt("first");
          return;
        }
        setTimeout(waitThenSend, 100);
      };
      waitThenSend();
    },
    [openingQuestion]
  );

  useEffect(() => {
    flushPendingQ01ResponseRef.current = flushPendingQ01Response;
  }, [flushPendingQ01Response]);

  // Single entry point for "greeting is over -> ask Q01". Every detection path
  // (WebRTC silence, audio.done, READY arriving late, failsafe) goes through here
  // so Q01 is spoken exactly once, with the exact Gemini-generated wording.
  const triggerFirstQuestion = useCallback(
    (reason) => {
      if (q01TriggeredRef.current || cancelledRef.current) {
        return false;
      }

      consoleGreetingFinishedRef.current = true;

      if (!realtimePromptReadyRef.current) {
        console.log(`[Q01] Deferred: realtime prompt not ready yet (${reason}).`);
        return false;
      }

      if (!openingQuestion) {
        console.warn("Q01 cannot start: no opening question in session data.");
        return false;
      }

      if (FIRST_MESSAGE_INCLUDES_Q01) {
        // The Console First Message already asked the opening question.
        q01TriggeredRef.current = true;
        q01PromptRestoredRef.current = true;
        q01SpeechStartedRef.current = true;
        console.log(
          `First Message finished (${reason}); it already contains Q01. Opening the answer window.`
        );

        if (openingQuestion) {
          currentQuestionRef.current = openingQuestion;
          setCurrentQuestion(openingQuestion);
        }

        avatarSpeakingGateRef.current = false;
        avatarTurnStartedAtRef.current = 0;
        candidateAnswerEnabledRef.current = true;
        setStatusMessage("ALVIN is listening...");
        notifyAvatarDoneRef.current?.();
        armNoAnswerTimerRef.current?.();
        return true;
      }

      q01TriggeredRef.current = true;
      candidateAnswerEnabledRef.current = false;
      console.log(
        CLIENT_SPEAKS_OPENING
          ? `Starting interview (${reason}); ALVIN will speak the greeting and then Q01.`
          : `Greeting finished (${reason}); automatically speaking Q01.`
      );
      setStatusMessage(
        CLIENT_SPEAKS_OPENING
          ? "ALVIN is starting the interview..."
          : "ALVIN is asking the first question..."
      );

      const ok = speakQuestion(openingQuestion, {
        withGreeting: CLIENT_SPEAKS_OPENING,
      });
      if (!ok) {
        // WebSocket not ready: allow another path to retry.
        q01TriggeredRef.current = false;
      }
      return ok;
    },
    [openingQuestion, speakQuestion]
  );

  const notifyAvatarDoneRef = useRef(() => {});
  const triggerFirstQuestionRef = useRef(() => false);
  useEffect(() => {
    triggerFirstQuestionRef.current = triggerFirstQuestion;
  }, [triggerFirstQuestion]);

  const sendOpeningMessage = useCallback(() => {
    if (openingSentRef.current) return;

    if (!navtalkAiPrompt) {
      console.warn("No NavTalk AI interview prompt is available.");
      return;
    }

    const sent = sendNavTalkConfig(navtalkAiPrompt);

    if (sent) {
      openingSentRef.current = true;
      currentQuestionRef.current = openingQuestion;
      setCurrentQuestion(openingQuestion);
      conversationHistoryRef.current = openingQuestion
        ? [{ speaker: "ALVIN", text: openingQuestion }]
        : [];
      setStatusMessage("ALVIN is starting the interview...");
    }
  }, [navtalkAiPrompt, openingQuestion, sendNavTalkConfig]);

  const notifyAvatarDone = useCallback(async () => {
    if (!navtalkSessionId || cancelledRef.current) {
      return;
    }

    try {
      await postBackend("/api/interview/avatar-done", {
        session_id: navtalkSessionId,
        navtalk_session_id: navtalkSessionIdRef.current,
      });
      console.log(
        "Backend notified that avatar playback ended."
      );
    } catch (error) {
      console.warn("Failed to arm silence timer:", error);
    }
  }, [navtalkSessionId]);

  useEffect(() => {
    notifyAvatarDoneRef.current = notifyAvatarDone;
  }, [notifyAvatarDone]);

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
        const reply =
          result?.reply?.trim();
        const advanced =
          result?.advanced === true;

        if (!question) {
          throw new Error(
            "Gemini returned an empty question."
          );
        }

        if (advanced) {
          currentQuestionRef.current =
            question;
          setCurrentQuestion(question);
        }

        console.log(
          "Gemini decision:",
          {
            advanced,
            question,
            reply,
          }
        );

        return {
          question,
          reply,
          advanced,
        };
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
    [navtalkSessionId, speakQuestion]
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

  // After a question has finished playing: if the candidate stays completely
  // silent for NO_ANSWER_SIMPLIFY_MS, ALVIN restates the same question more simply.
  // Driven from the browser because only it can speak through the NavTalk socket.
  const armNoAnswerTimer = useCallback(() => {
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }

    candidateSpokeThisAnswerRef.current = false;
    candidateSpeechMsRef.current = 0;
    answerEndSignalledRef.current = false;
    answerEndSentAtRef.current = 0;
    endpointLastSpeechAtRef.current = 0;

    if (interviewEndedRef.current || closingPendingRef.current) return;

    const candidateHasSaidSomething = () =>
      candidateSpokeThisAnswerRef.current ||
      candidateSpeakingRef.current ||
      Boolean(candidateAnswerBufferRef.current.trim());

    noAnswerTimerRef.current = setTimeout(async () => {
      noAnswerTimerRef.current = null;

      if (
        cancelledRef.current ||
        interviewEndedRef.current ||
        closingPendingRef.current ||
        !candidateAnswerEnabledRef.current ||
        avatarSpeakingGateRef.current ||
        candidateHasSaidSomething()
      ) {
        return;
      }

      if (simplifyCountRef.current >= MAX_SIMPLIFICATIONS_PER_QUESTION) {
        console.log("[NO ANSWER] Simplification limit reached for this question.");
        return;
      }

      simplifyCountRef.current += 1;
      simplifyingRef.current = true;
      setShowSilenceWarning(true);
      setStatusMessage("ALVIN is simplifying the question...");

      try {
        console.log(
          `[NO ANSWER] No audio for ${NO_ANSWER_SIMPLIFY_MS / 1000}s; simplifying the question.`
        );

        const simplified = await requestSimplifiedQuestion();

        // The candidate may have started talking while Gemini was working.
        if (
          !simplified ||
          cancelledRef.current ||
          interviewEndedRef.current ||
          closingPendingRef.current ||
          avatarSpeakingGateRef.current ||
          candidateHasSaidSomething()
        ) {
          return;
        }

        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const spoken = `No problem, take your time. Let me put that a little more simply. ${simplified.replace(/"/g, "'")}`;
        nextTurnSubtitleRef.current = spoken;

        ws.send(
          JSON.stringify({
            type: NavTalkMessageType.INPUT_TEXT,
            data: {
              content: `[INTERVIEW CONTROL]
The candidate has not answered for about ${NO_ANSWER_SIMPLIFY_MS / 1000} seconds. Help them by making the SAME question easier.

Say exactly the following, word for word, and nothing else:
"${spoken}"

Do not add another question, praise, or commentary.
After saying it, stop and wait for the candidate's answer.`,
              reply: 1,
            },
          })
        );

        console.log("[NO ANSWER] Sent simplified question:", simplified);
      } finally {
        simplifyingRef.current = false;
        setShowSilenceWarning(false);
      }
    }, NO_ANSWER_SIMPLIFY_MS);
  }, [requestSimplifiedQuestion]);

  useEffect(() => {
    armNoAnswerTimerRef.current = armNoAnswerTimer;
  }, [armNoAnswerTimer]);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  const handleStartInterview = () => {
    // Must run synchronously inside the click to be allowed by the browser.
    lockdown.enterFullscreen();

    if (!navtalkSessionId) {
      setDisconnectedReason(
        "Missing interview session ID."
      );

      return;
    }

    cancelledRef.current = false;

    openingSentRef.current = false;
    realtimePromptReadyRef.current = false;
    consoleGreetingFinishedRef.current = false;
    q01TriggeredRef.current = false;
    q01PromptRestoredRef.current = false;
    pendingQ01ResponseRef.current = false;
    q01SpeechStartedRef.current = false;
    q01AttemptsRef.current = 0;
    realtimeStatusCountRef.current = 0;
    consoleGreetingAudioSeenRef.current = false;
    consoleGreetingLastAudioAtRef.current = 0;
    candidateAnswerEnabledRef.current = false;
    interviewEndedRef.current = false;
    setInterviewComplete(false);

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
      if (interviewEndedRef.current) return;

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

        // Streaming noise suppressor for this microphone session. If anything goes
        // wrong with it, the raw microphone signal is used instead.
        const noiseSuppressor = MIC_NOISE_SUPPRESSION_ENABLED
          ? new SpectralNoiseSuppressor(24000)
          : null;
        console.log(
          noiseSuppressor
            ? "Microphone noise suppression: ON"
            : "Microphone noise suppression: OFF"
        );

        // Send `ms` of digital silence to NavTalk instantly (not in real time).
        const sendSilence = (socket, ms) => {
          const totalSamples = Math.round((24000 * ms) / 1000);
          const block = new Float32Array(8192); // all zeros
          let remaining = totalSamples;

          while (remaining > 0) {
            const count = Math.min(block.length, remaining);
            const pcm = floatTo16BitPCM(
              count === block.length ? block : block.subarray(0, count)
            );
            const base64 = base64EncodeAudio(new Uint8Array(pcm));

            for (let i = 0; i < base64.length; i += 4096) {
              socket.send(
                JSON.stringify({
                  type: NavTalkMessageType.INPUT_AUDIO_BUFFER_APPEND,
                  data: { audio: base64.slice(i, i + 4096) },
                })
              );
            }

            remaining -= count;
          }
        };

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
              interviewEndedRef.current ||
              avatarSpeakingGateRef.current ||
              !candidateAnswerEnabledRef.current
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

            const rawInput =
              event.inputBuffer.getChannelData(
                0
              );

            let input = rawInput;
            if (noiseSuppressor) {
              try {
                input = noiseSuppressor.process(rawInput);
              } catch (error) {
                console.warn("Noise suppression failed; using raw audio:", error);
                input = rawInput;
              }
            }

            let sumSquares = 0;
            for (let i = 0; i < input.length; i += 1) {
              sumSquares += input[i] * input[i];
            }

            const rms = Math.sqrt(
              sumSquares / Math.max(1, input.length)
            );

            // ---- Client-side end-of-answer detection (see THINKING_HOLD_* above) ----
            // Levels are judged against this microphone's own noise floor, so a soft
            // speaker is never mistaken for silence (and a noisy room for speech).
            const levelHistory = micRmsHistoryRef.current;
            levelHistory.push(rms);
            if (levelHistory.length > MIC_LEVEL_HISTORY_CHUNKS) levelHistory.shift();

            const noiseFloor = Math.min(...levelHistory);
            const endpointThreshold = Math.min(
              ENDPOINT_MAX_SPEECH_RMS,
              Math.max(
                ENDPOINT_MIN_SPEECH_RMS,
                noiseFloor * ENDPOINT_NOISE_FLOOR_FACTOR
              )
            );
            // Only audio this close to the noise floor is withheld during a pause.
            const withholdBelowRms = Math.max(
              0.0015,
              Math.min(noiseFloor * 1.5, endpointThreshold * 0.6)
            );
            const nowMs = performance.now();

            // Local "candidate is speaking" flag: never more sensitive than the original
            // fixed level, but it rises with the noise floor so a steady fan does not
            // count as speech forever.
            if (rms >= Math.max(CANDIDATE_SPEECH_RMS_THRESHOLD, endpointThreshold)) {
              if (closingPendingRef.current) cancelClosing();

              candidateLastAudioAtRef.current = performance.now();
              candidateLocalSpeakingRef.current = true;

              if (!candidateSpeakingRef.current) {
                candidateSpeakingRef.current = true;
                clearSilenceTimer();
                setShowSilenceWarning(false);
                syncCandidateSpeaking(true);
                console.log(
                  "Local microphone speech detected; answer finalization paused."
                );
              }
            }

            // ---- Client-side end-of-answer detection (see THINKING_HOLD_* above) ----
            if (rms >= endpointThreshold) {
              endpointLastSpeechAtRef.current = nowMs;
              candidateSpokeThisAnswerRef.current = true;
              candidateSpeechMsRef.current += (input.length / 24000) * 1000;
              answerEndSignalledRef.current = false;
            }

            if (
              candidateSpokeThisAnswerRef.current &&
              endpointLastSpeechAtRef.current > 0 &&
              rms < endpointThreshold
            ) {
              const quietForMs = nowMs - endpointLastSpeechAtRef.current;
              const holdMs = getThinkingHoldMs(candidateSpeechMsRef.current);

              if (quietForMs < holdMs) {
                // Still within thinking time: withhold only dead-quiet audio so a
                // pause or an "uhm" does not end the turn. Anything louder than
                // the noise floor is still forwarded in case it is soft speech.
                if (rms < withholdBelowRms) {
                  return;
                }
              } else if (!answerEndSignalledRef.current) {
                // The pause reached the hold: treat the answer as finished and tell
                // NavTalk right now with a short burst of digital silence. Audio then
                // keeps flowing normally, so nothing is ever discarded after this.
                answerEndSignalledRef.current = true;
                answerEndSentAtRef.current = nowMs;

                try {
                  sendSilence(ws, ANSWER_END_SILENCE_INJECT_MS);
                  console.log(
                    `[ANSWER END] ${Math.round(quietForMs)} ms of quiet after ` +
                      `${Math.round(candidateSpeechMsRef.current)} ms of speech ` +
                      `(mic noise floor ${noiseFloor.toFixed(4)}, speech threshold ` +
                      `${endpointThreshold.toFixed(4)}); sent ${ANSWER_END_SILENCE_INJECT_MS} ms of silence.`
                  );
                } catch (error) {
                  console.warn("[ANSWER END] Could not send silence:", error);
                }
              }
            }

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
    }, [
      clearSilenceTimer,
      syncCandidateSpeaking,
      cancelClosing,
    ]);

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

  const stopMicAfterInterview = useCallback(() => {
    if (interviewEndedRef.current) return;

    interviewEndedRef.current = true;
    interviewEndedAtRef.current = performance.now();
    micActiveRef.current = false;

    setMicActive(false);
    setInterviewComplete(true);
    setStatusMessage("Interview complete.");

    stopAudioStreaming();
    clearSilenceTimer();
    syncCandidateSpeaking(false);

    localStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = false));

    console.log("Interview complete: microphone stopped.");
  }, [stopAudioStreaming, clearSilenceTimer, syncCandidateSpeaking]);

  // Called after the outro has FINISHED PLAYING. Ends the interview only if
  // the candidate stays quiet for the grace window.
  const beginClosingGrace = useCallback(() => {
    if (closingGraceTimerRef.current) {
      clearTimeout(closingGraceTimerRef.current);
    }

    setStatusMessage("Wrapping up...");

    closingGraceTimerRef.current = setTimeout(() => {
      closingGraceTimerRef.current = null;

      if (!closingPendingRef.current) return;

      if (
        candidateVadSpeakingRef.current ||
        candidateLocalSpeakingRef.current
      ) {
        cancelClosing();
        return;
      }

      closingPendingRef.current = false;
      stopMicAfterInterview();
    }, CLOSING_GRACE_MS);
  }, [cancelClosing, stopMicAfterInterview]);

  const stopRemoteAudioMonitor = useCallback(() => {
    if (remoteAudioMonitorFrameRef.current) {
      cancelAnimationFrame(remoteAudioMonitorFrameRef.current);
      remoteAudioMonitorFrameRef.current = null;
    }

    if (avatarPlaybackCheckTimeoutRef.current) {
      clearTimeout(avatarPlaybackCheckTimeoutRef.current);
      avatarPlaybackCheckTimeoutRef.current = null;
    }

    if (remoteAudioSourceRef.current) {
      try {
        remoteAudioSourceRef.current.disconnect();
      } catch {}
      remoteAudioSourceRef.current = null;
    }

    if (remoteAudioContextRef.current) {
      try {
        if (remoteAudioContextRef.current.state !== "closed") {
          remoteAudioContextRef.current.close();
        }
      } catch {}
      remoteAudioContextRef.current = null;
    }

    remoteAudioAnalyserRef.current = null;
    avatarAudioActiveRef.current = false;
    avatarLastAudioAtRef.current = 0;
  }, []);

  const startRemoteAudioMonitor = useCallback(
    (stream) => {
      if (!stream?.getAudioTracks?.().length) {
        console.warn("NavTalk remote stream has no audio track to monitor.");
        return;
      }

      stopRemoteAudioMonitor();

      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        source.connect(analyser);

        remoteAudioContextRef.current = audioContext;
        remoteAudioSourceRef.current = source;
        remoteAudioAnalyserRef.current = analyser;

        audioContext.resume().catch(() => {});

        const samples = new Float32Array(analyser.fftSize);

        const monitor = () => {
          if (cancelledRef.current || !remoteAudioAnalyserRef.current) {
            return;
          }

          analyser.getFloatTimeDomainData(samples);

          let sumSquares = 0;
          for (let i = 0; i < samples.length; i += 1) {
            sumSquares += samples[i] * samples[i];
          }

          const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));

          const now = performance.now();

          if (rms >= AVATAR_AUDIO_RMS_THRESHOLD) {
            avatarAudioActiveRef.current = true;
            avatarLastAudioAtRef.current = now;

            // Before Q01, any remote avatar audio is the NavTalk Console
            // First Message. Remember that we actually heard it.
            if (!q01TriggeredRef.current) {
              consoleGreetingAudioSeenRef.current = true;
              consoleGreetingLastAudioAtRef.current = now;
            }
          } else if (
            !q01TriggeredRef.current &&
            realtimePromptReadyRef.current &&
            consoleGreetingAudioSeenRef.current &&
            consoleGreetingLastAudioAtRef.current > 0 &&
            now - consoleGreetingLastAudioAtRef.current >=
              CONSOLE_GREETING_END_SILENCE_MS
          ) {
            // The Console First Message has really finished playing. Speak the
            // generated Q01 so the candidate never has to reply between the
            // introduction and the first interview question.
            triggerFirstQuestion("WebRTC greeting playback ended");
          }

          remoteAudioMonitorFrameRef.current =
            requestAnimationFrame(monitor);
        };

        monitor();
        console.log("NavTalk WebRTC audio monitor started.");
      } catch (error) {
        console.warn("Could not monitor NavTalk WebRTC audio:", error);
      }
    },
    [stopRemoteAudioMonitor, triggerFirstQuestion]
  );

  const waitForActualAvatarPlaybackEnd = useCallback(() => {
    if (avatarPlaybackCheckTimeoutRef.current) {
      clearTimeout(avatarPlaybackCheckTimeoutRef.current);
      avatarPlaybackCheckTimeoutRef.current = null;
    }

    const startedWaitingAt = performance.now();

    const checkPlayback = () => {
      if (cancelledRef.current) return;

      const now = performance.now();
      const lastAudioAt = avatarLastAudioAtRef.current;
      const silenceFor = lastAudioAt > 0 ? now - lastAudioAt : 0;
      const minimumPlaybackElapsed =
        now >= avatarMinimumPlaybackEndAtRef.current;
      const audioHasSettled =
        !avatarAudioActiveRef.current ||
        silenceFor >= AVATAR_END_SILENCE_MS;

      if (
        now - startedWaitingAt >= AVATAR_POST_DONE_MIN_WAIT_MS &&
        minimumPlaybackElapsed &&
        audioHasSettled
      ) {
        avatarAudioActiveRef.current = false;
        avatarSpeakingGateRef.current = false;
        avatarTurnStartedAtRef.current = 0;
        avatarMinimumPlaybackEndAtRef.current = 0;

        if (avatarGateFailsafeTimeoutRef.current) {
          clearTimeout(avatarGateFailsafeTimeoutRef.current);
          avatarGateFailsafeTimeoutRef.current = null;
        }

        console.log(
          "Avatar WebRTC audio actually finished playing."
        );

        // First avatar turn is NavTalk Console First Message (greeting only).
        // Do not arm the candidate silence timer yet. Ask Gemini-generated Q01.
        if (!q01TriggeredRef.current) {
          triggerFirstQuestion("greeting audio.done + playback ended");
          return;
        }

        if (interviewEndedRef.current) {
          setStatusMessage("Interview complete. You may end the session.");
          return;
        }

        if (closingPendingRef.current) {
          console.log(
            "Outro finished playing; stopping microphone and automatically finalizing interview."
          );
          closingPendingRef.current = false;
          candidateAnswerEnabledRef.current = false;
          stopMicAfterInterview();

          // Allow React/state cleanup to settle, then use the exact same safe
          // shutdown + results flow as the manual End Interview action.
          setTimeout(() => {
            autoEndInterviewRef.current?.();
          }, 150);
          return;
        }

        // Q01's one-turn directive must not linger: restore the clean roadmap
        // prompt so later turns follow Q02, Q03... and the answer routing.
        if (!q01PromptRestoredRef.current && navtalkAiPrompt) {
          q01PromptRestoredRef.current = true;
          sendNavTalkConfig(navtalkAiPrompt);
          console.log("Q01 spoken; roadmap prompt restored for the remaining turns.");
        }

        // A question has now FINISHED playing. Only now may candidate speech
        // become part of an answer. This deliberately excludes the Console greeting.
        candidateAnswerEnabledRef.current = true;
        setStatusMessage("ALVIN is listening...");
        notifyAvatarDone();
        armNoAnswerTimerRef.current?.();
        return;
      }

      // Do not use a short timeout fallback here. A fallback can arm the
      // backend countdown while buffered WebRTC audio is still playing.
      // The existing avatar gate failsafe remains the emergency escape hatch.

      avatarPlaybackCheckTimeoutRef.current = setTimeout(
        checkPlayback,
        AVATAR_PLAYBACK_CHECK_MS
      );
    };

    checkPlayback();
  }, [
    notifyAvatarDone,
    triggerFirstQuestion,
    stopMicAfterInterview,
    sendNavTalkConfig,
    navtalkAiPrompt,
  ]);

  const attachRemoteStream =
    useCallback((stream) => {
      if (!stream) {
        return;
      }

      remoteStreamRef.current =
        stream;

      startRemoteAudioMonitor(stream);

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
    }, [startRemoteAudioMonitor]);

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

        const connection =
          await fetchNavTalkWsUrl(
            navtalkSessionId
          );
        wsUrl = connection.wsUrl;
        if (connection.avatarName) {
          avatarNameRef.current = connection.avatarName;
          setAvatarName(connection.avatarName);
        }
        console.log(
          "Active avatar:",
          connection.avatarName || "(none configured)"
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
          "Connecting ALVIN..."
        );

        // Do NOT send realtime.input_config here.
        // NavTalk can discard provider frames before realtime input is READY.
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

          // realtime.status READY is sent repeatedly by NavTalk; log it only
          // occasionally so the useful lines are not buried.
          if (type === NavTalkMessageType.REALTIME_STATUS) {
            realtimeStatusCountRef.current += 1;
          }
          const noisyStatus =
            type === NavTalkMessageType.REALTIME_STATUS &&
            realtimeStatusCountRef.current > 3 &&
            realtimeStatusCountRef.current % 50 !== 0;

          if (!noisyStatus) {
            console.log(
              "NavTalk event:",
              type,
              message
            );
          }

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
                  "NavTalk did not return a realtime session ID."
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
                  "NavTalk did not return a realtime session ID."
                );
                break;
              }

              setStatusMessage(
                "Starting NavTalk realtime AI..."
              );

              // Do not send provider frames here. NavTalk can emit
              // realtime.session.created before its provider input is ready.
              // The opening bootstrap is sent only after READY + a confirmed
              // post-ready session.update below.

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

              // A pending Q01 was waiting for NavTalk to apply its new config.
              flushPendingQ01ResponseRef.current?.("session.updated ack");

              // NavTalk Console First Message owns the opening turn.
              // Do not inject the opening turn here; it is sent after READY + config ack.


              break;
            }

            case NavTalkMessageType.REALTIME_STATUS: {
              if (realtimeStatusCountRef.current <= 3) {
                console.log("NavTalk realtime status:", navData);
              }

              const realtimeStatus =
                navData?.data || navData || {};

              const realtimePhase =
                String(realtimeStatus?.phase || "").toLowerCase();
              const realtimeState =
                String(realtimeStatus?.status || "").toLowerCase();
              const realtimeMessage =
                String(
                  realtimeStatus?.message ||
                  navData?.message ||
                  ""
                ).toLowerCase();

              const realtimeInputReady =
                (realtimePhase === "ready" &&
                  realtimeState === "success") ||
                realtimeMessage.includes("realtime input is ready");

              if (realtimeInputReady && realtimePromptReadyRef.current) {
                // Already configured. Re-sending the prompt here on every READY
                // can reset the session and cancel Q01, so only ack a pending Q01.
                if (realtimeStatusCountRef.current % 50 === 0) {
                  console.log(
                    `NavTalk READY repeated ${realtimeStatusCountRef.current}x; prompt already applied.`
                  );
                }
                flushPendingQ01ResponseRef.current?.("READY ack");
                // If the first attempt could not start (e.g. socket not open yet), retry.
                if (CLIENT_SPEAKS_OPENING && !q01TriggeredRef.current) {
                  triggerFirstQuestionRef.current?.(
                    "READY retry: client-driven greeting + Q01"
                  );
                }
                break;
              }

              if (realtimeInputReady) {
                console.log(
                  "NavTalk realtime input is READY; applying Gemini roadmap prompt."
                );

                const configured = sendNavTalkConfig(navtalkAiPrompt);

                if (configured) {
                  openingSentRef.current = true;
                  realtimePromptReadyRef.current = true;
                  currentQuestionRef.current = openingQuestion;
                  setCurrentQuestion(openingQuestion);

                  console.log(
                    CLIENT_SPEAKS_OPENING
                      ? "Gemini roadmap prompt applied. ALVIN will be told to greet and ask Q01 via realtime.input_text."
                      : "Gemini roadmap prompt applied. Waiting for Console greeting to finish before Q01."
                  );
                  const geminiRoadmap =
                    parseGeminiRoadmap(navtalkAiPrompt);

                  console.group("[GEMINI ROADMAP] Generated interview questions");
                  geminiRoadmap.forEach((item) => {
                    console.log(
                      `${item.id}:`,
                      item.question,
                      "| intent:",
                      item.intent
                    );
                  });
                  console.groupEnd();

                  if (CLIENT_SPEAKS_OPENING) {
                    // Console First Message is empty, so nothing plays on its
                    // own: start the interview ourselves (greeting, then Q01).
                    triggerFirstQuestionRef.current?.(
                      "READY: client-driven greeting + Q01"
                    );
                  }

                  // If the greeting already finished before READY arrived,
                  // immediately ask Q01 now.
                  if (
                    consoleGreetingFinishedRef.current &&
                    !q01TriggeredRef.current
                  ) {
                    triggerFirstQuestionRef.current?.(
                      "READY arrived after greeting finished"
                    );
                  }

                  // Failsafe: if no greeting audio is ever detected, don't
                  // leave the candidate waiting in silence forever.
                  setTimeout(() => {
                    if (
                      !q01TriggeredRef.current &&
                      !consoleGreetingAudioSeenRef.current &&
                      !avatarSpeakingGateRef.current
                    ) {
                      triggerFirstQuestionRef.current?.(
                        "failsafe: no greeting audio detected"
                      );
                    }
                  }, Q01_FAILSAFE_AFTER_READY_MS);
                }

                setStatusMessage(
                  "ALVIN is starting the interview..."
                );
              }

              break;
            }

            case NavTalkMessageType.SPEECH_STARTED: {
              if (interviewEndedRef.current) break;

              // Ignore speech during the Console greeting, while ALVIN is speaking,
              // and after the closing turn. The candidate should answer questions only.
              if (!candidateAnswerEnabledRef.current || avatarSpeakingGateRef.current) {
                console.log(
                  "Ignoring candidate speech because no interview answer window is open."
                );
                break;
              }

              candidateVadSpeakingRef.current = true;
              candidateSpeakingRef.current = true;
              candidateLocalSpeakingRef.current = true;
              candidateLastAudioAtRef.current = performance.now();
              transcriptOwedRef.current += 1;
              lastAcceptedSpeechStartAtRef.current = performance.now();
              // Keep the current answer when speech resumes after a pause.
              if (!candidateAnswerBufferRef.current) {
                answerQuestionRef.current = currentQuestionRef.current;
              }

              if (candidateSpeechStopTimerRef.current) {
                clearTimeout(candidateSpeechStopTimerRef.current);
                candidateSpeechStopTimerRef.current = null;
              }

              if (candidateAnswerFinalizeTimerRef.current) {
                clearTimeout(candidateAnswerFinalizeTimerRef.current);
                candidateAnswerFinalizeTimerRef.current = null;
              }

              clearSilenceTimer();
              setShowSilenceWarning(false);
              syncCandidateSpeaking(true);

              console.log(
                "Candidate speech detected. Backend silence timer paused."
              );

              break;
            }

            case NavTalkMessageType.SPEECH_STOPPED: {
              candidateVadSpeakingRef.current = false;
              candidateLocalSpeakingRef.current = false;

              console.log(
                "NavTalk speech stopped; waiting for transcript stability before finalizing the answer."
              );
              if (candidateSpokeThisAnswerRef.current) {
                console.log(
                  "[TIMING] NavTalk speech_stopped:",
                  describeAnswerTiming(
                    endpointLastSpeechAtRef.current,
                    answerEndSentAtRef.current
                  )
                );
              }

              break;
            }

            case NavTalkMessageType.INPUT_AUDIO_TRANSCRIPTION_COMPLETED: {
              // The Console greeting is not a question and requires no response.
              // Also reject late/background transcripts once ALVIN starts another turn
              // or the interview is closing/finished.
              const transcriptWasOwed = transcriptOwedRef.current > 0;
              if (transcriptOwedRef.current > 0) transcriptOwedRef.current -= 1;

              if (
                !shouldAcceptCandidateTranscript({
                  answerWindowOpen: candidateAnswerEnabledRef.current,
                  interviewEnded: interviewEndedRef.current,
                  closingPending: closingPendingRef.current,
                  transcriptOwed: transcriptWasOwed,
                  msSinceAcceptedSpeechStart:
                    performance.now() - lastAcceptedSpeechStartAtRef.current,
                })
              ) {
                console.log(
                  "Ignoring candidate transcript because no interview answer window is open."
                );
                break;
              }

              if (
                transcriptWasOwed &&
                (!candidateAnswerEnabledRef.current ||
                  closingPendingRef.current ||
                  interviewEndedRef.current)
              ) {
                console.log(
                  "Late candidate transcript accepted: it arrived after ALVIN started replying."
                );
              }

              const candidateText =
                extractCandidateText(message)?.trim();

              if (!candidateText || candidateText.length < 2) {
                console.warn(
                  "NavTalk transcription event had no usable text:",
                  message
                );
                break;
              }

              const existing = candidateAnswerBufferRef.current.trim();

              if (!existing) {
                candidateAnswerBufferRef.current = candidateText;
              } else if (candidateText.startsWith(existing)) {
                candidateAnswerBufferRef.current = candidateText;
              } else if (!existing.endsWith(candidateText)) {
                candidateAnswerBufferRef.current = `${existing} ${candidateText}`.trim();
              }

              candidatePendingTranscriptRef.current =
                candidateAnswerBufferRef.current;
              candidateLastTranscriptAtRef.current = performance.now();
              clearSilenceTimer();

              console.log(
                "Candidate transcript chunk received; waiting for answer to settle:",
                candidateText
              );
              console.log(
                "[TIMING] transcript received:",
                describeAnswerTiming(
                    endpointLastSpeechAtRef.current,
                  answerEndSentAtRef.current
                )
              );

              if (candidateAnswerFinalizeTimerRef.current) {
                clearTimeout(candidateAnswerFinalizeTimerRef.current);
                candidateAnswerFinalizeTimerRef.current = null;
              }

              const finalizeCandidateAnswer = async () => {
                candidateAnswerFinalizeTimerRef.current = null;

                if (cancelledRef.current) return;

                // A new NavTalk VAD speech_started event always cancels this
                // timer. This guard handles a race where speech starts at the
                // same moment the timer callback is queued.
                if (candidateVadSpeakingRef.current) {
                  return;
                }

                const elapsedSinceTranscript =
                  performance.now() - candidateLastTranscriptAtRef.current;

                if (elapsedSinceTranscript < CANDIDATE_TRANSCRIPT_SETTLE_MS) {
                  candidateAnswerFinalizeTimerRef.current = setTimeout(
                    finalizeCandidateAnswer,
                    CANDIDATE_TRANSCRIPT_SETTLE_MS - elapsedSinceTranscript
                  );
                  return;
                }

                const finalCandidateText = candidateAnswerBufferRef.current.trim();
                if (!finalCandidateText) return;

                setStatusMessage("ALVIN is listening and responding...");
                console.log("Candidate answer settled:", finalCandidateText);
                flushCandidateAnswer();
              };

              // This timer is independent of speech_stopped handling. If no
              // new speech_started or transcript event arrives, it submits the
              // accumulated answer automatically after the settle window.
              candidateAnswerFinalizeTimerRef.current = setTimeout(
                finalizeCandidateAnswer,
                CANDIDATE_TRANSCRIPT_SETTLE_MS
              );

              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_DELTA: {
              if (q01TriggeredRef.current && !q01SpeechStartedRef.current) {
                q01SpeechStartedRef.current = true;
                console.log("[Q01] ALVIN started speaking (audio delta received).");
              }
              // ALVIN has begun a turn; close the candidate answer window immediately
              // so avatar audio / late speech cannot leak into the candidate transcript.
              candidateAnswerEnabledRef.current = false;
              if (!avatarTurnStartedAtRef.current) {
                avatarTurnStartedAtRef.current = performance.now();
                if (candidateSpokeThisAnswerRef.current) {
                  console.log(
                    "[TIMING] ALVIN audio started:",
                    describeAnswerTiming(
                    endpointLastSpeechAtRef.current,
                      answerEndSentAtRef.current
                    )
                  );
                  answerEndSentAtRef.current = 0;
                }
              }
              avatarSpeakingGateRef.current = true;
              clearSilenceTimer();

              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_TRANSCRIPT_DELTA: {
              const isOpeningTurn =
                q01TriggeredRef.current && !q01SpeechStartedRef.current;
              if (q01TriggeredRef.current && !q01SpeechStartedRef.current) {
                q01SpeechStartedRef.current = true;
                console.log("[Q01] ALVIN started speaking (transcript delta received).");
              }
              avatarSpeakingGateRef.current = true;
              clearSilenceTimer();

              const deltaText =
                pickTranscriptDelta(message, navData) ||
                extractCandidateText({
                  data: navData,
                }) ||
                "";

              if (deltaText) {
                if (!responseTranscriptTextRef.current) {
                  // First fragment of a new spoken turn.
                  responseDeltasRef.current = [];
                  lastAlvinTurnRef.current = {
                    ...lastAlvinTurnRef.current,
                    finalized: false,
                  };

                  // Work out the full line ALVIN is about to say so the subtitle can show
                  // it at once: a line we told him to say, the opening greeting + Q01, or
                  // the next roadmap question (or the fixed closing after the last one).
                  subtitleLockedRef.current = false;
                  let expectedLine = nextTurnSubtitleRef.current;
                  nextTurnSubtitleRef.current = "";
                  if (!expectedLine && isOpeningTurn) {
                    expectedLine = q01SpeechTextRef.current;
                  }
                  if (!expectedLine) {
                    const roadmap = parseGeminiRoadmap(navtalkAiPrompt);
                    const current = compactForMatch(currentQuestionRef.current);
                    const index = current
                      ? roadmap.findIndex(
                          (item) => compactForMatch(item.question) === current
                        )
                      : -1;
                    if (index >= 0) {
                      expectedLine =
                        index + 1 < roadmap.length
                          ? roadmap[index + 1].question
                          : CLOSING_LINE;
                    }
                  }
                  expectedSubtitleRef.current = expectedLine || "";
                }

                responseDeltasRef.current.push(deltaText);

                responseTranscriptLengthRef.current +=
                  deltaText.length;

                responseTranscriptTextRef.current =
                  joinTranscriptDeltas(responseDeltasRef.current);

                // Never type the subtitle out word by word.
                const spokenSoFar = responseTranscriptTextRef.current;
                const expectedLine = expectedSubtitleRef.current;
                if (expectedLine && spokenMatchesExpected(spokenSoFar, expectedLine)) {
                  // ALVIN is saying the planned line: show all of it immediately.
                  if (!subtitleLockedRef.current) {
                    subtitleLockedRef.current = true;
                    setAvatarSubtitle(expectedLine);
                  }
                } else {
                  subtitleLockedRef.current = false;
                  const stillMightBeLeadIn =
                    expectedLine && compactForMatch(spokenSoFar).length < 60;
                  // Off-script or unplanned speech: update one finished sentence at a time.
                  if (!stillMightBeLeadIn && /[.!?]["')\]]?\s*$/.test(spokenSoFar.trim())) {
                    setAvatarSubtitle(spokenSoFar);
                  }
                }
              }

              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_TRANSCRIPT_DONE: {
              // NavTalk's own complete transcript of what ALVIN said (exact spacing).
              const finalTranscript =
                [navData?.transcript, message?.raw_data?.transcript, navData?.text].find(
                  (value) => typeof value === "string" && value.trim()
                ) || "";

              if (!finalTranscript) {
                console.log(
                  "[SUBTITLE] transcript.done carried no transcript text; keeping the streamed text."
                );
                break;
              }

              const turn = lastAlvinTurnRef.current;

              if (!turn.finalized) {
                // Arrived before audio.done: audio.done will use this exact text.
                finalTranscriptRef.current = finalTranscript.trim();
                break;
              }

              const upgrade = planFinalTranscriptUpgrade({
                turn,
                finalText: finalTranscript,
                currentQuestion: currentQuestionRef.current,
                newTurnStarted: Boolean(responseTranscriptTextRef.current),
                roadmap: parseGeminiRoadmap(navtalkAiPrompt),
              });

              if (!upgrade.apply) break;

              console.log(
                "[SUBTITLE] Using NavTalk's final transcript instead of the streamed text:",
                { streamed: turn.text, final: upgrade.finalText }
              );

              if (upgrade.subtitle !== null) setAvatarSubtitle(upgrade.subtitle);

              const history = conversationHistoryRef.current;
              if (Array.isArray(history)) {
                for (let i = history.length - 1; i >= 0; i -= 1) {
                  if (history[i]?.speaker === "ALVIN" && history[i]?.text === turn.text) {
                    history[i] = { ...history[i], text: upgrade.finalText };
                    break;
                  }
                }
              }

              if (upgrade.question) {
                if (answerQuestionRef.current === turn.question) {
                  answerQuestionRef.current = upgrade.question;
                }
                currentQuestionRef.current = upgrade.question;
                setCurrentQuestion(upgrade.question);
                console.log("[UI QUESTION CORRECTED]", upgrade.question);
              }

              lastAlvinTurnRef.current = {
                ...turn,
                text: upgrade.finalText,
                question: upgrade.question || turn.question,
              };
              break;
            }

            case NavTalkMessageType.RESPONSE_AUDIO_DONE: {
              // ALVIN has already responded, so the candidate's answer is final. Send it
              // BEFORE ALVIN's line so the backend pairs question and answer correctly.
              flushCandidateAnswer();

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

              const completedAlvinText = (
                finalTranscriptRef.current || responseTranscriptTextRef.current
              ).trim();
              finalTranscriptRef.current = "";

              if (!completedAlvinText) {
                // An empty turn is still a finished turn: a late transcript must not leak
                // into the next one.
                lastAlvinTurnRef.current = {
                  text: "",
                  question: "",
                  closing: false,
                  finalized: true,
                };
              }

              // Diagnostic: did ALVIN say the Gemini-prepared Q01 verbatim?
              if (q01VerifyPendingRef.current && completedAlvinText) {
                q01VerifyPendingRef.current = false;
                const spokenNorm = compactForMatch(completedAlvinText);
                const expectedNorm = compactForMatch(openingQuestion);
                if (expectedNorm && spokenNorm.includes(expectedNorm)) {
                  console.log("[Q01 CHECK] ALVIN said the Gemini Q01 verbatim.");
                } else {
                  console.warn("[Q01 CHECK] ALVIN did NOT say the Gemini Q01 verbatim.", {
                    expected: openingQuestion,
                    spoken: completedAlvinText,
                  });
                }
              }

              let alvinQuestionForHistory = "";

              if (completedAlvinText) {
                setAvatarSubtitle(completedAlvinText);

                conversationHistoryRef.current.push({
                  speaker: "ALVIN",
                  text: completedAlvinText,
                });

                if (q01TriggeredRef.current && !interviewEndedRef.current) {
                  if (isClosingStatement(completedAlvinText)) {
                    // The final answer was flushed above. From this point forward,
                    // no additional microphone transcript belongs to the interview.
                    candidateAnswerEnabledRef.current = false;
                    closingPendingRef.current = true;
                  } else {
                    closingPendingRef.current = false;

                    const spokenQuestion = formatQuestionForDisplay(
                      extractDisplayedQuestion(completedAlvinText),
                      parseGeminiRoadmap(navtalkAiPrompt)
                    );

                    if (spokenQuestion) {
                      alvinQuestionForHistory = spokenQuestion;
                      currentQuestionRef.current = spokenQuestion;
                      setCurrentQuestion(spokenQuestion);
                      console.log("[UI QUESTION UPDATED]", spokenQuestion);
                    } else {
                      console.warn(
                        "No question found in ALVIN turn:",
                        completedAlvinText
                      );
                    }
                  }
                }

                enqueueTranscript(
                  "ALVIN",
                  completedAlvinText,
                  alvinQuestionForHistory || undefined
                );

                lastAlvinTurnRef.current = {
                  text: completedAlvinText,
                  question: alvinQuestionForHistory,
                  closing: isClosingStatement(completedAlvinText),
                  finalized: true,
                };
              }

              // audio.done means NavTalk finished generating/sending audio.
              // It does NOT mean the buffered WebRTC audio has finished
              // playing in the browser. Keep the candidate microphone gated
              // until the actual remote audio becomes quiet.
              const transcriptChars = responseTranscriptLengthRef.current;
              const estimatedTurnMs = Math.max(
                AVATAR_MIN_TURN_MS,
                (transcriptChars / AVATAR_ESTIMATED_CHARS_PER_SECOND) * 1000
              );
              const turnStartedAt =
                avatarTurnStartedAtRef.current || performance.now();
              avatarMinimumPlaybackEndAtRef.current =
                turnStartedAt + estimatedTurnMs;

              console.log(
                "NavTalk audio generation finished; waiting for WebRTC playback and minimum transcript duration.",
                { estimatedTurnMs: Math.round(estimatedTurnMs) }
              );

              responseTranscriptLengthRef.current = 0;
              responseTranscriptTextRef.current = "";
              expectedSubtitleRef.current = "";
              subtitleLockedRef.current = false;

              avatarSpeakingGateRef.current = true;
              waitForActualAvatarPlaybackEnd();

              break;
            }

            case "realtime_synthesis.tts.error": {
              console.warn(
                "NavTalk TTS synthesis error:",
                message
              );
              avatarSpeakingGateRef.current = false;
              break;
            }

            case "realtime_synthesis.stt.error": {
              console.warn(
                "NavTalk STT synthesis error; keeping candidate answer open:",
                message
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
      stopMicAfterInterview,
      cancelClosing,
      beginClosingGrace,
      sendOpeningMessage,
      triggerAvatarResponse,
      registerNavTalkSession,
      disarmAvatarSpeakingGate,
      speakQuestion,
      requestAdaptiveQuestion,
      notifyAvatarDone,
      waitForActualAvatarPlaybackEnd,
      handleOffer,
      handleIceCandidate,
      clearSilenceTimer,
      startSilenceTimer,
      syncCandidateSpeaking,
      enqueueTranscript,
      flushCandidateAnswer,
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

        // In native OpenAIRealtime mode, the backend's current_question can
        // remain on the original Gemini Q01 because NavTalk owns the live
        // ANSWERED/PARTIAL/KNOWLEDGE_GAP/OFF_TOPIC progression.
        //
        // Once Q01 has started, NEVER let session polling overwrite the
        // question we synchronized from ALVIN's actual spoken transcript.
        if (
          data.current_question &&
          !q01TriggeredRef.current
        ) {
          currentQuestionRef.current = data.current_question;
          setCurrentQuestion(data.current_question);
        }

        if (Array.isArray(data.history)) {
          conversationHistoryRef.current = data.history;
        }

        const backendCandidateSpeaking =
          Boolean(data.candidate_speaking);

        if (
          backendCandidateSpeaking ||
          candidateSpeakingRef.current
        ) {
          setShowSilenceWarning(false);
        } else {
          setShowSilenceWarning(
            Boolean(data.silence_warning) || simplifyingRef.current
          );
        }

        if (
          (data.silence_warning || simplifyingRef.current) &&
          !backendCandidateSpeaking &&
          !candidateSpeakingRef.current
        ) {
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

      if (candidateSpeechStopTimerRef.current) {
        clearTimeout(candidateSpeechStopTimerRef.current);
        candidateSpeechStopTimerRef.current = null;
      }

      if (candidateAnswerFinalizeTimerRef.current) {
        clearTimeout(candidateAnswerFinalizeTimerRef.current);
        candidateAnswerFinalizeTimerRef.current = null;
      }

      clearSilenceTimer();

      if (navtalkSessionId) {
        postBackend(
          "/api/interview/candidate-speaking",
          {
            session_id: navtalkSessionId,
            speaking: false,
          }
        ).catch(() => {});
      }

      stopAudioStreaming();
      stopRemoteAudioMonitor();

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

  useEffect(() => {
    if (
      !CV_ANALYSIS_ENABLED ||
      !sessionStarted ||
      !camActive ||
      !navtalkSessionId
    ) {
      return undefined;
    }

    let consecutiveFailures = 0;
    let intervalId = null;

    const captureAndAnalyzeFrame = async () => {
      const video = localVideoRef.current;
      if (
        cvRequestInFlightRef.current ||
        !video ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        return;
      }

      cvRequestInFlightRef.current = true;

      try {
        const canvas = cvCanvasRef.current || document.createElement("canvas");
        cvCanvasRef.current = canvas;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.7)
        );
        if (!blob) return;

        const body = new FormData();
        body.append("session_id", navtalkSessionId);
        body.append("frame", blob, "cv-frame.jpg");

        const response = await fetch(`${API_BASE_URL}/api/interview/cv-frame`, {
          method: "POST",
          headers: { "X-API-Key": APP_API_KEY },
          body,
        });

        if (response.ok) {
          consecutiveFailures = 0;
          const result = await response.json();
          if (typeof result.confidence === "number") {
            setLiveConfidence(result.confidence);
          }
        } else if (response.status === 503 || response.status === 409) {
          consecutiveFailures += 1;
          if (consecutiveFailures >= 3) {
            console.warn("CV analysis unavailable; disabling frame sampling.");
            window.clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.warn("CV frame analysis failed:", error);
      } finally {
        cvRequestInFlightRef.current = false;
      }
    };

    intervalId = window.setInterval(captureAndAnalyzeFrame, 1000);
    captureAndAnalyzeFrame();

    return () => {
      window.clearInterval(intervalId);
      cvRequestInFlightRef.current = false;
    };
  }, [camActive, navtalkSessionId, sessionStarted]);

  const handleConfirmEnd = async () => {
    if (isFinishing) return;

    // IMPORTANT: shut down the paid/live NavTalk path BEFORE asking Gemini
    // to build results. A Gemini/network failure must never leave NavTalk
    // connected or allow this component to create a replacement connection.
    setIsEndModalOpen(false);
    setFinalizationError(null);
    setDisconnectedReason(null);
    setIsFinishing(true);
    candidateAnswerEnabledRef.current = false;

    // The last answer may still be being transcribed by NavTalk. Keep the connection
    // open for a few seconds so it is not lost when the socket closes.
    const gotAllTranscripts = await waitForOwedTranscripts({
      getOwed: () => transcriptOwedRef.current,
      getMsSinceSpeechStart: () =>
        performance.now() - lastAcceptedSpeechStartAtRef.current,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });
    if (!gotAllTranscripts) {
      console.warn("Ending the session while a candidate transcript was still pending.");
    }

    flushCandidateAnswer(); // Don't lose an answer that is still settling.

    cancelledRef.current = true;
    setConnectionInitiated(false);
    setAvatarConnected(false);

    clearSilenceTimer();
    stopAudioStreaming();
    stopRemoteAudioMonitor();

    if (candidateSpeechStopTimerRef.current) {
      clearTimeout(candidateSpeechStopTimerRef.current);
      candidateSpeechStopTimerRef.current = null;
    }

    if (candidateAnswerFinalizeTimerRef.current) {
      clearTimeout(candidateAnswerFinalizeTimerRef.current);
      candidateAnswerFinalizeTimerRef.current = null;
    }

    if (closingGraceTimerRef.current) {
      clearTimeout(closingGraceTimerRef.current);
      closingGraceTimerRef.current = null;
    }
    closingPendingRef.current = false;

    if (backendSyncTimerRef.current) {
      clearInterval(backendSyncTimerRef.current);
      backendSyncTimerRef.current = null;
    }

    // Best-effort only. Never keep the live connection open waiting for this.
    if (navtalkSessionId) {
      postBackend(
        "/api/interview/candidate-speaking",
        { session_id: navtalkSessionId, speaking: false }
      ).catch(() => {});
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "Interview completed");
      } catch {}
      wsRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    remoteStreamRef.current = null;
    sessionReadyRef.current = false;
    mqttModeRegisteredRef.current = false;
    navtalkSessionIdRef.current = "";
    openingSentRef.current = false;

    try {
      await flushCandidateAnswer();
      await Promise.allSettled([
        ...pendingTranscriptRequestsRef.current,
      ]);

      // This endpoint is idempotent. It marks the backend session ended and
      // returns either the scored result or a transcript-only fallback when
      // Gemini assessment was unavailable.
      await postBackend(
        "/api/interview/end-session",
        { session_id: navtalkSessionId }
      );

      navigate(
        `/user/interview-results/${encodeURIComponent(navtalkSessionId)}`,
        { replace: true }
      );
    } catch (error) {
      console.error("Failed to finalize interview:", error);

      // Do NOT reactivate NavTalk here. The paid/live session remains closed.
      // A retry only retries backend result generation.
      setIsFinishing(false);
      setFinalizationError(
        error?.message ||
          "The interview ended, but the results could not be generated. Please retry the results."
      );
    }
  };

  // The avatar-closing callback uses this ref to invoke the same idempotent
  // finalization path automatically after the closing audio has really ended.
  autoEndInterviewRef.current = handleConfirmEnd;

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
                {" "}{targetRole} Interview
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
                  ? `${avatarName || "ALVIN"} Connected`
                  : `Connecting ${avatarName || "ALVIN"}...`}
              </span>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            {finalizationError && (
              <div className="absolute inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                  <AlertCircle className="w-16 h-16 text-[#862334] mx-auto mb-4" />

                  <h3 className="text-xl font-black text-black uppercase mb-2">
                    Interview Results Error
                  </h3>

                  <p className="text-sm text-gray-600 mb-2">
                    Your live interview has already been stopped.
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    {finalizationError}
                  </p>

                  <button
                    onClick={handleConfirmEnd}
                    className="w-full py-3 bg-[#862334] text-white font-bold uppercase rounded-xl hover:bg-black transition-all"
                  >
                    Retry Results
                  </button>
                </div>
              </div>
            )}

            {disconnectedReason && !finalizationError && (
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

                      <p className="text-gray-500 mb-4">
                        {avatarName || "ALVIN"} will conduct your{" "}
                        {targetRole} interview.
                      </p>

                      <ul className="list-disc pl-5 space-y-2 text-left text-sm font-bold text-gray-600 mb-8 max-w-lg mx-auto">
                        <li>The interview runs in fullscreen.</li>
                        <li>
                          Switching tabs, leaving the window, or exiting fullscreen counts as a
                          warning, and the interview ends after {MAX_VIOLATIONS} warnings.
                        </li>
                        <li>
                          Please be in a quiet environment and make sure that no distractions are
                          present.
                        </li>
                        <li>
                          {avatarName || "ALVIN"} will be monitoring your environment for any disturbances.
                        </li>
                      </ul>

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

            <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
              <div className="flex-1 relative overflow-hidden bg-slate-950">
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

                {/* Avatar stage: the largest 16:9 frame that fits the available
                    space, centered. Nothing is cropped or stretched; any spare
                    space is the dark page background. */}
                <div
                  className={`relative w-full h-full ${
                    !sessionStarted
                      ? "hidden"
                      : "flex items-center justify-center"
                  }`}
                  style={{ containerType: "size" }}
                >
                  <div
                    className="relative w-full max-h-full overflow-hidden bg-black"
                    style={{
                      aspectRatio: "16 / 9",
                      width: "min(100cqw, calc(100cqh * 16 / 9))",
                    }}
                  >
                    <video
                      ref={navtalkVideoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
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

                    {liveConfidence !== null && (
                      <span className="absolute top-2 right-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-white">
                        Confidence {liveConfidence}%
                      </span>
                    )}
                  </div>
                )}

              {sessionStarted && interviewComplete && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[90%]">
                  <div className="bg-black/60 backdrop-blur-md text-white rounded-xl px-5 py-3 text-center">
                    <p className="text-sm font-medium">
                      Interview complete. Click End Session to see your results.
                    </p>
                  </div>
                </div>
              )}

              {sessionStarted &&
                subtitleParts.question &&
                !interviewComplete && (
                  <div className="absolute inset-x-0 bottom-28 z-40 flex justify-center px-4 sm:px-6 pointer-events-none">
                    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black/70 px-6 py-4 text-center shadow-2xl backdrop-blur-md">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                        Interviewer
                      </p>

                      <div
                        ref={subtitleScrollRef}
                        className="max-h-[28vh] space-y-2 overflow-y-auto break-words"
                        style={{ textWrap: "balance" }}
                      >
                        {subtitleParts.lead && (
                          <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                            {subtitleParts.lead}
                          </p>
                        )}

                        <p className="text-base font-medium leading-relaxed text-white sm:text-lg">
                          {subtitleParts.question}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {sessionStarted && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#111827]/90 px-5 py-3 rounded-full border border-white/10 shadow-2xl">
                    <button
                      disabled={interviewComplete}
                      onClick={() =>
                        setMicActive(
                          (value) =>
                            !value
                        )
                      }
                      className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                        interviewComplete
                          ? "border-white/10 text-white/30 cursor-not-allowed"
                          :
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

      {lockdown.warning && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 text-center"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="integrity-warning-title"
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
            <AlertTriangle className="w-16 h-16 text-[#862334] mx-auto mb-4" />

            <h3
              id="integrity-warning-title"
              className="text-xl font-black text-black uppercase mb-2"
            >
              Stay in the interview
            </h3>

            <p className="text-sm text-gray-600 mb-2">
              {lockdown.warning.reason}
            </p>

            <p className="text-sm text-gray-600 mb-6">
              Warning {Math.min(lockdown.warning.count, MAX_VIOLATIONS)} of{" "}
              {MAX_VIOLATIONS}. The interview ends automatically after{" "}
              {MAX_VIOLATIONS} warnings.
            </p>

            <button
              onClick={lockdown.dismissWarning}
              className="w-full py-3 bg-[#862334] text-white font-bold uppercase rounded-xl hover:bg-black transition-all"
            >
              Return to interview
            </button>
          </div>
        </div>
      )}

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