import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LayoutDashboard,
  BarChart3,
  MoreVertical,
  EllipsisVertical,
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
  PauseCircle,
  PlayCircle,
  Pause,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

const SORT_OPTIONS = [
  { id: "newest", label: "Date Created (Newest)" },
  { id: "oldest", label: "Date Created (Oldest)" },
  { id: "az", label: "Alphabetical (A – Z)" },
  { id: "za", label: "Alphabetical (Z – A)" },
];

const STUDENTS_PER_PAGE = 5;

export default function StaffDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [navAnimKey, setNavAnimKey] = useState(0);
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

  // Pause/Resume Interviews Modal State
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [courseToTogglePause, setCourseToTogglePause] = useState(null);
  const [isTogglingPause, setIsTogglingPause] = useState(false);

  // Delete Course Confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Enrollment action confirmation
  const [studentToUnenroll, setStudentToUnenroll] = useState(null);
  const [studentAction, setStudentAction] = useState("unenroll");
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [activeStudentMenuId, setActiveStudentMenuId] = useState(null);
  const studentMenuContainerRef = useRef(null);

  // Course dropdown state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Course sort/filter state
  const [courseSort, setCourseSort] = useState("newest");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
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

  const showToastNotification = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ show: true, message, key: Date.now() });

    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
      if (
        studentMenuContainerRef.current &&
        !studentMenuContainerRef.current.contains(event.target)
      ) {
        setActiveStudentMenuId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveStudentMenuId(null);
        setActiveMenuId(null);
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      const mappedCourses = data.map(mapCourseFromDatabase);

      setPublishedCourses(
        mappedCourses.filter((course) => course.status === "active")
      );

      setConcludedCourses(
        mappedCourses.filter(
          (course) =>
            course.status === "concluded" || course.status === "archived"
        )
      );
    } catch (error) {
      console.error("Error loading courses:", error);

      showToastNotification("Unable to load courses.");
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

      if (!match) {
        setRestoringCourse(false);
        return;
      }

      if (coursesLoading) {
        return;
      }

      const courseId = match[1];

      const course = [...publishedCourses, ...concludedCourses].find(
        (item) => item.id === courseId
      );

      if (!course) {
        setRestoringCourse(false);

        navigate("/staff/dashboard", {
          replace: true,
        });

        return;
      }

      try {
        const enrollmentRows = await getCourseEnrollments(course.id);

        const students = enrollmentRows.map(mapEnrollmentFromDatabase);

        setSelectedCourse({
          ...course,
          students,
          studentsCount: students.length,
        });
      } catch (error) {
        console.error("Error restoring course:", error);

        showToastNotification("Unable to load course enrollment.");
      } finally {
        setRestoringCourse(false);
      }
    };

    restoreSelectedCourse();
  }, [location.pathname, coursesLoading]);

  const mapEnrollmentFromDatabase = (row) => {
    const student = row.student_profile;

    return {
      id: row.enrollment_id,
      studentId: student?.student_id || "",
      studentNo: student?.ub_mail?.split("@")[0] || "",
      name: student?.display_name || "Unknown Student",
      email: student?.ub_mail || "",
      status: row.enrollment_status
        ? row.enrollment_status.charAt(0).toUpperCase() +
          row.enrollment_status.slice(1)
        : "Enrolled",
      dateJoined: row.enrolled_at
        ? new Date(row.enrolled_at).toLocaleDateString()
        : "—",
    };
  };

  const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
    }
    return false;
  };

  const mapCourseFromDatabase = (course) => ({
    id: course.course_id,
    code: course.course_code,
    title: course.course_title,
    section: course.section || "",
    term: course.academic_term || "",
    status: course.course_status,
    createdAt: course.created_at || null,
    is_interviews_paused: toBoolean(course.is_interviews_paused),
    color: course.course_color || "bg-[#862334]",
    imageUrl: course.course_image || null,
    image: course.course_image || null,
    studentsCount: course.students_count ?? (course.students?.length || 0),
    students: course.students || [],
  });

  const handleCreateCourse = async (newCourse) => {
    try {
      const createdCourse = await createCourse({
        course_title: newCourse.title,
        course_code: newCourse.code,
        section: newCourse.section,
        academic_term: newCourse.term,
        course_color: newCourse.color,
        course_image: newCourse.imageUrl,
      });

      const mappedCourse = mapCourseFromDatabase(createdCourse);

      setPublishedCourses((prev) => [mappedCourse, ...prev]);

      showToastNotification(
        `Course "${mappedCourse.code}" successfully created!`
      );

      return {
        success: true,
        course: mappedCourse,
      };
    } catch (error) {
      console.error("Error creating course:", error);

      showToastNotification(error.message || "Unable to create course.");

      return {
        error: error.message || "Unable to create course.",
      };
    }
  };

  const confirmTogglePauseInterviews = async () => {
    if (!courseToTogglePause || isTogglingPause) return;

    const currentPauseState = toBoolean(
      courseToTogglePause.is_interviews_paused
    );
    const newPauseState = !currentPauseState;

    try {
      setIsTogglingPause(true);

      const savedCourse = await updateCourse(courseToTogglePause.id, {
        course_title: courseToTogglePause.title,
        course_code: courseToTogglePause.code,
        section: courseToTogglePause.section,
        academic_term: courseToTogglePause.term,
        course_status: courseToTogglePause.status || "active",
        course_color: courseToTogglePause.color || "bg-[#862334]",
        course_image: courseToTogglePause.imageUrl || courseToTogglePause.image,
        is_interviews_paused: newPauseState,
      });

      const updatedCourse = {
        ...courseToTogglePause,
        ...mapCourseFromDatabase(savedCourse),
        is_interviews_paused: newPauseState,
      };

      setPublishedCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
      );

      setConcludedCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
      );

      if (selectedCourse?.id === updatedCourse.id) {
        setSelectedCourse((prev) => ({
          ...prev,
          is_interviews_paused: newPauseState,
        }));
      }

      setIsPauseModalOpen(false);
      setCourseToTogglePause(null);
      setActiveMenuId(null);

      showToastNotification(
        newPauseState
          ? `Interviews paused for students in ${updatedCourse.code}.`
          : `Interviews resumed for students in ${updatedCourse.code}.`
      );
    } catch (error) {
      console.error("Error toggling pause state:", error);
      showToastNotification(
        error.message || "Unable to update interview status for this course."
      );
    } finally {
      setIsTogglingPause(false);
    }
  };

  const confirmConcludeCourse = async () => {
    if (!courseToConclude) return;

    try {
      const savedCourse = await updateCourse(courseToConclude.id, {
        course_title: courseToConclude.title,
        course_code: courseToConclude.code,
        section: courseToConclude.section,
        academic_term: courseToConclude.term,
        course_status: "concluded",
        course_color: courseToConclude.color || "bg-[#862334]",
        course_image: courseToConclude.imageUrl || courseToConclude.image,
        is_interviews_paused: courseToConclude.is_interviews_paused,
      });

      const mappedCourse = mapCourseFromDatabase(savedCourse);

      const concludedCourse = {
        ...courseToConclude,
        ...mappedCourse,
        status: "concluded",
      };

      setPublishedCourses((prev) =>
        prev.filter((course) => course.id !== concludedCourse.id)
      );

      setConcludedCourses((prev) => [
        concludedCourse,
        ...prev.filter((course) => course.id !== concludedCourse.id),
      ]);

      if (selectedCourse?.id === concludedCourse.id) {
        setSelectedCourse(null);
      }

      setIsConcludeModalOpen(false);
      setCourseToConclude(null);
      setActiveMenuId(null);

      showToastNotification(
        `Course "${concludedCourse.code}" successfully concluded!`
      );
    } catch (error) {
      console.error("Error concluding course:", error);

      showToastNotification(error.message || "Unable to conclude course.");
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const courseId = courseToDelete.id;
      const courseCode = courseToDelete.code;

      await deleteCourse(courseId);

      setPublishedCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      setConcludedCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }

      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      setActiveMenuId(null);

      showToastNotification(`Course "${courseCode}" successfully deleted!`);
    } catch (error) {
      console.error("Error deleting course:", error);

      showToastNotification(error.message || "Unable to delete course.");
    }
  };

  const handleSaveEditedCourse = async (updatedCourse) => {
    try {
      const savedCourse = await updateCourse(updatedCourse.id, {
        course_title: updatedCourse.title,
        course_code: updatedCourse.code,
        section: updatedCourse.section,
        academic_term: updatedCourse.term,
        course_status: updatedCourse.status || "active",
        course_color: updatedCourse.color || "bg-[#862334]",
        course_image: updatedCourse.imageUrl || updatedCourse.image,
        is_interviews_paused: toBoolean(updatedCourse.is_interviews_paused),
      });

      const mappedCourse = mapCourseFromDatabase(savedCourse);

      setPublishedCourses((prev) =>
        prev.map((course) =>
          course.id === mappedCourse.id
            ? { ...course, ...mappedCourse }
            : course
        )
      );

      setConcludedCourses((prev) =>
        prev.map((course) =>
          course.id === mappedCourse.id
            ? { ...course, ...mappedCourse }
            : course
        )
      );

      if (selectedCourse?.id === mappedCourse.id) {
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
      console.error("Error updating course:", error);

      showToastNotification(error.message || "Unable to update course.");

      return {
        error: error.message || "Unable to update course.",
      };
    }
  };

  const handleEnrollStudent = async (studentEmail) => {
    if (!selectedCourse) {
      return { error: "No course selected." };
    }

    try {
      const student = await findStudentByEmail(studentEmail);

      const alreadyEnrolled = selectedCourse.students?.some(
        (enrolledStudent) => enrolledStudent.studentId === student.student_id
      );

      if (alreadyEnrolled) {
        return {
          error: "This student is already enrolled in this course.",
        };
      }

      await enrollStudents(selectedCourse.id, [student]);

      let emailNotificationSent = true;

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

        const API_KEY = import.meta.env.VITE_APP_API_KEY || "";

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
              student_name: student.display_name || "Student",
              course_title: selectedCourse.title,
              course_code: selectedCourse.code,
              section: selectedCourse.section || "",
              academic_term: selectedCourse.term || "",
            }),
          }
        );

        if (!emailResponse.ok) {
          emailNotificationSent = false;
        }
      } catch (emailError) {
        emailNotificationSent = false;
        console.error(
          "Enrollment saved, but email notification failed:",
          emailError
        );
      }

      const enrollmentRows = await getCourseEnrollments(selectedCourse.id);
      const students = enrollmentRows.map(mapEnrollmentFromDatabase);

      const updatedCourse = {
        ...selectedCourse,
        students,
        studentsCount: students.length,
      };

      setSelectedCourse(updatedCourse);

      setPublishedCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id ? updatedCourse : course
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
      console.error("Error enrolling student:", error);

      if (error.code === "23505") {
        return {
          error: "This student is already enrolled in this course.",
        };
      }

      return {
        error: error.message || "Unable to enroll student.",
      };
    }
  };

  const confirmUnenrollStudent = async () => {
    if (!studentToUnenroll || !selectedCourse || isUnenrolling) return;

    const action = studentAction;
    const student = studentToUnenroll;

    try {
      setIsUnenrolling(true);

      if (action === "drop") {
        const { error } = await supabase
          .from("course_enrollments")
          .update({ enrollment_status: "dropped" })
          .eq("enrollment_id", student.id);

        if (error) throw error;
      } else {
        await removeEnrollment(student.id);
      }

      let students;
      if (action === "drop") {
        students = (selectedCourse.students || []).map((item) =>
          item.id === student.id ? { ...item, status: "Dropped" } : item
        );
      } else {
        const enrollmentRows = await getCourseEnrollments(selectedCourse.id);
        students = enrollmentRows.map(mapEnrollmentFromDatabase);
      }

      const updatedCourse = {
        ...selectedCourse,
        students,
        studentsCount: students.filter(
          (s) => s.status.toLowerCase() !== "dropped"
        ).length,
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
        action === "drop"
          ? `${student.name} marked as dropped from ${selectedCourse.code}.`
          : `${student.name} successfully unenrolled from ${selectedCourse.code}.`
      );

      setStudentToUnenroll(null);
      setActiveStudentMenuId(null);
    } catch (error) {
      console.error(
        `Error ${action === "drop" ? "dropping" : "unenrolling"} student:`,
        error
      );
      showToastNotification(
        error.message ||
          `Unable to ${action === "drop" ? "drop" : "unenroll"} student.`
      );
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleOpenCourse = async (course) => {
    try {
      const enrollmentRows = await getCourseEnrollments(course.id);
      const students = enrollmentRows.map(mapEnrollmentFromDatabase);

      const courseWithStudents = {
        ...course,
        students,
        studentsCount: students.length,
      };

      setSelectedCourse(courseWithStudents);
      setStudentPage(1);
      setStudentSearch("");
      setActiveStudentMenuId(null);
      setNavAnimKey((prev) => prev + 1);

      setPublishedCourses((prev) =>
        prev.map((item) => (item.id === course.id ? courseWithStudents : item))
      );

      setConcludedCourses((prev) =>
        prev.map((item) => (item.id === course.id ? courseWithStudents : item))
      );

      navigate(`/staff/dashboard/course/${course.id}`);
    } catch (error) {
      console.error("Error loading course enrollments:", error);
      showToastNotification(
        error.message || "Unable to load enrolled students."
      );
    }
  };

  const sortCourses = (list) => {
    const items = [...list];
    switch (courseSort) {
      case "az":
        return items.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "", undefined, {
            sensitivity: "base",
          })
        );
      case "za":
        return items.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "", undefined, {
            sensitivity: "base",
          })
        );
      case "oldest":
        return items.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });
      case "newest":
      default:
        return items.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
    }
  };

  const filteredCourses = sortCourses(
    publishedCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.section &&
          course.section.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const filteredConcludedCourses = sortCourses(
    concludedCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.section &&
          course.section.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const activeSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === courseSort)?.label ||
    "Date Created (Newest)";

  const filteredStudents = (selectedCourse?.students || []).filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const totalStudentPages = Math.ceil(
    filteredStudents.length / STUDENTS_PER_PAGE
  );
  const displayedStudentPage = Math.min(
    studentPage,
    Math.max(totalStudentPages, 1)
  );
  const paginatedStudents = filteredStudents.slice(
    (displayedStudentPage - 1) * STUDENTS_PER_PAGE,
    displayedStudentPage * STUDENTS_PER_PAGE
  );

  const getVisibleStudentPages = () => {
    if (totalStudentPages <= 5) {
      return Array.from({ length: totalStudentPages }, (_, i) => i + 1);
    }
    if (displayedStudentPage <= 3) {
      return [1, 2, 3, 4, "...", totalStudentPages];
    }
    if (displayedStudentPage >= totalStudentPages - 2) {
      return [
        1,
        "...",
        totalStudentPages - 3,
        totalStudentPages - 2,
        totalStudentPages - 1,
        totalStudentPages,
      ];
    }
    return [
      1,
      "...",
      displayedStudentPage - 1,
      displayedStudentPage,
      displayedStudentPage + 1,
      "...",
      totalStudentPages,
    ];
  };

  const totalEnrolledStudents = [...publishedCourses, ...concludedCourses].reduce(
    (acc, course) =>
      acc + (course.studentsCount ?? course.students?.length ?? 0),
    0
  );

  const renderCourseCard = (course, isConcluded = false, index = 0) => {
    const courseImg = course.imageUrl || course.image;
    const isMenuOpen = activeMenuId === course.id;
    const isPaused = course.is_interviews_paused;

    return (
      <div
        key={course.id}
        style={{ animationDelay: `${Math.min(index * 110, 900)}ms` }}
        className="animate-item-in bg-white border border-[#862334]/25 hover:border-[#862334]/45 rounded-2xl shadow-[0_4px_16px_rgba(134,35,52,0.05)] hover:shadow-md transition-all group flex flex-col justify-between relative"
      >
        <div>
          <div
            className={`h-36 relative p-4 flex flex-col justify-between overflow-visible rounded-t-2xl ${
              !courseImg ? course.color || "bg-[#862334]" : "bg-gray-800"
            }`}
          >
            {courseImg && (
              <img
                src={courseImg}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover rounded-t-2xl z-0"
              />
            )}

            {courseImg && (
              <div className="absolute inset-0 bg-black/40 rounded-t-2xl z-0" />
            )}

            <div className="flex items-center justify-between relative z-20">
              <div className="flex items-center gap-1.5 flex-wrap">
                {course.section ? (
                  <span className="bg-black/35 text-white font-Inter tracking-widest font-semibold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs shadow-xs">
                    {course.section}
                  </span>
                ) : null}

                {isPaused && (
                  <span className="bg-amber-500/90 text-white font-sans font-bold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs flex items-center gap-1">
                    <Pause className="w-3 h-3 stroke-[2.5]" />
                    PAUSED
                  </span>
                )}
              </div>

              <div
                className="relative ml-auto"
                ref={isMenuOpen ? menuRef : null}
              >
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
                    className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        setCourseToTogglePause(course);
                        setIsPauseModalOpen(true);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      {isPaused ? (
                        <>
                          <PlayCircle className="w-4 h-4 text-emerald-600" />
                          Resume Interviews
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-4 h-4 text-amber-600" />
                          Pause Interviews
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        setEditingCourse(course);
                        setIsEditModalOpen(true);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-[#862334]/10 hover:text-[#862334] flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Course Details
                    </button>

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
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-[#862334]/10 hover:text-[#862334] flex items-center gap-2 cursor-pointer transition-colors border-t border-gray-100"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Conclude Course
                      </button>
                    )}

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
              <span className="text-xs font-Inter font-bold text-white/90 drop-shadow-xs">
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

            <div className="flex items-center justify-between pt-2 border-t border-[#862334]/15 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-600">
                <Users className="w-4 h-4 text-[#862334]" />
                {course.studentsCount ?? course.students?.length ?? 0} Students
              </span>
              {isConcluded ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  Concluded
                </span>
              ) : isPaused ? (
                <span className="text-[10px] font-bold tracking-tight px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                  Interviews Paused
                </span>
              ) : null}
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
          <p className="text-sm font-medium text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-Inter relative">
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress {
          animation: shrinkWidth 4s linear forwards;
        }
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

      {/* Modals */}
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

      {isPauseModalOpen && courseToTogglePause && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              disabled={isTogglingPause}
              onClick={() => {
                setIsPauseModalOpen(false);
                setCourseToTogglePause(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                courseToTogglePause.is_interviews_paused
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {courseToTogglePause.is_interviews_paused ? (
                <PlayCircle className="w-6 h-6" />
              ) : (
                <PauseCircle className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-Geist text-gray-900">
                {courseToTogglePause.is_interviews_paused
                  ? "Resume Interviews?"
                  : "Pause Interviews?"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                {courseToTogglePause.is_interviews_paused ? (
                  <>
                    Are you sure you want to resume interviews for{" "}
                    <span className="font-semibold text-gray-800">
                      "{courseToTogglePause.title}"
                    </span>
                    ? Enrolled students will be able to start AI interviews
                    again.
                  </>
                ) : (
                  <>
                    Are you sure you want to pause interviews for{" "}
                    <span className="font-semibold text-gray-800">
                      "{courseToTogglePause.title}"
                    </span>
                    ? Students enrolled in this course will temporarily be
                    restricted from starting new AI interviews.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isTogglingPause}
                onClick={() => {
                  setIsPauseModalOpen(false);
                  setCourseToTogglePause(null);
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTogglingPause}
                onClick={confirmTogglePauseInterviews}
                className={`px-5 py-2.5 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60 ${
                  courseToTogglePause.is_interviews_paused
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isTogglingPause
                  ? "Updating..."
                  : courseToTogglePause.is_interviews_paused
                  ? "Yes, Resume Interviews"
                  : "Yes, Pause Interviews"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isConcludeModalOpen && courseToConclude && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => {
                setIsConcludeModalOpen(false);
                setCourseToConclude(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-Geist text-gray-900">
                Conclude Course?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Are you sure you want to conclude{" "}
                <span className="font-semibold text-gray-800">
                  "{courseToConclude.title}"
                </span>
                ? This will move it to the concluded courses list.
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
              <h3 className="text-xl font-bold font-Geist text-gray-900">
                {studentAction === "drop"
                  ? "Drop Student?"
                  : "Unenroll Student?"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                {studentAction === "drop" ? (
                  <>
                    Mark{" "}
                    <span className="font-semibold text-gray-800">
                      {studentToUnenroll.name}
                    </span>{" "}
                    as dropped from{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedCourse?.code}
                    </span>
                    ? The enrollment record will be kept for history.
                  </>
                ) : (
                  <>
                    Remove{" "}
                    <span className="font-semibold text-gray-800">
                      {studentToUnenroll.name}
                    </span>{" "}
                    from{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedCourse?.code}
                    </span>
                    ? This removes only the course enrollment and does not
                    delete the student's account.
                  </>
                )}
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
                {isUnenrolling
                  ? studentAction === "drop"
                    ? "Dropping..."
                    : "Unenrolling..."
                  : studentAction === "drop"
                  ? "Yes, Drop Student"
                  : "Yes, Unenroll Student"}
              </button>
            </div>
          </div>
        </div>
      )}

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
      <aside className="w-[100px] bg-[#FDFBF7] border-r-1 border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 select-none h-screen z-50 relative">
        <div className="w-full flex flex-col items-center">
          <div
            className="mb-3 px-1 flex flex-col items-center cursor-pointer"
            onClick={() => {
              setIsAccountOpen(false);
              setSelectedCourse(null);
              setActiveNav("dashboard");
              setNavAnimKey((prev) => prev + 1);
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

      {/* Account Drawer Backdrop */}
      {isAccountOpen && (
        <div
          className="fixed inset-0 left-[100px] bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setIsAccountOpen(false)}
        />
      )}

      {/* Account Drawer */}
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
      <main className="flex-1 bg-[#F7F7F8] h-screen overflow-y-auto p-6 md:p-8">
        <div
          key={`${activeNav}-${selectedCourse?.id || "list"}-${navAnimKey}`}
          className="max-w-7xl mx-auto space-y-6"
        >
          {activeNav === "statistics" ? (
            <div className="space-y-6">
              <div
                style={{ animationDelay: "0ms" }}
                className="animate-item-in border-b border-gray-200 pb-5"
              >
                <h1 className="text-3xl font-black font-Geist text-gray-900">
                  Analytics & Statistics
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Overview of active courses, total enrolled students, and
                  engagement metrics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                  style={{ animationDelay: "120ms" }}
                  className="animate-item-in p-5 bg-stone-50 border border-gray-200 rounded-2xl flex items-center justify-between"
                >
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

                <div
                  style={{ animationDelay: "240ms" }}
                  className="animate-item-in p-5 bg-stone-50 border border-gray-200 rounded-2xl flex items-center justify-between"
                >
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

                <div
                  style={{ animationDelay: "360ms" }}
                  className="animate-item-in p-5 bg-stone-50 border border-gray-200 rounded-2xl flex items-center justify-between"
                >
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

              <div
                style={{ animationDelay: "480ms" }}
                className="animate-item-in bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs mt-6"
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base">
                    Course Statistics Breakdown
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                        <th className="py-3.5 px-6">Course Code</th>
                        <th className="py-3.5 px-6">Course Title</th>
                        <th className="py-3.5 px-6">Section</th>
                        <th className="py-3.5 px-6 text-center">
                          Interviews Status
                        </th>
                        <th className="py-3.5 px-6 text-right">
                          Enrolled Students
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {[...publishedCourses, ...concludedCourses].map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6 font-Inter font-medium text-gray-700">
                            {c.code}
                          </td>
                          <td className="py-4 px-6 font-bold text-gray-900">
                            {c.title}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {c.section || "N/A"}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {c.is_interviews_paused ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Pause className="w-3 h-3" /> Paused
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-gray-800">
                            {c.studentsCount ?? c.students?.length ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{ animationDelay: "0ms" }}
                className="animate-item-in flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5"
              >
                <div className="flex items-center gap-3">
                  {selectedCourse && (
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        setStudentSearch("");
                        setStudentPage(1);
                        setActiveStudentMenuId(null);
                        setNavAnimKey((prev) => prev + 1);
                        navigate("/staff/dashboard");
                      }}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      title="Back to Dashboard"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-3xl font-black font-Geist text-gray-900">
                        {selectedCourse ? selectedCourse.title : "Dashboard"}
                      </h1>
                      {selectedCourse?.is_interviews_paused && (
                        <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                          <Pause className="w-3 h-3 stroke-[2.5]" /> Interviews
                          Paused
                        </span>
                      )}
                    </div>
                    {selectedCourse && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedCourse.code} • Section {selectedCourse.section}{" "}
                        • Enrolled Student Roster
                      </p>
                    )}
                  </div>
                </div>

                {!selectedCourse ? (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search Published Courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-400 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#862334] w-64 shadow-xs transition-all"
                      />
                    </div>

                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-2 bg-[#862334] text-white px-4 py-2 rounded-xl text-sm font-bold font-Geist hover:bg-[#701c2b] transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Add Course
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => setIsEnrollModalOpen(true)}
                      className="flex items-center gap-2 bg-[#862334] text-white px-4 py-2.5 rounded-xl text-sm font-bold font-Geist hover:bg-[#701c2b] transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" /> Enroll Student
                    </button>
                  </div>
                )}
              </div>

              {!selectedCourse ? (
                <div className="space-y-10">
                  <div>
                    <div
                      style={{ animationDelay: "120ms" }}
                      className="animate-item-in flex items-center justify-between mb-4 relative z-30"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold font-Geist text-gray-900">
                          Published Courses
                        </h2>
                        <span className="bg-[#862334]/10 text-[#862334] text-xs font-Inter font-bold px-2 py-0.5 rounded-full">
                          {filteredCourses.length}
                        </span>
                      </div>

                      <div className="relative" ref={sortMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsSortMenuOpen((prev) => !prev)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-medium shadow-2xs transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#862334]" />
                          <span>{activeSortLabel}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${
                              isSortMenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isSortMenuOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                              Sort Courses By
                            </div>
                            {SORT_OPTIONS.map((option) => {
                              const isSelected = courseSort === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => {
                                    setCourseSort(option.id);
                                    setIsSortMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-[#862334]/10 text-[#862334]"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#862334]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {filteredCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredCourses.map((course, idx) =>
                          renderCourseCard(course, false, idx + 2)
                        )}
                      </div>
                    ) : (
                      <div
                        style={{ animationDelay: "220ms" }}
                        className="animate-item-in p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-500 text-sm"
                      >
                        No Published Courses Available.
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <div
                      style={{ animationDelay: "320ms" }}
                      className="animate-item-in flex items-center gap-2 mb-4"
                    >
                      <h2 className="text-lg font-bold font-Geist text-gray-900">
                        Concluded Courses
                      </h2>
                      <span className="bg-gray-100 text-gray-600 text-xs font-Inter font-bold px-2 py-0.5 rounded-full">
                        {filteredConcludedCourses.length}
                      </span>
                    </div>

                    {filteredConcludedCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredConcludedCourses.map((course, idx) =>
                          renderCourseCard(course, true, idx + 4)
                        )}
                      </div>
                    ) : (
                      <div
                        style={{ animationDelay: "420ms" }}
                        className="animate-item-in p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 text-sm"
                      >
                        No concluded courses available.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                  {/* Student Roster Container matching UserManagement_2.jsx */}
                  <div
                    style={{ animationDelay: "120ms" }}
                    className="animate-item-in md:col-span-12 bg-white border border-[#862334]/25 shadow-[0_4px_16px_rgba(134,35,52,0.05)] relative z-20 overflow-visible rounded-2xl"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 md:px-8 py-5 gap-4 border-b border-[#862334]/15 bg-rose-50/20 rounded-t-2xl">
                      <h3 className="font-Geist text-lg font-bold text-black tracking-tight">
                        Student Roster
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 md:w-80">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            value={studentSearch}
                            onChange={(e) => {
                              setStudentSearch(e.target.value);
                              setStudentPage(1);
                              setActiveStudentMenuId(null);
                            }}
                            className="bg-white border border-[#862334]/30 focus:ring-1 focus:ring-[#862334] text-xs font-Inter w-full pl-10 py-2.5 text-black placeholder:text-gray-400 outline-none rounded-lg"
                            placeholder="SEARCH STUDENTS..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto md:overflow-visible">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-[#862334]/15 bg-rose-50/10">
                            {[
                              "Student",
                              "Student No.",
                              "Status",
                              "Date Enrolled",
                              "Action",
                            ].map((h, i) => (
                              <th
                                key={i}
                                className={`px-6 md:px-8 py-4 md:py-5 text-[14px] font-bold text-gray-900 font-Geist ${
                                  i === 4 ? "text-right" : ""
                                }`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody
                          key={`students-page-${displayedStudentPage}-${studentSearch}`}
                          className="divide-y divide-gray-100"
                        >
                          {paginatedStudents.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-10 text-center text-gray-400 text-sm font-[Manrope,sans-serif]"
                              >
                                No enrolled students match your query.
                              </td>
                            </tr>
                          ) : (
                            paginatedStudents.map((student, i) => {
                              const isMenuOpen =
                                activeStudentMenuId === student.id;
                              const isEnrolled =
                                student.status.toLowerCase() === "enrolled";
                              const openUpward =
                                i >= paginatedStudents.length - 2 &&
                                paginatedStudents.length > 2;

                              return (
                                <tr
                                  key={student.id}
                                  style={{
                                    animationDelay: `${Math.min(
                                      (i + 1) * 80,
                                      500
                                    )}ms`,
                                  }}
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
                                          {student.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-[Inter,sans-serif] truncate">
                                          {student.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-6 md:px-8 py-4 md:py-5">
                                    <span className="px-2.5 md:px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full font-Inter bg-gray-100 text-gray-500">
                                      {student.studentNo || "—"}
                                    </span>
                                  </td>

                                  <td className="px-6 md:px-8 py-4 md:py-5">
                                    <div
                                      className={`flex items-center text-[11px] font-semibold font-[Inter,sans-serif] uppercase ${
                                        isEnrolled
                                          ? "text-green-700"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${
                                          isEnrolled
                                            ? "bg-green-700 animate-pulse"
                                            : "bg-gray-300"
                                        }`}
                                      />
                                      {student.status}
                                    </div>
                                  </td>

                                  <td className="px-6 md:px-8 py-4 md:py-5 text-sm text-gray-400 font-[Inter,sans-serif] whitespace-nowrap">
                                    {student.dateJoined || "—"}
                                  </td>

                                  <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                                    <div
                                      ref={
                                        isMenuOpen
                                          ? studentMenuContainerRef
                                          : null
                                      }
                                      className="relative inline-block text-left"
                                    >
                                      <button
                                        type="button"
                                        disabled={isUnenrolling || !isEnrolled}
                                        onClick={() =>
                                          setActiveStudentMenuId((prev) =>
                                            prev === student.id
                                              ? null
                                              : student.id
                                          )
                                        }
                                        aria-haspopup="menu"
                                        aria-expanded={isMenuOpen}
                                        aria-label={`Enrollment actions for ${student.name}`}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors focus:outline-none ${
                                          !isEnrolled
                                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
                                            : isMenuOpen
                                            ? "border-[#862334]/40 bg-[#862334]/[0.08] text-[#862334] cursor-pointer"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-[#862334]/30 hover:text-[#862334] hover:bg-rose-50/30 cursor-pointer"
                                        }`}
                                      >
                                        <EllipsisVertical className="w-4 h-4" />
                                      </button>

                                      {isMenuOpen && isEnrolled && (
                                        <div
                                          role="menu"
                                          aria-label={`Actions for ${student.name}`}
                                          className={`absolute right-0 ${
                                            openUpward
                                              ? "bottom-full mb-1.5"
                                              : "top-full mt-1.5"
                                          } w-44 rounded-xl bg-white border border-gray-200 shadow-lg py-1.5 z-30 font-Inter`}
                                        >
                                          <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                              setStudentAction("unenroll");
                                              setStudentToUnenroll(student);
                                              setActiveStudentMenuId(null);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                          >
                                            <UserMinus className="w-3.5 h-3.5" />
                                            <span>Unenroll</span>
                                          </button>
                                          <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                              setStudentAction("drop");
                                              setStudentToUnenroll(student);
                                              setActiveStudentMenuId(null);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#862334] hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                          >
                                            <UserMinus className="w-3.5 h-3.5" />
                                            <span>Drop Student</span>
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

                  {/* Pill Pagination matching UserManagement_2.jsx */}
                  <div
                    style={{ animationDelay: "260ms" }}
                    className="animate-item-in md:col-span-12 relative z-0 mt-2 mb-4 flex justify-between items-center flex-wrap gap-4"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStudentPage((p) => Math.max(1, p - 1));
                          setActiveStudentMenuId(null);
                        }}
                        disabled={displayedStudentPage === 1}
                        aria-label="Previous page"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-[#862334] hover:bg-[#862334]/[0.06] transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      {getVisibleStudentPages().map((item, idx) =>
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
                              setStudentPage(item);
                              setActiveStudentMenuId(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                              displayedStudentPage === item
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
                          setStudentPage((p) =>
                            Math.min(totalStudentPages, p + 1)
                          );
                          setActiveStudentMenuId(null);
                        }}
                        disabled={
                          displayedStudentPage === totalStudentPages ||
                          totalStudentPages === 0
                        }
                        aria-label="Next page"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-[#862334] hover:bg-[#862334]/[0.06] transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="hidden sm:block font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-400">
                      Viewing {paginatedStudents.length} of{" "}
                      {filteredStudents.length} students
                    </span>
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