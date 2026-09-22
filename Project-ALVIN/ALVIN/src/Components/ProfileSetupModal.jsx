import { useEffect, useState, useRef } from "react";
import { AlertCircle, BookOpen, CalendarDays, ChevronDown, GraduationCap, Info, Check } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const academicYearOptions = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
];

const courseOptions = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Information Systems",
  "Bachelor of Library and Information Science",
];

export default function ProfileSetupModal({ isOpen, onComplete }) {
  const [academicYearLevel, setAcademicYearLevel] = useState("");
  const [courseDegreeProgram, setCourseDegreeProgram] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Dropdown open states
  const [openYearDropdown, setOpenYearDropdown] = useState(false);
  const [openCourseDropdown, setOpenCourseDropdown] = useState(false);

  const modalRef = useRef(null);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setAcademicYearLevel("");
      setCourseDegreeProgram("");
      setError("");
      setOpenYearDropdown(false);
      setOpenCourseDropdown(false);
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup scroll lock on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpenYearDropdown(false);
        setOpenCourseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!academicYearLevel || !courseDegreeProgram) {
      setError("Please complete both fields to continue.");
      return;
    }

    setIsSaving(true);
    setError("");

    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        academic_year_level: academicYearLevel,
        course_degree_program: courseDegreeProgram,
        profile_completed: true,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    onComplete(data.user);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-white/70 backdrop-blur-md p-4 transition-all duration-300">
      <section
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-setup-title"
        className="w-full max-w-[420px] overflow-visible rounded-[24px] border border-[#e2e4e9] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative"
      >
        {/* Header Section */}
        <div className="flex flex-col items-center border-b border-[#f0f0f2] px-6 pb-5 pt-6 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#862334]/[0.08] text-[#862334]">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 id="profile-setup-title" className="font-Geist text-xl font-bold text-[#17171a]">
            Complete your profile
          </h2>
          <p className="mt-1.5 font-Inter text-xs leading-relaxed text-[#747784]">
            Please tell us about your academic standing to personalize your dashboard experience.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">

          {/* Custom Academic Year Dropdown */}
          <div className="block relative">
            <span className="mb-1.5 block font-Geist text-xs font-semibold uppercase tracking-[0.08em] text-[#4e5360]">
              Academic year level <span className="text-[#862334]">*</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setOpenYearDropdown(!openYearDropdown);
                setOpenCourseDropdown(false);
              }}
              className={`h-11 w-full flex items-center justify-between rounded-xl border bg-[#fafbfc] pl-10 pr-3 font-Inter text-sm text-[#353943] transition cursor-pointer relative ${
                openYearDropdown
                  ? "border-[#862334] ring-2 ring-[#862334]/10 bg-white"
                  : "border-[#e4e6eb] hover:border-[#862334]/50"
              }`}
            >
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a7b0]" aria-hidden="true" />
              <span className={`truncate ${!academicYearLevel ? "text-[#8b8e98]" : "text-[#17171a] font-medium"}`}>
                {academicYearLevel || "Select your current year"}
              </span>
              <ChevronDown className={`h-4 w-4 text-[#a3a7b0] transition-transform duration-200 ${openYearDropdown ? "rotate-180 text-[#862334]" : ""}`} aria-hidden="true" />
            </button>

            {/* Dropdown Options Container */}
            {openYearDropdown && (
              <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-[#e4e6eb] bg-white p-1 shadow-xl text-sm font-Inter">
                {academicYearOptions.map((option) => {
                  const isSelected = academicYearLevel === option;
                  return (
                    <li
                      key={option}
                      onClick={() => {
                        setAcademicYearLevel(option);
                        setOpenYearDropdown(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#862334] text-white font-semibold"
                          : "text-[#353943] hover:bg-[#862334]/10 hover:text-[#862334]"
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Custom Course Dropdown */}
          <div className="block relative">
            <span className="mb-1.5 block font-Geist text-xs font-semibold uppercase tracking-[0.08em] text-[#4e5360]">
              Course / degree program <span className="text-[#862334]">*</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setOpenCourseDropdown(!openCourseDropdown);
                setOpenYearDropdown(false);
              }}
              className={`h-11 w-full flex items-center justify-between rounded-xl border bg-[#fafbfc] pl-10 pr-3 font-Inter text-sm text-[#353943] transition cursor-pointer relative ${
                openCourseDropdown
                  ? "border-[#862334] ring-2 ring-[#862334]/10 bg-white"
                  : "border-[#e4e6eb] hover:border-[#862334]/50"
              }`}
            >
              <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a7b0]" aria-hidden="true" />
              <span className={`truncate ${!courseDegreeProgram ? "text-[#8b8e98]" : "text-[#17171a] font-medium"}`}>
                {courseDegreeProgram || "Select your enrolled course"}
              </span>
              <ChevronDown className={`h-4 w-4 text-[#a3a7b0] transition-transform duration-200 ${openCourseDropdown ? "rotate-180 text-[#862334]" : ""}`} aria-hidden="true" />
            </button>


            {openCourseDropdown && (
              <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-[#e4e6eb] bg-white p-1 shadow-xl text-sm font-Inter">
                {courseOptions.map((option) => {
                  const isSelected = courseDegreeProgram === option;
                  return (
                    <li
                      key={option}
                      onClick={() => {
                        setCourseDegreeProgram(option);
                        setOpenCourseDropdown(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#862334] text-white font-semibold"
                          : "text-[#353943] hover:bg-[#862334]/10 hover:text-[#862334]"
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

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 font-Inter text-xs text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <p className="flex items-center gap-2 border-t border-[#f0f0f2] pt-4 font-Inter text-xs text-[#8b8e98]">
            <Info className="h-4 w-4 flex-shrink-0 text-[#862334]" aria-hidden="true" />
            You can always update this later in your Account Settings.
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="h-11 w-full rounded-xl bg-[#862334] font-Geist text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#711c2b] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </section>
    </div>
  );
}