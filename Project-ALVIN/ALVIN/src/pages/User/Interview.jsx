
import { useEffect, useState, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  Mic,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Mail,
  Calendar,
  BookOpen,
  Users,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import AccountActionToast from "../../Components/AccountActionToast";
import { supabase } from "../../lib/supabaseClient";
import { authenticatedFetch } from "../../lib/authenticatedFetch";

const navItems = [
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "interviews", label: "History", path: "/user/interviews", icon: Mic },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Most Recent" },
  { id: "score", label: "Highest Score" },
];

const PER_PAGE = 5;

const formatInterviewDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const getScoreDotColor = (score) => {
  if (score == null) return "bg-slate-300";
  const num = Number(score);
  if (num >= 70) return "bg-emerald-600";
  if (num >= 40) return "bg-amber-500";
  if (num >= 25) return "bg-[#862334]";
  return "bg-slate-300";
};

function getPaginationNumbers(current, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Group into chunks of 3.
  const chunkStart = Math.floor((current - 1) / 3) * 3 + 1;

  if (chunkStart === 1) {
    return [1, 2, 3, "...", totalPages];
  }

  if (chunkStart >= totalPages - 3) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", chunkStart, chunkStart + 1, chunkStart + 2, "...", totalPages];
}

export default function Interview() {
  const [activeNav, setActiveNav] = useState("interviews");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [interviews, setInterviews] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState(null);

  const sortDropdownRef = useRef(null);
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

  // Close sort dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isSortOpen) return;

    const handleClickOutside = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setIsSortOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsSortOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortOpen]);

  const processedInterviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = query
      ? interviews.filter((row) => {
          const role = (row.target_role || "Interview").toLowerCase();
          const formattedDate = formatInterviewDate(row.started_at).toLowerCase();

          return role.includes(query) || formattedDate.includes(query);
        })
      : [...interviews];

    if (sortBy === "score") {
      filtered.sort((a, b) => {
        const scoreA = a.overall_score == null ? -1 : Number(a.overall_score);
        const scoreB = b.overall_score == null ? -1 : Number(b.overall_score);

        return scoreB - scoreA;
      });
    } else {
      filtered.sort((a, b) => {
        const timeA = a.started_at ? new Date(a.started_at).getTime() : 0;
        const timeB = b.started_at ? new Date(b.started_at).getTime() : 0;

        return timeB - timeA;
      });
    }

    return filtered;
  }, [interviews, searchQuery, sortBy]);

  const total = processedInterviews.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, pages);

  const visibleInterviews = processedInterviews.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  );

  const pageNumbers = getPaginationNumbers(safePage, pages);

  const activeSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || "Most Recent";

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  // Load user profile.
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
          initials,
        }));
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load student enrollments with automatic token refresh.
  useEffect(() => {
    let active = true;

    const loadEnrollments = async () => {
      try {
        const response = await authenticatedFetch(
          "/api/student/enrollments",
          { cache: "no-store" }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));

          throw new Error(
            body.detail || `Enrollment request failed (${response.status})`
          );
        }

        const rows = await response.json();

        if (active) {
          setUserProfile((prev) => ({
            ...prev,
            enrollments: Array.isArray(rows) ? rows : [],
          }));
        }
      } catch (error) {
        console.error("Unable to load student enrollments:", error);
      }
    };

    loadEnrollments();

    return () => {
      active = false;
    };
  }, []);

  // Update active navigation.
  useEffect(() => {
    if (location.pathname.includes("/interviews")) {
      setActiveNav("interviews");
    } else if (location.pathname.includes("/dashboard")) {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  // Load interview history with automatic token refresh.
  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await authenticatedFetch(
          "/api/interview/history",
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));

          throw new Error(
            typeof body.detail === "string"
              ? body.detail
              : `Failed to load interviews (${response.status}).`
          );
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setInterviews(Array.isArray(data) ? data : []);
          setPage(1);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setHistoryError(
            error.message || "Unable to load interview history."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [refreshKey]);

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  // Delete interview report with automatic token refresh.
  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await authenticatedFetch(
        `/api/interview/results/${encodeURIComponent(
          deleteTarget.session_id
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        throw new Error(
          typeof body.detail === "string"
            ? body.detail
            : `Failed to delete report (${response.status}).`
        );
      }

      const deletedId = deleteTarget.session_id;

      const deletedLabel = `${
        deleteTarget.target_role || "Interview"
      } report from ${formatInterviewDate(deleteTarget.started_at)}`;

      setInterviews((prev) =>
        prev.filter((row) => row.session_id !== deletedId)
      );

      setDeleteTarget(null);

      setToast({
        id: Date.now(),
        title: "Report deleted",
        message: `Your ${deletedLabel} was permanently deleted.`,
      });
    } catch (error) {
      setDeleteError(error.message || "Unable to delete this report.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const staggerStyle = (index) => ({
    animationDelay: `${index * 110}ms`,
  });

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }

        @keyframes pillPop {
          0% { transform: scale(0.88); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        .animate-pill-pop {
          animation: pillPop 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes pageFadeSlideIn {
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
          animation: pageFadeSlideIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-slide-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-slate-900 font-[Inter] relative">
        {/* Modals */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        <AccountActionToast
          toast={toast}
          onClose={() => setToast(null)}
        />

        {/* Delete Report Confirmation */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-report-title"
              aria-describedby="delete-report-desc"
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-10 border-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                aria-label="Close"
                className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001] disabled:opacity-60 disabled:hover:scale-100"
              >
                <X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
              </button>

              <div className="pt-6 pb-2 flex flex-col items-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                  <Trash2 className="w-6 h-6 text-maroon" />
                </div>

                <h2
                  id="delete-report-title"
                  className="text-xl font-bold text-gray-900 font-Geist"
                >
                  Delete Report
                </h2>
              </div>

              <div className="px-6 pb-6 text-center">
                <p
                  id="delete-report-desc"
                  className="text-sm text-gray-600 mb-6 font-Inter"
                >
                  Are you sure you want to delete your{" "}
                  {deleteTarget.target_role || "Interview"} report from{" "}
                  {formatInterviewDate(deleteTarget.started_at)}? Its score,
                  feedback and answers will be permanently removed.
                </p>

                {deleteError && (
                  <p
                    role="alert"
                    className="text-sm text-red-700 mb-4 font-Inter"
                  >
                    {deleteError}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-white bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {isDeleting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}

                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide-out Account Drawer */}
        <div
          className={`fixed inset-0 z-40 flex transition-all duration-300 ${
            isAccountOpen
              ? "pointer-events-auto"
              : "pointer-events-none"
          }`}
        >
          <div
            className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ease-in-out ${
              isAccountOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsAccountOpen(false)}
          />

          <aside
            className={`relative left-0 md:left-[100px] w-[340px] h-full bg-white border-r border-[#862334] z-50 flex flex-col overflow-y-auto select-none font-[Inter] text-[#2D3B45] transition-transform duration-300 ease-in-out ${
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
                  setIsAccountOpen(false);
                  setIsSignOutModalOpen(true);
                }}
                className="mt-3 px-4 py-1 bg-[#F5F5F5] hover:bg-gray-200 border border-gray-300 rounded font-[Inter] text-xs font-medium text-[#2D3B45] transition-colors cursor-pointer"
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
                  <span className="font-[Inter] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Email Address
                  </span>

                  <span className="font-[Inter] text-sm font-medium text-[#2D3B45] break-all">
                    {userProfile.email || "Not Available"}
                  </span>
                </div>
              </div>

              {userProfile.enrollments.length ? (
                userProfile.enrollments.map((enrollment, index) => (
                  <div
                    key={`${enrollment.course_id}-${index}`}
                    className="space-y-4 border-t border-gray-100 pt-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="font-[Inter] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Enrolled Course
                        </span>

                        <span className="font-[Inter] text-sm font-medium text-[#2D3B45] break-words">
                          {enrollment.course_title || "Not available"}
                        </span>

                        {enrollment.course_code && (
                          <span className="font-[Inter] text-xs text-gray-500">
                            {enrollment.course_code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col">
                        <span className="font-[Inter] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Section
                        </span>

                        <span className="font-[Inter] text-sm font-medium text-[#2D3B45]">
                          {enrollment.section || "Not available"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col">
                        <span className="font-[Inter] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Academic Term
                        </span>

                        <span className="font-[Inter] text-sm font-medium text-[#2D3B45]">
                          {enrollment.academic_term || "Not available"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-[Inter] text-sm text-gray-500">
                  No course enrollment found.
                </p>
              )}
            </div>
          </aside>
        </div>

        {/* Left Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen font-[Inter]">
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
                      className={`font-[Inter] text-xs tracking-tight ${
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

        {/* Main Content */}
        <main className="flex-1 w-full bg-[#F7F7F8] overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-hidden flex flex-col pt-9 pb-6 px-10 sm:px-16 lg:px-24 w-full">
            {/* Header */}
            <div
              style={staggerStyle(0)}
              className="mb-10 animate-fade-slide-in"
            >
              <h1 className="font-[Geist] text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-black leading-tight">
                Interview History
              </h1>

              <p className="font-[Inter] text-[#4a4a4a] text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
                Review your previous performance and detailed interview feedback reports.
              </p>
            </div>

            {/* Toolbar */}
            <div
              style={staggerStyle(1)}
              className="relative z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 animate-fade-slide-in"
            >
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by Role or Keyword..."
                  className="w-full h-9 bg-white border border-gray-350 focus:border-[#862334]/50 focus:outline-none rounded-lg pl-9 pr-3.5 font-[Inter] text-xs text-gray-700 placeholder:text-gray-500 shadow-2xs transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center gap-2"
                  ref={sortDropdownRef}
                >
                  <span className="font-[Inter] text-xs font-md text-gray-500 whitespace-nowrap">
                    Sort By:
                  </span>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSortOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isSortOpen}
                      className={`h-9 min-w-[118px] inline-flex items-center justify-between gap-2.5 bg-white border rounded-lg px-3.5 font-[Inter] text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                        isSortOpen
                          ? "border-[#862334]/50 bg-[#862334]/5 text-[#862334]"
                          : "border-gray-350 hover:border-[#862334]/40 hover:bg-[#862334]/5 text-gray-700 hover:text-[#862334]"
                      }`}
                    >
                      <span>{activeSortLabel}</span>

                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isSortOpen
                            ? "rotate-180 text-[#862334]"
                            : "text-slate-400"
                        }`}
                      />
                    </button>

                    {isSortOpen && (
                      <div
                        role="listbox"
                        className="absolute right-0 mt-1.5 w-44 bg-white border border-[#862334]/20 rounded-xl shadow-lg p-1.5 space-y-1 z-30"
                      >
                        {SORT_OPTIONS.map((option) => {
                          const isSelected = sortBy === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setSortBy(option.id);
                                setIsSortOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left font-[Inter] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#862334] text-white font-semibold"
                                  : "text-slate-700 hover:bg-[#862334]/10 hover:text-[#862334] font-medium"
                              }`}
                            >
                              <span>{option.label}</span>

                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Refresh History */}
                <button
                  type="button"
                  onClick={() => setRefreshKey((n) => n + 1)}
                  disabled={historyLoading}
                  className="h-9 inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-[#862334]/40 hover:bg-[#862334]/5 text-gray-700 hover:text-[#862334] rounded-lg px-3.5 font-[Inter] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      historyLoading ? "animate-spin" : ""
                    }`}
                  />

                  Refresh History
                </button>
              </div>
            </div>

            {historyError && (
              <p
                role="alert"
                className="mb-4 font-[Inter] text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl"
              >
                {historyError}
              </p>
            )}

            {/* Interview History Table */}
            <div
              style={staggerStyle(2)}
              className="relative z-10 bg-white rounded-xl overflow-hidden border border-[#862334]/20 shadow-xs animate-fade-slide-in"
            >
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse min-w-[640px]">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[34%]" />
                  </colgroup>

                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="pl-7 pr-4 py-3.5 font-[Inter] text-[14px] text-gray-900 font-semibold">
                        Target Role
                      </th>

                      <th className="px-4 py-3.5 font-[Inter] text-[14px] text-gray-900 font-semibold">
                        Date
                      </th>

                      <th className="px-4 py-3.5 font-[Inter] text-[14px] text-gray-900 font-semibold">
                        Readiness Score
                      </th>

                      <th className="pl-4 pr-7 py-3.5 font-[Inter] text-[14px] text-gray-900 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {historyLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center font-[Inter] text-sm text-slate-400"
                        >
                          Loading interview history...
                        </td>
                      </tr>
                    ) : historyError ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center font-[Inter] text-sm text-slate-400"
                        >
                          Unable to display interviews.
                        </td>
                      </tr>
                    ) : total === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center font-[Inter] text-sm text-slate-400"
                        >
                          {searchQuery.trim()
                            ? `No interviews matching "${searchQuery}".`
                            : "No saved interviews yet. Complete an interview to view its report here."}
                        </td>
                      </tr>
                    ) : (
                      visibleInterviews.map((row) => (
                        <tr
                          key={row.session_id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="pl-7 pr-4 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <p className="font-[Inter] font-semibold text-gray-700 text-sm sm:text-base truncate">
                                {row.target_role || "Interview"}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-[Inter] font-mediumtext-gray-700 text-xs sm:text-sm whitespace-nowrap">
                            {formatInterviewDate(row.started_at)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-[Inter] font-bold text-sm sm:text-base tabular-nums whitespace-nowrap ${
                                row.overall_score == null
                                  ? "text-gray-400 font-medium text-xs sm:text-sm"
                                  : "text-gray-700"
                              }`}
                            >
                              {row.overall_score == null
                                ? "Pending"
                                : `${Number(row.overall_score).toFixed(0)}%`}
                            </span>
                          </td>

                          <td className="pl-4 pr-7 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/user/interview-results/${encodeURIComponent(
                                      row.session_id
                                    )}`
                                  )
                                }
                                disabled={
                                  row.report_status !== "completed" &&
                                  row.report_status !== "failed"
                                }
                                className="bg-[#862334] text-white hover:bg-[#6e1c2a] transition-all duration-200 px-4 py-2 text-xs font-[Inter] font-semibold uppercase tracking-wider rounded-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap cursor-pointer shadow-2xs"
                              >
                                View Report
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError("");
                                  setDeleteTarget(row);
                                }}
                                disabled={
                                  row.report_status !== "completed" &&
                                  row.report_status !== "failed"
                                }
                                aria-label={`Delete ${
                                  row.target_role || "interview"
                                } report`}
                                title="Delete report"
                                className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-[#862334] hover:border-[#862334]/40 hover:bg-[#862334]/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div
              style={staggerStyle(3)}
              className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-slide-in"
            >
              <nav
                aria-label="Interview history pagination"
                className="flex items-center gap-1.5"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg font-[Inter] text-sm font-medium text-slate-700 hover:text-[#862334] hover:bg-[#862334]/5 active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:active:scale-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-9 h-9 flex items-center justify-center font-[Inter] text-sm text-slate-400 select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        aria-current={
                          safePage === item ? "page" : undefined
                        }
                        className={`w-9 h-9 rounded-lg font-[Inter] text-sm font-semibold tabular-nums active:scale-95 transition-all duration-200 cursor-pointer ${
                          safePage === item
                            ? "bg-[#862334] text-white shadow-xs animate-pill-pop"
                            : "text-slate-700 hover:bg-[#862334]/10 hover:text-[#862334]"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={safePage === pages}
                  className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg font-[Inter] text-sm font-medium text-slate-700 hover:text-[#862334] hover:bg-[#862334]/5 active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-700 disabled:active:scale-100 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>

              <div className="h-9 flex items-center gap-1.5 font-[Inter] text-sm text-slate-500">
                <span>Showing</span>

                <span className="font-[Geist] font-semibold text-slate-900 tabular-nums">
                  {total === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}–
                  {Math.min(safePage * PER_PAGE, total)}
                </span>

                <span>of</span>

                <span className="font-[Geist] font-semibold text-[#862334] tabular-nums">
                  {total}
                </span>

                <span>Interviews</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
