import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
  ChevronDown,
  X,
  Mail,
  EllipsisVertical,
  UserCheck,
  UserX,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import AccountActionModal from "../../Components/AccountActionModal";
import AccountActionToast from "../../Components/AccountActionToast";
import AddCareerAdvisorModal from "../../Components/AddCareerAdvisorModal";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "users", label: "People", path: "/admin/users", icon: Users },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { id: "avatars", label: "Avatars", path: "/admin/avatars", icon: UserCircle },
];

const PER_PAGE = 5;
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

export default function UserManagement() {
  const [activeNav, setActiveNav] = useState("users");
  const [navAnimKey, setNavAnimKey] = useState(0);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountError, setAccountError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [accountAction, setAccountAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [isCareerAdvisorModalOpen, setIsCareerAdvisorModalOpen] = useState(false);
  const [openMenuRowKey, setOpenMenuRowKey] = useState(null);
  const menuContainerRef = useRef(null);
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

  // Close action dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (openMenuRowKey === null) return;

    const handleClickOutside = (event) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target)
      ) {
        setOpenMenuRowKey(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenuRowKey(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuRowKey]);

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

  useEffect(() => {
    queueMicrotask(() => {
      if (location.pathname.includes("/reports")) {
        setActiveNav("reports");
      } else if (location.pathname.includes("/avatars")) {
        setActiveNav("avatars");
      } else {
        setActiveNav("users");
      }
    });
  }, [location.pathname]);

  const apiRequest = useCallback(async (path, options = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session?.access_token || ""}`,
        "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed (${response.status})`);
    }
    return response.json();
  }, []);

  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountError("");
    try {
      const users = await apiRequest("/api/admin/users");
      setAccounts(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error("Unable to load users:", error);
      setAccountError(error.message || "Unable to load users.");
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    queueMicrotask(loadAccounts);
  }, [loadAccounts]);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {
      // Ignore storage errors
    }
    await supabase.auth.signOut();
    navigate("/");
  };

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalFilteredPAGES = Math.ceil(filtered.length / PER_PAGE);
  const displayedPage = Math.min(page, Math.max(totalFilteredPAGES, 1));
  const paginatedAccounts = filtered.slice(
    (displayedPage - 1) * PER_PAGE,
    displayedPage * PER_PAGE
  );

  const getVisiblePages = () => {
    if (totalFilteredPAGES <= 5) {
      return Array.from({ length: totalFilteredPAGES }, (_, i) => i + 1);
    }
    if (displayedPage <= 3) {
      return [1, 2, 3, 4, "...", totalFilteredPAGES];
    }
    if (displayedPage >= totalFilteredPAGES - 2) {
      return [
        1,
        "...",
        totalFilteredPAGES - 3,
        totalFilteredPAGES - 2,
        totalFilteredPAGES - 1,
        totalFilteredPAGES,
      ];
    }
    return [
      1,
      "...",
      displayedPage - 1,
      displayedPage,
      displayedPage + 1,
      "...",
      totalFilteredPAGES,
    ];
  };

  const openAccountAction = (action, account) => {
    setOpenMenuRowKey(null);
    setAccountAction({ action, account });
  };
  const closeAccountAction = () => setAccountAction(null);

  const confirmAccountAction = async () => {
    if (!accountAction) return;

    const { action, account } = accountAction;
    try {
      if (action === "delete") {
        await apiRequest(`/api/admin/users/${account.role}/${account.id}`, {
          method: "DELETE",
        });
        await loadAccounts();
        setToast({
          id: Date.now(),
          title:
            account.role === "career_advisor"
              ? "Career Advisor Removed"
              : "Account Deleted",
          message:
            account.role === "career_advisor"
              ? `${account.name} has been restored as a student.`
              : `${account.name} has been permanently removed.`,
        });
      } else {
        const accountStatus = action === "activate" ? "active" : "inactive";
        await apiRequest(`/api/admin/users/student/${account.id}`, {
          method: "PATCH",
          body: JSON.stringify({ account_status: accountStatus }),
        });
        setAccounts((previous) =>
          previous.map((item) =>
            item.id === account.id
              ? { ...item, account_status: accountStatus }
              : item
          )
        );
        setToast({
          id: Date.now(),
          title: action === "activate" ? "Account Activated" : "Account Deactivated",
          message:
            action === "activate"
              ? `${account.name} can now access the ALVIN AI Mock Interview platform.`
              : `${account.name} has been deactivated successfully.`,
        });
      }
    } catch (error) {
      console.error(`Unable to ${action} account:`, error);
      // Show the failure as a toast. setAccountError would replace the whole table.
      setToast({
        id: Date.now(),
        title:
          action === "delete" && account.role === "career_advisor"
            ? "Unable to Remove Career Advisor"
            : `Unable to ${action} account`,
        message: error.message || `Unable to ${action} account.`,
      });
    }

    closeAccountAction();
  };

  // Promote the selected students one by one (the backend takes one email per call)
  const addCareerAdvisors = async (selected) => {
    const added = [];
    const failed = [];

    for (const person of selected) {
      try {
        await apiRequest("/api/admin/users/career-advisor", {
          method: "POST",
          body: JSON.stringify({ email: person.email }),
        });
        added.push(person);
      } catch (error) {
        console.error(`Unable to add career advisor ${person.email}:`, error);
        failed.push({
          person,
          message: error.message || "Unable to add career advisor.",
        });
      }
    }

    if (added.length > 0) {
      await loadAccounts();
      setToast({
        id: Date.now(),
        title: added.length === 1 ? "Career Advisor Added" : "Career Advisors Added",
        message:
          added.length === 1
            ? `${added[0].email} can now access the career advisor platform.`
            : `${added.length} users can now access the career advisor platform.`,
      });
    }

    if (failed.length > 0) {
      const details = failed
        .map(({ person, message }) => `${person.email} (${message})`)
        .join("; ");
      return {
        error:
          added.length > 0
            ? `${added.length} added, but ${failed.length} failed: ${details}`
            : `Unable to add: ${details}`,
      };
    }

    return {};
  };

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
        @keyframes toast-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes itemFadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-item-in {
          opacity: 0;
          animation: itemFadeSlideIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Geist, Inter] relative">
        {/* Modals & Toasts */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />
        <AccountActionModal
          key={
            accountAction
              ? `${accountAction.action}-${accountAction.account.email}`
              : "closed"
          }
          isOpen={Boolean(accountAction)}
          action={accountAction?.action ?? null}
          account={accountAction?.account ?? null}
          onClose={closeAccountAction}
          onConfirm={confirmAccountAction}
        />
        <AccountActionToast toast={toast} onClose={() => setToast(null)} />
        <AddCareerAdvisorModal
          isOpen={isCareerAdvisorModalOpen}
          onClose={() => setIsCareerAdvisorModalOpen(false)}
          onAddCareerAdvisors={addCareerAdvisors}
          students={accounts.filter((a) => a.role === "student")}
          isLoading={isLoadingAccounts && accounts.length === 0}
          loadError={accounts.length === 0 ? accountError : ""}
        />

        {/* Slide-out Account Drawer Wrapper */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-150 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/10 transition-opacity duration-150"
            onClick={() => setIsAccountOpen(false)}
          />

          {/* Animated Drawer */}
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

        {/* Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r-1 border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 select-none h-screen z-50 relative">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
                setActiveNav("users");
                setNavAnimKey((prev) => prev + 1);
                navigate("/admin/users");
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
                const Icon =
                  item.id === "account"
                    ? User
                    : item.icon;

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

        {/* Main Section */}
        <main className="flex-1 w-full bg-[#F7F7F8] overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-y-auto w-full">
            <section
              key={`${activeNav}-${navAnimKey}`}
              className="px-8 sm:px-12 md:px-16 lg:px-24 py-8 flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

                {/* User Directory Container with Subtle Maroon Border */}
                <div
                  style={{ animationDelay: "0ms" }}
                  className="animate-item-in md:col-span-12 bg-white border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)] relative overflow-visible rounded-2xl"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 md:px-8 py-5 gap-4 border-b border-[#862334]/15 bg-rose-50/20 rounded-t-2xl">
                    <h3 className="font-Geist text-lg font-bold text-black tracking-tight">
                      User Directory
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsCareerAdvisorModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#862334] text-white rounded-lg text-xs font-bold hover:bg-[#701c2b] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Career Advisor
                      </button>
                      <div className="relative group w-full sm:w-40">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                          value={roleFilter}
                          onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                            setOpenMenuRowKey(null);
                          }}
                          className="w-full bg-white border border-[#862334]/30 text-xs font-bold uppercase tracking-wider py-2.5 pl-9 pr-8 outline-none focus:ring-1 focus:ring-[#862334] appearance-none rounded-lg cursor-pointer text-gray-600 transition-all font-Inter"
                        >
                          <option value="All Roles">All Roles</option>
                          <option value="student">Student</option>
                          <option value="career_advisor">Career Advisor</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#862334] w-3.5 h-3.5 pointer-events-none" />
                      </div>

                      <div className="relative w-full sm:w-64 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                            setOpenMenuRowKey(null);
                          }}
                          className="bg-white border border-[#862334]/30 focus:ring-1 focus:ring-[#862334] text-xs font-Inter w-full pl-10 py-2.5 text-black placeholder:text-gray-400 outline-none rounded-lg"
                          placeholder="SEARCH USERS..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto md:overflow-visible">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-[#862334]/15 bg-rose-50/10">
                          {["User", "Role", "Account Status", "Created", "Action"].map(
                            (h, i) => (
                              <th
                                key={i}
                                className={`px-6 md:px-8 py-4 md:py-5 text-[14px] font-bold text-gray-900 font-Geist ${
                                  i === 4 ? "text-right" : ""
                                }`}
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody
                        key={`page-${displayedPage}-${roleFilter}-${search}`}
                        className="divide-y divide-gray-100"
                      >
                        {isLoadingAccounts ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">
                              Loading accounts...
                            </td>
                          </tr>
                        ) : accountError ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-red-600 text-sm">
                              {accountError}
                            </td>
                          </tr>
                        ) : paginatedAccounts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-10 text-center text-gray-400 text-sm font-[Manrope,sans-serif]"
                            >
                              No accounts match your query.
                            </td>
                          </tr>
                        ) : (
                          paginatedAccounts.map((acc, i) => {
                            const rowKey = acc.id ?? `${acc.email}-${i}`;
                            const isMenuOpen = openMenuRowKey === rowKey;
                            const isActive = acc.account_status === "active";
                            const openUpward = i >= paginatedAccounts.length - 2 && paginatedAccounts.length > 2;

                            return (
                              <tr
                                key={rowKey}
                                style={{ animationDelay: `${Math.min((i + 1) * 80, 500)}ms` }}
                                className={`animate-item-in transition-colors group relative ${
                                  isMenuOpen ? "z-30" : "z-0"
                                }`}
                              >
                                <td className="px-6 md:px-8 py-4 md:py-5">
                                  <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 border border-gray-200">
                                      <User className="text-[#862334] w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-black truncate font-Geist">
                                        {acc.name}
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-[Inter,sans-serif] truncate">
                                        {acc.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 md:px-8 py-4 md:py-5">
                                  <span
                                    className={`px-2.5 md:px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full font-Inter ${
                                      acc.role === "career_advisor"
                                        ? "bg-[#862334]/10 text-[#862334]"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {acc.role === "career_advisor" ? "Career Advisor" : "Student"}
                                  </span>
                                </td>

                                <td className="px-6 md:px-8 py-4 md:py-5">
                                  <div
                                    className={`flex items-center text-[11px] font-semibold font-[Inter,sans-serif] ${
                                      isActive ? "text-green-700" : "text-gray-400"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${
                                        isActive
                                          ? "bg-green-700 animate-pulse"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    {isActive ? "ACTIVE" : "INACTIVE"}
                                  </div>
                                </td>

                                <td className="px-6 md:px-8 py-4 md:py-5 text-sm text-gray-400 font-[Inter,sans-serif] whitespace-nowrap">
                                  {acc.created_at
                                    ? new Date(acc.created_at).toLocaleDateString()
                                    : "—"}
                                </td>

                                <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                                  <div
                                    ref={isMenuOpen ? menuContainerRef : null}
                                    className="relative inline-block text-left"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenMenuRowKey((prev) =>
                                          prev === rowKey ? null : rowKey
                                        )
                                      }
                                      aria-haspopup="menu"
                                      aria-expanded={isMenuOpen}
                                      aria-label={`Actions for ${acc.name}`}
                                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors cursor-pointer focus:outline-none ${
                                        isMenuOpen
                                          ? "border-[#862334]/40 bg-[#862334]/[0.08] text-[#862334]"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#862334]/30 hover:text-[#862334] hover:bg-rose-50/30"
                                      }`}
                                    >
                                      <EllipsisVertical className="w-4 h-4" />
                                    </button>

                                    {isMenuOpen && (
                                      <div
                                        role="menu"
                                        className={`absolute right-0 ${
                                          openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
                                        } w-44 rounded-xl bg-white border border-gray-200 shadow-lg py-1.5 z-30 font-Inter`}
                                      >
                                        {acc.role === "student" && (
                                          <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() =>
                                              openAccountAction(
                                                isActive ? "deactivate" : "activate",
                                                acc
                                              )
                                            }
                                            className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                                              isActive
                                                ? "text-amber-700 hover:bg-amber-50"
                                                : "text-emerald-700 hover:bg-emerald-50"
                                            }`}
                                          >
                                            {isActive ? (
                                              <>
                                                <UserX className="w-3.5 h-3.5" />
                                                <span>Deactivate</span>
                                              </>
                                            ) : (
                                              <>
                                                <UserCheck className="w-3.5 h-3.5" />
                                                <span>Activate</span>
                                              </>
                                            )}
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() =>
                                            openAccountAction("delete", acc)
                                          }
                                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#862334] hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Interview-Style Pill Pagination */}
                <div
                  style={{ animationDelay: "260ms" }}
                  className="animate-item-in md:col-span-12 mt-2 mb-4 flex justify-between items-center flex-wrap gap-4"
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        setOpenMenuRowKey(null);
                      }}
                      disabled={displayedPage === 1}
                      aria-label="Previous page"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-[#862334] hover:bg-[#862334]/[0.06] transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {getVisiblePages().map((item, idx) =>
                      item === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-xs text-slate-400 select-none"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setPage(item);
                            setOpenMenuRowKey(null);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                            displayedPage === item
                              ? "bg-[#862334] text-white font-semibold"
                              : "text-slate-500 hover:text-[#862334] hover:bg-[#862334]/[0.06]"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setPage((p) => Math.min(totalFilteredPAGES, p + 1));
                        setOpenMenuRowKey(null);
                      }}
                      disabled={
                        displayedPage === totalFilteredPAGES ||
                        totalFilteredPAGES === 0
                      }
                      aria-label="Next page"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-[#862334] hover:bg-[#862334]/[0.06] transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="hidden sm:block font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-400">
                    Viewing {paginatedAccounts.length} of {filtered.length} users
                  </span>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}