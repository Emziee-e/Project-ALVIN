import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mic,
  User,
  Bot,
  X,
  Mail,
  Calendar,
  BookOpen,
  Users,
  Download,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
  Presentation,
  MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import AccountActionToast from "../../Components/AccountActionToast";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account", path: null, icon: User },
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "interviews", label: "History", path: "/user/interviews", icon: Mic },
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const APP_API_KEY =
  import.meta.env.VITE_APP_API_KEY || "";

const RUBRIC_ICONS = [FileText, UserCheck, Presentation, MessageSquare];

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDynamicEvaluationTitle(results) {
  const rawRole = (
    results?.target_role ||
    results?.job_title ||
    results?.role ||
    results?.position ||
    ""
  ).trim();

  if (!rawRole) return "Interview Evaluation";
  if (/\bevaluation\b/i.test(rawRole)) return rawRole;
  return `${rawRole} Evaluation`;
}

// ----------------------------------------------------------------------
// SHARED RUBRIC METRICS HELPER (GUARANTEES 100% MATCH BETWEEN CARDS & NOTES)
// ----------------------------------------------------------------------
function getRubricMetrics(rubric) {
  const rawScore = Math.round(Number(rubric?.score || 0));
  const maxScore = Math.round(Number(rubric?.max_score || 25)) || 25;
  const pct = Math.min(100, Math.max(0, Math.round((rawScore / maxScore) * 100)));
  return {
    label: String(rubric?.label || "").trim(),
    rawScore,
    maxScore,
    pct,
  };
}

// ----------------------------------------------------------------------
// HELPER: EXTRACT STRONGEST & WEAKEST RUBRICS FOR REALISTIC NOTES
// ----------------------------------------------------------------------
function analyzeRubricPerformance(rubrics = []) {
  if (!Array.isArray(rubrics) || rubrics.length === 0) {
    return { strongest: null, weakest: null };
  }

  const normalized = rubrics
    .filter((r) => r && r.label)
    .map((r) => getRubricMetrics(r));

  if (normalized.length === 0) return { strongest: null, weakest: null };

  const sorted = [...normalized].sort((a, b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return {
    strongest,
    weakest: strongest.label !== weakest.label ? weakest : null,
  };
}

// ----------------------------------------------------------------------
// SCORE TIER METADATA HELPER (70-100 GREEN, 40-69 YELLOW, 0-39 RED)
// ----------------------------------------------------------------------
function getScoreTier(score, available, rubrics = []) {
  if (!available) {
    return {
      key: "pending",
      label: "Evaluation Pending",
      note: "Your responses are currently being evaluated. Check back shortly for your score breakdown.",
      trackColor: "#E2E8F0",
      gradStart: "#94A3B8",
      gradEnd: "#64748B",
      percentColor: "text-slate-400",
      badgeBg: "bg-slate-100 border-slate-200 text-slate-600",
      noteBoxBg: "bg-slate-50/80 border-slate-200/80 text-slate-600",
      dotColor: "bg-slate-400",
      pdfBg: "#F1F5F9",
      pdfColor: "#475569",
      Icon: AlertTriangle,
    };
  }

  const { strongest, weakest } = analyzeRubricPerformance(rubrics);

  // 70% - 100%: Green (Very Good)
  if (score >= 70) {
    let note;
    if (score >= 90) {
      note = strongest
        ? `Outstanding interview performance, led by ${strongest.label} (${strongest.pct}%). Your answers were clear, well-structured, and ready for real hiring panels.`
        : "Outstanding interview performance. Your answers were clear, well-structured, and ready for real hiring panels.";
    } else if (strongest && weakest && weakest.pct < 75) {
      note = `Solid job passing the 70% readiness mark, with strong results in ${strongest.label} (${strongest.pct}%). Tightening up ${weakest.label} (${weakest.pct}%) will make you even more competitive.`;
    } else if (strongest) {
      note = `Good work meeting the 70% readiness benchmark. You showed strong command in ${strongest.label} (${strongest.pct}%)—keep using concrete examples to push toward 90%+.`;
    } else {
      note =
        "Good work meeting the 70% readiness benchmark. Your answers demonstrated clear communication and solid role alignment.";
    }

    return {
      key: "good",
      label: "Very Good",
      note,
      trackColor: "#DCFCE7",
      gradStart: "#10B981",
      gradEnd: "#059669",
      percentColor: "text-emerald-600",
      badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      noteBoxBg: "bg-emerald-50/60 border-emerald-200/80 text-emerald-900",
      dotColor: "bg-emerald-500",
      pdfBg: "#ECFDF5",
      pdfColor: "#047857",
      Icon: CheckCircle2,
    };
  }

  // 40% - 69%: Yellow (Needs Improvement)
  if (score >= 40) {
    const gap = 70 - score;
    let note;
    if (strongest && weakest) {
      note = `You showed potential in ${strongest.label} (${strongest.pct}%), but ${weakest.label} (${weakest.pct}%) held your score back. Focus on adding specific examples to close the ${gap}% gap to 70%.`;
    } else if (weakest) {
      note = `You have a workable baseline, though ${weakest.label} (${weakest.pct}%) needs sharper structure and detail. Aim for ${gap}% more to pass the 70% readiness benchmark.`;
    } else {
      note = `You have a decent baseline, but several answers lacked depth or clear structure. Review the AI feedback below to bridge the ${gap}% gap to 70%.`;
    }

    return {
      key: "fair",
      label: "Needs Improvement",
      note,
      trackColor: "#FEF3C7",
      gradStart: "#F59E0B",
      gradEnd: "#D97706",
      percentColor: "text-amber-600",
      badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
      noteBoxBg: "bg-amber-50/70 border-amber-200/80 text-amber-950",
      dotColor: "bg-amber-500",
      pdfBg: "#FFFBEB",
      pdfColor: "#B45309",
      Icon: AlertTriangle,
    };
  }

  // 0% - 39%: Red (Needs Major Work / Bad)
  const note = weakest
    ? `Your responses were too brief or off-target—especially in ${weakest.label} (${weakest.pct}%). Study the sample critiques in the transcript below and practice answering with clear examples before retrying.`
    : "Your responses were too brief or lacked clear structure to meet interview standards. Review the feedback in your transcript below and try another practice session.";

  return {
    key: "poor",
    label: "Needs Major Work",
    note,
    trackColor: "#FEE2E2",
    gradStart: "#EF4444",
    gradEnd: "#DC2626",
    percentColor: "text-red-600",
    badgeBg: "bg-red-50 border-red-200 text-red-700",
    noteBoxBg: "bg-red-50/65 border-red-200/80 text-red-950",
    dotColor: "bg-red-500",
    pdfBg: "#FEF2F2",
    pdfColor: "#B91C1C",
    Icon: XCircle,
  };
}

// ----------------------------------------------------------------------
// SHADCN-INSPIRED HALF-DONUT OVERALL SCORE CARD WITH DYNAMIC RANGE NOTES
// ----------------------------------------------------------------------
function MinimalHalfDonutCard({ score, available, rubrics }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!available) return;
    let start = null;
    const duration = 900;

    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    };

    const id = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(id);
  }, [score, available]);

  const pct = available ? Math.min(100, Math.max(0, animatedScore)) : 0;
  const radius = 88;
  const strokeWidth = 13;
  const semiCircumference = Math.PI * radius;
  const dashOffset = semiCircumference * (1 - pct / 100);

  // Sync progress bar color smoothly with the animated score as it counts up
  const activeTier = getScoreTier(available ? animatedScore : 0, available, rubrics);
  const finalTier = getScoreTier(score, available, rubrics);
  const StatusIcon = finalTier.Icon;
  const gradientId = `overallArcGrad-${activeTier.key}`;

  return (
    <div className="bg-white border border-[#862334]/25 border-t-4 border-t-[#862334] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Top Header Row: Title + Dynamic Range Status Pill */}
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="font-[Inter] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Overall Score
        </span>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition-colors duration-300 ${finalTier.badgeBg}`}
        >
          <StatusIcon className="w-3 h-3 flex-shrink-0" />
          <span>{finalTier.label}</span>
        </span>
      </div>

      {/* Center Half-Donut Gauge + Scale Ticks */}
      <div className="flex flex-col items-center my-auto py-2">
        <div className="relative w-full max-w-[236px] h-[124px] flex items-end justify-center">
          <svg viewBox="0 0 220 116" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={activeTier.gradStart} />
                <stop offset="100%" stopColor={activeTier.gradEnd} />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <path
              d="M 22 108 A 88 88 0 0 1 198 108"
              fill="none"
              stroke={activeTier.trackColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-colors duration-300"
            />

            {/* Dynamic Color Progress Arc */}
            <path
              d="M 22 108 A 88 88 0 0 1 198 108"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={semiCircumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Hero Score Readout */}
          <div className="absolute bottom-0.5 flex flex-col items-center leading-none">
            <div className="flex items-baseline tabular-nums">
              <span className="font-[Geist] text-5xl sm:text-[54px] font-bold tracking-tight text-slate-950">
                {available ? animatedScore : "N/A"}
              </span>
              {available && (
                <span
                  className={`font-[Geist] text-2xl font-bold ml-0.5 transition-colors duration-300 ${activeTier.percentColor}`}
                >
                  %
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimalist Benchmark Legend (0-39 Red | 40-69 Yellow | 70-100 Green) */}
        <div className="w-full max-w-[236px] flex items-center justify-between text-[10px] font-medium text-slate-400 mt-1.5 px-1 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            0–39%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            40–69%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            70–100%
          </span>
        </div>
      </div>

      {/* Bottom Specific Range Note Callout (Shadcn Alert-Style) */}
      <div
        className={`w-full rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5 text-left transition-colors duration-300 ${finalTier.noteBoxBg}`}
      >
        <span
          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${finalTier.dotColor}`}
        />
        <p className="font-[Inter] text-xs font-medium leading-relaxed">
          {finalTier.note}
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ANIMATED RUBRIC CARD (SMOOTH COUNT-UP & PROGRESS BAR SYNC)
// ----------------------------------------------------------------------
function AnimatedRubricCard({ rubric, index, available, style }) {
  const { rawScore, maxScore, pct: targetPercent } = getRubricMetrics(rubric);

  const [animatedRaw, setAnimatedRaw] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    if (!available) {
      setAnimatedRaw(0);
      setAnimatedPercent(0);
      return;
    }

    let start = null;
    const duration = 900;

    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedRaw(Math.round(rawScore * eased));
      setAnimatedPercent(Math.round(targetPercent * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    };

    const id = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(id);
  }, [rawScore, targetPercent, available]);

  const RubricIcon = RUBRIC_ICONS[index % RUBRIC_ICONS.length];

  return (
    <div
      style={style}
      className="animate-fade-slide-in bg-white border border-[#862334]/25 border-t-4 border-t-[#862334] rounded-2xl px-6 py-5 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#862334]/[0.07] text-[#862334] flex items-center justify-center flex-shrink-0 mt-0.5">
            <RubricIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block font-[Inter] text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
              Rubric {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-[Geist] text-base font-bold text-slate-900 tracking-tight leading-snug">
              {rubric.label}
            </h3>
          </div>
        </div>

        <div className="flex items-baseline gap-1 flex-shrink-0 tabular-nums">
          <span className="font-[Geist] text-2xl sm:text-[31px] font-bold text-[#862334] leading-none">
            {available ? animatedRaw : "N/A"}
          </span>
          {available && (
            <span className="font-[Inter] text-lg font-medium text-slate-400">
              /{maxScore}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="h-2 flex-1 bg-[#F2E4E7] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#862334] to-[#B6354B] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${animatedPercent}%` }}
          />
        </div>
        {available && (
          <span className="font-[Inter] text-xs font-bold text-[#862334] bg-[#862334]/[0.08] px-2 py-0.5 rounded-md tabular-nums">
            {animatedPercent}%
          </span>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MINIMALIST SHADCN / LINEAR-STYLE ARC SPINNER
// ----------------------------------------------------------------------
function MinimalEvaluationLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F7F7F8] px-6 select-none">
      <style>{`
        @keyframes arcRotate {
          100% { transform: rotate(360deg); }
        }
        @keyframes arcDash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 86, 150;
            stroke-dashoffset: -28;
          }
          100% {
            stroke-dasharray: 86, 150;
            stroke-dashoffset: -113;
          }
        }
        .shadcn-arc-spin {
          animation: arcRotate 1.8s linear infinite;
          transform-origin: center;
        }
        .shadcn-arc-stroke {
          animation: arcDash 1.4s ease-in-out infinite;
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center text-center"
      >
        <svg
          className="w-10 h-10 shadcn-arc-spin mb-5"
          viewBox="0 0 44 44"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            stroke="#862334"
            strokeOpacity="0.14"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            stroke="#862334"
            strokeWidth="3"
            strokeLinecap="round"
            className="shadcn-arc-stroke"
          />
        </svg>

        <h2 className="font-[Geist] text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
          Loading Interview Results
        </h2>
        <p className="font-[Inter] text-sm text-slate-500 mt-1">
          Preparing your evaluation report...
        </p>
      </div>
    </div>
  );
}

export default function InterviewResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();

  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState("");
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState("all");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [toast, setToast] = useState(null); // { id, title, message } | null

  const [activeNav, setActiveNav] = useState("interviews");
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "Vin",
    email: "",
    enrollments: [],
    avatarUrl: null,
    initials: "V",
  });
  const [imageError, setImageError] = useState(false);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);

  const isInterviewPaused = userProfile.enrollments.some(
    (e) =>
      e?.is_interviews_paused === true ||
      String(e?.is_interviews_paused).toLowerCase() === "true"
  );
  // Not enrolled in any course: browsing is allowed, interviews are not.
  const isEnrolled = userProfile.enrollments.length > 0;
  // A course the Career Advisor concluded no longer allows interviews. The student
  // is blocked once every course they are in has been concluded.
  const isCourseConcluded =
    isEnrolled &&
    userProfile.enrollments.every((e) =>
      ["concluded", "archived"].includes(
        String(e?.course_status ?? "").trim().toLowerCase()
      )
    );
  const newSessionDisabled =
    !enrollmentsLoaded || !isEnrolled || isCourseConcluded || isInterviewPaused;
  const newSessionReason = !enrollmentsLoaded
    ? "Checking course availability"
    : !isEnrolled
    ? "Enroll in a course to start an interview"
    : isCourseConcluded
    ? "This course has been concluded"
    : isInterviewPaused
    ? "Paused by Career Advisor"
    : "New Session";

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isMounted) {
        const metadata = user.user_metadata || {};
        const fullName =
          metadata.full_name ||
          metadata.name ||
          `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() ||
          user.email?.split("@")[0] ||
          "Vin";

        const emailAddress = user.email || metadata.email || "N/A";
        const avatar =
          metadata.avatar_url ||
          metadata.picture ||
          metadata.avatar ||
          user.identities?.[0]?.identity_data?.avatar_url ||
          user.identities?.[0]?.identity_data?.picture ||
          null;

        const nameParts = fullName.split(" ").filter(Boolean);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        setUserProfile((prev) => ({
          ...prev,
          name: fullName,
          email: emailAddress,
          avatarUrl: avatar,
          initials: initials,
        }));
      }
    };

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadEnrollments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch(`${API_BASE_URL}/api/student/enrollments`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "X-API-Key": APP_API_KEY,
          },
        });
        if (!response.ok) throw new Error(`Enrollment request failed (${response.status})`);
        const rows = await response.json();
        if (active) {
          setUserProfile((prev) => ({ ...prev, enrollments: Array.isArray(rows) ? rows : [] }));
          setEnrollmentsLoaded(true);
        }
      } catch (error) {
        console.error("Unable to load student enrollments:", error);
      }
    };
    loadEnrollments();
    const intervalId = window.setInterval(loadEnrollments, 10000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/interviews")) {
      setActiveNav("interviews");
    } else if (location.pathname.includes("/dashboard")) {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      if (!sessionId) {
        setResultsError("Missing interview session ID.");
        setResultsLoading(false);
        return;
      }

      try {
        setResultsLoading(true);
        setResultsError("");

        const getAccessToken = async (forceRefresh = false) => {
          const { data, error } = forceRefresh
            ? await supabase.auth.refreshSession()
            : await supabase.auth.getSession();
          if (error) throw new Error(`Authentication failed: ${error.message}`);
          if (!data.session?.access_token) {
            throw new Error("Your Google sign-in session is unavailable. Please sign in again and reopen Interview History.");
          }
          return data.session.access_token;
        };

        const requestResults = (token) =>
          fetch(`${API_BASE_URL}/api/interview/results/${encodeURIComponent(sessionId)}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              ...(APP_API_KEY ? { "X-API-Key": APP_API_KEY } : {}),
            },
          });

        let token = await getAccessToken();
        let response = await requestResults(token);

        if (response.status === 401) {
          token = await getAccessToken(true);
          response = await requestResults(token);
        }

        if (!response.ok) {
          let detail = `Results request failed (${response.status})`;
          try {
            const payload = await response.json();
            detail = typeof payload.detail === "string" ? payload.detail : detail;
          } catch {}
          if (response.status === 401) {
            throw new Error(`${detail}. Authentication was rejected even after refreshing the Supabase session.`);
          }
          throw new Error(detail);
        }

        const data = await response.json();
        if (active) setResults(data);
      } catch (error) {
        console.error("Failed to load interview results:", error);
        if (active) {
          setResultsError(error?.message || "Failed to load interview results.");
        }
      } finally {
        if (active) setResultsLoading(false);
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  if (resultsLoading) {
    return <MinimalEvaluationLoader />;
  }

  if (resultsError || !results) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F7F7F8]">
        <div className="text-center max-w-md px-6 bg-white border border-[#862334]/20 rounded-2xl p-6 shadow-xs">
          <h2 className="font-[Geist] text-lg font-bold text-slate-900 mb-2">Results Unavailable</h2>
          <p className="font-[Inter] text-sm text-slate-500 mb-5">
            {resultsError || "The interview results could not be loaded."}
          </p>
          <button
            onClick={() => navigate("/user/interviews")}
            className="px-4 py-2 bg-[#862334] text-white font-[Geist] font-semibold text-xs rounded-lg cursor-pointer"
          >
            Back to Interview History
          </button>
        </div>
      </div>
    );
  }

  const evaluationAvailable = results.evaluation_available !== false;
  const overallScore = Math.round(results.overall_rating || 0);
  const rubrics = results.rubrics || [];
  const questions = results.questions || [];
  const recommendations = results.recommendations || [];
  const dynamicTitle = buildDynamicEvaluationTitle(results);

  const filteredQuestions =
    selectedQuestionIdx === "all"
      ? questions.map((q, idx) => ({ ...q, originalIndex: idx }))
      : questions
          .map((q, idx) => ({ ...q, originalIndex: idx }))
          .filter((_, idx) => idx === selectedQuestionIdx);

  const staggerStyle = (index) => ({
    animationDelay: `${index * 110}ms`,
  });

  // ----------------------------------------------------------------------
  // READY-TO-DOWNLOAD EXECUTIVE PDF REPORT GENERATOR (HIDDEN IFRAME - NO EXTRA WINDOW)
  // ----------------------------------------------------------------------
  // Requires: npm install html2canvas-pro jspdf
  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    setPdfError("");

    try {
      const logoUrl = `${window.location.origin}/images/Alvin-logo.png`;
      const primaryEnrollment = userProfile.enrollments?.[0] || {};
      const dateStr = results.created_at
        ? new Date(results.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      const scoreTier = getScoreTier(overallScore, evaluationAvailable, rubrics);
      const statusLabel = `${scoreTier.label}: ${scoreTier.note}`;
      const statusBg = scoreTier.pdfBg;
      const statusColor = scoreTier.pdfColor;

      const rubricsHtml = rubrics
        .map((r, idx) => {
          const { rawScore, maxScore, pct } = getRubricMetrics(r);
          const percent = evaluationAvailable ? pct : 0;

          return `
            <div class="rubric-card">
              <div class="rubric-top">
                <div>
                  <div class="rubric-num">RUBRIC ${String(idx + 1).padStart(2, "0")}</div>
                  <div class="rubric-title">${escapeHtml(r.label)}</div>
                </div>
                <div class="rubric-score">
                  <span class="score-val">${evaluationAvailable ? rawScore : "N/A"}</span>
                  ${evaluationAvailable ? `<span class="score-max">/${maxScore}</span>` : ""}
                </div>
              </div>
              <div class="bar-row">
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${percent}%;"></div>
                </div>
                ${evaluationAvailable ? `<span class="pct-badge">${percent}%</span>` : ""}
              </div>
            </div>
          `;
        })
        .join("");

      const recommendationsHtml =
        recommendations.length > 0
          ? recommendations
              .map(
                (rec, idx) => `
                <div class="rec-item">
                  <span class="rec-num">${String(idx + 1).padStart(2, "0")}.</span>
                  <p class="rec-text">${escapeHtml(rec)}</p>
                </div>
              `
              )
              .join("")
          : `<p class="empty-note">No recommendations available yet.</p>`;

      const questionsHtml =
        questions.length > 0
          ? questions
              .map(
                (q, idx) => `
                <div class="qa-block">
                  <div class="q-header">
                    <span class="q-tag">QUESTION ${String(idx + 1).padStart(2, "0")}</span>
                    <h4 class="q-title">${escapeHtml(q.question)}</h4>
                  </div>
                  <div class="ans-box">
                    <div class="box-label">CANDIDATE RESPONSE</div>
                    <p class="box-text">${escapeHtml(q.answer || "No response recorded.")}</p>
                  </div>
                  <div class="critique-box">
                    <div class="box-label cherry">AI COACH FEEDBACK</div>
                    <p class="box-text">${escapeHtml(q.critique || "No critique available.")}</p>
                  </div>
                </div>
              `
              )
              .join("")
          : `<p class="empty-note">No transcript entries available for this session.</p>`;

      const safeFileTitle = dynamicTitle.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();

      const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(safeFileTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 10.5pt;
      max-width: 780px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      margin-bottom: 16px;
      border-bottom: 2px solid #862334;
    }

    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 46px;
      height: 46px;
      object-fit: contain;
    }

    .eyebrow {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #862334;
      margin-bottom: 2px;
    }

    .doc-title {
      font-family: 'Geist', sans-serif;
      font-size: 18pt;
      font-weight: 700;
      color: #090D16;
      line-height: 1.15;
    }

    .meta-right {
      text-align: right;
      font-size: 8.5pt;
      color: #475569;
    }

    .meta-right strong {
      color: #0F172A;
      font-weight: 600;
    }

    .candidate-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #FDFBF7;
      border: 1px solid #EAE5D9;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 18px;
    }

    .meta-cell span {
      display: block;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748B;
      margin-bottom: 1px;
    }

    .meta-cell p {
      font-size: 9pt;
      font-weight: 600;
      color: #1E293B;
    }

    .score-section {
      display: grid;
      grid-template-columns: 36% 64%;
      gap: 14px;
      margin-bottom: 20px;
      break-inside: avoid;
    }

    .overall-box {
      border: 1px solid rgba(134, 35, 52, 0.28);
      border-top: 4px solid #862334;
      border-radius: 12px;
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #FFFFFF;
    }

    .overall-num {
      font-family: 'Geist', sans-serif;
      font-size: 32pt;
      font-weight: 700;
      color: #090D16;
      line-height: 1;
    }

    .overall-num span {
      font-size: 15pt;
      color: #862334;
    }

    .overall-label {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748B;
      margin-top: 6px;
      margin-bottom: 10px;
    }

    .status-pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 10px;
      font-size: 7.6pt;
      font-weight: 600;
      line-height: 1.38;
      text-align: left;
      background: ${statusBg};
      color: ${statusColor};
    }

    .rubrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding-right: 14px;
    }

    .rubric-card {
      border: 1px solid rgba(134, 35, 52, 0.25);
      border-top: 3px solid #862334;
      border-radius: 10px;
      padding: 11px 13px;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .rubric-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 10px;
    }

    .rubric-num {
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #94A3B8;
      margin-bottom: 2px;
    }

    .rubric-title {
      font-family: 'Geist', sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.25;
    }

    .rubric-score {
      white-space: nowrap;
    }

    .score-val {
      font-family: 'Geist', sans-serif;
      font-size: 15pt;
      font-weight: 700;
      color: #862334;
    }

    .score-max {
      font-size: 8.5pt;
      color: #94A3B8;
      font-weight: 500;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bar-track {
      flex: 1;
      height: 6px;
      background: #F2E4E7;
      border-radius: 999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #862334;
      border-radius: 999px;
    }

    .pct-badge {
      font-size: 8pt;
      font-weight: 700;
      color: #862334;
      background: rgba(134, 35, 52, 0.08);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .section-block {
      margin-bottom: 18px;
    }

    .section-heading {
      font-family: 'Geist', sans-serif;
      font-size: 12pt;
      font-weight: 700;
      color: #0F172A;
      padding-bottom: 6px;
      margin-bottom: 10px;
      border-bottom: 1px solid rgba(134, 35, 52, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-heading span {
      color: #862334;
    }

    .rec-container {
      border: 1px solid rgba(134, 35, 52, 0.22);
      border-radius: 10px;
      padding: 10px 14px;
      background: #FAFAFA;
      break-inside: avoid;
    }

    .rec-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid #E2E8F0;
    }

    .rec-item:last-child {
      border-bottom: none;
    }

    .rec-num {
      font-family: 'Geist', sans-serif;
      font-size: 9pt;
      font-weight: 700;
      color: #862334;
      min-width: 22px;
    }

    .rec-text {
      font-size: 9.5pt;
      color: #334155;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .qa-block {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      break-inside: avoid;
      background: #FFFFFF;
    }

    .q-header {
      margin-bottom: 8px;
    }

    .q-tag {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #862334;
      margin-bottom: 2px;
    }

    .q-title {
      font-family: 'Geist', sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #0F172A;
    }

    .ans-box {
      border-left: 2.5px solid #CBD5E1;
      padding: 4px 0 4px 10px;
      margin-bottom: 8px;
    }

    .critique-box {
      border-left: 2.5px solid #862334;
      background: rgba(134, 35, 52, 0.035);
      padding: 6px 10px;
      border-radius: 0 6px 6px 0;
    }

    .box-label {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #64748B;
      margin-bottom: 2px;
    }

    .box-label.cherry {
      color: #862334;
    }

    .box-text {
      font-size: 9.2pt;
      color: #334155;
      line-height: 1.45;
      overflow-wrap: anywhere;
      word-break: normal;
    }

    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94A3B8;
    }

    .empty-note {
      font-size: 9pt;
      color: #64748B;
      font-style: italic;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="brand-left">
      <img src="${logoUrl}" alt="Alvin Logo" class="brand-logo" onerror="this.style.display='none'" />
      <div>
        <div class="eyebrow">Alvin AI Mock Interview Report</div>
        <h1 class="doc-title">${escapeHtml(dynamicTitle)}</h1>
      </div>
    </div>
    <div class="meta-right">
      <div>Date: <strong>${escapeHtml(dateStr)}</strong></div>
      <div>Session ID: <strong>${escapeHtml(String(sessionId).slice(0, 12))}</strong></div>
    </div>
  </header>

  <div class="candidate-strip">
    <div class="meta-cell">
      <span>Candidate</span>
      <p>${escapeHtml(userProfile.name || "Student")}</p>
    </div>
    <div class="meta-cell">
      <span>Email</span>
      <p>${escapeHtml(userProfile.email || "N/A")}</p>
    </div>
    <div class="meta-cell">
      <span>Course / Term</span>
      <p>${escapeHtml(
        primaryEnrollment.course_code ||
          primaryEnrollment.course_title ||
          primaryEnrollment.academic_term ||
          "Career Readiness"
      )}</p>
    </div>
  </div>

  <section class="score-section">
    <div class="overall-box">
      <div class="overall-num">${
        evaluationAvailable ? `${overallScore}<span>%</span>` : "N/A"
      }</div>
      <div class="overall-label">Overall Score</div>
      <div class="status-pill">${escapeHtml(statusLabel)}</div>
    </div>
    <div class="rubrics-grid">
      ${rubricsHtml}
    </div>
  </section>

  <section class="section-block">
    <h2 class="section-heading">Key Recommendations <span>(${recommendations.length})</span></h2>
    <div class="rec-container">
      ${recommendationsHtml}
    </div>
  </section>

  <section class="section-block">
    <h2 class="section-heading">Interview Transcript &amp; AI Feedback <span>(${questions.length} Questions)</span></h2>
    ${questionsHtml}
  </section>

  <footer class="footer">
    <span>Generated by Alvin AI Career Readiness Platform</span>
    <span>Readiness Target Benchmark: 70%+</span>
  </footer>
</body>
</html>`;

      // Render the report in an off-screen frame (keeps its styles isolated from
      // the app), then turn it into a PDF and download it directly.
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText =
        "position:fixed;left:-10000px;top:0;width:780px;height:1200px;border:0;pointer-events:none;";
      document.body.appendChild(iframe);

      try {
        const doc = iframe.contentWindow?.document;
        if (!doc) throw new Error("Report frame unavailable.");

        doc.open();
        doc.write(reportHtml);
        doc.close();

        // Wait for the frame, its images (logo) and fonts before capturing.
        await new Promise((resolve) => {
          if (doc.readyState === "complete") {
            setTimeout(resolve, 0);
          } else {
            iframe.addEventListener("load", resolve, { once: true });
            setTimeout(resolve, 4000);
          }
        });
        await Promise.all(
          Array.from(doc.images).map((img) =>
            img.complete
              ? null
              : new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                })
          )
        );
        try {
          await Promise.race([doc.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
        } catch {
          // Fonts are cosmetic; continue with fallbacks.
        }
        iframe.style.height = `${doc.documentElement.scrollHeight}px`;

        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);

        const SCALE = 2;

        // Measure the blocks so pages can break between them, never through one.
        // A section heading stays attached to the block that follows it.
        const bodyTop = doc.body.getBoundingClientRect().top;
        const blocks = [];
        let pendingTop = null;
        doc
          .querySelectorAll(
            ".header, .candidate-strip, .score-section, .section-heading, .rec-container, .qa-block, .empty-note, .footer"
          )
          .forEach((el) => {
            if (el.parentElement.closest(".rec-container, .qa-block")) return;
            const rect = el.getBoundingClientRect();
            const top = (rect.top - bodyTop) * SCALE;
            const bottom = (rect.bottom - bodyTop) * SCALE;
            if (el.classList.contains("section-heading")) {
              pendingTop = top;
              return;
            }
            blocks.push({ top: pendingTop ?? top, bottom });
            pendingTop = null;
          });
        // Inner pieces, used only to split a block that is taller than one page.
        const items = Array.from(
          doc.querySelectorAll(".rec-item, .q-header, .ans-box, .critique-box")
        ).map((el) => (el.getBoundingClientRect().bottom - bodyTop) * SCALE);

        const canvas = await html2canvas(doc.body, {
          scale: SCALE,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 12;
        const contentW = pageW - margin * 2;
        const contentH = pageH - margin - 14; // extra room at the bottom for page numbers
        const pxPerMm = canvas.width / contentW;
        const pageHeightPx = Math.floor(contentH * pxPerMm);

        const PAD = 4 * SCALE;
        const queue = blocks.length
          ? blocks.map((b) => ({ ...b }))
          : [{ top: 0, bottom: canvas.height }];
        const pages = [];
        let i = 0;
        while (i < queue.length) {
          const first = queue[i];
          const start = Math.max(0, Math.floor(first.cont ? first.top : first.top - PAD));
          let j = i;
          while (j + 1 < queue.length && queue[j + 1].bottom + PAD - start <= pageHeightPx) j += 1;
          const end = Math.min(canvas.height, Math.ceil(queue[j].bottom + PAD));

          if (end - start > pageHeightPx && j === i) {
            const limit = start + pageHeightPx;
            const cuts = items.filter((b) => b > start + pageHeightPx * 0.3 && b + PAD <= limit);
            const cut = Math.floor(cuts.length ? Math.max(...cuts) + PAD : limit);
            pages.push({ start, end: cut });
            queue[i] = { top: cut, bottom: first.bottom, cont: true };
          } else {
            pages.push({ start, end });
            i = j + 1;
          }
        }

        pages.forEach(({ start, end }, pageIndex) => {
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = end - start;
          const ctx = slice.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, start, canvas.width, end - start, 0, 0, canvas.width, end - start);

          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(
            slice.toDataURL("image/jpeg", 0.95),
            "JPEG",
            margin,
            margin,
            contentW,
            (end - start) / pxPerMm
          );
        });

        const totalPages = pdf.getNumberOfPages();
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        for (let n = 1; n <= totalPages; n += 1) {
          pdf.setPage(n);
          pdf.text(`Page ${n} of ${totalPages}`, pageW / 2, pageH - 7, { align: "center" });
        }

        const fileName = (safeFileTitle || "Interview_Evaluation").replace(/\s+/g, "_");
        pdf.save(`${fileName}.pdf`);

        setToast({
          id: Date.now(),
          title: "PDF downloaded",
          message: "Your interview report was saved to your device.",
        });
      } finally {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      setPdfError("Could not generate the PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const transcriptStaggerIndex = 2 + rubrics.length;
  const recommendationsStaggerIndex = 3 + rubrics.length;

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; overflow: hidden; }
        .cherry-scroll::-webkit-scrollbar { width: 4px; }
        .cherry-scroll::-webkit-scrollbar-track { background: transparent; }
        .cherry-scroll::-webkit-scrollbar-thumb { background: rgba(134, 35, 52, 0.22); border-radius: 9999px; }
        @keyframes resultsFadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-slide-in {
          animation: resultsFadeSlideIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-slide-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-slate-950 font-[Inter] relative">
        {/* Sign Out Confirmation Modal */}
        <AccountActionToast toast={toast} onClose={() => setToast(null)} />
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* Dark Overlay Backdrop for Drawer */}
        <div
          className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-30 ${
            isAccountDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsAccountDrawerOpen(false)}
        />

        {/* Slide-out Account Drawer */}
        <aside
          className={`fixed top-0 left-0 md:left-[100px] w-[340px] h-full bg-white border-r border-[#862334] shadow-xl z-40 flex flex-col overflow-y-auto select-none font-[Inter] text-[#2D3B45] transform transition-transform duration-300 ease-in-out ${
            isAccountDrawerOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-[440px]"
          }`}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsAccountDrawerOpen(false)}
              className="p-1.5 rounded-lg border border-[#862334] text-[#862334] cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center pt-2 pb-6 px-6">
            {userProfile.avatarUrl && !imageError ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                onError={() => setImageError(true)}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#862334] shadow-xs mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-[#862334] flex items-center justify-center text-[#862334] font-[Geist] font-semibold text-2xl mb-3 bg-white">
                {userProfile.initials}
              </div>
            )}

            <h2 className="font-[Geist] text-xl font-bold text-[#2D3B45] text-center tracking-tight">
              {userProfile.name}
            </h2>

            <button
              onClick={() => {
                setIsAccountDrawerOpen(false);
                setIsSignOutModalOpen(true);
              }}
              className="mt-3 px-4 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-[#2D3B45] cursor-pointer"
            >
              Logout
            </button>
          </div>

          <div className="px-6 my-1">
            <hr className="border-t border-slate-200" />
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </span>
                <span className="text-sm font-medium text-[#2D3B45] break-all">
                  {userProfile.email || "Not Available"}
                </span>
              </div>
            </div>

            {userProfile.enrollments.length ? (
              userProfile.enrollments.map((enrollment, index) => (
                <div key={`${enrollment.course_id}-${index}`} className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Enrolled Course
                      </span>
                      <span className="text-sm font-medium text-[#2D3B45] break-words">
                        {enrollment.course_title || "Not available"}
                      </span>
                      {enrollment.course_code && (
                        <span className="text-xs text-slate-500">{enrollment.course_code}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Section
                      </span>
                      <span className="text-sm font-medium text-[#2D3B45]">
                        {enrollment.section || "Not available"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Academic Term
                      </span>
                      <span className="text-sm font-medium text-[#2D3B45]">
                        {enrollment.academic_term || "Not available"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No course enrollment found.</p>
            )}
          </div>
        </aside>

        {/* Left Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen relative">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountDrawerOpen(false);
                setActiveNav("dashboard");
                navigate("/user/dashboard");
              }}
            >
              <img
                src={Logo}
                alt="Alvin Logo"
                className="w-20 h-20 object-contain"
              />
            </div>

            <nav className="w-full flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSolidActive = isAccountDrawerOpen
                  ? item.id === "account"
                  : activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "account") {
                        setIsAccountDrawerOpen(!isAccountDrawerOpen);
                      } else {
                        setIsAccountDrawerOpen(false);
                        setActiveNav(item.id);
                        if (item.path) navigate(item.path);
                      }
                    }}
                    className={`w-full py-3.5 px-2 flex flex-col items-center justify-center relative cursor-pointer border-0 outline-none ${
                      isSolidActive
                        ? "bg-[#862334] text-white"
                        : "text-[#862334] bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-1 ${
                        isSolidActive ? "text-white" : "text-[#862334]"
                      }`}
                    />
                    <span
                      className={`text-xs tracking-tight ${
                        isSolidActive
                          ? "font-semibold text-white"
                          : "font-medium text-[#862334]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Workspace Canvas: Non-scrollable outer shell on desktop (lg) */}
        <main className="flex-1 w-full bg-[#F7F7F8] overflow-y-auto overflow-x-hidden lg:overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 flex flex-col max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 py-5 lg:h-full lg:overflow-hidden min-w-0">

            {/* ── DYNAMIC EVALUATION TITLE HEADER (0ms) ── */}
            <header
              style={staggerStyle(0)}
              className="animate-fade-slide-in flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-5 border-b border-[#862334]/15"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <button
                    onClick={() => navigate("/user/interviews")}
                    className="cursor-pointer font-medium text-slate-500"
                  >
                    History
                  </button>
                  <span>/</span>
                  <span className="text-slate-600 font-medium">Result</span>
                </div>
                <h1 className="font-[Geist] text-2xl sm:text-[26px] font-bold tracking-tight text-slate-950 leading-tight">
                  {dynamicTitle}
                </h1>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#862334]/20 text-slate-700 font-[Inter] font-semibold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5 text-[#862334]" />
                  <span>{exportingPdf ? "Preparing PDF..." : "Export PDF"}</span>
                </button>
                {pdfError && (
                  <span role="alert" className="font-[Inter] text-xs text-red-700">
                    {pdfError}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!newSessionDisabled) navigate("/user/resume-upload");
                  }}
                  disabled={newSessionDisabled}
                  aria-disabled={newSessionDisabled}
                  title={newSessionReason}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 font-[Inter] font-semibold text-xs rounded-xl shadow-xs ${
                    newSessionDisabled
                      ? "bg-slate-200 text-slate-500 opacity-60 cursor-not-allowed"
                      : "bg-[#862334] text-white cursor-pointer"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Session</span>
                </button>
              </div>
            </header>

            {/* ── SEPARATED SCORECARD & 4 ANIMATED RUBRIC CARDS (110ms – 550ms) ── */}
            <section className="flex-shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
              {/* Left 4 Columns: Large Space-Filling Half-Donut Score Card (110ms) */}
              <div style={staggerStyle(1)} className="lg:col-span-4 animate-fade-slide-in">
                <MinimalHalfDonutCard
                  score={overallScore}
                  available={evaluationAvailable}
                  rubrics={rubrics}
                />
              </div>

              {/* Right 8 Columns: 4 Separate Animated Rubric Cards (220ms – 550ms) */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rubrics.map((r, index) => (
                  <AnimatedRubricCard
                    key={r.label}
                    rubric={r}
                    index={index}
                    available={evaluationAvailable}
                    style={staggerStyle(2 + index)}
                  />
                ))}
              </div>
            </section>

            {/* ── LOWER MINIMALIST SCROLLABLE FEEDBACK & RECOMMENDATIONS (660ms – 770ms) ── */}
            <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 pb-1">

              {/* Left 8 Cols: Scrollable Transcript & AI Feedback */}
              <div
                style={staggerStyle(transcriptStaggerIndex)}
                className="animate-fade-slide-in lg:col-span-8 min-w-0 bg-white border border-[#862334]/20 rounded-2xl shadow-xs flex flex-col min-h-[360px] lg:min-h-0 overflow-hidden"
              >
                {/* Sticky Minimal Header */}
                <div className="px-6 py-3.5 border-b border-[#862334]/15 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
                  <h2 className="font-[Geist] text-base font-bold tracking-tight text-slate-950">
                    Transcript <span className="text-[#862334]">&amp;</span> Feedback
                  </h2>

                  {questions.length > 0 && (
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIdx("all")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          selectedQuestionIdx === "all"
                            ? "bg-[#862334] text-white"
                            : "text-slate-500"
                        }`}
                      >
                        All ({questions.length})
                      </button>
                      {questions.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedQuestionIdx(idx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer tabular-nums ${
                            selectedQuestionIdx === idx
                              ? "bg-[#862334] text-white"
                              : "text-slate-500"
                          }`}
                        >
                          Q{idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scrollable Editorial Transcript Feed (Vertical Scroll Only) */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden cherry-scroll px-6 py-5 divide-y divide-slate-100 min-w-0">
                  {filteredQuestions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-12">
                      No transcript entries available for this session.
                    </p>
                  ) : (
                    filteredQuestions.map((q) => (
                      <div
                        key={q.originalIndex}
                        className="py-5 first:pt-1 last:pb-1 space-y-3.5 min-w-0"
                      >
                        {/* Question */}
                        <div className="min-w-0">
                          <span className="inline-block font-[Geist] text-[11px] font-bold uppercase tracking-wider text-[#862334] mb-1">
                            Question {String(q.originalIndex + 1).padStart(2, "0")}
                          </span>
                          <p className="font-[Geist] text-[15px] font-bold text-slate-900 leading-snug break-words">
                            {q.question}
                          </p>
                        </div>

                        {/* Candidate Answer */}
                        <div className="pl-4 border-l-2 border-slate-200 min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                            Your Response
                          </span>
                          <p className="text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                            {q.answer || "No response recorded."}
                          </p>
                        </div>

                        {/* AI Coach Feedback */}
                        <div className="pl-4 border-l-2 border-[#862334] bg-[#862334]/[0.025] py-2.5 pr-4 rounded-r-xl min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Bot className="text-[#862334] w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#862334]">
                              AI Feedback
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed break-words">
                            {q.critique || "No critique available."}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right 4 Cols: Scrollable Key Recommendations */}
              <div
                style={staggerStyle(recommendationsStaggerIndex)}
                className="animate-fade-slide-in lg:col-span-4 min-w-0 bg-white border border-[#862334]/20 rounded-2xl shadow-xs flex flex-col min-h-[260px] lg:min-h-0 overflow-hidden"
              >
                <div className="px-6 py-3.5 border-b border-[#862334]/15 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#862334]" />
                    <h3 className="font-[Geist] text-base font-bold tracking-tight text-slate-950">
                      Key Recommendations
                    </h3>
                  </div>
                  {recommendations.length > 0 && (
                    <span className="text-xs font-semibold text-[#862334] tabular-nums">
                      {recommendations.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden cherry-scroll px-6 py-5 divide-y divide-slate-100 min-w-0">
                  {recommendations.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      No recommendations available yet.
                    </p>
                  ) : (
                    recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="py-4 first:pt-1 last:pb-1 flex items-start gap-3.5 min-w-0"
                      >
                        <span className="font-[Geist] text-xs font-bold text-[#862334] tabular-nums mt-0.5 flex-shrink-0">
                          {String(index + 1).padStart(2, "0")}.
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed break-words">
                          {recommendation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </section>
          </div>
        </main>
      </div>
    </>
  );
}