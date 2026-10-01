import { useEffect, useState } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Mic,
  TrendingUp,
  LayoutGrid,
  Calendar,
  Clock,
  ChevronDown,
  User,
  X,
  Mail,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import BarCharts from "./barChart";
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "users", label: "People", path: "/admin/users", icon: Users },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { id: "avatars", label: "Avatars", path: "/admin/avatars", icon: UserCircle },
];

export default function SystemReport() {
  const [activeNav, setActiveNav] = useState("reports");
  const [reportType, setReportType] = useState("Weekly");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
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
    if (location.pathname.includes("/users")) {
      setActiveNav("users");
    } else if (location.pathname.includes("/avatars")) {
      setActiveNav("avatars");
    } else {
      setActiveNav("reports");
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Geist, Inter] relative">
        {/* Modals */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* Slide-out Account Drawer Wrapper with Smooth Transitions */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-300 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/10 transition-opacity duration-300"
            onClick={() => setIsAccountOpen(false)}
          />

          {/* Animated Drawer Panel */}
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

        {/* Canvas-style Vertical Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
                setActiveNav("reports");
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
          <div className="flex-1 overflow-y-auto w-full">
            {/* Expanded padding to give substantial offset from the sidebar */}
            <div className="px-12 sm:px-16 md:px-20 lg:px-28 py-8 space-y-8 w-full">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Total Interviews */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">
                      Total Interviews
                    </p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Mic className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-black font-[Geist,Inter]">
                    12,842
                  </h3>
                </div>

                {/* Avg. Performance */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">
                      Avg. Performance
                    </p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <FileBarChart className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-black font-[Geist,Inter]">
                    94.8%
                  </h3>
                </div>

                {/* Active Users */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">
                      Active Users
                    </p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-black font-[Geist,Inter]">
                    3,205
                  </h3>
                </div>

                {/* Daily Users */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">
                      Daily Users
                    </p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-black font-[Geist,Inter]">
                      10
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Clock className="w-4 h-4" />
                      <span>Last 24 hours</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Users */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">
                      Weekly Users
                    </p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-black font-[Geist,Inter]">
                      20
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <LayoutGrid className="w-4 h-4" />
                      <span>Last 7 days</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Users */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs relative overflow-hidden group transition-all duration-300 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-500 text-sm font-semibold font-[Geist,Inter]">
                      Monthly Users
                    </p>
                    <div className="p-2 bg-rose-50 text-[#862334] rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-black font-[Geist,Inter]">
                      40
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>Last 30 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Users Graph Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden mb-10">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                  <h3 className="text-lg font-bold font-[Geist,Inter] text-black">
                    {reportType} Interview Volume
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#862334]"></span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Volume
                      </span>
                    </div>
                    <div className="relative group">
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="appearance-none bg-white text-gray-700 text-[10px] font-Inter font-bold py-2 px-4 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer uppercase tracking-wider transition-all hover:bg-gray-50"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-hover:text-gray-600" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <BarCharts reportType={reportType} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}