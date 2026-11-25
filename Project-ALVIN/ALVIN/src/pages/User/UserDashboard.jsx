import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Mic,
  User,
  X,
  Mail,
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import FloatingButton from "../../Components/FloatingButton";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "interviews", label: "History", path: "/user/interviews", icon: Mic },
];

const SUMMARY_HIGHLIGHTS = /(Appearance\s+and\s+Poise|Skill\s+Presentation|Delivery\s+and\s+Language|Resume(?:\s+Alignment)?|\b\d+(?:\.\d+)?\s*%?)/gi;
const SUMMARY_CATEGORIES = /^(Appearance\s+and\s+Poise|Skill\s+Presentation|Delivery\s+and\s+Language|Resume(?:\s+Alignment)?)$/i;
const SUMMARY_SCORES = /^\d+(?:\.\d+)?\s*%?$/;

function renderPerformanceSummary(summary) {
  return String(summary).split(SUMMARY_HIGHLIGHTS).map((part, index) => {
    if (SUMMARY_CATEGORIES.test(part)) {
      return <strong key={index} className="font-bold text-black">{part}</strong>;
    }
    if (SUMMARY_SCORES.test(part)) {
      return <strong key={index} className="font-bold text-[#862334]">{part}</strong>;
    }
    return part;
  });
}

// ----------------------------------------------------------------------
// CONNECTED SCORE TIER HELPER (MATCHES OVERALL SCORE IN INTERVIEW RESULTS)
// 70-100% GREEN | 40-69% YELLOW | 0-39% RED + SESSION VOLUME AWARE NOTES
// ----------------------------------------------------------------------
function getAccuracyTier(avgScore, sessionVolume) {
  if (avgScore == null) {
    return {
      key: "pending",
      label: "No Data",
      textColor: "text-slate-400",
      barFill: "bg-slate-300",
      badgeClass: "bg-slate-100 border-slate-200 text-slate-600",
      noteColor: "text-slate-500",
      note: "Complete an interview to track your readiness average.",
      Icon: AlertTriangle,
    };
  }

  const volume = Number(sessionVolume || 0);

  if (avgScore >= 70) {
    return {
      key: "good",
      label: "Very Good",
      textColor: "text-emerald-600",
      barFill: "bg-emerald-500",
      badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
      noteColor: "text-emerald-700",
      note:
        volume >= 10
          ? `Strong consistency across ${volume} sessions — meeting the 70%+ goal.`
          : "Strong average — you are consistently hitting the 70%+ readiness goal.",
      Icon: CheckCircle2,
    };
  }

  if (avgScore >= 40) {
    const gap = 70 - avgScore;
    return {
      key: "fair",
      label: "Needs Improvement",
      textColor: "text-amber-600",
      barFill: "bg-amber-500",
      badgeClass: "bg-amber-50 border-amber-200 text-amber-800",
      noteColor: "text-amber-700",
      note:
        volume >= 10
          ? `Fair across ${volume} sessions — ${gap}% away from the 70% goal.`
          : `Developing average — ${gap}% more needed to reach the 70% goal.`,
      Icon: AlertTriangle,
    };
  }

  return {
    key: "poor",
    label: "Low Accuracy",
    textColor: "text-red-600",
    barFill: "bg-red-500",
    badgeClass: "bg-red-50 border-red-200 text-red-700",
    noteColor: "text-red-600",
    note:
      volume >= 10
        ? `Low average despite ${volume} sessions — slow down & review AI feedback.`
        : "Below the 70% goal — review past critiques before your next session.",
    Icon: XCircle,
  };
}

// ----------------------------------------------------------------------
// ANIMATED COUNT-UP NUMBER HELPER COMPONENT
// ----------------------------------------------------------------------
function CountUpNumber({ value, duration = 1000, prefix = "", suffix = "", decimals = 0 }) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let target = 0;
    if (typeof value === "number") {
      target = value;
    } else if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
      target = isNaN(parsed) ? 0 : parsed;
    }

    let startTimestamp = null;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const val = startValue + (target - startValue) * easeOutProgress;

      setCurrentValue(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  const formattedNumber =
    decimals > 0
      ? currentValue.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(currentValue).toLocaleString();

  return (
    <span>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}

// Recursively discover any feedback/comment arrays or objects in the backend response
function extractAllFeedbackRecords(payload) {
  if (!payload || typeof payload !== "object") return [];

  const collected = [];
  const visited = new Set();
  const feedbackKeyPattern = /(staff_feedback|advisor_comment|advisor_feedback|feedback_history|advisor_note|staff_comment|coach_feedback|mentor_feedback|feedbacks|comments|notes)/i;

  const walk = (node, currentKey = "") => {
    if (!node || typeof node !== "object" || visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      if (feedbackKeyPattern.test(currentKey)) {
        collected.push(...node);
      }
      return;
    }

    for (const [key, val] of Object.entries(node)) {
      if (key === "history" && Array.isArray(val) && val[0]?.session_id) {
        continue; // Skip interview session history array
      }

      if (feedbackKeyPattern.test(key)) {
        if (Array.isArray(val)) {
          collected.push(...val);
        } else if (val && typeof val === "object") {
          if (val.message || val.comment || val.feedback || val.content || val.notes) {
            collected.push(val);
          }
          walk(val, key);
        } else if (typeof val === "string" && val.trim()) {
          collected.push({ message: val.trim() });
        }
      } else if (val && typeof val === "object" && !Array.isArray(val)) {
        walk(val, key);
      }
    }
  };

  walk(payload);
  return collected;
}

export default function UserDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAccountMounted, setIsAccountMounted] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);
  const [isInterviewPaused, setIsInterviewPaused] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState({
    id: null,
    name: "Student",
    email: "",
    enrollments: [],
    avatarUrl: null,
    initials: "V",
  });

  const [imageError, setImageError] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [extraFeedbackList, setExtraFeedbackList] = useState([]);
  const [dashboardError, setDashboardError] = useState("");

  // Normalize pause values from top-level and nested API response shapes.
  const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      return ["true", "1", "yes", "on", "paused"].includes(value.trim().toLowerCase());
    }
    return false;
  };

  const enrollmentIsPaused = (enrollment) => {
    if (!enrollment || typeof enrollment !== "object") return false;
    return [
      enrollment.is_interviews_paused,
      enrollment.isInterviewsPaused,
      enrollment.interviews_paused,
      enrollment.course?.is_interviews_paused,
      enrollment.courses?.is_interviews_paused,
      enrollment.course?.isInterviewsPaused,
      enrollment.course_details?.is_interviews_paused,
    ].some(toBoolean);
  };

  // A course concluded by the Career Advisor blocks interviews, just like a pause.
  const enrollmentIsConcluded = (enrollment) => {
    if (!enrollment || typeof enrollment !== "object") return false;
    return [
      enrollment.course_status,
      enrollment.courseStatus,
      enrollment.course?.course_status,
      enrollment.courses?.course_status,
      enrollment.course_details?.course_status,
    ].some((status) =>
      ["concluded", "archived"].includes(String(status ?? "").trim().toLowerCase())
    );
  };

  // Students without an active course enrollment can browse but not interview.
  const isEnrolled = userProfile.enrollments.length > 0;
  // Interviews are blocked when every course the student is in has been concluded.
  const activeEnrollments = userProfile.enrollments.filter(
    (enrollment) => !enrollmentIsConcluded(enrollment)
  );
  const isCourseConcluded = isEnrolled && activeEnrollments.length === 0;

  const interviews = (dashboard?.history || []).slice(0, 3).map((r) => ({
    id: r.session_id,
    role: r.target_role || "Interview",
    date: r.started_at ? new Date(r.started_at).toLocaleDateString() : "—",
    score: r.overall_score == null ? "—" : `${Math.round(Number(r.overall_score))}%`,
    high: Number(r.overall_score) >= 70,
    canView: r.report_status === "completed",
  }));

  const loadDashboard = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");

      const base = import.meta.env.VITE_API_BASE_URL || "https://project-alvin-backend-production.up.railway.app";
      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
      };

      const response = await fetch(`${base}/api/interview/dashboard`, {
        headers,
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`Dashboard request failed (${response.status})`);
      const result = await response.json();

      // Also check if a dedicated student feedback history endpoint exists
      let fetchedExtra = [];
      const feedbackEndpoints = [
        `${base}/api/student/feedback`,
        `${base}/api/interview/feedback`,
      ];

      for (const url of feedbackEndpoints) {
        try {
          const fbRes = await fetch(url, { headers, cache: "no-store" });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (Array.isArray(fbData)) {
              fetchedExtra = fbData;
              break;
            } else if (fbData && typeof fbData === "object") {
              fetchedExtra = extractAllFeedbackRecords(fbData);
              if (fetchedExtra.length > 0) break;
            }
          }
        } catch {
          // Endpoint optional; ignore if not present
        }
      }

      setDashboard(result);
      setExtraFeedbackList(fetchedExtra);
      setDashboardError("");
    } catch (err) {
      setDashboardError(err.message);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (active) await loadDashboard();
    };

    run();
    const intervalId = window.setInterval(run, 10000);

    // Immediately re-fetch when user switches back from Career Advisor account/tab
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [loadDashboard]);

  useEffect(() => {
    let active = true;
    let intervalId;

    const loadEnrollments = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const base = import.meta.env.VITE_API_BASE_URL || "https://project-alvin-backend-production.up.railway.app";
        const response = await fetch(`${base}/api/student/enrollments`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Enrollment request failed (${response.status})`);
        }

        const rows = await response.json();

        if (active) {
          const enrollmentRows = Array.isArray(rows) ? rows : [];
          const paused = enrollmentRows.some(enrollmentIsPaused);

          setUserProfile((prev) => ({
            ...prev,
            enrollments: enrollmentRows,
          }));
          setIsInterviewPaused(paused);
          // Only enable the button after a successful availability check.
          setEnrollmentsLoaded(true);
        }
      } catch (error) {
        console.error("Unable to load student enrollments:", error);
      }
    };

    loadEnrollments();
    intervalId = window.setInterval(loadEnrollments, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Dynamically normalize, merge, and preserve all Career Advisor comments
  const advisorComments = (() => {
    // /api/student/feedback returns the full history. The dashboard payload only
    // carries the latest comment, so it is just a fallback until history loads.
    const rawItems = extraFeedbackList.length
      ? extraFeedbackList
      : extractAllFeedbackRecords(dashboard);

    const normalizeItem = (item, idx) => {
      const message =
        typeof item === "string"
          ? item
          : item?.message ||
            item?.comment ||
            item?.feedback ||
            item?.content ||
            item?.notes ||
            "";

      const rawDate =
        item?.created_at ||
        item?.updated_at ||
        item?.submitted_at ||
        item?.date ||
        null;

      const parsedTimestamp = rawDate ? new Date(rawDate).getTime() : 0;
      const timestamp = isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
      const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null;

      const trimmedMessage = String(message).trim();
      const dedupeKey =
        item?.id || item?.feedback_id
          ? `id:${item.id || item.feedback_id}|msg:${trimmedMessage}`
          : `msg:${trimmedMessage}|ts:${timestamp}`;

      return {
        id: item?.id || item?.feedback_id || `comment-${idx}-${timestamp}`,
        dedupeKey,
        message: trimmedMessage,
        formattedDate,
        timestamp,
      };
    };

    const normalizedFromBackend = rawItems
      .map(normalizeItem)
      .filter((c) => c.message.length > 0);

    const combined = normalizedFromBackend;

    const seen = new Set();
    return combined
      .filter((c) => {
        if (!c.message.length) return false;
        if (seen.has(c.dedupeKey)) return false;
        seen.add(c.dedupeKey);
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((c, index) => ({
        ...c,
        // Keep the maroon dot on the latest comment until a newer comment is added
        isNew: index === 0,
      }));
  })();

  const handleToggleAccountDrawer = (openState) => {
    if (openState) {
      setIsAccountMounted(true);
      setTimeout(() => setIsAccountOpen(true), 10);
    } else {
      setIsAccountOpen(false);
      setTimeout(() => setIsAccountMounted(false), 300);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      try {
        // Read the cached Supabase session instead of making a separate auth request.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!user || !isMounted) return;

        const metadata = user.user_metadata || {};
        const identityData = user.identities?.[0]?.identity_data || {};

        const fullName =
          metadata.full_name ||
          metadata.name ||
          `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() ||
          user.email?.split("@")[0] ||
          "Student";

        const emailAddress = user.email || metadata.email || "N/A";

        const avatar =
          metadata.avatar_url ||
          metadata.picture ||
          metadata.avatar ||
          identityData.avatar_url ||
          identityData.picture ||
          null;

        const nameParts = fullName.split(" ").filter(Boolean);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        if (avatar) {
          // Warm the browser cache before the account drawer is opened.
          const preloadImage = new window.Image();
          preloadImage.decoding = "async";
          preloadImage.src = avatar;
        }

        if (isMounted) {
          setImageError(false);
          setUserProfile((prev) => ({
            ...prev,
            id: user.id,
            name: fullName,
            email: emailAddress,
            avatarUrl: avatar,
            initials,
          }));
        }
      } catch (error) {
        console.error("Unable to load user profile:", error);
      }
    };

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/interviews")) {
      setActiveNav("interviews");
    } else {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const sessionCount = dashboard?.session_volume ?? null;
  const avgPerf = dashboard?.average_performance != null ? Math.round(dashboard.average_performance) : null;
  const accuracyTier = getAccuracyTier(avgPerf, sessionCount);
  const AccuracyStatusIcon = accuracyTier.Icon;

  const staggerStyle = (index) => ({
    animationDelay: `${index * 110}ms`,
  });

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; overflow: hidden; }
        @keyframes dashboardFadeSlideIn {
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
          animation: dashboardFadeSlideIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-slide-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div
        className={`flex h-screen w-full overflow-hidden bg-white text-slate-900 font-[Inter] relative transition-opacity duration-500 ${
          isStarting ? "opacity-0" : "opacity-100"
        }`}
      >
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* Slide-out Account Drawer */}
        {isAccountMounted && (
          <div className="fixed inset-0 z-40 flex overflow-hidden">
            <div
              className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ease-in-out ${
                isAccountOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => handleToggleAccountDrawer(false)}
            />

            <aside
              className={`relative left-0 md:left-[100px] w-[340px] h-full bg-white border-r border-[#862334] shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-[Inter] text-[#2D3B45] transform transition-transform duration-300 ease-out ${
                isAccountOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex justify-end p-4">
                <button
                  onClick={() => handleToggleAccountDrawer(false)}
                  className="p-1.5 rounded-lg border border-[#862334] text-[#862334] hover:bg-[#862334]/10 transition-colors cursor-pointer"
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
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#862334] shadow-sm mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-[#862334] flex items-center justify-center text-[#862334] font-[Geist] font-semibold text-2xl mb-3 bg-white shadow-xs">
                    {userProfile.initials}
                  </div>
                )}

                <h2 className="font-[Geist] text-xl font-bold text-[#2D3B45] text-center tracking-tight">
                  {userProfile.name}
                </h2>

                <button
                  onClick={() => {
                    handleToggleAccountDrawer(false);
                    setIsSignOutModalOpen(true);
                  }}
                  className="mt-3 px-4 py-1 bg-[#F5F5F5] hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-[#2D3B45] transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>

              <div className="px-6 my-1">
                <hr className="border-t border-gray-200" />
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Email Address
                    </span>
                    <span className="text-sm font-medium text-[#2D3B45] break-all">
                      {userProfile.email || "Not Available"}
                    </span>
                  </div>
                </div>

                {userProfile.enrollments.length ? (
                  userProfile.enrollments.map((enrollment, index) => (
                    <div key={`${enrollment.course_id}-${index}`} className="space-y-4 border-t border-gray-100 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5"><BookOpen className="w-4 h-4" /></div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Enrolled Course</span>
                          <span className="text-sm font-medium text-[#2D3B45] break-words">{enrollment.course_title || "Not available"}</span>
                          {enrollment.course_code && <span className="text-xs text-gray-500">{enrollment.course_code}</span>}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5"><Users className="w-4 h-4" /></div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Section</span>
                          <span className="text-sm font-medium text-[#2D3B45]">{enrollment.section || "Not available"}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5"><Calendar className="w-4 h-4" /></div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Academic Term</span>
                          <span className="text-sm font-medium text-[#2D3B45]">{enrollment.academic_term || "Not available"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No course enrollment found.</p>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Left Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen font-[Inter]">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                handleToggleAccountDrawer(false);
                setActiveNav("dashboard");
                navigate("/user/dashboard");
              }}
            >
              <img
                src={Logo}
                alt="Alvin Logo"
                className="w-20 h-20 object-contain hover:scale-105 transition-transform"
              />
            </div>

            <nav className="w-full flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.id === "account" ? User : item.icon;
                const isSolidActive = isAccountOpen ? item.id === "account" : activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "account") {
                        handleToggleAccountDrawer(!isAccountOpen);
                      } else {
                        handleToggleAccountDrawer(false);
                        setActiveNav(item.id);
                        if (item.path) navigate(item.path);
                      }
                    }}
                    className={`w-full py-3.5 px-2 flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
                      isSolidActive
                        ? "bg-[#862334] text-white"
                        : "text-[#862334] hover:bg-[#862334]/10 bg-transparent"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-1 ${isSolidActive ? "text-white" : "text-[#862334]"}`} />
                    <span className={`text-xs tracking-tight ${isSolidActive ? "font-semibold text-white" : "font-medium text-[#862334]"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Workspace Canvas (Non-scrollable outer shell on desktop, full-scale content preserved) */}
        <main className="flex-1 w-full bg-[#F7F7F8] overflow-hidden flex flex-col h-screen min-w-0 relative">
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-12 sm:px-16 md:px-20 lg:px-28 py-5 lg:py-6 w-full relative">

            {/* Level 1: Large Display Greeting & Full-Width Narrative Summary (0ms) */}
            <section
              style={staggerStyle(0)}
              className="flex-shrink-0 mb-4 md:mb-5 animate-fade-slide-in"
            >
              <div className="text-left">
                <h1 className="font-[Geist] text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-black leading-tight mb-2 md:mb-3">
                  Welcome, <span className="text-[#862334]">{userProfile.name.split(" ")[0]}!</span>
                </h1>
                <p className="font-[Inter] text-[#4a4a4a] text-sm sm:text-base lg:text-lg leading-[1.7] tracking-normal w-full max-w-none line-clamp-2">
                  {renderPerformanceSummary(
                    dashboardError
                      ? "Your performance summary is temporarily unavailable. Please refresh the page."
                      : dashboard?.overall_summary || "Loading your interview performance summary..."
                  )}
                </p>
              </div>
            </section>

            {/* Level 2: Large KPI Metric Cards (110ms – 440ms) */}
            <section className="flex-shrink-0 mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* 1. Session Volume (110ms) */}
                <div
                  style={staggerStyle(1)}
                  className="animate-fade-slide-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between min-h-[146px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-[Inter] text-sm font-semibold tracking-wider text-slate-500">
                      Session Volume
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334] flex-shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-auto py-1.5 flex items-center">
                    <h2 className="font-[Geist] text-4xl font-bold text-[#862334] tracking-tight leading-none tabular-nums">
                      {sessionCount == null ? (
                        "—"
                      ) : (
                        <CountUpNumber value={sessionCount} />
                      )}
                    </h2>
                  </div>

                  <p className="font-[Inter] text-xs font-medium text-slate-500">
                    Total Completed Interviews
                  </p>
                </div>

                {/* 2. Avg. Accuracy — Connected to Overall Score Tiers (220ms) */}
                <div
                  style={staggerStyle(2)}
                  className="animate-fade-slide-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between min-h-[146px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-[Inter] text-sm font-semibold tracking-wider text-slate-500">
                      Avg. Accuracy
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-colors ${accuracyTier.badgeClass}`}
                    >
                      <AccuracyStatusIcon className="w-3 h-3 flex-shrink-0" />
                      <span>{accuracyTier.label}</span>
                    </span>
                  </div>

                  <div className="my-auto py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2
                        className={`font-[Geist] text-4xl font-bold tracking-tight leading-none tabular-nums transition-colors ${accuracyTier.textColor}`}
                      >
                        {avgPerf == null ? (
                          "—"
                        ) : (
                          <CountUpNumber value={avgPerf} suffix="%" />
                        )}
                      </h2>
                      <span className="font-[Inter] text-[11px] font-medium text-slate-400 tabular-nums">
                        Goal <strong className="text-emerald-600 font-semibold">70%+</strong>
                      </span>
                    </div>

                    {/* Mini 3-Zone Readiness Progress Bar with 70% Target Marker */}
                    <div className="relative h-2 w-full rounded-full bg-slate-100 mt-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${accuracyTier.barFill}`}
                        style={{
                          width: `${avgPerf == null ? 0 : Math.min(100, Math.max(0, avgPerf))}%`,
                        }}
                      />
                      <span
                        title="70% Readiness Benchmark"
                        className="absolute top-0 bottom-0 left-[70%] w-[2px] bg-slate-400/70"
                      />
                    </div>
                  </div>

                  <p className={`font-[Inter] text-[11px] font-medium leading-snug ${accuracyTier.noteColor}`}>
                    {accuracyTier.note}
                  </p>
                </div>

                {/* 3. Peak Competency (330ms) */}
                <div
                  style={staggerStyle(3)}
                  className="animate-fade-slide-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between min-h-[146px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-[Inter] text-sm font-semibold tracking-wider text-slate-500">
                      Peak Competency
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334] flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-auto py-1.5 flex items-center">
                    <h2 className="font-[Geist] text-2xl font-bold text-[#862334] tracking-tight leading-snug line-clamp-2">
                      {dashboard?.peak_competency || "Not Yet Available"}
                    </h2>
                  </div>

                  <p className="font-[Inter] text-xs font-medium text-slate-500">
                    <span className="font-semibold text-emerald-600">Strongest</span> Category
                  </p>
                </div>

                {/* 4. Priority Focus (440ms) */}
                <div
                  style={staggerStyle(4)}
                  className="animate-fade-slide-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between min-h-[146px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-[Inter] text-sm font-semibold tracking-wider text-slate-500">
                      Priority Focus
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334] flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-auto py-1.5 flex items-center">
                    <h2 className="font-[Geist] text-2xl font-bold text-[#862334] tracking-tight leading-snug line-clamp-2">
                      {dashboard?.priority_focus || "Not Yet Available"}
                    </h2>
                  </div>

                  <p className="font-[Inter] text-xs font-medium text-slate-500">
                    Area to Improve
                  </p>
                </div>

              </div>
            </section>

            {/* Level 3: Distinct Minimalist Sections with Matching Soft Maroon Outline (550ms – 660ms) */}
            <section className="flex-shrink-0 lg:flex-1 lg:min-h-[380px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-2">

              {/* Left Panel: Clean Structured Ledger for Interview History (550ms) */}
              <div
                style={staggerStyle(5)}
                className="animate-fade-slide-in lg:col-span-7 bg-white border border-[#862334]/20 rounded-xl overflow-hidden shadow-xs flex flex-col w-full max-h-[480px] lg:max-h-full"
              >
                <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-[Geist] text-lg font-bold tracking-tight text-slate-900">
                    Interview History
                  </h3>
                  <button
                    onClick={() => navigate("/user/interviews")}
                    className="font-[Inter] text-xs font-medium text-gray-700 hover:text-[#862334] transition-colors cursor-pointer"
                  >
                    View all →
                  </button>
                </div>

                <div className="grid grid-cols-[5fr_3fr_2fr_2.5fr] px-6 py-2 bg-slate-50/60 border-b border-slate-100 font-[Inter] text-[12px] font-semibold text-gray-900 flex-shrink-0">
                  <div>Target Role</div>
                  <div>Date</div>
                  <div>Score</div>
                  <div className="text-right">Insight</div>
                </div>

                {dashboardError && (
                  <p className="font-[Inter] text-sm text-red-600 px-6 py-4">{dashboardError}</p>
                )}

                {interviews.length === 0 && !dashboardError && (
                  <p className="font-[Inter] px-6 py-6 text-sm text-slate-400 text-center">
                    No interviews yet.
                  </p>
                )}

                <div className="divide-y divide-slate-100 overflow-y-auto overflow-x-hidden min-h-0">
                  {interviews.map((row, i) => (
                    <div
                      key={row.id || i}
                      className="grid grid-cols-[5fr_3fr_2fr_2.5fr] items-center px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2 font-[Inter] text-sm font-medium text-gray-700">
                        <span className="truncate">{row.role}</span>
                      </div>

                      <div className="font-[Inter] text-xs font-medium text-gray-700">
                        {row.date}
                      </div>

                      <div className={`font-[Inter] text-sm font-semibold ${row.high ? "text-emerald-600" : "text-gray-700"}`}>
                        {row.score}
                      </div>

                      <div className="text-right">
                        <button
                          disabled={!row.canView}
                          onClick={() => navigate(`/user/interview-results/${encodeURIComponent(row.id)}`)}
                          className="disabled:opacity-40 disabled:cursor-not-allowed bg-transparent border-0 border-b border-slate-300 cursor-pointer font-[Inter] text-[11px] font-semibold uppercase tracking-wider text-slate-600 pb-0.5 transition-colors hover:text-[#862334] hover:border-[#862334]"
                        >
                          View Feedback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Naturally Sized Career Advisor Comments (Vertical Scroll Only, Edge Maroon Dot) (660ms) */}
              <div
                style={staggerStyle(6)}
                className="animate-fade-slide-in lg:col-span-5 bg-white border border-[#862334]/20 rounded-xl p-5 shadow-xs flex flex-col w-full max-h-[480px] lg:max-h-full overflow-hidden"
              >
                <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between gap-2 flex-shrink-0">
                  <h3 className="font-[Geist] text-lg font-bold tracking-tight text-slate-900">
                    Career Advisor Comment
                  </h3>
                  {advisorComments.length > 0 && (
                    <span className="font-[Inter] text-xs font-medium text-gray-600">
                      {advisorComments.length} {advisorComments.length === 1 ? "Note" : "Notes"}
                    </span>
                  )}
                </div>

                {advisorComments.length === 0 ? (
                  <p className="font-[Inter] text-sm text-gray-400 py-4 text-center">
                    No career advisor feedback has been submitted yet.
                  </p>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-1.5 pr-2 space-y-3">
                    {advisorComments.map((item) => (
                      <div
                        key={item.id}
                        className="relative bg-amber-50/70 border border-amber-200/70 rounded-lg p-3.5"
                      >
                        {item.isNew && (
                          <span
                            title="Latest comment"
                            aria-label="Latest comment"
                            className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-10 pointer-events-none"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#862334] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#862334] ring-2 ring-white" />
                          </span>
                        )}

                        <div className="border-l-2 border-amber-400/80 pl-3.5 py-0.5">
                          <p className="font-[Inter] text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">
                            {item.message}
                          </p>
                        </div>

                        {item.formattedDate && (
                          <div className="mt-2 pl-3.5">
                            <span className="font-[Inter] text-[11px] text-slate-500">
                              {item.formattedDate}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </section>

          </div>

          <FloatingButton
            disabled={!enrollmentsLoaded || !isEnrolled || isInterviewPaused || isCourseConcluded}
            paused={isInterviewPaused}
            concluded={isCourseConcluded}
            disabledReason={
              !enrollmentsLoaded
                ? "Checking course availability"
                : !isEnrolled
                ? "Enroll in a course to start an interview"
                : isCourseConcluded
                ? "This course has been concluded"
                : isInterviewPaused
                ? "Paused by Career Advisor"
                : ""
            }
          />
        </main>

        <div
          className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10"
          style={{ background: "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)" }}
        />
      </div>
    </>
  );
}