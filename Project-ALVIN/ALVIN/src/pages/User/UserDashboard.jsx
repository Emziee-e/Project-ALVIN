import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mic,
  Settings,
  User,
  X,
  Mail,
  Calendar,
  GraduationCap,
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

const interviews = [
  { role: "Senior Product Manager", date: "OCT 24, 2024", score: "88%", high: true },
  { role: "UX Designer (L6)", date: "OCT 21, 2024", score: "75%", high: false },
  { role: "Technical Program Lead", date: "OCT 18, 2024", score: "91%", high: true },
];

export default function UserDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAccountMounted, setIsAccountMounted] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState({
    name: "Vin",
    email: "",
    academicYear: "4th Year",
    degreeProgram: "BS in Information Technology",
    avatarUrl: null,
    initials: "V",
  });
  const [imageError, setImageError] = useState(false);

  // Handle drawer opening and smooth unmounting logic
  const handleToggleAccountDrawer = (openState) => {
    if (openState) {
      setIsAccountMounted(true);
      // Small timeout allows DOM element to render before triggering slide-in transform
      setTimeout(() => setIsAccountOpen(true), 10);
    } else {
      setIsAccountOpen(false);
      // Wait for the transition duration (300ms) before unmounting
      setTimeout(() => setIsAccountMounted(false), 300);
    }
  };

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
        const academicYear =
          metadata.academic_year || metadata.academicYear || "A.Y. 2026 - 2027";
        const degreeProgram =
          metadata.degree_program ||
          metadata.course ||
          metadata.department ||
          "BS in Computer Science";
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

        setUserProfile({
          name: fullName,
          email: emailAddress,
          academicYear: academicYear,
          degreeProgram: degreeProgram,
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

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div
        className={`flex h-screen w-full overflow-hidden bg-white text-black font-[Geist,Inter] relative transition-opacity duration-500 ${
          isStarting ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Modals */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* ── Slide-out Account Drawer with Smooth CSS Transitions ── */}
        {isAccountMounted && (
          <div className="fixed inset-0 z-40 flex overflow-hidden">
            {/* Dark Overlay Backdrop */}
            <div
              className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ease-in-out ${
                isAccountOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => handleToggleAccountDrawer(false)}
            />

            {/* Slide-in Drawer Container */}
            <aside
              className={`relative left-0 md:left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transform transition-transform duration-300 ease-out ${
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
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#862334] shadow-sm mb-3"
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
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email Address
                    </span>
                    <span className="text-sm font-medium text-[#2D3B45] break-all">
                      {userProfile.email || "Not Available"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Academic Year Level
                    </span>
                    <span className="text-sm font-medium text-[#2D3B45]">
                      {userProfile.academicYear}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Course / Degree Program
                    </span>
                    <span className="text-sm font-medium text-[#2D3B45]">
                      {userProfile.degreeProgram}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Canvas-style Vertical Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen">
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

                const isSolidActive = isAccountOpen
                  ? item.id === "account"
                  : activeNav === item.id;

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
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen min-w-0 relative">
          <div className="flex-1 overflow-y-auto px-12 sm:px-16 md:px-20 lg:px-28 py-8 w-full relative">
            <section className="mb-8 md:mb-12">
              <div className="text-left">
                <h2 className="font-[Geist,Inter] text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-black leading-tight mb-3 md:mb-4">
                  Welcome, <span className="text-maroon">{userProfile.name.split(" ")[0]}!</span>
                </h2>
                <p className="text-[#4a4a4a] font-[Inter] text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl">
                  Your interview performance indicates a{" "}
                  <span className="text-maroon font-bold">3% improvement</span> since your last session.
                </p>
              </div>
            </section>

            {/* ── Analytics Grid ── */}
            <section className="mb-16">
              <div className="grid grid-cols-4 gap-6 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
                {/* Session Volume */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1">
                    Session Volume
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-[Geist] text-[30px] font-bold text-black">24</span>
                  </div>
                  <div className="mt-4 text-xs font-[Inter] text-[#4a4a4a] uppercase tracking-tight">
                    Total Interviews
                  </div>
                </div>

                {/* Avg Performance */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1 text-center w-full">
                    Average Performance Accuracy
                  </span>
                  <span className="font-[Geist] text-[30px] font-bold text-black">82%</span>
                  <div className="mt-4 w-full bg-[#f0f0f0] h-1 rounded-[2px]">
                    <div className="bg-[#862334] h-full rounded-[2px]" style={{ width: "82%" }} />
                  </div>
                </div>

                {/* Peak Competency */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1 text-center w-full">
                    Peak Competency
                  </span>
                  <div className="font-[Geist] text-xl font-bold text-black mt-2 leading-tight uppercase text-center">
                    Consistent Eye Contact
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-[#862334]/10 text-[#862334] text-[10px] font-bold rounded-full mt-4">
                    ELITE TIER
                  </div>
                </div>

                {/* Priority Focus */}
                <div className="group bg-white p-5 border border-[#e5e5e5] hover:border-[#862334] relative overflow-hidden rounded-[2px] flex flex-col items-center justify-center transition-all duration-300">
                  <span className="text-[#4a4a4a] font-[Inter,sans-serif] font-bold text-[8px] uppercase tracking-[0.2em] block mb-1 text-center w-full">
                    Priority Focus Area
                  </span>
                  <div className="font-[Geist] text-xl font-bold text-[#862334] mt-2 uppercase">
                    Filler Words
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[true, true, true, false, false].map((f, i) => (
                      <div key={i} className={`w-1 h-3 ${f ? "bg-[#862334]" : "bg-[#f0f0f0]"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Interview History & Staff Comment ── */}
            <div className="flex justify-center items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-[Geist] text-2xl font-bold uppercase tracking-[-0.02em] text-black">
                    Interview History
                  </h3>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[5fr_3fr_2fr_2fr] px-6 py-2 text-[10px] font-[Geist,Inter] uppercase tracking-[0.2em] text-[black]">
                  <div>Target Role</div>
                  <div>Date</div>
                  <div>Score</div>
                  <div className="text-right">Insight</div>
                </div>

                {/* Rows */}
                {interviews.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[5fr_3fr_2fr_2fr] items-center px-6 py-5 bg-[#f9f9f9] border-b border-[#e5e5e5] hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="flex items-center gap-3 font-[Space_Grotesk,sans-serif] font-medium text-black">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.high ? "bg-[#862334]" : "bg-[#862334]/40"}`} />
                      {row.role}
                    </div>
                    <div className="text-[#4a4a4a] font-[Inter,sans-serif] text-xs">{row.date}</div>
                    <div className={`font-[Space_Grotesk,sans-serif] font-bold ${row.high ? "text-[#862334]" : "text-black"}`}>
                      {row.score}
                    </div>
                    <div className="text-right">
                      <button className="bg-transparent border-0 border-b border-[#d1d1d1] cursor-pointer text-[10px] font-[Inter,sans-serif] uppercase text-[#4a4a4a] pb-[1px] transition-all hover:text-[#862334] hover:border-[#862334]">
                        VIEW FEEDBACK
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Staff Comment Section */}
              <div className="w-80 flex-shrink-0">
                <h3 className="font-[Geist] text-2xl font-bold uppercase tracking-[-0.02em] text-black mb-8">
                  Staff Comment
                </h3>

                <div className="p-6 bg-[#f9f9f9] border border-[#e5e5e5] rounded-[2px] hover:border-[#862334] transition-colors h-fit">
                  <div className="flex gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#862334] flex-shrink-0 mt-1" />
                    <h4 className="font-[Space_Grotesk,sans-serif] font-bold text-sm text-black">
                      General Performance Feedback
                    </h4>
                  </div>
                  <p className="font-[Inter] text-xs text-[#4a4a4a] leading-relaxed">
                    Your overall performance demonstrates consistent improvement with an 82% average accuracy across all sessions. You excel in communication and eye contact, which are critical competencies. Focus on reducing filler words and maintaining a steady pace when explaining complex topics to further strengthen your interview presence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Action Button Placement */}
          <FloatingButton />
        </main>

        {/* Decorative background glow */}
        <div
          className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10"
          style={{ background: "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)" }}
        />
      </div>
    </>
  );
}