import { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { getProfileForUser, saveStudentProfile } from './lib/profileService'

// Page & Component Imports
import LandingPage from "./pages/LandingPage/LandingPage.jsx"
import About from "./pages/LandingPage/About.jsx"
import Loading from "./Components/Loading.jsx"
import Error404 from "./Components/Error404.jsx"
import UserLogin from './pages/LoginPage/login';
import StaffLogin from './pages/LoginPage/Staff-Login.jsx';
import UserDashboard from './pages/User/UserDashboard.jsx';
import InterviewHistory from './pages/User/Interview.jsx';
import InterviewResults from './pages/User/InterviewResults.jsx';
import UserSettings from './pages/User/UserSettings.jsx';
import ResumeUpload from './pages/User/ResumeUpload.jsx';
import HardwareCheck from './pages/User/HardwareCheck.jsx';
import LiveSession from './pages/User/LiveSession.jsx';
import StaffDashboard from './pages/Staff/StaffDashboard.jsx';
import StaffStatistics from './pages/Staff/StaffStatistics.jsx';
import StaffSettings from './pages/Staff/StaffSettings.jsx';
import SystemReport from './pages/Admin/SystemReport.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import AvatarManagement from './pages/Admin/AvatarManagement.jsx';
import FloatingButton from './Components/FloatingButton.jsx';
import ProfileSetupModal from './Components/ProfileSetupModal.jsx';

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)

      // Hide initial loading screen after 2s
      setTimeout(() => setIsLoading(false), 2000)
    })

    // 2. Listen for Auth Changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession((currentSession) => {
        const sameUser =
          currentSession?.user?.id &&
          nextSession?.user?.id &&
          currentSession.user.id === nextSession.user.id

        if (sameUser && event !== 'USER_UPDATED') {
          return currentSession
        }

        return nextSession
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  // Resolve role dynamically from database profiles
  useEffect(() => {
    if (!session?.user?.email) {
      queueMicrotask(() => {
        setRole(null)
        setRoleLoading(false)
      })
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      try {
        const profileResult = await getProfileForUser(session.user)
        const resolvedRole = profileResult?.role || 'student'

        if (isMounted) {
          setRole(resolvedRole)
        }

        const metadata = session.user.user_metadata || {}

        if (
          resolvedRole === 'student' &&
          metadata.course_degree_program &&
          metadata.academic_year_level
        ) {
          try {
            await saveStudentProfile(session.user, {
              program_course: metadata.course_degree_program,
              year_level: metadata.academic_year_level,
            })
          } catch (error) {
            console.error('Error saving student profile:', error)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        if (isMounted) {
          setRole('student')
        }
      } finally {
        if (isMounted) {
          setRoleLoading(false)
        }
      }
    }

    queueMicrotask(() => {
      if (isMounted) {
        setRoleLoading(true)
      }
    })

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id, session?.user?.email])

  // Profile setup modal status check
  const isUbStudent =
    session?.user?.email?.toLowerCase().endsWith('@ub.edu.ph') &&
    role === 'student'

  const needsProfileSetup =
    isUbStudent && !session.user.user_metadata?.profile_completed

  const handleProfileComplete = (updatedUser) => {
    setSession((currentSession) =>
      currentSession ? { ...currentSession, user: updatedUser } : currentSession
    )
  }

  // App loading screen state
  if (isLoading || (session && roleLoading && !role)) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={needsProfileSetup}
        onComplete={handleProfileComplete}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />

        {/* Authentication Routes */}
        <Route
          path="/login"
          element={<Navigate to="/login/student" replace />}
        />
        <Route
          path="/login/student"
          element={
            session && role === 'admin' ? (
              <Navigate to="/admin/reports" />
            ) : session && role === 'staff' ? (
              <Navigate to="/staff/dashboard" />
            ) : session && (role === 'user' || role === 'student') ? (
              <Navigate to="/user/dashboard" />
            ) : (
              <UserLogin />
            )
          }
        />
        <Route
          path="/login/staff"
          element={
            session && role === 'admin' ? (
              <Navigate to="/admin/reports" />
            ) : session && role === 'staff' ? (
              <Navigate to="/staff/dashboard" />
            ) : session && (role === 'user' || role === 'student') ? (
              <Navigate to="/user/dashboard" />
            ) : (
              <StaffLogin />
            )
          }
        />

        {/* Protected Student Routes */}
        <Route
          path="/user/dashboard"
          element={
            session && (role === 'user' || role === 'student') ? (
              <div className="relative min-h-screen w-full">
                <UserDashboard />
                <FloatingButton />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/interviews"
          element={
            session && (role === 'user' || role === 'student') ? (
              <InterviewHistory />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/interview-results/:sessionId"
          element={
            session && (role === 'user' || role === 'student') ? (
              <InterviewResults />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/interview-results"
          element={
            session && (role === 'user' || role === 'student') ? (
              <InterviewResults />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/settings"
          element={
            session && (role === 'user' || role === 'student') ? (
              <UserSettings />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/resume-upload"
          element={
            session && (role === 'user' || role === 'student') ? (
              <ResumeUpload />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/hardware-check"
          element={
            session && (role === 'user' || role === 'student') ? (
              <HardwareCheck />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user/live-session"
          element={
            session && (role === 'user' || role === 'student') ? (
              <LiveSession />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            session && role === 'staff' ? (
              <StaffDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/staff/statistics"
          element={
            session && role === 'staff' ? (
              <StaffStatistics />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/staff/settings"
          element={
            session && role === 'staff' ? (
              <StaffSettings />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/reports"
          element={
            session && role === 'admin' ? (
              <SystemReport />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            session && role === 'admin' ? (
              <UserManagement />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/avatars"
          element={
            session && role === 'admin' ? (
              <AvatarManagement />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Fallback Error Page */}
        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App