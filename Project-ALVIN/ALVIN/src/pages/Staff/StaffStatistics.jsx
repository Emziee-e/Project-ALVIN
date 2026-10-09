import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LayoutDashboard,
  BarChart3,
  X,
  Mail,
  Bot,
  Search,
  GraduationCap,
  Calendar,
  Download,
  CheckCircle2,
  Send,
  Mic,
  FileBarChart,
  Users,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

// Imports from the main content target
import OverallStats from "./OverallStats";
import StudentLineChart from "./StudentLineChart";
import RadarChartComponent from "./RadarChart";

// Navigation items definition
const navItems = [
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Dashboard", path: "/staff/dashboard" },
  { id: "statistics", label: "Statistics", path: "/staff/statistics" },
];

// Mock database of students with individual statistics and comments
const MOCK_STUDENTS = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    initials: "JD",
    program: "BSIT",
    yearLevel: "3rd Year",
    grade: "85%",
    aiCritique:
      "Juan demonstrates excellent structure using the STAR method. Recommendations include reducing reliance on filler words and maintaining a steadier vocal pace during complex technical answers.",
    lineData: [
      { name: "May 4", Grade: 40 },
      { name: "May 6", Grade: 52 },
      { name: "May 8", Grade: 79 },
      { name: "May 11", Grade: 65 },
      { name: "May 13", Grade: 93 },
      { name: "May 15", Grade: 80 },
      { name: "May 18", Grade: 85 },
    ],
    radarData: [
      { subject: "Eye Contact", Score: 90, fullMark: 100 },
      { subject: "Grammar", Score: 68, fullMark: 100 },
      { subject: "Confidence", Score: 78, fullMark: 100 },
      { subject: "Answer Quality", Score: 85, fullMark: 100 },
      { subject: "Posture", Score: 82, fullMark: 100 },
    ],
    comments: [
      "Great improvement on eye contact compared to the last mock interview.",
    ],
  },
  {
    id: "2",
    name: "Maria Santos",
    initials: "MS",
    program: "BSCS",
    yearLevel: "4th Year",
    grade: "92%",
    aiCritique:
      "Maria exhibits high confidence and articulate domain knowledge in software engineering concepts. Vocal pace is well-controlled with minimal hesitation.",
    lineData: [
      { name: "May 4", Grade: 65 },
      { name: "May 6", Grade: 72 },
      { name: "May 8", Grade: 80 },
      { name: "May 11", Grade: 88 },
      { name: "May 13", Grade: 89 },
      { name: "May 15", Grade: 91 },
      { name: "May 18", Grade: 92 },
    ],
    radarData: [
      { subject: "Eye Contact", Score: 95, fullMark: 100 },
      { subject: "Grammar", Score: 90, fullMark: 100 },
      { subject: "Confidence", Score: 92, fullMark: 100 },
      { subject: "Answer Quality", Score: 94, fullMark: 100 },
      { subject: "Posture", Score: 88, fullMark: 100 },
    ],
    comments: ["Ready for enterprise technical interviews!"],
  },
  {
    id: "3",
    name: "Alex Reyes",
    initials: "AR",
    program: "BSIS",
    yearLevel: "2nd Year",
    grade: "78%",
    aiCritique:
      "Alex shows strong enthusiasm and posture. Needs to structure responses more clearly around key achievements and avoid rushing technical explanations.",
    lineData: [
      { name: "May 4", Grade: 50 },
      { name: "May 6", Grade: 58 },
      { name: "May 8", Grade: 62 },
      { name: "May 11", Grade: 70 },
      { name: "May 13", Grade: 74 },
      { name: "May 15", Grade: 76 },
      { name: "May 18", Grade: 78 },
    ],
    radarData: [
      { subject: "Eye Contact", Score: 80, fullMark: 100 },
      { subject: "Grammar", Score: 72, fullMark: 100 },
      { subject: "Confidence", Score: 85, fullMark: 100 },
      { subject: "Answer Quality", Score: 70, fullMark: 100 },
      { subject: "Posture", Score: 84, fullMark: 100 },
    ],
    comments: [],
  },
];

export default function StaffStatistics() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [activeNav, setActiveNav] = useState("statistics");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Search & Student Management States
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "",
    avatarUrl: null,
    initials: "U",
  });
  const [imageError, setImageError] = useState(false);

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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";
  const [commentError, setCommentError] = useState("");

  const staffRequest = async (path, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "X-API-Key": APP_API_KEY, Authorization: `Bearer ${session.access_token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed (${response.status})`);
    }
    return response.json();
  };

  useEffect(() => {
    let alive = true;
    staffRequest("/api/staff/students").then((rows) => {
      if (!alive) return;
      const mapped = rows.map((r) => ({ ...r, initials: (r.name || "S").split(/\s+/).map(x => x[0]).slice(0,2).join("").toUpperCase() }));
      setStudents(mapped);
      setSelectedStudent(mapped[0] || null);
    }).catch((err) => { if (alive) setCommentError(err.message); });
    return () => { alive = false; };
  }, []);

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle student selection from search dropdown
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  // Add observation comment to selected student
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedStudent) return;
    setCommentError("");
    setCommentSuccess(false);
    try {
      await staffRequest("/api/staff/feedback", { method: "POST", body: JSON.stringify({
        student_id: selectedStudent.id, message: commentInput.trim() }) });
      const comment = commentInput.trim();
      setStudents((prev) => prev.map((s) => s.id === selectedStudent.id ?
        { ...s, comments: [...(s.comments || []), comment] } : s));
      setSelectedStudent((prev) => ({ ...prev, comments: [...(prev.comments || []), comment] }));
      setCommentInput("");
      setCommentSuccess(true);
    } catch (err) { setCommentError(err.message); }
  };

  // Download PDF function trigger
  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `${selectedStudent?.name || "Student"}_Performance_Report`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-Inter relative">
      {/* Dynamic Multi-Page Print Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }

          /* Hide app shell and non-report sections */
          body * {
            visibility: hidden !important;
          }

          /* Reset containers for print flow */
          html, body, #root, main, div {
            overflow: visible !important;
            height: auto !important;
          }

          /* Render student report area */
          #student-report-section, #student-report-section * {
            visibility: visible !important;
          }

          #student-report-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Block breaking inside critical cards for multi-page overflow */
          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 24px !important;
          }

          /* Responsive chart container fixes during print */
          .grid {
            display: block !important;
          }

          /* Hide interactive or UI-only elements */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />

      {/* Slide-out Account Drawer Container */}
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
          className={`relative left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transform transition-transform duration-300 ease-in-out ${
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
              <div className="w-20 h-20 rounded-full border-2 border-[#1565C0] flex items-center justify-center text-[#1565C0] font-semibold text-2xl mb-3 bg-white shadow-xs">
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
      <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen no-print">
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
                    className={`text-[11px] tracking-tight ${
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
      <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 md:px-16 lg:px-24 w-full py-10 space-y-8">

          {/* ========================================================= */}
          {/* 4-COLUMN KPI METRIC CARDS                                  */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">

            {/* CARD 1: Total Mock Interviews */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[12px] font-semibold text-gray-500 font-geist">
                    Total Mock Interviews
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 font-geist mt-2 tracking-tight">
                    12,842
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                  <Mic className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium mt-3">
                <span className="text-emerald-600 font-bold">+12%</span>
                <span className="text-gray-400">this week</span>
              </div>
            </div>

            {/* CARD 2: Job Readiness Rate */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[12px] font-semibold text-gray-500 font-geist">
                    Job Readiness Rate
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 font-geist mt-2 tracking-tight">
                    78.4%
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                  <FileBarChart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium mt-3">
                <span>Scored 80%+ on last attempt</span>
              </div>
            </div>

            {/* CARD 3: Avg. Skill Improvement */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[12px] font-semibold text-gray-500 font-geist">
                    Avg. Improvement
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 font-geist mt-2 tracking-tight">
                    +16.2%
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium mt-3">
                <span>Between 1st & latest attempt</span>
              </div>
            </div>

            {/* CARD 4: Requires Coaching */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[12px] font-semibold text-gray-500 font-geist">
                    Requires Coaching
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 font-geist mt-2 tracking-tight">
                    48
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#862334]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold mt-3">
                <span>Students scoring below 60%</span>
              </div>
            </div>

          </div>

          {/* Overall Performance Section */}
          <div className="no-print">
            <div className="bg-white rounded-lg border border-[#e5e5e5] p-8">
              <OverallStats />
            </div>
          </div>

          {/* Detailed Analysis / Multi-Page Printable Report */}
          <div className="mb-12">
            <div
              id="student-report-section"
              ref={printRef}
              className="bg-white rounded-lg border border-[#e5e5e5] p-8"
            >
              {/* Header */}
              <div className="mb-8 print-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-geist text-xl md:text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-1">
                      Student Detailed Analysis
                    </h2>
                    <p className="text-sm text-[#4a4a4a] font-inter">
                      Performance metrics and feedback for individual students
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-80 no-print">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        placeholder="SEARCH USERS"
                        className="w-full bg-white border border-[#e5e7eb] text-black pl-11 pr-4 py-2 text-xs font-geist tracking-wider rounded-lg outline-none focus:border-[#862334] transition-colors"
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
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#e5e5e5] rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
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
                                <div className="w-8 h-8 rounded-full bg-[#862334]/10 text-[#862334] font-bold text-xs flex items-center justify-center">
                                  {student.initials}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-black">{student.name}</p>
                                  <p className="text-[10px] text-gray-500">
                                    {student.program} • {student.yearLevel}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-gray-500 text-center">
                            No students found matching "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Summary Header Card */}
                {selectedStudent && (
                  <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 mb-6 shadow-sm relative overflow-hidden print-card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-[#862334]/10 flex items-center justify-center text-[#862334] text-2xl font-bold border-2 border-[#862334]/20">
                          {selectedStudent.initials}
                        </div>

                        <div>
                          <p className="text-[#862334] font-geist font-bold text-xs uppercase tracking-widest mb-1">
                            Featured Student
                          </p>
                          <h3 className="font-geist text-2xl font-bold text-black mb-3">
                            {selectedStudent.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="text-[#4a4a4a] w-4 h-4" />
                              <p className="font-inter text-sm text-[#4a4a4a]">
                                <span className="font-bold">Program:</span> {selectedStudent.program}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="text-[#4a4a4a] w-4 h-4" />
                              <p className="font-inter text-sm text-[#4a4a4a]">
                                <span className="font-bold">Year Level:</span> {selectedStudent.yearLevel}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-2">
                        <div className="text-center md:text-right px-4">
                          <p className="font-inter text-[10px] text-[#4a4a4a] uppercase font-bold tracking-[0.2em] mb-0">
                            PERFORMANCE GRADE
                          </p>
                          <p className="font-geist text-4xl font-black text-[#862334] leading-tight">
                            {selectedStudent.grade}
                          </p>
                        </div>

                        <button
                          onClick={handleDownloadPDF}
                          className="no-print flex items-center gap-2 px-6 py-2.5 bg-[#862334] text-white font-bold uppercase text-[10px] tracking-wider rounded-lg hover:bg-[#a12a3f] transition-all shadow-lg shadow-[#862334]/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Charts Section */}
              {selectedStudent && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white rounded-lg border border-[#e5e5e5] p-6 print-card">
                    <h3 className="font-geist text-base font-bold uppercase tracking-[-0.02em] text-black mb-4">
                      Performance Growth ({selectedStudent.name})
                    </h3>
                    <StudentLineChart data={selectedStudent.lineData || []} />
                  </div>

                  <div className="bg-white rounded-lg border border-[#e5e5e5] p-6 print-card">
                    <h3 className="font-geist text-base font-bold uppercase tracking-[-0.02em] text-black mb-4">
                      Skills Assessment ({selectedStudent.name})
                    </h3>
                    <RadarChartComponent data={selectedStudent.radarData || []} />
                  </div>
                </div>
              )}

              {/* Dynamic AI Feedback Analysis */}
              {selectedStudent && (
                <div className="bg-gradient-to-r from-[#862334]/5 to-[#ffb003]/5 rounded-lg border border-[#e5e5e5] p-6 mb-8 print-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#862334] text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <h3 className="text-[#862334] font-geist font-bold uppercase text-sm tracking-widest">
                      AI Feedback Analysis
                    </h3>
                  </div>
                  <p className="text-black/90 font-inter text-sm leading-relaxed">
                    {selectedStudent.aiCritique}
                  </p>
                </div>
              )}

              {/* Student Observations Section */}
              {selectedStudent && (
                <div className="print-card">
                  <h3 className="font-geist text-base font-bold uppercase tracking-[-0.02em] text-black mb-4">
                    Your Observations for {selectedStudent.name}
                  </h3>

                  {selectedStudent.comments && selectedStudent.comments.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedStudent.comments.map((comment, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs font-inter text-gray-800"
                        >
                          {comment}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddComment} className="no-print">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full p-4 border border-[#e5e5e5] rounded-lg text-sm font-inter text-black focus:outline-none focus:shadow-[0_0_0_2px_#862334] resize-none"
                      placeholder={`Add your comments and observations about ${selectedStudent.name}'s performance...`}
                      rows="4"
                    ></textarea>

                    <div className="flex items-center justify-between mt-3">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#862334] text-white font-bold uppercase text-xs rounded-md hover:bg-[#ffb003] hover:text-black transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit Comment
                      </button>

                      {commentError && <p className="text-red-600 text-xs">{commentError}</p>}
                      {commentSuccess && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Comment saved for {selectedStudent.name}!
                        </div>
                      )}
                    </div>
                  </form>
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