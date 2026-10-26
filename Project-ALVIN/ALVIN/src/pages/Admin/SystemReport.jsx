import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Mic,
  TrendingUp,
  Clock,
  ChevronDown,
  User,
  X,
  Mail,
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

// Mock Data for Interview Volume (Smooth Area Chart)
const getInterviewVolumeData = (type) => {
  switch (type) {
    case "Daily":
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${i}:00`,
        volume: Math.floor(Math.random() * 10) + 2,
      }));
    case "Monthly":
      return Array.from({ length: 30 }, (_, i) => ({
        label: `Day ${i + 1}`,
        volume: Math.floor(Math.random() * 20) + 10,
      }));
    case "Weekly":
    default:
      return [
        { label: "MON", volume: 8 },
        { label: "TUE", volume: 5 },
        { label: "WED", volume: 12 },
        { label: "THU", volume: 7 },
        { label: "FRI", volume: 15 },
        { label: "SAT", volume: 9 },
        { label: "SUN", volume: 11 },
      ];
  }
};

// Mock Data for Active Users (Radial Donut Chart)
const getUserDonutData = (type) => {
  switch (type) {
    case "Monthly":
      return [
        { name: "Week 1 Active", value: 520, color: "#862334" },
        { name: "Week 2 Active", value: 780, color: "#FFB003" },
        { name: "Week 3 Active", value: 950, color: "#2D0C13" },
        { name: "Week 4 Active", value: 955, color: "#991B1B" },
      ];
    case "Weekly":
    default:
      return [
        { name: "Students", value: 2300, color: "#862334" },
        { name: "Faculty/Staff", value: 905, color: "#FFB003" },
      ];
  }
};

// 1. Interview Volume Area Chart
function InterviewVolumeAreaChart({ reportType }) {
  const data = useMemo(() => getInterviewVolumeData(reportType), [reportType]);

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
          />
          <YAxis
            axisLine={false}
            tickLine={false}
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
function RadialDonutUsersChart({ timeframe }) {
  const data = useMemo(() => getUserDonutData(timeframe), [timeframe]);
  const totalUsers = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  return (
    <div className="w-full h-[320px] grid grid-cols-1 md:grid-cols-2 items-center">
      <div className="w-full h-[260px] relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={72}
              outerRadius={96}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A090D",
                border: "1px solid rgba(134, 35, 52, 0.4)",
                borderRadius: "10px",
                color: "#FFF",
              }}
              itemStyle={{ color: "#FFB003", fontWeight: "bold" }}
              formatter={(val) => [`${val} Users`, "Active"]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 font-Geist tracking-tight">
            {totalUsers.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Active Users
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
  const [interviewReportType, setInterviewReportType] = useState("Weekly");
  const [userTrendType, setUserTrendType] = useState("Weekly");

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

        {/* Slide-out Account Drawer Wrapper */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-300 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="fixed inset-0 bg-black/10 transition-opacity duration-300"
            onClick={() => setIsAccountOpen(false)}
          />

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

        {/* Sidebar Nav */}
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

        {/* Main Workspace Canvas */}
        <main className="flex-1 w-full bg-[#F7F7F8] overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-y-auto w-full">
            <div className="px-8 sm:px-12 md:px-16 lg:px-20 py-8 space-y-8 w-full">

              {/* Minimalist Top KPI Row (Static Subtle Maroon Border) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">

                {/* Total Interviews */}
                <div className="bg-white p-5 rounded-2xl border border-[#862334]/25 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_16px_-4px_rgba(134,35,52,0.06)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[#862334] text-xs font-bold font-Geist uppercase tracking-wider">
                      Total Interviews
                    </p>
                    <div className="p-2 bg-rose-50/80 text-[#862334] rounded-xl border border-[#862334]/15">
                      <Mic className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-Geist tracking-tight">
                    12,842
                  </h3>
                </div>

                {/* Avg. Performance */}
                <div className="bg-white p-5 rounded-2xl border border-[#862334]/25 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_16px_-4px_rgba(134,35,52,0.06)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[#862334] text-xs font-bold font-Geist uppercase tracking-wider">
                      Avg. Performance
                    </p>
                    <div className="p-2 bg-rose-50/80 text-[#862334] rounded-xl border border-[#862334]/15">
                      <FileBarChart className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-Geist tracking-tight">
                    94.8%
                  </h3>
                </div>

                {/* Active Users */}
                <div className="bg-white p-5 rounded-2xl border border-[#862334]/25 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_16px_-4px_rgba(134,35,52,0.06)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[#862334] text-xs font-bold font-Geist uppercase tracking-wider">
                      Active Users
                    </p>
                    <div className="p-2 bg-rose-50/80 text-[#862334] rounded-xl border border-[#862334]/15">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-Geist tracking-tight">
                    205
                  </h3>
                </div>

                {/* Daily Users */}
                <div className="bg-white p-5 rounded-2xl border border-[#862334]/25 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_16px_-4px_rgba(134,35,52,0.06)] relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[#862334] text-xs font-bold font-Geist uppercase tracking-wider">
                      Daily Users
                    </p>
                    <div className="p-2 bg-rose-50/80 text-[#862334] rounded-xl border border-[#862334]/15">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-2xl font-black text-slate-900 font-Geist tracking-tight">
                      10
                    </h3>
                  </div>
                </div>

              </div>

              {/* Side-by-Side Analytics Section (Static Subtle Maroon Border Containers) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

                {/* CHART 1: Interview Volume (Left Container) */}
                <div className="bg-white rounded-2xl border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-[#862334]/15 flex justify-between items-center bg-rose-50/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#862334]" />
                      <h3 className="text-base font-bold font-[Geist,Inter] text-slate-900 tracking-tight">
                        {interviewReportType} Interview Volume
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <select
                          value={interviewReportType}
                          onChange={(e) => setInterviewReportType(e.target.value)}
                          className="appearance-none bg-white text-[#862334] text-[11px] font-Inter font-bold py-1.5 px-3 pr-8 rounded-lg border border-[#862334]/30 focus:outline-none focus:ring-1 focus:ring-[#862334] cursor-pointer uppercase tracking-wider transition-all hover:bg-rose-50/50"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#862334] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <InterviewVolumeAreaChart reportType={interviewReportType} />
                  </div>
                </div>

                {/* CHART 2: Active Users Donut (Right Container) */}
                <div className="bg-white rounded-2xl border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)] overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-[#862334]/15 flex justify-between items-center bg-rose-50/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFB003]" />
                      <h3 className="text-base font-bold font-[Geist,Inter] text-slate-900 tracking-tight">
                        {userTrendType} Users
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <select
                          value={userTrendType}
                          onChange={(e) => setUserTrendType(e.target.value)}
                          className="appearance-none bg-white text-[#862334] text-[11px] font-Inter font-bold py-1.5 px-3 pr-8 rounded-lg border border-[#862334]/30 focus:outline-none focus:ring-1 focus:ring-[#862334] cursor-pointer uppercase tracking-wider transition-all hover:bg-rose-50/50"
                        >
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#862334] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <RadialDonutUsersChart timeframe={userTrendType} />
                  </div>
                </div>

              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}