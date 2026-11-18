import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LayoutDashboard,
  BarChart3,
  X,
  Mail,
  Search,
  Download,
  CheckCircle2,
  Send,
  Mic,
  FileBarChart,
  Users,
  TrendingUp,
  Filter,
  ChevronDown,
  BookOpen,
  Check,
  GraduationCap,
  Layers,
  Calendar,
  AlertTriangle,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SignOutModal from "../../Components/SignOutModal";
import AccountActionToast from "../../Components/AccountActionToast";
import { supabase } from "../../lib/supabaseClient";

// Recharts imports
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

// ----------------------------------------------------------------------
// ANIMATED COUNT-UP NUMBER HELPER COMPONENT
// ----------------------------------------------------------------------
function CountUpNumber({ value, duration = 1000, prefix = "", suffix = "" }) {
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

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formattedNumber = Math.round(currentValue).toLocaleString();

  return (
    <span>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}

// ----------------------------------------------------------------------
// 1. STUDENT LINE CHART COMPONENT (Historical Growth Trend)
// ----------------------------------------------------------------------
function StudentLineChart({ data = [], expanded = false, onToggleExpand }) {
  // Attempts can share the same date, which breaks Recharts hover matching.
  // Give every point a unique index to use as the X key.
  const safeData = (Array.isArray(data) ? data : []).map((d, i) => ({ ...d, idx: i }));
  const latestScore = safeData.length > 0 ? (safeData[safeData.length - 1]?.score ?? 0) : 0;

  return (
    <div className="flex flex-col justify-between h-full min-h-[340px] w-full min-w-0">
      <div className={`${expanded ? "h-[440px]" : "h-[280px]"} w-full min-w-0 overflow-hidden transition-all duration-300`}>
        {safeData.length > 0 ? (
          <div className="h-full w-full overflow-x-auto overflow-y-hidden">
          <div style={{ minWidth: expanded ? safeData.length * 110 : undefined, height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeData} margin={{ top: 15, right: 14, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="studentLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#862334" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#862334" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />

              <XAxis
                dataKey="idx"
                tickFormatter={(i) => safeData[i]?.date ?? ""}
                interval={0}
                tick={{ fontSize: 13, fill: "#6B7280", fontFamily: "Inter" }}
                axisLine={false}
                tickLine={false}
                dy={5}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 13, fill: "#6B7280", fontFamily: "Geist" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value ?? 0;
                    const label = payload[0].payload?.date;
                    return (
                      <div className="bg-[#FDFBF7] border border-[#EAE5D9] p-2.5 rounded-xl shadow-md text-xs font-Inter">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label || "Date"}</p>
                        <p className="font-bold text-sm text-[#862334] font-Geist mt-0.5">
                          Attempt Score: {Number(val).toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="score"
                stroke="#862334"
                strokeWidth={2.5}
                fill="url(#studentLineGrad)"
                dot={{ r: 4, fill: "#FFFFFF", stroke: "#862334", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#862334", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs font-Inter">
            No evaluation attempt history recorded for this student.
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between font-Inter">
        <span className="text-sm text-gray-500 font-normal">
          Latest Score: <strong className="text-gray-900 font-bold font-Geist text-sm">{Number(latestScore).toFixed(1)}%</strong>
        </span>
        {onToggleExpand && safeData.length > 0 && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="no-print flex items-center gap-1.5 bg-[#862334] text-white rounded-lg px-3 py-1.5 text-xs font-bold font-Inter tracking-wider hover:bg-[#6d1c2a] transition-colors cursor-pointer"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {expanded ? "Unexpand" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. RADAR CHART COMPONENT (Enlarged Diamond & Compact Progress Bars)
// ----------------------------------------------------------------------
function RadarChartComponent({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];
  const sortedData = [...safeData].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const highestSubject = sortedData[0]?.subject;
  const lowestSubject = sortedData[sortedData.length - 1]?.subject;

  const latestAvgScore = safeData.length
    ? Math.round(safeData.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / safeData.length)
    : 0;

  const targetMinimum = 70;
  const competencyGap = (latestAvgScore - targetMinimum).toFixed(1);

  return (
    <div className="flex flex-col justify-between h-full min-h-[340px] w-full min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center flex-1">

        {/* Left Expanded Container for Radar Visual (7 cols) */}
        <div className="md:col-span-7 h-[440px] w-full flex items-center justify-center min-w-0 overflow-hidden">
          {safeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={safeData}
                margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
              >
                <PolarGrid stroke="#EAE5D9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={({ x, y, payload }) => {
                    const val = payload.value || "";

                    if (val.includes("Delivery")) {
                      return (
                        <text x={x} y={y} textAnchor="end" fill="#4B5563" fontSize={13} fontWeight={600} fontFamily="Inter">
                          <tspan x={x - 10} dy="-2">Delivery &</tspan>
                          <tspan x={x - 10} dy="12">Language</tspan>
                        </text>
                      );
                    }

                    if (val.includes("Appearance")) {
                      return (
                        <text x={x} y={y} textAnchor="start" fill="#4B5563" fontSize={13} fontWeight={600} fontFamily="Inter">
                          <tspan x={x + 10} dy="-2">Appearance &</tspan>
                          <tspan x={x + 10} dy="12">Poise</tspan>
                        </text>
                      );
                    }

                    let dy = 0;
                    if (val.includes("Resume")) {
                      dy = -10;
                    } else if (val.includes("Skill")) {
                      dy = 16;
                    }

                    return (
                      <text x={x} y={y} dy={dy} textAnchor="middle" fill="#4B5563" fontSize={13} fontWeight={600} fontFamily="Inter">
                        {val}
                      </text>
                    );
                  }}
                />
                <Radar
                  name="Skill Score"
                  dataKey="score"
                  stroke="#862334"
                  fill="#862334"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: "#862334", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-400 text-sm font-Inter">No skill metrics recorded for latest attempt</div>
          )}
        </div>

        {/* Side Narrower Itemized Progress Bars (5 cols) */}
        <div className="md:col-span-5 space-y-4 font-Inter pl-0 md:pl-1 select-none pointer-events-none">
          {safeData.length > 0 ? (
            safeData.map((item) => {
              const scoreVal = Number(item.score ?? 0).toFixed(1);
              const numericVal = Number(item.score ?? 0);
              const isTop = item.subject === highestSubject && numericVal > 0;
              const isWeakest = item.subject === lowestSubject && safeData.length > 1;

              return (
                <div key={item.subject || Math.random()} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-700 flex-1 pr-1 leading-tight whitespace-nowrap">{item.subject || "Skill"}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-bold text-gray-900 font-Geist">{scoreVal}%</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop
                          ? "bg-emerald-500"
                          : isWeakest
                          ? "bg-rose-500"
                          : "bg-[#862334]"
                      }`}
                      style={{ width: `${Math.min(Math.max(numericVal, 0), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-400 font-Inter text-center py-4">
              Latest skill breakdown unavailable
            </div>
          )}
        </div>
      </div>

      {/* Target Minimum & Competency Gap Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between font-Inter text-sm">
        <span className="text-gray-500 font-normal">
          Target Benchmark: <strong className="text-gray-800 font-bold font-Geist">{targetMinimum}%</strong>
        </span>

        <div
          className={`px-3 py-1 rounded-lg text-sm font-bold font-Geist border ${
            competencyGap >= 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-[#862334] border-rose-200"
          }`}
        >
          Latest Gap: {competencyGap >= 0 ? `+${competencyGap}%` : `${competencyGap}%`}
        </div>
      </div>
    </div>
  );
}

// Custom Data Label for Cohort Area Line Graph
// ----------------------------------------------------------------------
// COHORT TREND CHART (pxPerPoint = 0 fits the card; > 0 spreads the dots out and scrolls sideways)
// ----------------------------------------------------------------------
function CohortTrendChart({ data = [], pxPerPoint = 0 }) {
  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden">
      <div style={{ minWidth: pxPerPoint ? data.length * pxPerPoint : undefined, height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 25, right: 20, left: -10, bottom: 10 }}>
            <defs>
              <linearGradient id="maroonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#862334" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#862334" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#EAE5D9" opacity={0.6} />

            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              tick={{ fontSize: 11, fill: "#4B5563", fontWeight: 600, fontFamily: "Inter" }}
              axisLine={{ stroke: "#EAE5D9" }}
              tickLine={false}
              dy={8}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11, fill: "#4B5563", fontWeight: 600, fontFamily: "Geist" }}
              axisLine={{ stroke: "#EAE5D9" }}
              tickLine={false}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  const isPassing = val >= 70;
                  return (
                    <div className="bg-[#FDFBF7] border border-[#EAE5D9] p-3 rounded-2xl shadow-lg text-xs font-Inter space-y-1 z-50">
                      <p className="text-gray-400 text-xs uppercase font-bold tracking-wider font-mono">
                        {label ? new Date(`${label}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : ""}
                      </p>
                      <div className="flex items-center gap-2.5 pt-0.5">
                        <span className="font-extrabold text-base text-[#862334] font-Geist">{val}%</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-Inter ${isPassing ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-[#862334] border border-rose-200"}`}>
                          {isPassing ? "Passing" : "Needs Coaching"}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={70}
              stroke="#D97706"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "70% Target Benchmark",
                fill: "#D97706",
                fontSize: 10,
                fontWeight: 700,
                position: "top",
                offset: 6
              }}
            />

            <Area
              type="monotone"
              dataKey="average"
              stroke="#862334"
              strokeWidth={3}
              strokeOpacity={0.95}
              fill="url(#maroonGradient)"
              dot={{ r: 5, fill: "#FFFFFF", stroke: "#862334", strokeWidth: 2.5 }}
              activeDot={{ r: 7, fill: "#FFB003", stroke: "#862334", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const navItems = [
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Dashboard", path: "/staff/dashboard" },
  { id: "statistics", label: "Statistics", path: "/staff/statistics" },
];

// ----------------------------------------------------------------------
// 3. MAIN PAGE COMPONENT: StaffStatistics
// ----------------------------------------------------------------------
export default function StaffStatistics() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const commentTimerRef = useRef(null);

  const [activeNav, setActiveNav] = useState("statistics");
  const [navAnimKey, setNavAnimKey] = useState(0);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Dynamic Section Filtering States
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search & Student Management States
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentImageError, setStudentImageError] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Delete Confirmation Modal State
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null); // { id, title, message } | null
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [isTrendExpanded, setIsTrendExpanded] = useState(false);
  const [isStudentChartExpanded, setIsStudentChartExpanded] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "",
    avatarUrl: null,
    initials: "U",
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    return () => {
      if (commentTimerRef.current) {
        clearTimeout(commentTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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

          setUserProfile({
            name: fullName,
            email: emailAddress,
            avatarUrl: avatar,
            initials: initials,
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/statistics")) {
      setActiveNav("statistics");
    } else {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://project-alvin-backend-production.up.railway.app";
  const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";
  const [commentError, setCommentError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const staffRequest = async (path, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "X-API-Key": APP_API_KEY,
        Authorization: `Bearer ${session.access_token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed (${response.status})`);
    }
    return response.json();
  };

  useEffect(() => {
    let alive = true;
    setSectionsLoading(true);
    staffRequest("/api/staff/sections")
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data)) {
          setSections(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load sections from backend:", err);
      })
      .finally(() => {
        if (alive) setSectionsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const path =
      selectedSection === "ALL"
        ? "/api/staff/students"
        : `/api/staff/students?section_id=${encodeURIComponent(selectedSection)}`;

    staffRequest(path)
      .then((rows) => {
        if (!alive) return;
        const mapped = (rows || []).map((r) => {
          const rawRadarData = Array.isArray(r.latestRadarData) && r.latestRadarData.length > 0
            ? r.latestRadarData
            : Array.isArray(r.radarData)
            ? r.radarData
            : [];

          const formattedRadar = rawRadarData.map((item) => ({
            subject: item.subject || "",
            score: item.score ?? item.Score ?? 0,
          }));

          const formattedLine = Array.isArray(r.lineData)
            ? r.lineData.map((item) => ({
                date: item.date || item.name || "",
                score: item.score ?? item.Grade ?? 0,
              }))
            : [];

          const avatarPicture =
            r.avatar_url ||
            r.avatarUrl ||
            r.picture ||
            r.profile_picture ||
            r.user_metadata?.avatar_url ||
            r.user_metadata?.picture ||
            null;

          return {
            ...r,
            avatarUrl: avatarPicture,
            initials: (r.name || "S")
              .split(/\s+/)
              .map((x) => x[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
            lineData: formattedLine,
            radarData: formattedRadar,
            latestRadarData: formattedRadar,
            latestScore: formattedLine.length > 0 ? formattedLine[formattedLine.length - 1].score : null,
            comments: Array.isArray(r.comments) ? r.comments : [],
            enrollments: Array.isArray(r.enrollments) ? r.enrollments : [],
          };
        });

        setStudents(mapped);
        setSelectedStudent(mapped[0] || null);
        setStudentImageError(false);
      })
      .catch((err) => {
        if (alive) {
          setStudents([]);
          setSelectedStudent(null);
          setCommentError(err.message);
        }
      });
    return () => {
      alive = false;
    };
  }, [selectedSection]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setOverviewLoading(true);
      try {
        const path =
          selectedSection === "ALL"
            ? "/api/staff/statistics/overview"
            : `/api/staff/statistics/overview?section_id=${encodeURIComponent(selectedSection)}`;

        const data = await staffRequest(path);
        if (active) {
          setOverview(data);
          setOverviewError("");
        }
      } catch (error) {
        if (active) setOverviewError(error.message);
      } finally {
        if (active) setOverviewLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedSection]);

  // Student number = the part of the UB mail before "@ub.edu.ph".
  const getStudentNumber = (student) => {
    if (student?.student_number) return String(student.student_number);
    const mail = String(student?.email || "");
    return mail.toLowerCase().endsWith("@ub.edu.ph") ? mail.split("@")[0] : "";
  };

  // Ignore case, dashes and spaces so "2021-12345" finds "202112345" and vice versa.
  const compact = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const matchesSearch = (student, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const qCompact = compact(q);
    return (
      (student?.name || "").toLowerCase().includes(q) ||
      (student?.email || "").toLowerCase().includes(q) ||
      (qCompact !== "" && compact(getStudentNumber(student)).includes(qCompact))
    );
  };

  const filteredStudents = students.filter((student) => matchesSearch(student, searchQuery));

  const handleSelectStudent = (student) => {
    if (!student) return;
    setSelectedStudent(student);
    setStudentImageError(false);
    setSearchQuery("");
    setIsSearchFocused(false);
    setEditingCommentId(null);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedStudent) return;
    setCommentError("");
    setCommentSuccess(false);

    if (commentTimerRef.current) {
      clearTimeout(commentTimerRef.current);
    }

    try {
      const comment = await staffRequest("/api/staff/feedback", {
        method: "POST",
        body: JSON.stringify({
          student_id: selectedStudent.id,
          message: commentInput.trim(),
        }),
      });
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? { ...s, comments: [...(s.comments || []), comment] }
            : s
        )
      );
      setSelectedStudent((prev) => ({
        ...prev,
        comments: [...(prev?.comments || []), comment],
      }));
      setCommentInput("");
      setCommentSuccess(true);

      commentTimerRef.current = setTimeout(() => {
        setCommentSuccess(false);
      }, 5000);
    } catch (err) {
      setCommentError(err.message);
    }
  };

  const updateStudentComment = (studentId, callback) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, comments: callback(s.comments || []) } : s
      )
    );
    setSelectedStudent((prev) =>
      prev?.id === studentId ? { ...prev, comments: callback(prev.comments || []) } : prev
    );
  };

  const handleEditComment = async (comment) => {
    if (!editingText.trim() || !selectedStudent || !comment?.message_id) return;
    const studentId = selectedStudent.id;
    setCommentError("");
    try {
      const updated = await staffRequest(`/api/staff/feedback/${comment.message_id}`, {
        method: "PATCH",
        body: JSON.stringify({ message: editingText.trim() }),
      });
      updateStudentComment(studentId, (list) =>
        list.map((c) => (c.message_id === comment.message_id ? updated : c))
      );
      setEditingCommentId(null);
      setEditingText("");
      setToast({
        id: Date.now(),
        title: "Comment updated",
        message: `Your note for ${selectedStudent.name} was saved.`,
      });
    } catch (err) {
      setCommentError(err.message);
    }
  };

  const confirmDeleteComment = async () => {
    if (!selectedStudent || !commentToDelete?.message_id) return;
    const studentId = selectedStudent.id;
    setIsDeleting(true);
    setCommentError("");
    try {
      await staffRequest(`/api/staff/feedback/${commentToDelete.message_id}`, { method: "DELETE" });
      updateStudentComment(studentId, (list) =>
        list.filter((c) => c.message_id !== commentToDelete.message_id)
      );
      setCommentToDelete(null);
      setToast({
        id: Date.now(),
        title: "Comment deleted",
        message: `Your note for ${selectedStudent.name} was permanently removed.`,
      });
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Builds the student's detailed report as a PDF and downloads it directly
  // (no print dialog). Requires: npm install html2canvas-pro jspdf
  const handleDownloadPDF = async () => {
    const node = printRef.current || document.getElementById("student-report-section");
    if (!node || !selectedStudent || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    setIsStudentChartExpanded(false);
    setPdfError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // Cross-origin photos (Google) can't be drawn into the PDF canvas, so load
      // the picture through our API and hand it over as a data URL.
      let avatarDataUrl = null;
      if (selectedStudent.avatarUrl && !studentImageError) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const avatarResponse = await fetch(
            `${API_BASE_URL}/api/staff/students/${encodeURIComponent(selectedStudent.id)}/avatar`,
            {
              headers: {
                "X-API-Key": APP_API_KEY,
                Authorization: `Bearer ${session?.access_token || ""}`,
              },
            }
          );
          if (avatarResponse.ok) {
            const blob = await avatarResponse.blob();
            avatarDataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (avatarErr) {
          console.warn("Profile picture could not be added to the PDF:", avatarErr);
        }
      }

      // ALVIN logo for the report header (loaded as a data URL so it always renders).
      let logoDataUrl = null;
      try {
        const logoResponse = await fetch("/images/Alvin-logo.png");
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(logoBlob);
          });
        }
      } catch (logoErr) {
        console.warn("Logo could not be added to the PDF:", logoErr);
      }
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const SCALE = 2;
      let cards = []; // top-level report cards as { top, bottom } in canvas px
      let items = []; // bottoms of smaller blocks (e.g. each comment), used only to split an oversized card

      const canvas = await html2canvas(node, {
        scale: SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const root = clonedDoc.getElementById("student-report-section");
          if (!root) return;
          // Same as the print stylesheet: hide controls, skip entry animations.
          clonedDoc.querySelectorAll(".no-print").forEach((el) => {
            el.style.display = "none";
          });
          clonedDoc.querySelectorAll(".animate-item-in").forEach((el) => {
            el.style.animation = "none";
            el.style.opacity = "1";
            el.style.transform = "none";
          });
          // Drop the outer frame so page breaks never cut through a border; each
          // card is placed on the page on its own.
          root.style.boxShadow = "none";
          root.style.border = "none";
          root.style.borderRadius = "0";
          root.style.padding = "0";
          const clonedAvatar = root.querySelector("img[data-pdf-avatar]");
          if (clonedAvatar) {
            if (avatarDataUrl) {
              clonedAvatar.removeAttribute("crossorigin");
              clonedAvatar.src = avatarDataUrl;
            } else {
              clonedAvatar.style.display = "none"; // no picture available; avoid a blank circle
            }
          }
          // The on-screen title/search row is replaced by the branded header below.
          clonedDoc.querySelectorAll("[data-pdf-hide]").forEach((el) => el.remove());

          // Branded header (same look as the interview results report).
          const header = clonedDoc.createElement("div");
          header.className = "print-card font-Inter";
          header.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;gap:16px;" +
            "padding-bottom:14px;margin-bottom:12px;border-bottom:2px solid #862334;background:#ffffff;";

          const brand = clonedDoc.createElement("div");
          brand.style.cssText = "display:flex;align-items:center;gap:12px;";
          if (logoDataUrl) {
            const logo = clonedDoc.createElement("img");
            logo.src = logoDataUrl;
            logo.alt = "ALVIN logo";
            logo.width = 46;
            logo.height = 46;
            logo.style.cssText = "width:46px;height:46px;object-fit:contain;";
            brand.appendChild(logo);
          }
          const brandText = clonedDoc.createElement("div");
          const eyebrow = clonedDoc.createElement("div");
          eyebrow.textContent = "ALVIN AI CAREER READINESS";
          eyebrow.style.cssText =
            "font-size:11px;font-weight:700;letter-spacing:0.14em;color:#862334;margin-bottom:2px;";
          const headerTitle = clonedDoc.createElement("div");
          headerTitle.textContent = "Student Detailed Analytics";
          headerTitle.className = "font-Geist";
          headerTitle.style.cssText = "font-size:24px;font-weight:700;color:#090D16;line-height:1.15;";
          brandText.appendChild(eyebrow);
          brandText.appendChild(headerTitle);
          brand.appendChild(brandText);

          const meta = clonedDoc.createElement("div");
          meta.style.cssText = "text-align:right;font-size:12px;color:#475569;line-height:1.5;";
          const dateLine = clonedDoc.createElement("div");
          dateLine.textContent = `Date: ${reportDate}`;
          const studentLine = clonedDoc.createElement("div");
          meta.appendChild(dateLine);
          meta.appendChild(studentLine);

          header.appendChild(brand);
          header.appendChild(meta);
          root.insertBefore(header, root.firstChild);

          // Measure after hiding so the break points match what gets drawn.
          const rootTop = root.getBoundingClientRect().top;
          cards = Array.from(root.querySelectorAll(".print-card"))
            .filter((el) => !el.parentElement.closest(".print-card"))
            .map((el) => {
              const rect = el.getBoundingClientRect();
              return { top: (rect.top - rootTop) * SCALE, bottom: (rect.bottom - rootTop) * SCALE };
            });
          items = Array.from(root.querySelectorAll(".print-item")).map(
            (el) => (el.getBoundingClientRect().bottom - rootTop) * SCALE
          );
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;
      const pxPerMm = canvas.width / contentW;
      const pageHeightPx = Math.floor(contentH * pxPerMm);

      // Lay whole cards onto pages (never cutting through one). A card taller than
      // a page is split, preferring the gap between its inner items.
      const PAD = 4 * SCALE;
      const blocks = cards.length ? cards.map((c) => ({ ...c })) : [{ top: 0, bottom: canvas.height }];
      const pages = [];
      let i = 0;
      while (i < blocks.length) {
        const first = blocks[i];
        const start = Math.max(0, Math.floor(first.cont ? first.top : first.top - PAD));
        let j = i;
        while (j + 1 < blocks.length && blocks[j + 1].bottom + PAD - start <= pageHeightPx) j += 1;
        const end = Math.min(canvas.height, Math.ceil(blocks[j].bottom + PAD));

        if (end - start > pageHeightPx && j === i) {
          const limit = start + pageHeightPx;
          const cuts = items.filter((b) => b > start + pageHeightPx * 0.3 && b + PAD <= limit);
          const cut = Math.floor(cuts.length ? Math.max(...cuts) + PAD : limit);
          pages.push({ start, end: cut });
          blocks[i] = { top: cut, bottom: first.bottom, cont: true };
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

      // Page numbers
      const totalPages = pdf.getNumberOfPages();
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      for (let n = 1; n <= totalPages; n += 1) {
        pdf.setPage(n);
        pdf.text(`Page ${n} of ${totalPages}`, pageW / 2, pageH - 5, { align: "center" });
      }

      const safeName = String(selectedStudent.name || "Student")
        .trim()
        .replace(/[^\w\-]+/g, "_");
      pdf.save(`${safeName}_Performance_Report.pdf`);

      setToast({
        id: Date.now(),
        title: "PDF downloaded",
        message: `${selectedStudent.name}'s detailed report was saved to your device.`,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      setPdfError("Could not generate the PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentSectionLabel =
    selectedSection === "ALL"
      ? "Overall Section"
      : (Array.isArray(sections) ? sections : []).find(
          (s) => s.id === selectedSection || s.section_name === selectedSection || s.name === selectedSection
        )?.section_name || selectedSection;

  const dynamicChartTitle =
    selectedSection === "ALL"
      ? "Competency Growth Trend (Overall)"
      : `Competency Growth Trend (${currentSectionLabel})`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-Inter relative">
      <style>{`
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

        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          html, body, #root, main, div {
            overflow: visible !important;
            height: auto !important;
            background: #FFFFFF !important;
          }

          .animate-item-in {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }

          #student-report-section, #student-report-section * {
            visibility: visible !important;
          }

          #student-report-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 10mm 12mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #FFFFFF !important;
          }

          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12px !important;
            padding: 16px !important;
            border: 1px solid #E5E7EB !important;
            background-color: #FFFFFF !important;
            box-shadow: none !important;
          }

          .grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }

          .recharts-responsive-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
          }

          .h-\\[220px\\], .h-\\[230px\\] {
            height: 180px !important;
          }

          .no-print, .print-header {
            display: none !important;
          }
        }

        input:focus, textarea:focus {
          border-color: #862334 !important;
          box-shadow: 0 0 0 2px rgba(134, 35, 52, 0.15) !important;
          outline: none !important;
        }
      `}</style>

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />

      <AccountActionToast toast={toast} onClose={() => setToast(null)} />

      {/* Delete Comment Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print font-Inter">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200"
            onClick={() => setCommentToDelete(null)}
          />

          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-[#862334] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-Geist text-lg font-bold text-gray-900 tracking-tight">
                  Delete Observation Note?
                </h3>
                <p className="text-xs text-gray-500 font-Inter font-normal">
                  This observation note will be permanently removed from {selectedStudent?.name}'s file.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-gray-700 italic max-h-24 overflow-y-auto">
              "{commentToDelete.message}"
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCommentToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteComment}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#862334] text-white text-xs font-bold rounded-xl hover:bg-[#a12a3f] transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Drawer */}
      <div
        className={`fixed inset-0 z-40 flex transition-opacity duration-300 ease-in-out no-print ${
          isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/20 transition-opacity duration-300"
          onClick={() => setIsAccountOpen(false)}
        />

        <aside
          className={`relative left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none text-[#2D3B45] transform transition-transform duration-300 ease-in-out font-Inter ${
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
                onError={() => setImageError(true)}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#1565C0] shadow-sm mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-[#1565C0] flex items-center justify-center text-[#1565C0] font-bold text-2xl mb-3 bg-white shadow-xs font-Geist">
                {userProfile.initials}
              </div>
            )}

            <h2 className="text-xl font-bold text-[#2D3B45] text-center tracking-tight font-Geist">
              {userProfile.name}
            </h2>

            <button
              onClick={() => {
                setIsAccountOpen(false);
                setIsSignOutModalOpen(true);
              }}
              className="mt-3 px-4 py-1 bg-[#F5F5F5] hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-[#2D3B45] transition-colors cursor-pointer font-Inter"
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
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-Inter">
                  EMAIL ADDRESS
                </span>
                <span className="text-sm font-medium text-[#2D3B45] break-all font-Inter">
                  {userProfile.email || "Not Available"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-[100px] bg-[#FDFBF7] border-r-1 border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 select-none h-screen z-50 relative">
        <div className="w-full flex flex-col items-center">
          <div
            className="mb-3 px-1 flex flex-col items-center cursor-pointer"
            onClick={() => {
              setIsAccountOpen(false);
              setActiveNav("dashboard");
              navigate("/staff/dashboard");
            }}
          >
            <img
              src="/images/Alvin-logo.png"
              alt="Alvin Logo"
              className="w-20 h-20 object-contain hover:scale-105 transition-transform"
            />
          </div>

          <nav className="w-full flex flex-col gap-1">
            {navItems.map((item) => {
              const IconComponent =
                item.id === "account"
                  ? User
                  : item.id === "dashboard"
                  ? LayoutDashboard
                  : BarChart3;

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
                  <IconComponent
                    className={`w-6 h-6 mb-1 ${
                      isSolidActive ? "text-white" : "text-[#862334]"
                    }`}
                  />
                  <span
                    className={`text-xs tracking-tight font-Inter ${
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

      {/* Main Container */}
      <main className="flex-1 w-full bg-[#F7F7F8] overflow-hidden flex flex-col h-screen font-Inter">
        <div
          key={`${activeNav}-${selectedSection}-${navAnimKey}`}
          className="flex-1 overflow-y-auto px-6 sm:px-10 md:px-16 lg:px-24 w-full py-10 space-y-8"
        >

          {/* Section Header & Custom Dropdown */}
          <div
            style={{ animationDelay: "0ms" }}
            className="animate-item-in relative z-30 bg-white border border-[#EAE5D9] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#862334]/10 text-[#862334] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-Geist tracking-tight">
                  Evaluation Overview
                </h1>
                <p className="text-xs text-gray-500 font-Inter font-normal">
                  Filter analytics and roster data by selected section or view overall totals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#862334] hidden sm:block" />
              <div className="relative w-full sm:w-72" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={sectionsLoading}
                  className="w-full bg-[#FDFBF7] border border-[#EAE5D9] hover:border-[#862334]/40 text-gray-900 text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#862334]/10 font-Inter"
                >
                  <span className="truncate">{currentSectionLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-[#862334] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-[#EAE5D9] rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto font-Inter">
                    <div
                      onClick={() => {
                        setSelectedSection("ALL");
                        setIsDropdownOpen(false);
                      }}
                      className={`px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        selectedSection === "ALL"
                          ? "bg-[#862334] text-white"
                          : "text-gray-800 hover:bg-[#862334]/10 hover:text-[#862334]"
                      }`}
                    >
                      <span>Overall</span>
                      {selectedSection === "ALL" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {(Array.isArray(sections) ? sections : []).map((sec) => {
                      const secId = sec.id || sec.section_id || sec.name || sec.section_name;
                      const secName = sec.section_name || sec.name || sec.title || secId;
                      const courseCode = sec.course_code || sec.subject_code || "";
                      const isSelected = selectedSection === secId;

                      return (
                        <div
                          key={secId}
                          onClick={() => {
                            setSelectedSection(secId);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#862334] text-white"
                              : "text-gray-800 hover:bg-[#862334]/10 hover:text-[#862334]"
                          }`}
                        >
                          <span className="truncate">
                            {secName} {courseCode ? `(${courseCode})` : ""}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
            <div
              style={{ animationDelay: "120ms" }}
              className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                    Evaluations Completed
                  </span>
                  <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                    {overviewLoading ? (
                      "…"
                    ) : (
                      <CountUpNumber value={overview?.total_interviews ?? 0} />
                    )}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                  <Mic className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold mt-3 font-Inter">
                <span className="text-emerald-600 font-semibold">+12%</span>
                <span className="text-gray-500 font-semibold tracking-wider text-xs">This Week</span>
              </div>
            </div>

            <div
              style={{ animationDelay: "230ms" }}
              className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                    Career Readiness Index
                  </span>
                  <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                    {overviewLoading ? (
                      "…"
                    ) : (
                      <CountUpNumber value={overview?.job_readiness_rate ?? 0} suffix="%" />
                    )}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                  <FileBarChart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold tracking-wider mt-3 font-Inter">
                <span>Scored <span className="text-emerald-600">70%+</span> on Latest Attempt</span>
              </div>
            </div>

            <div
              style={{ animationDelay: "340ms" }}
              className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                    Improvement Rate
                  </span>
                  <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                    {overviewLoading ? (
                      "…"
                    ) : (
                      <CountUpNumber
                        value={overview?.average_improvement ?? 0}
                        prefix={(overview?.average_improvement ?? 0) > 0 ? "+" : ""}
                        suffix="%"
                      />
                    )}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold tracking-wider mt-3 font-Inter">
                <span>Between 1st & Latest Attempt</span>
              </div>
            </div>

            <div
              style={{ animationDelay: "450ms" }}
              className="animate-item-in bg-white border border-[#862334]/20 border-t-4 border-t-[#862334] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[135px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-700 font-Inter tracking-wider">
                    Priority Attention
                  </span>
                  <h3 className="text-3xl font-bold font-Geist text-[#862334] mt-2 tracking-tight">
                    {overviewLoading ? (
                      "…"
                    ) : (
                      <CountUpNumber value={overview?.requires_coaching ?? 0} />
                    )}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#862334]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold tracking-wider mt-3 font-Inter">
                <span>Students Scoring Below <span className="text-yellow-600">70%</span></span>
              </div>
            </div>
          </div>

          {/* Cohort Line Trend Graph */}
          <div
            style={{ animationDelay: "540ms" }}
            className="animate-item-in no-print"
          >
            <div className="bg-white rounded-2xl border border-[#862334]/20 p-6 md:p-8 shadow-xs transition-all">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mt-1 font-Geist tracking-tight">
                    {dynamicChartTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#862334]" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 font-Inter tracking-wider">Cohort Average:</span>
                      <span className="text-sm font-bold text-[#862334] font-Geist">
                        {Array.isArray(overview?.trend) && overview.trend.length
                          ? `${Math.round(overview.trend.reduce((acc, curr) => acc + (curr.average || 0), 0) / overview.trend.length)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 font-Inter tracking-wider">Benchmark:</span>
                      <span className="text-sm font-bold text-gray-800 font-Geist">70% Target</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTrendExpanded((v) => !v)}
                    disabled={!(Array.isArray(overview?.trend) && overview.trend.length)}
                    className="flex items-center gap-2 bg-[#862334] text-white rounded-xl px-3.5 py-1.5 text-xs font-bold font-Inter tracking-wider hover:bg-[#6d1c2a] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isTrendExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    {isTrendExpanded ? "Unexpand" : "Expand"}
                  </button>
                </div>
              </div>

              {overviewError && (
                <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm mb-4 font-Inter">
                  {overviewError}
                </div>
              )}

              <div className={`${isTrendExpanded ? "h-[520px]" : "h-[360px]"} w-full pt-2 transition-all duration-300`}>
                {overviewLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm font-Inter">
                    Loading section statistics…
                  </div>
                ) : Array.isArray(overview?.trend) && overview.trend.length ? (
                  <CohortTrendChart data={overview.trend} pxPerPoint={isTrendExpanded ? 90 : 0} />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm font-Inter">
                    No evaluation data available for {currentSectionLabel} yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Printable Student Report */}
          <div
            style={{ animationDelay: "660ms" }}
            className="animate-item-in mb-12 font-Inter"
          >
            <div
              id="student-report-section"
              ref={printRef}
              className="bg-white rounded-2xl border border-[#862334]/15 p-6 md:p-8 shadow-sm space-y-8"
            >
              {/* Header & Top Right Search Bar */}
              <div className="print-card">
                {/* Title/search row: left out of the PDF (its title moves into the PDF header). The student banner below stays. */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
                  data-pdf-hide="true"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="font-Geist text-2xl font-bold tracking-tight text-gray-900 mb-0.5">
                        Student Detailed Analytics
                      </h2>
                      <p className="text-xs text-gray-500 font-Inter font-normal">
                        In-depth performance metrics and individualized feedback
                      </p>
                    </div>
                  </div>

                  {/* Search Input at Top Right */}
                  <div className="relative w-full sm:w-72 no-print">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        placeholder="Search by name or student number"
                        className="w-full bg-[#FDFBF7] border border-[#EAE5D9] text-gray-900 pl-10 pr-4 py-2 text-xs font-Inter rounded-xl outline-none focus:border-[#862334] focus:ring-1 focus:ring-[#862334] transition-all shadow-2xs"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isSearchFocused && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto font-Inter">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <div
                              key={student.id}
                              onClick={() => handleSelectStudent(student)}
                              className={`px-4 py-3 hover:bg-[#862334]/5 cursor-pointer flex items-center transition-colors border-b border-gray-50 last:border-0 ${
                                selectedStudent?.id === student.id ? "bg-rose-50/50" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {student.avatarUrl ? (
                                  <img
                                    src={student.avatarUrl}
                                    alt={student.name}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#862334]/10 text-[#862334] font-bold text-xs flex items-center justify-center font-Geist">
                                    {student.initials}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-gray-900 font-Geist">{student.name}</p>
                                  {getStudentNumber(student) && (
                                    <p className="text-xs font-semibold text-[#862334] font-Inter">
                                      {getStudentNumber(student)}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 font-Inter font-normal">
                                    {(Array.isArray(student.enrollments) ? student.enrollments : [])
                                      .map((e) => e.course_code || e.course_title || e.section)
                                      .join(", ") || "Enrolled Student"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-gray-500 text-center font-Inter">
                            No enrolled students found matching "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Student Featured Banner */}
                {selectedStudent ? (
                  <div className="bg-[#FDFBF7]/50 rounded-2xl border border-[#862334]/20 p-6 md:p-8 shadow-xs relative overflow-hidden print-card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="relative flex-shrink-0">
                          {selectedStudent.avatarUrl && !studentImageError ? (
                            <img
                              src={selectedStudent.avatarUrl}
                              alt={selectedStudent.name}
                              data-pdf-avatar="true"
                              onError={() => setStudentImageError(true)}
                              referrerPolicy="no-referrer"
                              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xs"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-[#862334]/10 text-[#862334] text-2xl font-bold flex items-center justify-center border-4 border-white font-Geist">
                              {selectedStudent.initials}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-Geist text-2xl font-bold text-gray-900 tracking-tight">
                              {selectedStudent.name}
                            </h3>
                            {getStudentNumber(selectedStudent) && (
                              <span className="px-2.5 py-1 rounded-full bg-[#862334]/10 text-[#862334] text-xs font-semibold font-Inter">
                                {getStudentNumber(selectedStudent)}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            {(Array.isArray(selectedStudent.enrollments) ? selectedStudent.enrollments : []).length ? (
                              selectedStudent.enrollments.map((enrollment, i) => (
                                <React.Fragment key={`${enrollment.course_id || i}-${i}`}>
                                  <div className="flex items-center gap-3 bg-white border border-[#EAE5D9] px-3.5 py-2 rounded-xl shadow-2xs">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#862334] flex items-center justify-center flex-shrink-0">
                                      <GraduationCap className="w-4 h-4 stroke-[2]" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight font-Inter">
                                        Course
                                      </span>
                                      <span className="text-xs font-bold text-gray-900 font-Geist leading-tight mt-0.5">
                                        {enrollment.course_title || enrollment.course_code || "—"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 bg-white border border-[#EAE5D9] px-3.5 py-2 rounded-xl shadow-2xs">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#862334] flex items-center justify-center flex-shrink-0">
                                      <Layers className="w-4 h-4 stroke-[2]" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight font-Inter">
                                        SECTION
                                      </span>
                                      <span className="text-xs font-bold text-gray-900 font-Geist leading-tight mt-0.5">
                                        {enrollment.section || "—"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 bg-white border border-[#EAE5D9] px-3.5 py-2 rounded-xl shadow-2xs">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#862334] flex items-center justify-center flex-shrink-0">
                                      <Calendar className="w-4 h-4 stroke-[2]" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight font-Inter">
                                        TERM
                                      </span>
                                      <span className="text-xs font-bold text-gray-900 font-Geist leading-tight mt-0.5">
                                        {enrollment.academic_term || "—"}
                                      </span>
                                    </div>
                                  </div>
                                </React.Fragment>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 font-Inter">No course enrollment information available.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end justify-center gap-3">
                        <div className="text-left md:text-right">
                          <p className="font-Inter text-xs text-gray-500 font-bold tracking-wider mb-1.5">
                            PERFORMANCE GRADE
                          </p>
                          <p className="font-Geist text-4xl font-black text-[#862334] leading-none">
                            {selectedStudent.latestScore != null ? `${Number(selectedStudent.latestScore).toFixed(1)}%` : selectedStudent.grade || "N/A"}
                          </p>
                        </div>

                        <button
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPdf}
                          className="no-print flex items-center gap-2 px-5 py-2.5 bg-[#862334] text-white font-bold text-xs rounded-xl hover:bg-[#a12a3f] active:scale-[0.99] transition-all shadow-md shadow-[#862334]/20 cursor-pointer font-Inter disabled:opacity-60 disabled:cursor-wait"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
                        </button>
                        {pdfError && (
                          <p role="alert" className="no-print text-xs text-red-700 font-Inter">
                            {pdfError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FDFBF7] border border-[#EAE5D9] rounded-xl p-8 text-center text-gray-500 text-sm font-medium font-Inter">
                    No enrolled students found for {currentSectionLabel}.
                  </div>
                )}
              </div>

              {/* Student Analytics Charts Section */}
              {selectedStudent && (
                <div
                  key={`charts-${selectedStudent.id}`}
                  className="flex flex-col gap-6"
                >
                  {/* Historical Line Chart */}
                  <div
                    style={{ animationDelay: "0ms" }}
                    className="animate-item-in print-card bg-[#FDFBF7]/50 rounded-2xl border border-[#862334]/15 p-6 shadow-2xs flex flex-col justify-between overflow-hidden min-w-0"
                  >
                    <div className="mb-4">
                      <h3 className="font-Geist text-lg font-bold tracking-tight text-gray-900">
                        Performance Growth ({selectedStudent.name})
                      </h3>
                      <p className="text-sm text-gray-500 font-Inter font-normal">
                        Historical score progression across all completed attempts
                      </p>
                    </div>
                    <StudentLineChart
                      data={selectedStudent.lineData || []}
                      expanded={isStudentChartExpanded}
                      onToggleExpand={() => setIsStudentChartExpanded((v) => !v)}
                    />
                  </div>

                  {/* Skills Assessment Radar Chart */}
                  <div
                    style={{ animationDelay: "120ms" }}
                    className="animate-item-in print-card bg-[#FDFBF7]/50 rounded-2xl border border-[#862334]/15 p-6 shadow-2xs flex flex-col justify-between overflow-hidden min-w-0"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-Geist text-lg font-bold tracking-tight text-gray-900">
                          Skills Assessment ({selectedStudent.name})
                        </h3>
                        <p className="text-sm text-gray-500 font-Inter font-normal">
                          Competency score breakdown for the student's most recent attempt
                        </p>
                      </div>
                    </div>
                    <RadarChartComponent data={selectedStudent.latestRadarData || selectedStudent.radarData || []} />
                  </div>
                </div>
              )}

              {/* Observations & Feedback Section */}
              {selectedStudent && (
                <div
                  key={`obs-${selectedStudent.id}`}
                  style={{ animationDelay: "220ms" }}
                  className="animate-item-in bg-[#FDFBF7]/50 rounded-2xl border border-[#862334]/15 p-6 print-card font-Inter shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-Geist text-lg font-bold text-gray-900 tracking-tight">
                      Your Observations for {selectedStudent.name}
                    </h3>

                    <div className="px-3.5 py-1 bg-white border border-[#EAE5D9] text-[#862334] rounded-full text-xs font-semibold font-Inter shadow-2xs no-print">
                      {(selectedStudent.comments || []).length}{" "}
                      {(selectedStudent.comments || []).length === 1 ? "Active Note" : "Active Notes"}
                    </div>
                  </div>

                  {(Array.isArray(selectedStudent.comments) ? selectedStudent.comments : []).length > 0 && (
                    <div className="mb-6 space-y-3">
                      {selectedStudent.comments.map((comment) => {
                        const authorName =
                          comment.author_name ||
                          userProfile.name ||
                          "Prof. Staff Advisor";

                        const formattedDate = comment.created_at
                          ? new Date(comment.created_at).toLocaleString("en-US", {
                              month: "numeric",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })
                          : "Recently added";

                        return (
                          <div
                            key={comment.message_id || Math.random()}
                            className="print-item bg-white border border-[#862334]/15 p-5 rounded-xl text-sm font-Inter text-gray-800 transition-all shadow-2xs"
                          >
                            {editingCommentId === comment.message_id ? (
                              <div className="space-y-3 no-print">
                                <textarea
                                  className="w-full border border-gray-300 rounded-lg p-3 font-Inter text-sm bg-white focus:outline-none focus:border-[#862334]"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    className="px-4 py-1.5 bg-[#862334] text-white rounded-md text-xs font-bold font-Inter hover:bg-[#a12a3f] transition-colors cursor-pointer"
                                    onClick={() => handleEditComment(comment)}
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    type="button"
                                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold font-Inter cursor-pointer"
                                    onClick={() => setEditingCommentId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 font-Geist text-sm">
                                      {authorName}
                                    </span>
                                    <span className="text-xs text-gray-400 font-normal">
                                      {formattedDate}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs font-medium no-print">
                                    <button
                                      type="button"
                                      className="text-gray-600 hover:text-gray-900 transition-colors font-semibold cursor-pointer"
                                      onClick={() => {
                                        setEditingCommentId(comment.message_id);
                                        setEditingText(comment.message || "");
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <span className="text-gray-300">•</span>
                                    <button
                                      type="button"
                                      className="text-rose-600 hover:text-rose-800 transition-colors font-semibold cursor-pointer"
                                      onClick={() => setCommentToDelete(comment)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                <p className="text-gray-700 leading-relaxed font-Inter text-sm whitespace-pre-wrap">
                                  {comment.message}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-3 no-print">
                    <h4 className="text-md font-bold text-gray-900 font-Geist">
                      Add Staff Observation & Guidance
                    </h4>

                    <form onSubmit={handleAddComment} className="space-y-4">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="w-full p-4 border border-[#EAE5D9] rounded-xl text-sm font-Inter text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#862334] focus:ring-1 focus:ring-[#862334] bg-white transition-all resize-none shadow-2xs"
                        placeholder={`Add your comments, recommended drills, and feedback for ${selectedStudent.name}...`}
                        rows={3}
                      />

                      <div className="flex items-center justify-between">
                        <div>
                          {commentError && (
                            <p className="text-rose-600 text-xs font-semibold font-Inter">
                              {commentError}
                            </p>
                          )}
                          {commentSuccess && (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold font-Inter transition-opacity duration-300">
                              <CheckCircle2 className="w-4 h-4" />
                              Observation saved successfully!
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#862334] text-white font-bold text-xs rounded-xl hover:bg-[#a12a3f] active:scale-[0.99] transition-all shadow-md shadow-[#862334]/15 cursor-pointer font-Inter"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit Observation
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div
        className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10 no-print"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}