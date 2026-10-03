import { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom'

import { supabase } from './lib/supabaseClient'
import { getProfileForUser } from './lib/profileService'

// Page & Component Imports
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import About from './pages/LandingPage/About.jsx'
import Loading from './Components/Loading.jsx'
import Error404 from './Components/Error404.jsx'

import UserLogin from './pages/LoginPage/login'
import StaffLogin from './pages/LoginPage/Staff-Login.jsx'

import UserDashboard from './pages/User/UserDashboard.jsx'
import InterviewHistory from './pages/User/Interview.jsx'
import InterviewResults from './pages/User/InterviewResults.jsx'
import UserSettings from './pages/User/UserSettings.jsx'
import ResumeUpload from './pages/User/ResumeUpload.jsx'
import HardwareCheck from './pages/User/HardwareCheck.jsx'
import LiveSession from './pages/User/LiveSession.jsx'

import StaffDashboard from './pages/Staff/StaffDashboard.jsx'
import StaffStatistics from './pages/Staff/StaffStatistics.jsx'
import StaffSettings from './pages/Staff/StaffSettings.jsx'

import SystemReport from './pages/Admin/SystemReport.jsx'
import UserManagement from './pages/Admin/UserManagement.jsx'
import AvatarManagement from './pages/Admin/AvatarManagement.jsx'

import FloatingButton from './Components/FloatingButton.jsx'
import ProfileSetupModal from './Components/ProfileSetupModal.jsx'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  const [session, setSession] = useState(null)

  const [role, setRole] = useState(null)

  const [roleLoading, setRoleLoading] = useState(false)

  // =========================================================
  // SUPABASE SESSION
  // =========================================================

  useEffect(() => {
    let isMounted = true

    // Initial session check
    const loadInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error(
            'Error getting initial session:',
            error
          )
        }

        if (isMounted) {
          setSession(initialSession)
        }
      } catch (error) {
        console.error(
          'Unexpected session error:',
          error
        )
      } finally {
        // Preserve your existing 2-second loading screen.
        setTimeout(() => {
          if (isMounted) {
            setIsLoading(false)
          }
        }, 2000)
      }
    }

    loadInitialSession()

    // Listen for authentication changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession((currentSession) => {
          /*
           * Supabase can emit TOKEN_REFRESHED or similar
           * events when returning to a browser tab.
           *
           * If this is still the exact same authenticated
           * user, keep the current session object.
           *
           * This prevents unnecessary role reloads and
           * avoids unmounting an active ALVIN LiveSession.
           */
          const sameUser =
            currentSession?.user?.id &&
            nextSession?.user?.id &&
            currentSession.user.id ===
              nextSession.user.id

          if (
            sameUser &&
            event !== 'USER_UPDATED'
          ) {
            return currentSession
          }

          return nextSession
        })
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // =========================================================
  // RESOLVE USER ROLE
  // =========================================================

  useEffect(() => {
    // No authenticated user.
    if (!session?.user?.id) {
      queueMicrotask(() => {
        setRole(null)
        setRoleLoading(false)
      })

      return
    }

    let isMounted = true

    const loadProfile = async () => {
      try {
        const profileResult =
          await getProfileForUser(session.user)

        /*
         * profileService returns:
         *
         * admin_profile
         *      -> admin
         *
         * career_advisor_profile
         *      -> career_advisor
         *
         * student_profile
         *      -> student
         *
         * If there is no matching special profile,
         * default to student.
         */
        const resolvedRole =
          profileResult?.role || 'student'

        if (isMounted) {
          setRole(resolvedRole)
        }
      } catch (error) {
        console.error(
          'Error loading profile:',
          error
        )

        if (isMounted) {
          setRole('student')
        }
      } finally {
        if (isMounted) {
          setRoleLoading(false)
        }
      }
    }

    /*
     * Only show role loading when resolving
     * the current user's role.
     */
    queueMicrotask(() => {
      if (isMounted) {
        setRoleLoading(true)
      }
    })

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [
    session?.user?.id,
    session?.user?.email,
  ])

  // =========================================================
  // STUDENT PROFILE SETUP MODAL
  // =========================================================

  const isUbStudent =
    session?.user?.email
      ?.toLowerCase()
      .endsWith('@ub.edu.ph') &&
    role === 'student'

  const needsProfileSetup =
    isUbStudent &&
    !session?.user?.user_metadata
      ?.profile_completed

  const handleProfileComplete = (
    updatedUser
  ) => {
    setSession((currentSession) =>
      currentSession
        ? {
            ...currentSession,
            user: updatedUser,
          }
        : currentSession
    )
  }

  // =========================================================
  // INITIAL LOADING
  // =========================================================

  /*
   * roleLoading only blocks rendering when we do not
   * already know the user's role.
   *
   * This is important for ALVIN:
   * a background Supabase auth refresh should NOT
   * replace LiveSession with <Loading />.
   */
  if (
    isLoading ||
    (session && roleLoading && !role)
  ) {
    return <Loading />
  }

  // =========================================================
  // ROUTES
  // =========================================================

  return (
    <BrowserRouter>
      {/* Student Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={needsProfileSetup}
        onComplete={handleProfileComplete}
      />

      <Routes>
        {/* ============================================= */}
        {/* PUBLIC ROUTES */}
        {/* ============================================= */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        {/* ============================================= */}
        {/* AUTHENTICATION ROUTES */}
        {/* ============================================= */}

        <Route
          path="/login"
          element={
            <Navigate
              to="/login/student"
              replace
            />
          }
        />

        {/* Student Login */}
        <Route
          path="/login/student"
          element={
            session && role === 'admin' ? (
              <Navigate
                to="/admin/reports"
                replace
              />
            ) : session &&
              role === 'career_advisor' ? (
              <Navigate
                to="/staff/dashboard"
                replace
              />
            ) : session &&
              (role === 'user' ||
                role === 'student') ? (
              <Navigate
                to="/user/dashboard"
                replace
              />
            ) : (
              <UserLogin />
            )
          }
        />

        {/* Career Advisor Login */}
        <Route
          path="/login/staff"
          element={
            session && role === 'admin' ? (
              <Navigate
                to="/admin/reports"
                replace
              />
            ) : session &&
              role === 'career_advisor' ? (
              <Navigate
                to="/staff/dashboard"
                replace
              />
            ) : session &&
              (role === 'user' ||
                role === 'student') ? (
              <Navigate
                to="/user/dashboard"
                replace
              />
            ) : (
              <StaffLogin />
            )
          }
        />

        {/* ============================================= */}
        {/* PROTECTED STUDENT ROUTES */}
        {/* ============================================= */}

        <Route
          path="/user/dashboard"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <div className="relative min-h-screen w-full">
                <UserDashboard />
                <FloatingButton />
              </div>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/interviews"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <InterviewHistory />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/interview-results/:sessionId"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <InterviewResults />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/interview-results"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <InterviewResults />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/settings"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <UserSettings />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/resume-upload"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <ResumeUpload />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/hardware-check"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <HardwareCheck />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/user/live-session"
          element={
            session &&
            (role === 'user' ||
              role === 'student') ? (
              <LiveSession />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* ============================================= */}
        {/* PROTECTED CAREER ADVISOR ROUTES */}
        {/* ============================================= */}

        {/*
         * We keep /staff/... URLs so your existing
         * StaffDashboard, StaffStatistics and
         * StaffSettings navigation continues working.
         *
         * The authorization role, however, is now
         * career_advisor.
         */}

        <Route
          path="/staff/dashboard"
          element={
            session &&
            role === 'career_advisor' ? (
              <StaffDashboard />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/staff/dashboard/course/:courseId"
          element={
            session &&
            role === "career_advisor" ? (
              <StaffDashboard />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/staff/statistics"
          element={
            session &&
            role === 'career_advisor' ? (
              <StaffStatistics />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/staff/settings"
          element={
            session &&
            role === 'career_advisor' ? (
              <StaffSettings />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* ============================================= */}
        {/* PROTECTED ADMIN ROUTES */}
        {/* ============================================= */}

        <Route
          path="/admin/reports"
          element={
            session &&
            role === 'admin' ? (
              <SystemReport />
            ) : (
              <Navigate
                to="/"
                replace
              />
            )
          }
        />

        <Route
          path="/admin/users"
          element={
            session &&
            role === 'admin' ? (
              <UserManagement />
            ) : (
              <Navigate
                to="/"
                replace
              />
            )
          }
        />

        <Route
          path="/admin/avatars"
          element={
            session &&
            role === 'admin' ? (
              <AvatarManagement />
            ) : (
              <Navigate
                to="/"
                replace
              />
            )
          }
        />

        {/* ============================================= */}
        {/* FALLBACK */}
        {/* ============================================= */}

        <Route
          path="*"
          element={<Error404 />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App