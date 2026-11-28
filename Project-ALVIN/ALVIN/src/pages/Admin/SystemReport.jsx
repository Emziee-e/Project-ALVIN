import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Mic,
  TrendingUp,
  ChevronDown,
  User,
  X,
  Mail,
  Check,
  Download,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

// Navigation Configuration
const navItems = [
  { id: "account", label: "Account" },
  { id: "users", label: "People", path: "/admin/users", icon: Users },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { id: "avatars", label: "Avatars", path: "/admin/avatars", icon: UserCircle },
];

// Colors used for the donut segments (maroon / gold / dark / red)
const DONUT_COLORS = ["#862334", "#FFB003", "#2D0C13", "#991B1B"];

// Fallback poll in case Supabase Realtime is unavailable
const POLL_INTERVAL_MS = 30000;
const PROFILE_CACHE_KEY = "alvin_admin_profile_cache";

const buildProfileFromUser = (user) => {
  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() ||
    user.email?.split("@")[0] ||
    "User Account";

  const emailAddress = user.email || metadata.email || "N/A";
  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    user.identities?.[0]?.identity_data?.picture ||
    null;

  const nameParts = fullName.split(" ").filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

  return {
    name: fullName,
    email: emailAddress,
    avatarUrl: avatar,
    initials,
  };
};

const ADMIN_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://project-alvin-backend-production.up.railway.app";

// Authenticated request to the admin API (same headers as the report loader).
const adminRequest = async (path, options = {}) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in again.");
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// jsPDF's built-in fonts only cover Latin-1, so swap/strip anything outside it.
const pdfText = (value) =>
  String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "");

// ----------------------------------------------------------------------
// CUSTOM MAROON DROPDOWN COMPONENT
// ----------------------------------------------------------------------
function MaroonDropdown({ value, onChange, options = ["Daily", "Weekly", "Monthly"] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2.5 text-[11px] font-Inter font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer uppercase tracking-wider focus:outline-none ${
          isOpen
            ? "bg-[#862334] text-white border-[#862334] ring-2 ring-[#862334]/20 shadow-xs"
            : "bg-white text-[#862334] border-[#862334]/30 hover:bg-[#862334]/10"
        }`}
      >
        <span>{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : "text-[#862334]"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#862334]/25 rounded-xl shadow-lg z-50 py-1 overflow-hidden font-Inter">
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#862334] text-white"
                    : "text-[#862334] hover:bg-[#862334]/10"
                }`}
              >
                <span>{option}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// ANIMATED COUNT-UP NUMBER HELPER COMPONENT
// ----------------------------------------------------------------------
function CountUpNumber({ value, duration = 1000, prefix = "", suffix = "", decimals = 0 }) {
  const [currentValue, setCurrentValue] = useState(0);
  const shownRef = useRef(0); // what is on screen right now

  useEffect(() => {
    let target = 0;
    if (typeof value === "number") {
      target = value;
    } else if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
      target = isNaN(parsed) ? 0 : parsed;
    }

    let startTimestamp = null;
    // First render counts up from 0; later live updates animate from the old value.
    const startValue = shownRef.current;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const val = startValue + (target - startValue) * easeOutProgress;

      shownRef.current = val;
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

// 1. Interview Volume Area Chart
function InterviewVolumeAreaChart({ data = [], reportType }) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#862334" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#862334" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="2 2" stroke="#E2E8F0" />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: reportType === "Weekly" ? 11 : 10, fontWeight: 600 }}
            dy={8}
            interval={reportType === "Weekly" ? 0 : "preserveStartEnd"}
            minTickGap={16}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1A090D",
              border: "1px solid rgba(134, 35, 52, 0.4)",
              borderRadius: "12px",
              color: "#FFFFFF",
              boxShadow: "0 10px 25px -5px rgba(134, 35, 52, 0.2)",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#FFB003", fontWeight: "bold" }}
            formatter={(value) => [`${value} Sessions`, "Volume"]}
          />

          <Area
            type="monotone"
            dataKey="volume"
            stroke="#862334"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "#862334", stroke: "#FFFFFF", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#FFB003", stroke: "#862334", strokeWidth: 2 }}
            fill="url(#interviewGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Active Users Donut Gauge Chart
function RadialDonutUsersChart({ segments = [], total, reportType }) {
  const data = useMemo(
    () =>
      segments.map((segment, index) => ({
        ...segment,
        color: DONUT_COLORS[index % DONUT_COLORS.length],
      })),
    [segments]
  );
  const hasData = data.some((item) => item.value > 0);
  // Empty grey ring when there is nothing to show yet
  const chartData = hasData ? data : [{ name: "No activity", value: 1, color: "#E2E8F0" }];
  const totalUsers = total ?? data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full h-[320px] grid grid-cols-1 md:grid-cols-2 items-center">
      <div className="w-full h-[260px] relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={72}
              outerRadius={96}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />
              ))}
            </Pie>
            {hasData && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A090D",
                  border: "1px solid rgba(134, 35, 52, 0.4)",
                  borderRadius: "10px",
                  color: "#FFF",
                }}
                itemStyle={{ color: "#FFB003", fontWeight: "bold" }}
                formatter={(val, name) => [`${val} Users`, name]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 font-Geist tracking-tight">
            <CountUpNumber value={totalUsers} duration={800} />
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {reportType} Users
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-slate-700 font-Inter">{item.name}</span>
            </div>
            <span className="text-xs font-bold font-Inter text-[#862334]">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemReport() {
  const [activeNav, setActiveNav] = useState("reports");
  const [navAnimKey, setNavAnimKey] = useState(0);
  const [interviewReportType, setInterviewReportType] = useState("Weekly");
  const [userTrendType, setUserTrendType] = useState("Weekly");

  // Live report data (served by GET /api/admin/reports, computed from the database)
  const [report, setReport] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [reportError, setReportError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMountedRef = useRef(true);

  // AI analysis of the whole report + PDF export
  const volumeChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const aiRequestedRef = useRef(false);
  const [aiAnalysis, setAiAnalysis] = useState({ status: "idle", text: "", error: "" }); // idle | loading | done | error
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore storage errors
    }
    return {
      name: "User",
      email: "",
      avatarUrl: null,
      initials: "U",
    };
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const applyUser = (user) => {
      if (!user || !isMounted) return;
      const nextProfile = buildProfileFromUser(user);
      setUserProfile(nextProfile);
      setImageError(false);
      try {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
      } catch {
        // Ignore storage errors
      }
    };

    const loadUserData = async () => {
      // 1. Instant local session read (no network round-trip)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        applyUser(session.user);
      }

      // 2. Background refresh for latest metadata
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        applyUser(user);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const base = import.meta.env.VITE_API_BASE_URL || "https://project-alvin-backend-production.up.railway.app";
      const response = await fetch(`${base}/api/admin/reports`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
          "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${response.status})`);
      }
      const data = await response.json();
      if (!isMountedRef.current) return;
      setReport(data);
      setReportError("");
      setLastUpdated(new Date());
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Unable to load system report:", error);
      setReportError(error.message || "Unable to load system report.");
    } finally {
      if (isMountedRef.current) setIsLoadingReport(false);
    }
  }, []);

  // Initial load + realtime refresh (Supabase Realtime) + polling fallback
  useEffect(() => {
    isMountedRef.current = true;
    loadReport();

    let debounceTimer = null;
    const refreshSoon = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadReport, 700);
    };

    const channel = supabase
      .channel("admin-system-report")
      .on("postgres_changes", { event: "*", schema: "public", table: "interview_sessions" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "evaluation_reports" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_profile" }, refreshSoon)
      .subscribe();

    const pollTimer = setInterval(loadReport, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearTimeout(debounceTimer);
      clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [loadReport]);

  useEffect(() => {
    if (location.pathname.includes("/users")) {
      setActiveNav("users");
    } else if (location.pathname.includes("/avatars")) {
      setActiveNav("avatars");
    } else {
      setActiveNav("reports");
    }
  }, [location.pathname]);

  const summary = report?.summary;
  const volumeData = report?.interview_volume?.[interviewReportType.toLowerCase()] ?? [];

  // Supports Daily, Weekly, and Monthly user activity in the right-side donut chart
  const donut = useMemo(() => {
    const key = userTrendType.toLowerCase();
    if (report?.user_activity?.[key]) {
      return report.user_activity[key];
    }
    if (key === "daily") {
      const dailyCount = summary?.daily_users ?? 0;
      return {
        total: dailyCount,
        segments: [{ name: "Active Today", value: dailyCount }],
      };
    }
    return { total: 0, segments: [] };
  }, [report, userTrendType, summary]);

  const hasAiData = (summary?.total_interviews ?? 0) > 0 || (summary?.active_users ?? 0) > 0;

  // Asks the backend AI for a plain-language reading of the whole report.
  const generateAiAnalysis = useCallback(async (reportData) => {
    setAiAnalysis((prev) => ({ ...prev, status: "loading", error: "" }));
    try {
      const res = await adminRequest("/api/admin/reports/ai-analysis", {
        method: "POST",
        body: JSON.stringify({
          chart: "system_report",
          summary: reportData.summary,
          interview_volume: reportData.interview_volume,
          user_activity: reportData.user_activity,
        }),
      });
      const text = res.analysis || "";
      if (isMountedRef.current) setAiAnalysis({ status: "done", text, error: "" });
      return text;
    } catch (error) {
      console.warn("AI analysis unavailable:", error);
      if (isMountedRef.current) {
        setAiAnalysis({
          status: "error",
          text: "",
          error: error.message || "AI analysis is unavailable right now.",
        });
      }
      return "";
    }
  }, []);

  // Generate once when the data first arrives. Live refreshes do not re-run it
  // (that would call the AI on every update); use the Regenerate button instead.
  useEffect(() => {
    if (report && hasAiData && !aiRequestedRef.current) {
      aiRequestedRef.current = true;
      generateAiAnalysis(report);
    }
  }, [report, hasAiData, generateAiAnalysis]);

  // Downloads the system report (cards, both charts, AI analysis) as a PDF.
  // Requires: npm install html2canvas-pro jspdf
  const handleDownloadPdf = async () => {
    if (!report || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfError("");
    try {
      // Give charts a moment to finish any animation before they are captured.
      await new Promise((resolve) => setTimeout(resolve, 700));

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      let analysis = aiAnalysis.status === "done" ? aiAnalysis.text : "";
      if (!analysis && hasAiData) analysis = await generateAiAnalysis(report);

      let logoDataUrl = null;
      try {
        const logoResponse = await fetch(Logo);
        if (logoResponse.ok) logoDataUrl = await blobToDataUrl(await logoResponse.blob());
      } catch (logoErr) {
        console.warn("Logo could not be added to the PDF:", logoErr);
      }

      const capture = (node) =>
        node
          ? html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false })
          : Promise.resolve(null);
      const volumeCanvas = await capture(volumeChartRef.current);
      const donutCanvas = await capture(donutChartRef.current);

      const now = new Date();
      const reportDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const isoDate = now.toISOString().slice(0, 10);
      const fmt = (n) =>
        Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-US", { maximumFractionDigits: 1 }) : "0";
      const avgPerformance = summary?.average_performance;
      const volumeTotal = volumeData.reduce((acc, cur) => acc + (Number(cur.volume) || 0), 0);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - margin * 2;
      const footerTop = pageH - 16; // content must stay above the footer
      const maroon = [134, 35, 52];
      const ink = [9, 13, 22];
      const slate = [100, 116, 139];
      const border = [229, 231, 235];
      let y = margin;

      // ---- small drawing helpers (same look as the staff overview / interview report) ----
      const eyebrow = (text, x, yy, color = slate, size = 6.5) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        pdf.text(pdfText(text).toUpperCase(), x, yy, { charSpace: 0.35 });
      };
      const labelValueRight = (label, value, rightX, yy) => {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        const valueW = pdf.getTextWidth(value);
        pdf.setTextColor(...ink);
        pdf.text(value, rightX, yy, { align: "right" });
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...slate);
        pdf.text(label, rightX - valueW - 1, yy, { align: "right" });
      };
      const sectionHeading = (title, right) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...ink);
        pdf.text(pdfText(title), margin, y + 4);
        if (right) {
          pdf.setTextColor(...maroon);
          pdf.text(pdfText(right), pageW - margin, y + 4, { align: "right" });
        }
        y += 7;
        pdf.setDrawColor(...border);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, pageW - margin, y);
        y += 4;
      };
      const ensureSpace = (needed) => {
        if (y + needed > footerTop) {
          pdf.addPage();
          y = margin;
        }
      };
      // A chart image inside a rounded card, scaled to fit without distortion.
      const chartCard = (title, rightText, canvas, caption) => {
        const innerW = contentW - 8;
        const maxH = 58;
        let w = innerW;
        let h = canvas ? (canvas.height / canvas.width) * w : 12;
        if (canvas && h > maxH) {
          h = maxH;
          w = (canvas.width / canvas.height) * h;
        }
        const boxH = h + 14;
        ensureSpace(boxH + 11);
        sectionHeading(title, rightText);
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...border);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, contentW, boxH, 2.5, 2.5, "FD");
        if (canvas) {
          pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", margin + (contentW - w) / 2, y + 4, w, h);
        } else {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(...slate);
          pdf.text("Chart unavailable.", margin + 4, y + 8);
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...slate);
        pdf.text(pdfText(caption), margin + 4, y + h + 9.5);
        y += boxH + 8;
      };

      // ---- Header ----
      let textX = margin;
      if (logoDataUrl) {
        try {
          pdf.addImage(logoDataUrl, "PNG", margin, y, 14, 14);
          textX = margin + 18;
        } catch (imgErr) {
          console.warn("Logo format not supported by the PDF:", imgErr);
        }
      }
      eyebrow("ALVIN AI System Report", textX, y + 4, maroon, 7);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(...ink);
      pdf.text("System Report", textX, y + 12);
      labelValueRight("Date: ", reportDate, pageW - margin, y + 5);
      labelValueRight("Scope: ", "Platform-wide", pageW - margin, y + 11);
      y += 18;
      pdf.setDrawColor(...maroon);
      pdf.setLineWidth(0.6);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;

      // ---- Info box ----
      const infoH = 15;
      pdf.setFillColor(252, 252, 252);
      pdf.setDrawColor(...border);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, contentW, infoH, 2.5, 2.5, "FD");
      const infoCols = [
        ["Prepared By", userProfile?.name || "Administrator"],
        ["Email", userProfile?.email || "Not Available"],
        ["Data Last Updated", lastUpdated ? lastUpdated.toLocaleString("en-US") : "N/A"],
      ];
      const colW = contentW / 3;
      infoCols.forEach(([label, value], i) => {
        const x = margin + 4 + i * colW;
        eyebrow(label, x, y + 5.5);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...ink);
        const lines = pdf.splitTextToSize(pdfText(value), colW - 8);
        const shown = lines.length > 1 ? `${String(lines[0]).slice(0, -3)}...` : lines[0] || "";
        pdf.text(shown, x, y + 11);
      });
      y += infoH + 6;

      // ---- Summary cards (3 across) ----
      const kpis = [
        {
          tag: "Metric 01",
          label: "Total Interviews",
          value: fmt(summary?.total_interviews ?? 0),
          note: "All-time completed sessions",
        },
        {
          tag: "Metric 02",
          label: "Avg. Performance",
          value: avgPerformance == null ? "-" : `${fmt(avgPerformance)}%`,
          note: "Target benchmark 70%+",
          bar: avgPerformance == null ? null : Math.min(100, Math.max(0, Number(avgPerformance) || 0)),
        },
        {
          tag: "Metric 03",
          label: "Active Users",
          value: fmt(summary?.active_users ?? 0),
          note: `${fmt(summary?.daily_users ?? 0)} active today, last 30 days`,
        },
      ];
      const cardGap = 4;
      const cardW = (contentW - cardGap * 2) / 3;
      const cardH = 34;
      kpis.forEach((kpi, i) => {
        const x = margin + i * (cardW + cardGap);
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...border);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "FD");
        pdf.setFillColor(...maroon);
        pdf.roundedRect(x + 0.5, y, cardW - 1, 1.1, 0.5, 0.5, "F");
        eyebrow(kpi.tag, x + 5, y + 7, maroon, 6);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(...ink);
        pdf.text(kpi.label, x + 5, y + 12.5);
        pdf.setFontSize(20);
        pdf.setTextColor(...maroon);
        pdf.text(kpi.value, x + 5, y + 22);
        if (kpi.bar != null) {
          pdf.setFillColor(241, 245, 249);
          pdf.roundedRect(x + 5, y + 25, cardW - 10, 1.6, 0.8, 0.8, "F");
          if (kpi.bar > 0) {
            pdf.setFillColor(...maroon);
            pdf.roundedRect(x + 5, y + 25, Math.max(1.6, ((cardW - 10) * kpi.bar) / 100), 1.6, 0.8, 0.8, "F");
          }
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...slate);
        pdf.text(pdfText(kpi.note), x + 5, y + 30.5);
      });
      y += cardH + 9;

      // ---- Charts (as currently selected on screen) ----
      chartCard(
        `${interviewReportType} Interview Volume`,
        `Total: ${fmt(volumeTotal)} sessions`,
        volumeCanvas,
        `Interview sessions per period (${interviewReportType.toLowerCase()} view).`
      );
      chartCard(
        `${userTrendType} Users`,
        `Total: ${fmt(donut?.total ?? 0)} users`,
        donutCanvas,
        `User activity breakdown (${userTrendType.toLowerCase()} view).`
      );

      // ---- AI analysis (styled like the "AI Coach Feedback" blocks) ----
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setLineHeightFactor(1.45);
      const aiLines = pdf.splitTextToSize(
        pdfText(analysis || "AI analysis was not available when this report was generated."),
        contentW - 14
      );
      const aiLineH = 9 * 1.45 * 0.3528;
      const aiBoxH = 13 + aiLines.length * aiLineH + 7;
      ensureSpace(aiBoxH + 11);
      sectionHeading("AI Analysis");
      pdf.setFillColor(250, 245, 246);
      pdf.rect(margin, y, contentW, aiBoxH, "F");
      pdf.setFillColor(...maroon);
      pdf.rect(margin, y, 1.2, aiBoxH, "F");
      eyebrow("AI Analysis", margin + 6, y + 6.5, maroon, 6.5);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(55, 65, 81);
      pdf.text(aiLines, margin + 6, y + 12.5);
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Generated automatically from the report data. Review before sharing.", margin + 6, y + aiBoxH - 3);

      // ---- Footer on every page ----
      const totalPages = pdf.getNumberOfPages();
      for (let n = 1; n <= totalPages; n += 1) {
        pdf.setPage(n);
        pdf.setDrawColor(...border);
        pdf.setLineWidth(0.3);
        pdf.line(margin, footerTop, pageW - margin, footerTop);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text("Generated by Alvin AI Career Readiness Platform", margin, footerTop + 5);
        pdf.text("Readiness Target Benchmark: 70%+", pageW - margin, footerTop + 5, { align: "right" });
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(`Page ${n} of ${totalPages}`, pageW / 2, pageH - 5, { align: "center" });
      }

      pdf.save(`System_Report_${isoDate}.pdf`);
    } catch (error) {
      console.error("System report PDF generation failed:", error);
      setPdfError("Could not generate the PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {
      // Ignore storage errors
    }
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
        @keyframes itemFadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-item-in {
          opacity: 0;
          animation: itemFadeSlideIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Geist, Inter] relative">
        {/* Modals */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* Slide-out Account Drawer Wrapper */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-150 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="fixed inset-0 bg-black/10 transition-opacity duration-150"
            onClick={() => setIsAccountOpen(false)}
          />

          <aside
            className={`relative left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transition-transform duration-150 ease-out ${
              isAccountOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsAccountOpen(false)}
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
                  loading="eager"
                  decoding="async"
                  onError={() => setImageError(true)}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#862334] shadow-sm mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-[#862334] flex items-center justify-center text-[#862334] font-semibold text-2xl mb-3 bg-white shadow-xs">
                  {userProfile.initials}
                </div>
              )}

              <h2 className="text-xl font-bold text-[#2D3B45] text-center tracking-tight">
                {userProfile.name}
              </h2>

              <button
                onClick={() => {
                  setIsAccountOpen(false);
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
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="text-sm font-medium text-[#2D3B45] break-all">
                    {userProfile.email || "Not Available"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Sidebar Nav */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r-1 border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 select-none h-screen z-50 relative">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
                setActiveNav("reports");
                setNavAnimKey((prev) => prev + 1);
                navigate("/admin/reports");
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

                const isSolidActive = isAccountOpen
                  ? item.id === "account"
                  : activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "account") {
                        setIsAccountOpen(!isAccountOpen);
                      } else {
                        setIsAccountOpen(false);
                        setActiveNav(item.id);
                        setNavAnimKey((prev) => prev + 1);
                        if (item.path) navigate(item.path);
                      }
                    }}
                    className={`w-full py-3.5 px-2 flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
                      isSolidActive
                        ? "bg-[#862334] text-white"
                        : "text-[#862334] hover:bg-[#862334]/10 bg-transparent"
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
                          ? "font-bold text-white"
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

        {/* Main Workspace Canvas */}
        <main className="flex-1 w-full bg-[#F7F7F8] overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-y-auto w-full">
            <div
              key={`${activeNav}-${navAnimKey}`}
              className="px-8 sm:px-12 md:px-16 lg:px-20 py-8 space-y-8 w-full"
            >

              {reportError && (
                <div className="animate-item-in flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                  <span>{reportError}</span>
                  <button
                    onClick={loadReport}
                    className="px-3 py-1 rounded-lg border border-red-300 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Page heading + PDF export */}
              <div className="animate-item-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold font-Geist text-slate-900 tracking-tight">System Report</h2>
                  <p className="text-xs text-slate-500 font-Inter mt-0.5">
                    Platform-wide interview activity and performance
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!report || isGeneratingPdf}
                  className="flex items-center justify-center gap-2 bg-[#862334] text-white rounded-xl px-4 py-2.5 text-xs font-bold font-Inter tracking-wider hover:bg-[#6d1c2a] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
                </button>
              </div>
              {pdfError && (
                <p role="alert" className="text-xs text-red-700 font-Inter">
                  {pdfError}
                </p>
              )}

              {/* Minimalist Top KPI Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* 1. Total Interviews */}
                <div
                  style={{ animationDelay: "0ms" }}
                  className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                        Total Interviews
                      </span>
                      <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                        {!report && isLoadingReport ? (
                          "…"
                        ) : !report ? (
                          "—"
                        ) : (
                          <CountUpNumber value={summary?.total_interviews ?? 0} />
                        )}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                      <Mic className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold mt-3 font-Inter">
                    <span className="text-emerald-600 font-semibold">All-Time</span>
                    <span className="text-gray-500 font-semibold tracking-wider text-xs">
                      Completed Sessions
                    </span>
                  </div>
                </div>

                {/* 2. Avg. Performance */}
                <div
                  style={{ animationDelay: "120ms" }}
                  className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                        Avg. Performance
                      </span>
                      <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                        {!report && isLoadingReport ? (
                          "…"
                        ) : summary?.average_performance == null ? (
                          "—"
                        ) : (
                          <CountUpNumber
                            value={summary.average_performance}
                            suffix="%"
                            decimals={Number.isInteger(summary.average_performance) ? 0 : 1}
                          />
                        )}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                      <FileBarChart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold tracking-wider mt-3 font-Inter">
                    <span>
                      Target Benchmark <span className="text-emerald-600">70%+</span>
                    </span>
                  </div>
                </div>

                {/* 3. Active Users */}
                <div
                  style={{ animationDelay: "240ms" }}
                  className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                        Active Users
                      </span>
                      <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                        {!report && isLoadingReport ? (
                          "…"
                        ) : !report ? (
                          "—"
                        ) : (
                          <CountUpNumber value={summary?.active_users ?? 0} />
                        )}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold tracking-wider mt-3 font-Inter">
                    <span>
                      <span className="text-emerald-600">{summary?.daily_users ?? 0}</span> Active Today • Last 30 Days
                    </span>
                  </div>
                </div>

              </div>

              {/* Side-by-Side Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* CHART 1: Interview Volume (Left Container) */}
                <div
                  style={{ animationDelay: "360ms" }}
                  className="animate-item-in bg-white rounded-2xl border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)] flex flex-col"
                >
                  <div className="px-6 py-4 border-b border-[#862334]/15 flex justify-between items-center bg-rose-50/20 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#862334]" />
                      <h3 className="text-base font-bold font-[Geist,Inter] text-slate-900 tracking-tight">
                        {interviewReportType} Interview Volume
                      </h3>
                    </div>
                    <MaroonDropdown
                      value={interviewReportType}
                      onChange={setInterviewReportType}
                    />
                  </div>
                  <div className="p-6" ref={volumeChartRef}>
                    <InterviewVolumeAreaChart data={volumeData} reportType={interviewReportType} />
                  </div>
                </div>

                {/* CHART 2: Users Breakdown Donut (Right Container with Daily, Weekly, Monthly) */}
                <div
                  style={{ animationDelay: "480ms" }}
                  className="animate-item-in bg-white rounded-2xl border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)] flex flex-col"
                >
                  <div className="px-6 py-4 border-b border-[#862334]/15 flex justify-between items-center bg-rose-50/20 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFB003]" />
                      <h3 className="text-base font-bold font-[Geist,Inter] text-slate-900 tracking-tight">
                        {userTrendType} Users
                      </h3>
                    </div>
                    <MaroonDropdown
                      value={userTrendType}
                      onChange={setUserTrendType}
                    />
                  </div>
                  <div className="p-6" ref={donutChartRef}>
                    <RadialDonutUsersChart
                      segments={donut?.segments}
                      total={donut?.total}
                      reportType={userTrendType}
                    />
                  </div>
                </div>

              </div>

              {/* AI Analysis of the whole report */}
              {hasAiData && (
                <div
                  style={{ animationDelay: "540ms" }}
                  className="animate-item-in bg-white rounded-2xl border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)]"
                >
                  <div className="px-6 py-4 border-b border-[#862334]/15 flex justify-between items-center bg-rose-50/20 rounded-t-2xl">
                    <div className="flex items-center gap-2 text-[#862334]">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="text-base font-bold font-[Geist,Inter] text-slate-900 tracking-tight">
                        AI Analysis
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => report && generateAiAnalysis(report)}
                      disabled={!report || aiAnalysis.status === "loading"}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#862334] hover:text-[#6d1c2a] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${aiAnalysis.status === "loading" ? "animate-spin" : ""}`} />
                      {aiAnalysis.status === "error" ? "Retry" : "Regenerate"}
                    </button>
                  </div>
                  <div className="p-6 font-Inter">
                    {(aiAnalysis.status === "loading" || aiAnalysis.status === "idle") && (
                      <div className="space-y-2 animate-pulse" aria-label="Generating AI analysis">
                        <div className="h-3 rounded bg-gray-100 w-full" />
                        <div className="h-3 rounded bg-gray-100 w-11/12" />
                        <div className="h-3 rounded bg-gray-100 w-8/12" />
                      </div>
                    )}
                    {aiAnalysis.status === "error" && (
                      <p className="text-sm text-rose-600">{aiAnalysis.error}</p>
                    )}
                    {aiAnalysis.status === "done" && (
                      <>
                        <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.text}</p>
                        <p className="mt-2 text-[11px] text-gray-400">
                          AI-generated from the data shown. Review before acting on it.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom-right Last Updated status */}
              <div
                style={{ animationDelay: "560ms" }}
                className="animate-item-in flex justify-end pt-1 pb-2"
              >
                <p className="text-xs text-slate-500 font-medium">
                  {lastUpdated
                    ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                    : "Loading latest data…"}
                </p>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}