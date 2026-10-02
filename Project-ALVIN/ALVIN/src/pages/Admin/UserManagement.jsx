import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import AccountActionModal from "../../Components/AccountActionModal";
import AccountActionToast from "../../Components/AccountActionToast";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "users", label: "People", path: "/admin/users", icon: Users },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { id: "avatars", label: "Avatars", path: "/admin/avatars", icon: UserCircle },
];

const initialAccounts = [
  {
    name: "John Manuel Policarpio III",
    email: "1111111@ub.edu.ph",
    role: "Staff",
    active: true,
    date: "Oct 12, 2023",
    primary: true,
  },
  {
    name: "John Ashley Alday",
    email: "2222222@ub.edu.ph",
    role: "User",
    active: false,
    date: "Jan 05, 2024",
    primary: false,
  },
  {
    name: "Vin Vernon Perez",
    email: "3333333@ub.edu.ph",
    role: "User",
    active: true,
    date: "Nov 22, 2023",
    primary: false,
  },
  {
    name: "Tristan Jay Mirano",
    email: "4444444@ub.edu.ph",
    role: "User",
    active: true,
    date: "Feb 14, 2024",
    primary: false,
  },
];

const PER_PAGE = 5;

export default function UserManagement() {
  const [activeNav, setActiveNav] = useState("users");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [accountAction, setAccountAction] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "",
    avatarUrl: null,
    initials: "U",
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
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/reports")) {
      setActiveNav("reports");
    } else if (location.pathname.includes("/avatars")) {
      setActiveNav("avatars");
    } else {
      setActiveNav("users");
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
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

  const openAccountAction = (action, account) => setAccountAction({ action, account });
  const closeAccountAction = () => setAccountAction(null);

  const confirmAccountAction = () => {
    if (!accountAction) return;

    const { action, account } = accountAction;
    if (action === "delete") {
      setAccounts((previous) => previous.filter((item) => item.email !== account.email));
      setToast({
        id: Date.now(),
        title: "Account Deleted",
        message: `${account.name} has been permanently removed.`,
      });
    } else {
      const isActive = action === "activate";
      setAccounts((previous) =>
        previous.map((item) =>
          item.email === account.email ? { ...item, active: isActive } : item
        )
      );
      setToast({
        id: Date.now(),
        title: isActive ? "Account Activated" : "Account Deactivated",
        message: isActive
          ? `${account.name} can now access the ALVIN AI Mock Interview platform.`
          : `${account.name} has been deactivated successfully.`,
      });
    }

    closeAccountAction();
  };

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
        @keyframes toast-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
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

        {/* Slide-out Account Drawer Wrapper */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-300 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/20 transition-opacity duration-300"
            onClick={() => setIsAccountOpen(false)}
          />

          {/* Animated Drawer */}
          <aside
            className={`relative left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transition-transform duration-300 ease-in-out ${
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
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
                setActiveNav("users");
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

        {/* Main Section */}
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-y-auto w-full">
            <section className="px-8 sm:px-12 md:px-16 lg:px-24 py-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                <div className="md:col-span-12 bg-white border border-gray-200 relative overflow-hidden rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 md:px-8 py-5 gap-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-Geist text-lg font-bold text-black uppercase">
                      User Directory
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <div className="relative group w-full sm:w-40">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                        <select
                          value={roleFilter}
                          onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                          }}
                          className="w-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider py-2.5 pl-9 pr-8 outline-none focus:ring-1 focus:ring-[#862334] appearance-none rounded cursor-pointer text-gray-600 transition-all font-Inter"
                        >
                          <option value="All Roles">All Roles</option>
                          <option value="Staff">Staff</option>
                          <option value="User">User</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none group-hover:text-[#862334] transition-colors" />
                      </div>

                      <div className="relative w-full sm:w-64 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                          }}
                          className="bg-white border border-gray-200 focus:ring-1 focus:ring-[#862334] text-xs tracking-widest font-Inter w-full pl-10 py-2.5 text-black placeholder:text-gray-400 outline-none rounded"
                          placeholder="SEARCH USERS"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          {["User", "Role", "Account Status", "Created", ""].map(
                            (h, i) => (
                              <th
                                key={i}
                                className={`px-6 md:px-8 py-4 md:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 font-Geist ${
                                  i === 4 ? "text-right" : ""
                                }`}
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {paginatedAccounts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-10 text-center text-gray-400 text-sm font-[Manrope,sans-serif]"
                            >
                              No accounts match your query.
                            </td>
                          </tr>
                        ) : (
                          paginatedAccounts.map((acc, i) => (
                            <tr
                              key={i}
                              className="hover:bg-gray-50 transition-colors group"
                            >
                              <td className="px-6 md:px-8 py-4 md:py-5">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-sm flex items-center justify-center flex-shrink-0 bg-gray-100">
                                    <User className="text-gray-400 w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-black truncate font-[Space_Grotesk,sans-serif]">
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
                                    acc.role === "Staff"
                                      ? "bg-[#862334]/10 text-[#862334]"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {acc.role}
                                </span>
                              </td>

                              <td className="px-6 md:px-8 py-4 md:py-5">
                                <div
                                  className={`flex items-center text-[11px] font-semibold font-[Inter,sans-serif] ${
                                    acc.active ? "text-green-700" : "text-gray-400"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${
                                      acc.active
                                        ? "bg-green-700 animate-pulse"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  {acc.active ? "ACTIVE" : "INACTIVE"}
                                </div>
                              </td>

                              <td className="px-6 md:px-8 py-4 md:py-5 text-sm text-gray-400 font-[Inter,sans-serif] whitespace-nowrap">
                                {acc.date}
                              </td>

                              <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                                <div className="flex items-center justify-end gap-2 md:gap-3 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openAccountAction(
                                        acc.active ? "deactivate" : "activate",
                                        acc
                                      )
                                    }
                                    aria-label={`${
                                      acc.active ? "Deactivate" : "Activate"
                                    } ${acc.name}`}
                                    className={`inline-flex w-28 items-center justify-center rounded-[2px] border px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap font-Geist focus:outline-none ${
                                      acc.active
                                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 focus:ring-amber-400"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-400"
                                    }`}
                                  >
                                    {acc.active ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openAccountAction("delete", acc)}
                                    aria-label={`Delete ${acc.name}`}
                                    className="inline-flex w-28 items-center justify-center rounded-[2px] bg-[#8B1C2C] px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-[#711724] whitespace-nowrap font-Geist focus:outline-none focus:ring-2"
                                  >
                                    Delete
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
                <div className="md:col-span-12 mt-2 mb-4 flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={displayedPage === 1}
                      className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#862334] text-sm">
                        {totalFilteredPAGES > 0 ? displayedPage : 0}
                      </span>
                      <span className="text-gray-400 text-sm">/</span>
                      <span className="text-gray-500 text-sm">
                        {totalFilteredPAGES}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalFilteredPAGES, p + 1))
                      }
                      disabled={
                        displayedPage === totalFilteredPAGES ||
                        totalFilteredPAGES === 0
                      }
                      className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                    >
                      Next <ChevronRight className="w-4 h-4" />
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