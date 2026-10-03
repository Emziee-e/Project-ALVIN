import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Mic,
  User,
  Bot,
  X,
  Mail,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account", path: null, icon: User },
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "interviews", label: "Interviews", path: "/user/interviews", icon: Mic },
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const APP_API_KEY =
  import.meta.env.VITE_APP_API_KEY || "";

export default function InterviewResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();

  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState("");

  const [activeNav, setActiveNav] = useState("interviews");
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: "Vin",
    email: "",
    academicYear: "A.Y. 2026 - 2027",
    degreeProgram: "BS in Computer Science",
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
    } else if (location.pathname.includes("/dashboard")) {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      if (!sessionId) {
        setResultsError("Missing interview session ID.");
        setResultsLoading(false);
        return;
      }

      try {
        setResultsLoading(true);
        setResultsError("");

        const response = await fetch(
          `${API_BASE_URL}/api/interview/results/${encodeURIComponent(sessionId)}`,
          { headers: { "X-API-Key": APP_API_KEY } }
        );

        if (!response.ok) {
          let detail = `Request failed (${response.status})`;
          try {
            const data = await response.json();
            detail = data.detail || detail;
          } catch {}
          throw new Error(detail);
        }

        const data = await response.json();
        if (active) setResults(data);
      } catch (error) {
        console.error("Failed to load interview results:", error);
        if (active) {
          setResultsError(error?.message || "Failed to load interview results.");
        }
      } finally {
        if (active) setResultsLoading(false);
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  if (resultsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="font-Geist font-bold uppercase tracking-widest text-[#862334]">Loading Interview Results</p>
          <p className="font-Inter text-sm text-[#4b5563] mt-3">Preparing your evaluation report...</p>
        </div>
      </div>
    );
  }

  if (resultsError || !results) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center max-w-lg px-6">
          <h2 className="font-Geist text-2xl font-bold mb-3">Results Unavailable</h2>
          <p className="font-Inter text-[#4b5563] mb-6">
            {resultsError || "The interview results could not be loaded."}
          </p>
          <button
            onClick={() => navigate("/user/interviews")}
            className="px-6 py-3 bg-[#862334] text-white font-Geist font-bold uppercase text-xs tracking-widest"
          >
            Interview History
          </button>
        </div>
      </div>
    );
  }

  const evaluationAvailable = results.evaluation_available !== false;
  const overallScore = Math.round(results.overall_rating || 0);
  const rubrics = results.rubrics || [];
  const questions = results.questions || [];
  const recommendations = results.recommendations || [];

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Geist,Inter] relative">
        {/* Sign Out Confirmation Modal */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* ── Dark Overlay Backdrop for Drawer ── */}
        <div
          className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-30 ${
            isAccountDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsAccountDrawerOpen(false)}
        />

        {/* ── Custom Animated Account Slide-out Drawer ── */}
        <aside
          className={`fixed top-0 left-0 md:left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-40 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transform transition-transform duration-300 ease-in-out ${
            isAccountDrawerOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-[440px]"
          }`}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsAccountDrawerOpen(false)}
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
                setIsAccountDrawerOpen(false);
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

        {/* ── Compact Vertical Navigation Sidebar (Remains Visible with z-50) ── */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen relative">
          <div className="w-full flex flex-col items-center">
            {/* Logo */}
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountDrawerOpen(false);
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

            {/* Navigation Items */}
            <nav className="w-full flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSolidActive = isAccountDrawerOpen
                  ? item.id === "account"
                  : activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "account") {
                        setIsAccountDrawerOpen(!isAccountDrawerOpen);
                      } else {
                        setIsAccountDrawerOpen(false);
                        setActiveNav(item.id);
                        if (item.path) navigate(item.path);
                      }
                    }}
                    className={`w-full py-3.5 px-2 flex flex-col items-center justify-center transition-colors relative cursor-pointer border-0 outline-none ${
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

        {/* ── Main View Area ── */}
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 w-full bg-white">
            <div className="max-w-[1400px] mx-auto">
              {/* Hero Score Section */}
              <section className="mb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-7">
                  <h2 className="text-[#4b5563] font-Geist uppercase tracking-widest text-xs font-semibold mb-3">
                    Session Result //
                  </h2>
                  <div className="text-[110px] sm:text-[130px] font-Geist font-bold leading-none tracking-tighter text-black">
                    {evaluationAvailable ? overallScore : "N/A"}<span className="text-[#862334]">{evaluationAvailable ? "%" : ""}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <span className="bg-[#862334] text-white px-5 py-1 text-xs font-bold uppercase tracking-widest rounded-sm">
                      Interview Completed
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-5 flex justify-start lg:justify-end gap-3 flex-wrap">
                  <button className="px-6 py-3 border border-[#e5e5e5] text-black hover:bg-[#f8f8f8] transition-all font-bold uppercase text-xs tracking-widest font-Geist rounded-md cursor-pointer">
                    Download PDF
                  </button>
                  <button
                    onClick={() => navigate("/user/resume-upload")}
                    className="px-6 py-3 bg-[#862334] text-white hover:bg-[#6e1c2a] transition-all font-bold uppercase text-xs tracking-widest font-Geist rounded-md shadow-sm cursor-pointer"
                  >
                    New Session
                  </button>
                </div>
              </section>

              {/* Rubric Breakdown */}
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
                {rubrics.map((r, index) => (
                  <div
                    key={r.label}
                    className="bg-white border border-[#e5e5e5] p-6 rounded-xl relative overflow-hidden group shadow-sm hover:border-gray-300 transition-all"
                  >
                    <div className="relative z-10">
                      <p className="text-[#4b5563] font-Inter uppercase text-[11px] tracking-widest mb-1 font-medium">
                        Rubric {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-xl font-Geist font-bold mb-4">
                        {r.label}
                      </h3>
                      <div className="text-3xl font-Geist font-bold mb-3 text-[#862334]">
                        {evaluationAvailable
                          ? `${Math.round(r.score || 0)}/${Math.round(r.max_score || 25)}`
                          : "N/A"}
                      </div>
                      <div className="h-1.5 w-full bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#862334] rounded-full"
                          style={{
                            width: `${evaluationAvailable
                              ? Math.min(
                                  100,
                                  ((r.score || 0) / (r.max_score || 25)) * 100
                                )
                              : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Transcript & Feedback */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Transcript */}
                <div className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-8 flex-wrap gap-4 border-b border-[#e5e5e5] pb-4">
                    <h2 className="text-2xl font-Geist font-bold uppercase tracking-tight text-black">
                      Transcript <span className="text-[#862334]">&amp;</span> Feedback
                    </h2>
                    <span className="bg-gray-50 border border-[#e5e5e5] px-3 py-1 text-xs font-Inter font-medium uppercase text-[#4b5563] rounded-full">
                      {questions.length} {questions.length === 1 ? "Question" : "Questions"} Total
                    </span>
                  </div>

                  <div className="space-y-10">
                    {questions.map((q, i) => (
                      <div
                        key={i}
                        className={`border-l-4 pl-6 py-1 relative ${
                          i === 0 ? "border-[#862334]" : "border-gray-200"
                        }`}
                      >
                        <h4 className="text-[#4b5563] font-Inter uppercase text-[11px] tracking-wider mb-2 font-semibold">
                          Interviewer
                        </h4>
                        <p className="text-lg font-Inter font-medium mb-6 text-black">
                          {q.question}
                        </p>

                        <div className="bg-[#f8f9fa] p-5 mb-6 rounded-lg border border-[#e5e5e5]">
                          <h4 className="text-[#4b5563] font-Inter uppercase text-[10px] tracking-widest mb-3 font-semibold">
                            Your Answer
                          </h4>
                          <p className="text-black/80 leading-relaxed font-Inter text-sm">
                            {q.answer}
                          </p>
                        </div>

                        <div className="bg-[#862334]/5 p-5 rounded-lg border-l-4 border-[#862334]">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="text-[#862334]" size={18} />
                            <h4 className="text-[#862334] font-Inter font-bold uppercase text-xs tracking-wider">
                              AI Feedback
                            </h4>
                          </div>
                          <p className="text-black/80 italic font-Inter text-sm leading-relaxed">
                            {q.critique}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-[#f8f9fa] border border-[#e5e5e5] p-6 rounded-xl">
                    <h3 className="font-Geist font-bold uppercase text-xs tracking-widest mb-6 text-[#862334]">
                      Key Recommendations
                    </h3>
                    <ul className="space-y-5 p-0 m-0 list-none">
                      {recommendations.map((recommendation, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="text-[#862334] font-Geist font-bold text-xs flex-shrink-0 mt-0.5">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className="text-xs text-[#4b5563] leading-relaxed font-Inter">
                            {recommendation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Background glow */}
        <div
          className="fixed top-0 right-0 w-[50vw] h-[500px] pointer-events-none -z-10 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(134,35,52,0.2) 0%, transparent 70%)",
          }}
        />
      </div>
    </>
  );
}