import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LayoutDashboard,
  BarChart3,
  MoreVertical,
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Mail,
  ArrowLeft,
  UserPlus,
  UserMinus,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Pencil,
  Archive,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SignOutModal from "../../Components/SignOutModal";
import AddCourseModal from "../../Components/AddCourseModal";
import EditCourseModal from "../../Components/EditCourseModal";
import EnrollStudentModal from "../../Components/EnrollStudentModal";
import { supabase } from "../../lib/supabaseClient";
import {
  createCourse,
  getMyCourses,
  updateCourse,
  deleteCourse,
  findStudentByEmail,
  enrollStudents,
  getCourseEnrollments,
  removeEnrollment,
} from "../../lib/courseService";

const navItems = [
  { id: "account", label: "Account" },
  { id: "dashboard", label: "Dashboard", path: "/staff/dashboard" },
  { id: "statistics", label: "Statistics", path: "/staff/statistics" },
];

export default function StaffDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", key: 0 });
  const toastTimeoutRef = useRef(null);

  // Edit Course Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Conclude Course Confirmation Modal State
  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [courseToConclude, setCourseToConclude] = useState(null);

  // Delete Course Confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Unenroll Student Confirmation
  const [studentToUnenroll, setStudentToUnenroll] = useState(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  // Dropdown Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "",
    academicYear: "A.Y. 2026 - 2027",
    degreeProgram: "BS in Information Technology",
    avatarUrl: null,
    initials: "U",
  });
  const [imageError, setImageError] = useState(false);

  const [publishedCourses, setPublishedCourses] = useState([]);
  const [concludedCourses, setConcludedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true); 
  const [restoringCourse, setRestoringCourse] = useState(
    location.pathname.includes("/staff/dashboard/course/")
  );

  // Toast Helper
  const showToastNotification = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ show: true, message, key: Date.now() });

    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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

    fetchUserData();
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/statistics")) {
      setActiveNav("statistics");
    } else {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);

      const data = await getMyCourses();

      const mappedCourses = data.map(
        mapCourseFromDatabase
      );

      setPublishedCourses(
        mappedCourses.filter(
          (course) =>
            course.status === "active"
        )
      );

      setConcludedCourses(
        mappedCourses.filter(
          (course) =>
            course.status === "concluded" ||
            course.status === "archived"
        )
      );
    } catch (error) {
      console.error(
        "Error loading courses:",
        error
      );

      showToastNotification(
        "Unable to load courses."
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const restoreSelectedCourse = async () => {
      const match = location.pathname.match(
        /^\/staff\/dashboard\/course\/([^/]+)$/
      );

      // Normal dashboard page
      if (!match) {
        setRestoringCourse(false);
        return;
      }

      // Wait for courses to finish loading
      if (coursesLoading) {
        return;
      }

      const courseId = match[1];

      const course = [
        ...publishedCourses,
        ...concludedCourses,
      ].find((item) => item.id === courseId);

      if (!course) {
        setRestoringCourse(false);

        navigate("/staff/dashboard", {
          replace: true,
        });

        return;
      }

      try {
        const enrollmentRows =
          await getCourseEnrollments(course.id);

        const students =
          enrollmentRows.map(
            mapEnrollmentFromDatabase
          );

        setSelectedCourse({
          ...course,
          students,
        });
      } catch (error) {
        console.error(
          "Error restoring course:",
          error
        );

        showToastNotification(
          "Unable to load course enrollment."
        );
      } finally {
        setRestoringCourse(false);
      }
    };

      restoreSelectedCourse();
    }, [
      location.pathname,
      coursesLoading,
    ]);

  const mapEnrollmentFromDatabase = (row) => {
    const student = row.student_profile;

    return {
      id: row.enrollment_id,

      // Actual UUID from student_profile
      studentId: student?.student_id || "",

      // Display student number from the UB email
      studentNo:
        student?.ub_mail?.split("@")[0] || "",

      name:
        student?.display_name ||
        "Unknown Student",

      email:
        student?.ub_mail || "",

      status: row.enrollment_status
        ? row.enrollment_status.charAt(0).toUpperCase() +
          row.enrollment_status.slice(1)
        : "Enrolled",

      dateJoined: row.enrolled_at
        ? new Date(row.enrolled_at).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          )
        : "",
    };
  };

  const mapCourseFromDatabase = (course) => ({
    id: course.course_id,
    code: course.course_code,
    title: course.course_title,
    section: course.section || "",
    term: course.academic_term || "",
    status: course.course_status,

    color:
      course.course_color ||
      "bg-[#862334]",

    imageUrl: null,
    image: null,
    students: [],
  });

  const handleCreateCourse = async (newCourse) => {
    try {
      const createdCourse = await createCourse({
        course_title: newCourse.title,
        course_code: newCourse.code,
        section: newCourse.section,
        academic_term: newCourse.term,
        course_color: newCourse.color,
      });

      const mappedCourse =
        mapCourseFromDatabase(createdCourse);

      setPublishedCourses((prev) => [
        mappedCourse,
        ...prev,
      ]);

      showToastNotification(
        `Course "${mappedCourse.code}" successfully created!`
      );

      return {
        success: true,
        course: mappedCourse,
      };
    } catch (error) {
      console.error(
        "Error creating course:",
        error
      );

      showToastNotification(
        error.message ||
          "Unable to create course."
      );

      return {
        error: error.message ||
          "Unable to create course.",
      };
    }
  };

  const confirmConcludeCourse = async () => {
    if (!courseToConclude) return;

    try {
      const savedCourse = await updateCourse(
        courseToConclude.id,
        {
          course_title: courseToConclude.title,
          course_code: courseToConclude.code,
          section: courseToConclude.section,
          academic_term: courseToConclude.term,
          course_status: "concluded",
          course_color:
            courseToConclude.color ||
            "bg-[#862334]",
        }
      );

      const mappedCourse =
        mapCourseFromDatabase(savedCourse);

      // Preserve local-only values such as students/image
      const concludedCourse = {
        ...courseToConclude,
        ...mappedCourse,
        status: "concluded",
      };

      // Remove from Published Courses
      setPublishedCourses((prev) =>
        prev.filter(
          (course) =>
            course.id !== concludedCourse.id
        )
      );

      // Add to Concluded Courses
      setConcludedCourses((prev) => [
        concludedCourse,
        ...prev.filter(
          (course) =>
            course.id !== concludedCourse.id
        ),
      ]);

      // Close course details if currently viewing it
      if (
        selectedCourse?.id ===
        concludedCourse.id
      ) {
        setSelectedCourse(null);
      }

      setIsConcludeModalOpen(false);
      setCourseToConclude(null);
      setActiveMenuId(null);

      showToastNotification(
        `Course "${concludedCourse.code}" successfully concluded!`
      );
    } catch (error) {
      console.error(
        "Error concluding course:",
        error
      );

      showToastNotification(
        error.message ||
          "Unable to conclude course."
      );
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const courseId = courseToDelete.id;
      const courseCode = courseToDelete.code;

      await deleteCourse(courseId);

      // Remove from active courses
      setPublishedCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      // Remove from concluded courses too
      setConcludedCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      // Close course details if this course is open
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }

      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      setActiveMenuId(null);

      showToastNotification(
        `Course "${courseCode}" successfully deleted!`
      );
    } catch (error) {
      console.error("Error deleting course:", error);

      showToastNotification(
        error.message || "Unable to delete course."
      );
    }
  };

  const handleSaveEditedCourse = async (updatedCourse) => {
    try {
      const savedCourse = await updateCourse(
        updatedCourse.id,
        {
          course_title: updatedCourse.title,
          course_code: updatedCourse.code,
          section: updatedCourse.section,
          academic_term: updatedCourse.term,
          course_status:
            updatedCourse.status || "active",
          course_color:
            updatedCourse.color ||
            "bg-[#862334]",
        }
      );

      const mappedCourse =
        mapCourseFromDatabase(savedCourse);

      setPublishedCourses((prev) =>
        prev.map((course) =>
          course.id === mappedCourse.id
            ? {
                ...course,
                ...mappedCourse,
              }
            : course
        )
      );

      setConcludedCourses((prev) =>
        prev.map((course) =>
          course.id === mappedCourse.id
            ? {
                ...course,
                ...mappedCourse,
              }
            : course
        )
      );

      if (
        selectedCourse?.id ===
        mappedCourse.id
      ) {
        setSelectedCourse((prev) => ({
          ...prev,
          ...mappedCourse,
        }));
      }

      setIsEditModalOpen(false);
      setEditingCourse(null);

      showToastNotification(
        `Course "${mappedCourse.code}" successfully updated!`
      );

      return {
        success: true,
        course: mappedCourse,
      };
    } catch (error) {
      console.error(
        "Error updating course:",
        error
      );

      showToastNotification(
        error.message ||
          "Unable to update course."
      );

      return {
        error:
          error.message ||
          "Unable to update course.",
      };
    }
  };

  const handleEnrollStudent = async (studentEmail) => {
    if (!selectedCourse) {
      return {
        error: "No course selected.",
      };
    }

    try {
      // Find the real student using their UB email
      const student =
        await findStudentByEmail(studentEmail);

      // Check whether the student is already displayed
      // as enrolled in this course
      const alreadyEnrolled =
        selectedCourse.students?.some(
          (enrolledStudent) =>
            enrolledStudent.studentId ===
            student.student_id
        );

      if (alreadyEnrolled) {
        return {
          error:
            "This student is already enrolled in this course.",
        };
      }

      // Insert course_id + student's UUID
      await enrollStudents(
        selectedCourse.id,
        [student]
      );

      // Enrollment is already saved at this point. Email notification is
      // intentionally best-effort so a Gmail failure never rolls back enrollment.
      let emailNotificationSent = true;

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL ||
          "http://localhost:8000";

        const API_KEY =
          import.meta.env.VITE_APP_API_KEY || "";

        const emailResponse = await fetch(
          `${API_BASE_URL}/api/email/enrollment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": API_KEY,
            },
            body: JSON.stringify({
              student_email: student.ub_mail,
              student_name:
                student.display_name || "Student",
              course_title: selectedCourse.title,
              course_code: selectedCourse.code,
              section: selectedCourse.section || "",
              academic_term: selectedCourse.term || "",
            }),
          }
        );

        if (!emailResponse.ok) {
          emailNotificationSent = false;

          let emailError = null;
          try {
            emailError = await emailResponse.json();
          } catch {
            // Response body was not JSON.
          }

          console.error(
            "Enrollment saved, but email notification failed:",
            emailResponse.status,
            emailError
          );
        }
      } catch (emailError) {
        emailNotificationSent = false;
        console.error(
          "Enrollment saved, but email notification failed:",
          emailError
        );
      }

      // Reload the course enrollment list from Supabase
      const enrollmentRows =
        await getCourseEnrollments(
          selectedCourse.id
        );

      const students =
        enrollmentRows.map(
          mapEnrollmentFromDatabase
        );

      const updatedCourse = {
        ...selectedCourse,
        students,
      };

      // Update currently opened course
      setSelectedCourse(updatedCourse);

      // Synchronize Published Courses state
      setPublishedCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id
            ? updatedCourse
            : course
        )
      );

      showToastNotification(
        emailNotificationSent
          ? `${student.display_name} successfully enrolled! Email notification sent.`
          : `${student.display_name} successfully enrolled, but the email notification could not be sent.`
      );

      return {
        success: true,
        student,
        emailNotificationSent,
      };
    } catch (error) {
      console.error(
        "Error enrolling student:",
        error
      );

      // Database unique constraint:
      // unique(course_id, student_id)
      if (error.code === "23505") {
        return {
          error:
            "This student is already enrolled in this course.",
        };
      }

      return {
        error:
          error.message ||
          "Unable to enroll student.",
      };
    }
  };

  const confirmUnenrollStudent = async () => {
    if (!studentToUnenroll || !selectedCourse || isUnenrolling) return;

    try {
      setIsUnenrolling(true);

      // student.id is the course_enrollments.enrollment_id.
      // This deletes only the enrollment relationship, not the student account.
      await removeEnrollment(studentToUnenroll.id);

      const enrollmentRows = await getCourseEnrollments(selectedCourse.id);
      const students = enrollmentRows.map(mapEnrollmentFromDatabase);

      const updatedCourse = {
        ...selectedCourse,
        students,
      };

      setSelectedCourse(updatedCourse);

      setPublishedCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id ? updatedCourse : course
        )
      );

      setConcludedCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id ? updatedCourse : course
        )
      );

      showToastNotification(
        `${studentToUnenroll.name} successfully unenrolled from ${selectedCourse.code}.`
      );

      setStudentToUnenroll(null);
    } catch (error) {
      console.error("Error unenrolling student:", error);
      showToastNotification(
        error.message || "Unable to unenroll student."
      );
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleOpenCourse = async (course) => {
    try {
      const enrollmentRows =
        await getCourseEnrollments(course.id);

      const students =
        enrollmentRows.map(
          mapEnrollmentFromDatabase
        );

      const courseWithStudents = {
        ...course,
        students,
      };

      setSelectedCourse(courseWithStudents);

      setPublishedCourses((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? courseWithStudents
            : item
        )
      );

      setConcludedCourses((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? courseWithStudents
            : item
        )
      );

      // Keep selected course in the URL
      navigate(
        `/staff/dashboard/course/${course.id}`
      );
    } catch (error) {
      console.error(
        "Error loading course enrollments:",
        error
      );

      showToastNotification(
        error.message ||
          "Unable to load enrolled students."
      );
    }
  };

  const filteredCourses = publishedCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.section && course.section.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredConcludedCourses = concludedCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.section && course.section.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStudents = (selectedCourse?.students || []).filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const totalEnrolledStudents = [...publishedCourses, ...concludedCourses].reduce(
    (acc, course) => acc + (course.students?.length || 0),
    0
  );

  // Reusable Course Card Renderer
  const renderCourseCard = (course, isConcluded = false) => {
    const courseImg = course.imageUrl || course.image;
    const isMenuOpen = activeMenuId === course.id;


    return (
      <div
        key={course.id}
        className="bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-all group flex flex-col justify-between relative"
      >
        <div>
          <div
            className={`h-36 relative p-4 flex flex-col justify-between overflow-visible rounded-t-2xl ${
              !courseImg
                ? course.color || "bg-[#862334]"
                : "bg-gray-800"
            }`}
          >
            {courseImg && (
              <img
                src={courseImg}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover rounded-t-2xl z-0"
              />
            )}

            {courseImg && <div className="absolute inset-0 bg-black/40 rounded-t-2xl z-0" />}

            <div className="flex items-center justify-between relative z-20">
              {course.section ? (
                <span className="bg-black/35 text-white font-mono font-semibold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs shadow-xs">
                  {course.section}
                </span>
              ) : <div />}

              <div className="relative ml-auto" ref={isMenuOpen ? menuRef : null}>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActiveMenuId(isMenuOpen ? null : course.id);
                }}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-black/30 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div
                  className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Edit Course - available for both active and concluded */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      setEditingCourse(course);
                      setIsEditModalOpen(true);
                      setActiveMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#862334]/10 hover:text-[#862334] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Course Details
                  </button>

                  {/* Only active courses can be concluded */}
                  {!isConcluded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        setCourseToConclude(course);
                        setIsConcludeModalOpen(true);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#862334]/10 hover:text-[#862334] flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-100"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Conclude Course
                    </button>
                  )}

                  {/* Delete - available for both active and concluded */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      setCourseToDelete(course);
                      setIsDeleteModalOpen(true);
                      setActiveMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Course
                  </button>
                </div>
              )}
            </div>
            </div>

            <div className="text-white relative z-10">
              <span className="text-xs font-mono font-bold text-white/90 drop-shadow-xs">
                {course.code}
              </span>
              <p className="text-[11px] text-white/80 truncate drop-shadow-xs">
                {course.term}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <h3
              onClick={() => handleOpenCourse(course)}
              className="font-bold text-base font-Geist text-gray-900 line-clamp-2 hover:text-[#862334] cursor-pointer transition-colors leading-snug"
            >
              {course.title}
            </h3>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-600">
                <Users className="w-4 h-4 text-[#862334]" />
                {course.students?.length || course.studentsCount || 0} Students
              </span>
              {isConcluded && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  Concluded
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (restoringCourse) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#862334] rounded-full animate-spin" />

          <p className="text-sm font-medium text-gray-500">
            Loading course...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-Inter relative">
      {/* Inline Keyframes for Toast Progress Bar */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress {
          animation: shrinkWidth 4s linear forwards;
        }
      `}</style>

      {/* Success Toast Banner with Progress Bar */}
      {toast.show && (
        <div
          key={toast.key}
          className="fixed bottom-6 right-6 z-[120] bg-white text-gray-900 rounded-2xl shadow-xl border border-emerald-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold font-Geist text-gray-800 pr-2">
              {toast.message}
            </p>
            <button
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-1 bg-emerald-50 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-toast-progress" />
          </div>
        </div>
      )}

      {/* Extracted Modals */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />

      <AddCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />

      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollStudent}
      />

      {/* Edit Course Modal */}
      {isEditModalOpen && editingCourse && (
        <EditCourseModal
          isOpen={isEditModalOpen}
          course={editingCourse}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCourse(null);
          }}
          onSave={handleSaveEditedCourse}
        />
      )}

      {/* Conclude Course Confirmation Modal */}
      {isConcludeModalOpen && courseToConclude && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => {
                setIsConcludeModalOpen(false);
                setCourseToConclude(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-Geist text-gray-900">Conclude Course?</h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Are you sure you want to conclude <span className="font-semibold text-gray-800">"{courseToConclude.title}"</span>? This will move it to the concluded courses list.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConcludeModalOpen(false);
                  setCourseToConclude(null);
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmConcludeCourse}
                className="px-5 py-2.5 bg-[#862334] text-white rounded-full text-xs font-bold hover:bg-[#701c2b] transition-all shadow-xs cursor-pointer"
              >
                Yes, Conclude Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unenroll Student Confirmation Modal */}
      {studentToUnenroll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              disabled={isUnenrolling}
              onClick={() => setStudentToUnenroll(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-Geist text-gray-900">Unenroll Student?</h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Remove <span className="font-semibold text-gray-800">{studentToUnenroll.name}</span> from <span className="font-semibold text-gray-800">{selectedCourse?.code}</span>? This removes only the course enrollment and does not delete the student's account.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isUnenrolling}
                onClick={() => setStudentToUnenroll(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUnenrolling}
                onClick={confirmUnenrollStudent}
                className="px-5 py-2.5 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUnenrolling ? "Unenrolling..." : "Yes, Unenroll Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">

            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCourseToDelete(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-Geist text-gray-900">
                Delete Course?
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-800">
                  "{courseToDelete.title}"
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCourseToDelete(null);
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteCourse}
                className="px-5 py-2.5 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-all shadow-xs cursor-pointer"
              >
                Yes, Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 select-none h-screen z-50 relative">
        <div className="w-full flex flex-col items-center">
          <div
            className="mb-3 px-1 flex flex-col items-center cursor-pointer"
            onClick={() => {
              setIsAccountOpen(false);
              setSelectedCourse(null);
              setActiveNav("dashboard");
              navigate("/staff/dashboard");
            }}
          >
            <img
              src="/images/Alvin-logo.png"
              alt="Alvin Logo"
              className="w-20 h-20 object-contain hover:scale-105 transition-transform"
            />
          </div>

          <nav className="w-full flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon =
                item.id === "account"
                  ? User
                  : item.id === "dashboard"
                  ? LayoutDashboard
                  : BarChart3;

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
                      setSelectedCourse(null);
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

      {/* Account Drawer Overlay Backdrop */}
      {isAccountOpen && (
        <div
          className="fixed inset-0 left-[100px] bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setIsAccountOpen(false)}
        />
      )}

      {/* Slide-out Account Drawer */}
      <aside
        className={`fixed left-[100px] top-0 w-[340px] h-full bg-white border-r border-gray-200 z-40 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transform transition-transform duration-300 ease-in-out ${
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
              className="w-20 h-20 rounded-full object-cover border-2 border-[#1565C0] shadow-xs mb-3"
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

      {/* Main Workspace */}
      <main className="flex-1 bg-white h-screen overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeNav === "statistics" ? (
            /* STATISTICS VIEW */
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-black font-Geist text-gray-900">
                  Analytics & Statistics
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Overview of active courses, total enrolled students, and engagement metrics.
                </p>
              </div>

              {/* Stat Cards Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-5 bg-stone-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Published Courses
                    </p>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {publishedCourses.length}
                    </p>
                  </div>
                  <div className="p-3 bg-[#862334]/10 text-[#862334] rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 bg-stone-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Students Enrolled
                    </p>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {totalEnrolledStudents}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 bg-stone-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </p>
                    <p className="text-3xl font-black text-gray-900 mt-1">94%</p>
                  </div>
                  <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Course Breakdown Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs mt-6">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base">Course Statistics Breakdown</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                        <th className="py-3.5 px-6">Course Code</th>
                        <th className="py-3.5 px-6">Course Title</th>
                        <th className="py-3.5 px-6">Section</th>
                        <th className="py-3.5 px-6 text-right">Enrolled Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {[...publishedCourses, ...concludedCourses].map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-mono font-medium text-gray-700">{c.code}</td>
                          <td className="py-4 px-6 font-bold text-gray-900">{c.title}</td>
                          <td className="py-4 px-6 text-gray-600">{c.section || "N/A"}</td>
                          <td className="py-4 px-6 text-right font-semibold text-gray-800">
                            {c.students?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* DASHBOARD VIEW */
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div className="flex items-center gap-3">
                  {selectedCourse && (
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        setStudentSearch("");
                        navigate("/staff/dashboard");
                      }}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      title="Back to Dashboard"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-3xl font-black font-Geist text-gray-900">
                      {selectedCourse ? selectedCourse.title : "Dashboard"}
                    </h1>
                    {selectedCourse && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedCourse.code} • Section {selectedCourse.section} • Enrolled Student Roster
                      </p>
                    )}
                  </div>
                </div>

                {!selectedCourse ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search published courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] w-64 shadow-xs transition-all"
                      />
                    </div>

                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 bg-[#862334] text-white px-4 py-2 rounded-xl text-sm font-bold font-Geist hover:bg-[#701c2b] transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Course
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] w-56 md:w-64 shadow-xs transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setIsEnrollModalOpen(true)}
                      className="flex items-center gap-2 bg-[#862334] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#701c2b] transition-all shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Enroll Student
                    </button>
                  </div>
                )}
              </div>

              {!selectedCourse ? (
                <div className="space-y-10">
                  {/* Active Courses Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold font-Geist text-gray-900">
                          Published Courses
                        </h2>
                        <span className="bg-[#862334]/10 text-[#862334] text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                          {filteredCourses.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Card View</span>
                      </div>
                    </div>

                    {filteredCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredCourses.map((course) => renderCourseCard(course, false))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-500 text-sm">
                        No Published Courses Available.
                      </div>
                    )}
                  </div>

                  {/* Concluded Courses Section */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold font-Geist text-gray-900">
                        Concluded Courses
                      </h2>
                      <span className="bg-gray-100 text-gray-600 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                        {filteredConcludedCourses.length}
                      </span>
                    </div>

                    {filteredConcludedCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredConcludedCourses.map((course) => renderCourseCard(course, true))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 text-sm">
                        No concluded courses available.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-base">Student List</h3>
                      <span className="text-xs text-gray-500">
                        Showing {filteredStudents.length} of {selectedCourse.students?.length || 0} students
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                            <th className="py-3.5 px-6">Student No.</th>
                            <th className="py-3.5 px-6">Student Name</th>
                            <th className="py-3.5 px-6">Email Address</th>
                            <th className="py-3.5 px-6">Date Enrolled</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                            <th className="py-3.5 px-6 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-rose-50/30 transition-colors">
                              <td className="py-4 px-6 font-mono font-medium text-gray-700">{student.studentNo}</td>
                              <td className="py-4 px-6 font-bold text-gray-900">{student.name}</td>
                              <td className="py-4 px-6 text-gray-600">{student.email}</td>
                              <td className="py-4 px-6 text-gray-500 text-xs">{student.dateJoined}</td>
                              <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {student.status}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setStudentToUnenroll(student);
                                  setIsUnenrollModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                <UserMinus className="w-4 h-4" />
                                Unenroll
                              </button>
                            </td>
                            </tr>
                          ))}

                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-gray-500">
                                No enrolled students found matching your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}