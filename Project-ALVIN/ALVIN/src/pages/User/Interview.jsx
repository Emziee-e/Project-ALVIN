import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mic,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "interviews", label: "History", path: "/user/interviews", icon: Mic },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";
const PER_PAGE = 5;

const formatInterviewDate = (date) => date
  ? new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  : "—";

export default function Interview() {
  const [activeNav, setActiveNav] = useState("interviews");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [interviews, setInterviews] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const total = interviews.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const visibleInterviews = interviews.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState({
    name: "Vin",
    email: "",
    enrollments: [],
    avatarUrl: null,
    initials: "V",
  });
  const [imageError, setImageError] = useState(false);

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
        if (active) setUserProfile((prev) => ({ ...prev, enrollments: Array.isArray(rows) ? rows : [] }));
      } catch (error) {
        console.error("Unable to load student enrollments:", error);
      }
    };
    loadEnrollments();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/interviews")) {
      setActiveNav("interviews");
    } else if (location.pathname.includes("/dashboard")) {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.access_token) throw new Error("Please log in to view your interview history.");
        const response = await fetch(`${API_BASE_URL}/api/interview/history`, {
          headers: {
            "X-API-Key": APP_API_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(typeof body.detail === "string" ? body.detail : `Failed to load interviews (${response.status}).`);
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setInterviews(Array.isArray(data) ? data : []);
          setPage(1);
        }
      } catch (error) {
        if (!controller.signal.aborted) setHistoryError(error.message || "Unable to load interview history.");
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => controller.abort();
  }, [refreshKey]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Geist,Inter] relative">
        {/* Modals */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* ── Slide-out Account Drawer Wrapper ── */}
        <div
          className={`fixed inset-0 z-40 flex transition-all duration-300 ${
            isAccountOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {/* Dark Backdrop Overlay with Opacity Animation */}
          <div
            className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ease-in-out ${
              isAccountOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsAccountOpen(false)}
          />

          {/* Sliding Drawer Content Container */}
          <aside
            className={`relative left-0 md:left-[100px] w-[340px] h-full bg-white border-r border-gray-200 z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transition-transform duration-300 ease-in-out ${
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
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#862334] mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-[#1565C0] flex items-center justify-center text-[#1565C0] font-semibold text-2xl mb-3 bg-white">
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

              {userProfile.enrollments.length ? userProfile.enrollments.map((enrollment, index) => (
                <div key={`${enrollment.course_id}-${index}`} className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5"><BookOpen className="w-4 h-4" /></div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrolled Course</span>
                      <span className="text-sm font-medium text-[#2D3B45] break-words">{enrollment.course_title || "Not available"}</span>
                      {enrollment.course_code && <span className="text-xs text-gray-500">{enrollment.course_code}</span>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5"><Users className="w-4 h-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</span>
                      <span className="text-sm font-medium text-[#2D3B45]">{enrollment.section || "Not available"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5"><Calendar className="w-4 h-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Academic Term</span>
                      <span className="text-sm font-medium text-[#2D3B45]">{enrollment.academic_term || "Not available"}</span>
                    </div>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">No course enrollment found.</p>}
            </div>
          </aside>
        </div>

        {/* Canvas-style Vertical Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
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
                    <Icon
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

        {/* ── Main Content ── */}
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen min-w-0">
          {/* ── Page Content ── */}
          <div className="flex-1 overflow-y-auto pt-14 pb-12 px-12 sm:px-16 lg:px-24 w-full">
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-black font-[Geist]">
                Interview History
              </h1>
              <p className="text-[#4a4a4a] text-sm mt-2">
                Review your previous performance and detailed interview feedback reports.
              </p>
            </div>

            <div className="flex justify-end mb-4">
              <button onClick={() => setRefreshKey((n) => n + 1)} disabled={historyLoading}
                className="border border-[#862334] text-[#862334] rounded px-4 py-2 text-sm font-bold hover:bg-[#862334]/5 disabled:opacity-50 cursor-pointer">
                Refresh History
              </button>
            </div>
            {historyError && <p role="alert" className="mb-4 text-red-700 bg-red-50 border border-red-200 p-4 rounded">{historyError}</p>}
            {/* ── Data Table ── */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200">
                      {["Target Role", "Date", "Readiness Score", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-4 font-Geist text-xs uppercase tracking-widest text-[#862334] font-bold ${
                            i === 3 ? "text-right" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyLoading ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading interview history...</td></tr>
                    ) : historyError ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Unable to display interviews.</td></tr>
                    ) : total === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No saved interviews yet. Complete an interview to view its report here.</td></tr>
                    ) : visibleInterviews.map((row) => (
                      <tr key={row.session_id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Role */}
                        <td className="px-6 py-5">
                          <p className="font-bold text-black text-sm md:text-base truncate">
                            {row.target_role || "Interview"}
                          </p>
                        </td>
                        {/* Date */}
                        <td className="px-6 py-5 text-gray-500 font-[Inter,sans-serif] text-xs md:text-sm whitespace-nowrap">
                          {formatInterviewDate(row.started_at)}
                        </td>
                        {/* Score */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 md:w-28 bg-gray-100 h-1.5 rounded-full overflow-hidden flex-shrink-0">
                              <div
                                className="bg-[#862334] h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, Number(row.overall_score) || 0))}%` }}
                              />
                            </div>
                            <span className="font-bold text-[#862334] text-sm whitespace-nowrap">
                              {row.overall_score == null ? "Pending" : `${Number(row.overall_score).toFixed(1)}%`}
                            </span>
                          </div>
                        </td>
                        {/* Action */}
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => navigate(`/user/interview-results/${encodeURIComponent(row.session_id)}`)}
                            disabled={row.report_status !== "completed" && row.report_status !== "failed"}
                            className="bg-[#862334] text-white hover:bg-[#6e1c2a] transition-all duration-300 px-4 md:px-5 py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap font-Geist cursor-pointer"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Pagination ── */}
            <div className="mt-8 flex justify-between items-center px-1 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={18} /> Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#862334] text-sm">{page}</span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-gray-500 text-sm">{pages}</span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
              <span className="hidden sm:block font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-400">
                Viewing {total === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} interviews
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}