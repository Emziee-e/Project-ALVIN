import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, Mic, Settings, Play, Square, Save, X, Edit3, Loader2, ChevronDown, Check, Lock, CheckCircle2 } from 'lucide-react';
import Logo from '/images/Alvin-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import SignOutModal from "../../Components/SignOutModal";
import { supabase } from "../../lib/supabaseClient";
import { getProfileForUser, saveStudentProfile } from "../../lib/profileService";

const Icon = ({ name, filled = false, className = "" }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    {name}
  </span>
);

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Mic, label: "Interview History" },
  { icon: Settings, label: "Settings" },
];

const ACADEMIC_YEAR_OPTIONS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
];

const COURSE_OPTIONS = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Information Systems",
  "Bachelor of Library in Information Science",
];

export default function UserSettings() {
  const [activeNav, setActiveNav]     = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl]     = useState("");
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Profile States
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [course, setCourse]           = useState("");

  // Modal & Editing States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editYear, setEditYear]       = useState("");
  const [editCourse, setEditCourse]   = useState("");
  const [isSaving, setIsSaving]       = useState(false);

  // Bottom Right Toast State
  const [toast, setToast]             = useState(null);

  // Custom Dropdown Open States & Refs
  const [openYearDropdown, setOpenYearDropdown] = useState(false);
  const [openCourseDropdown, setOpenCourseDropdown] = useState(false);
  const yearDropdownRef = useRef(null);
  const courseDropdownRef = useRef(null);

  // Auto-dismiss Toast Timer
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setOpenYearDropdown(false);
      }
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
        setOpenCourseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scrolling when edit modal is active
  useEffect(() => {
    if (isEditModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isEditModalOpen]);

  // Hardware States
  const [mic, setMic]                 = useState("Microphone Array (Intel Smart Sound Technology for Digital Microphones)");
  const [camera, setCamera]           = useState("Integrated RGB HD Camera");

  // Mic Testing State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSignedInUserProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const metadata = user?.user_metadata ?? {};
      const profileResult = user ? await getProfileForUser(user) : null;
      const studentProfile = profileResult?.table === "student_profile"
        ? profileResult.profile
        : null;
      const nextAvatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        metadata.avatar ||
        metadata.image ||
        "";

      if (isMounted) {
        setAvatarUrl(nextAvatarUrl);
        const nextName = metadata.full_name || metadata.name || "User";
        const nextEmail = user?.email || "";
        const nextYear = metadata.academic_year_level || "First Year";
        const nextCourse = metadata.course_degree_program || COURSE_OPTIONS[0];

        setName(nextName);
        setEmail(nextEmail);
        setAcademicYear(studentProfile?.year_level || nextYear);
        setCourse(studentProfile?.program_course || nextCourse);

        setEditYear(studentProfile?.year_level || nextYear);
        setEditCourse(studentProfile?.program_course || nextCourse);
      }
    };

    loadSignedInUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEditModal = () => {
    setEditYear(academicYear);
    setEditCourse(course);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase.auth.updateUser({
        data: {
          academic_year_level: editYear,
          course_degree_program: editCourse,
        },
      });

      if (error) throw error;

      await saveStudentProfile(userData.user, {
        program_course: editCourse,
        year_level: editYear,
      });

      setAcademicYear(editYear);
      setCourse(editCourse);
      setIsEditModalOpen(false);
      setOpenYearDropdown(false);
      setOpenCourseDropdown(false);

      // Trigger bottom-right toast with custom text
      setToast({
        id: Date.now(),
        title: "Profile Updated",
        message: "Your academic profile details have been successfully saved.",
      });
    } catch (err) {
      console.error("Failed to update user profile:", err);
      const errorDetails = [err?.code, err?.message].filter(Boolean).join(": ");
      alert(`Failed to update profile details${errorDetails ? ` (${errorDetails})` : ""}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setOpenYearDropdown(false);
    setOpenCourseDropdown(false);
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      source.connect(analyzerRef.current);

      setIsTestingMic(true);
      drawWaveform();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopMicTest = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsTestingMic(false);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyzerRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const barCount = 30;
      const barWidth = 4;
      const gap = 4;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const value = dataArray[dataIndex];
        const percent = value / 255;
        const height = Math.max(6, percent * (canvas.height * 0.7));

        ctx.fillStyle = '#862334';

        const xRight = centerX + (i * (barWidth + gap));
        const xLeft = centerX - (i * (barWidth + gap));

        if (xRight < canvas.width) {
          ctx.beginPath();
          ctx.roundRect(xRight, centerY - height/2, barWidth, height, 10);
          ctx.fill();
        }
        if (xLeft > 0) {
          ctx.beginPath();
          ctx.roundRect(xLeft, centerY - height/2, barWidth, height, 10);
          ctx.fill();
        }
      }
    };

    renderFrame();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=Manrope:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Dynamic inline styles for guaranteed keyframe animations */}
      <style>{`
        @keyframes toast-progress {
          0% {
            transform: scaleX(1);
          }
          100% {
            transform: scaleX(0);
          }
        }
        @keyframes toast-fade {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="flex h-screen w-screen bg-white text-black font-[Manrope,sans-serif] overflow-hidden">

        {/* ── Bottom Right Toast Notification ── */}
        {toast && (
          <aside
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-[1100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
            style={{
              animation: "toast-fade 220ms ease-out forwards",
            }}
          >
            <div className="flex gap-3 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#16A34A]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-Geist text-sm font-bold text-gray-900">{toast.title}</p>
                <p className="mt-1 font-Inter text-xs leading-5 text-gray-500">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#862334]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Animated Progress Bar */}
            <div
              key={toast.id}
              className="h-1 origin-left bg-[#16A34A]"
              style={{
                animation: "toast-progress 3s linear forwards",
              }}
            />
          </aside>
        )}

        {/* ── Edit Profile Modal ── */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-black font-Geist uppercase tracking-tight text-black">
                  Edit Academic Profile
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                {/* Locked Full Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Full Name</label>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-Inter"><Lock size={10} /> Read-only</span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-Inter px-3.5 py-2 text-xs sm:text-sm rounded-lg cursor-not-allowed"
                  />
                </div>

                {/* Locked Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Email Address</label>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-Inter"><Lock size={10} /> Read-only</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-Inter px-3.5 py-2 text-xs sm:text-sm rounded-lg cursor-not-allowed"
                  />
                </div>

                {/* Academic Year Level Custom Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Academic Year Level</label>
                  <div className="relative w-full z-20" ref={yearDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenYearDropdown(!openYearDropdown);
                        setOpenCourseDropdown(false);
                      }}
                      className="w-full flex items-center justify-between bg-white border border-[#862334] focus:ring-2 focus:ring-[#862334]/20 text-gray-800 font-Inter px-3.5 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-sm text-left"
                    >
                      <span className="truncate">{editYear || "Select Academic Year"}</span>
                      <ChevronDown className={`h-4 w-4 text-[#862334] transition-transform duration-200 flex-shrink-0 ml-2 ${openYearDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {openYearDropdown && (
                      <ul className="absolute left-0 right-0 z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl text-xs sm:text-sm font-Inter [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {ACADEMIC_YEAR_OPTIONS.map((option) => {
                          const isSelected = editYear === option;
                          return (
                            <li
                              key={option}
                              onClick={() => {
                                setEditYear(option);
                                setOpenYearDropdown(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-[#862334] text-white font-semibold"
                                  : "text-gray-700 hover:bg-[#862334]/10 hover:text-[#862334]"
                              }`}
                            >
                              <span className="truncate">{option}</span>
                              {isSelected && <Check className="h-4 w-4 text-white flex-shrink-0" />}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Course / Degree Program Custom Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Course / Degree Program</label>
                  <div className="relative w-full z-10" ref={courseDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCourseDropdown(!openCourseDropdown);
                        setOpenYearDropdown(false);
                      }}
                      className="w-full flex items-center justify-between bg-white border border-[#862334] focus:ring-2 focus:ring-[#862334]/20 text-gray-800 font-Inter px-3.5 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-sm text-left"
                    >
                      <span className="truncate">{editCourse || "Select Course / Program"}</span>
                      <ChevronDown className={`h-4 w-4 text-[#862334] transition-transform duration-200 flex-shrink-0 ml-2 ${openCourseDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {openCourseDropdown && (
                      <ul className="absolute left-0 right-0 z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl text-xs sm:text-sm font-Inter [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {COURSE_OPTIONS.map((option) => {
                          const isSelected = editCourse === option;
                          return (
                            <li
                              key={option}
                              onClick={() => {
                                setEditCourse(option);
                                setOpenCourseDropdown(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-[#862334] text-white font-semibold"
                                  : "text-gray-700 hover:bg-[#862334]/10 hover:text-[#862334]"
                              }`}
                            >
                              <span className="truncate">{option}</span>
                              {isSelected && <Check className="h-4 w-4 text-white flex-shrink-0" />}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider font-Geist text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-[#862334] hover:bg-[#711c2b] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-Geist flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-6 px-4 flex items-center justify-center gap-0">
            <img src={Logo} alt="Alvin logo" className="h-12 w-auto flex-shrink-0 block" />
            <div className="flex h-12 items-center text-maroon font-Geist text-[46px] leading-none tracking-[-0.05em] uppercase whitespace-nowrap">
              LVIN
            </div>
          </div>

          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none">
              {navItems.map((item, i) => {
                const isDashboard = i === 0;
                const isInterviews = i === 1;
                const isSettings = i === 2;
                let navLink = '#';

                if (isDashboard) navLink = '/user/dashboard';
                if (isInterviews) navLink = '/user/interviews';
                if (isSettings) navLink = '/user/settings';

                return (
                  <li key={item.label} className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}>
                    <Link
                      to={navLink}
                      onClick={() => setActiveNav(i)}
                      className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                        ${activeNav === i
                          ? "text-[#862334]"
                          : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto">
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Sign Out Modal */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        {/* Main Content Container */}
        <main className="flex-1 md:ml-60 lg:ml-64 bg-white w-full h-screen overflow-hidden flex flex-col">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 md:left-60 lg:left-64 z-40 h-16 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span className="md:hidden font-[Space_Grotesk,sans-serif] font-black text-sm sm:text-base md:text-lg text-[#862334] uppercase tracking-tight truncate">ALVIN</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
              {avatarUrl && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border border-[#e5e5e5] bg-[#862334]/20 overflow-hidden flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </header>

          {/* Settings Content Area */}
          <section className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 py-6 w-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="h-full">

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-stretch">

                {/* Left Column: Account Details */}
                <div className="md:col-span-5 flex flex-col gap-3 sm:gap-4 md:gap-5">
                  <div className="p-3 sm:p-4 md:p-6 relative bg-white border border-gray-100 shadow-sm rounded-lg h-full flex flex-col justify-between">

                    <div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <h3 className="text-base sm:text-lg font-black font-Geist tracking-tighter text-black uppercase relative z-10">
                          Account Details
                        </h3>
                        <button
                          onClick={handleOpenEditModal}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#862334] hover:text-[#711c2b] font-Geist uppercase tracking-wider cursor-pointer"
                        >
                          <Edit3 size={14} />
                          Edit Profile
                        </button>
                      </div>

                      <div className="flex flex-col gap-5 relative">
                        {/* Avatar Display */}
                        <div className="flex flex-col items-center justify-center pt-1">
                          <div className="relative group">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 border border-gray-200 flex items-center justify-center relative overflow-hidden rounded-xl shadow-sm">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Icon name="person" className="text-slate-400 text-5xl" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Profile Info Fields */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Full Name</label>
                            <div className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-Inter px-3.5 py-2 text-xs sm:text-sm rounded-md">
                              {name || "Not Set"}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Email Address</label>
                            <div className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-Inter px-3.5 py-2 text-xs sm:text-sm rounded-md truncate">
                              {email || "Not Set"}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Academic Year Level</label>
                            <div className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-Inter px-3.5 py-2 text-xs sm:text-sm rounded-md">
                              {academicYear || "Not Set"}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-[#862334] font-Geist">Course / Degree Program</label>
                            <div className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-Inter px-3.5 py-2 text-xs sm:text-sm rounded-md truncate">
                              {course || "Not Set"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column: Hardware & Calibration */}
                <div className="md:col-span-7 p-3 sm:p-4 md:p-6 bg-white border border-gray-100 shadow-sm rounded-lg h-full flex flex-col">
                  <h3 className="text-base sm:text-lg font-black font-Geist tracking-tighter mb-3 border-b border-gray-100 pb-2 text-black uppercase relative z-10">
                    Hardware &amp; Calibration
                  </h3>

                  <div className="flex-1 flex flex-col justify-between pt-2">
                    {/* Devices */}
                    <div className="space-y-4 sm:space-y-5">
                      <h4 className="font-Geist font-bold text-black uppercase tracking-tight text-xs sm:text-sm">
                        Default Input Devices
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Microphone</label>
                          <div className="relative w-full">
                            <select
                              value={mic}
                              onChange={e => setMic(e.target.value)}
                              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 opacity-90 font-Inter text-xs sm:text-sm py-2 sm:py-2.5 pl-3 pr-8 focus:ring-1 focus:ring-[#862334] outline-none rounded-lg cursor-pointer truncate"
                            >
                              <option>Microphone Array (Intel Smart Sound Technology for Digital Microphones)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500 font-Geist">Camera</label>
                          <div className="relative w-full">
                            <select
                              value={camera}
                              onChange={e => setCamera(e.target.value)}
                              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 opacity-90 font-Inter text-xs sm:text-sm py-2 sm:py-2.5 pl-3 pr-8 focus:ring-1 focus:ring-[#862334] outline-none rounded-lg cursor-pointer truncate"
                            >
                              <option>Integrated RGB HD Camera</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mic Sensitivity */}
                    <div className="mt-auto space-y-3 pt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <h4 className="font-Geist font-bold text-black uppercase tracking-tight text-xs shrink-0">
                          Mic Sensitivity
                        </h4>
                        <button
                          onClick={isTestingMic ? stopMicTest : startMicTest}
                          className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded font-Geist text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm whitespace-nowrap cursor-pointer ${
                            isTestingMic
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-[#862334] text-white hover:bg-[#711c2b]"
                          }`}
                        >
                          {isTestingMic ? (
                            <>
                              <Square size={12} fill="currentColor" />
                              Stop Test
                            </>
                          ) : (
                            <>
                              <Play size={12} fill="currentColor" />
                              Test Microphone
                            </>
                          )}
                        </button>
                      </div>

                      <div className="relative w-full aspect-[4/1] sm:aspect-[6/1] bg-gray-50 border border-gray-100 overflow-hidden rounded-md">
                        {!isTestingMic && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-Geist">
                              Ready to Test
                            </span>
                          </div>
                        )}
                        <canvas
                          ref={canvasRef}
                          className="w-full h-full"
                          width={800}
                          height={150}
                        />
                      </div>

                      <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-Inter">
                        Set your microphone level so your voice stays clear and balanced.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          <footer className="h-12 sm:h-16 pb-8" />
        </main>

      </div>
    </>
  );
}