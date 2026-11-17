import { useState, useEffect, useRef } from 'react'
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

import WaitingRoom from "./Pages/User/WaitingRoom";
import EnrollmentGate from './Components/EnrollmentGate.jsx'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

  // Unified Loading Screen State
  const [loadProgress, setLoadProgress] = useState(0)
  const [showLoader, setShowLoader] = useState(true)
  const [isLoaderExiting, setIsLoaderExiting] = useState(false)
  const hasCompletedInitialBoot = useRef(false)

  // =========================================================
  // SUPABASE SESSION
  // =========================================================

  useEffect(() => {
    let isMounted = true

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
          // If a session exists, mark roleLoading true immediately so there is no gap
          if (initialSession?.user?.id) {
            setRoleLoading(true)
          }
        }
      } catch (error) {
        console.error(
          'Unexpected session error:',
          error
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession((currentSession) => {
          const sameUser =
            currentSession?.user?.id &&
            nextSession?.user?.id &&
            currentSession.user.id === nextSession.user.id

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
        const profileResult = await getProfileForUser(session.user)
        const resolvedRole = profileResult?.role || null

        if (isMounted) {
          setRole(resolvedRole)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        if (isMounted) {
          setRole(null)
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

  // =========================================================
  // UNIFIED PROGRESS TRACKER (SESSION + ROLE + ROUTE READY)
  // =========================================================

  const isAppStillLoading = isLoading || (Boolean(session) && roleLoading && !role)

  useEffect(() => {
    if (hasCompletedInitialBoot.current) return

    // Determine target ceiling based on current stage:
    // Stage 1: Checking session -> up to 55%
    // Stage 2: Fetching user role -> up to 90%
    // Stage 3: Everything ready -> 100%
    const targetProgress = isLoading
      ? 55
      : session && roleLoading && !role
      ? 90
      : 100

    const interval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(interval)
          return prev
        }
        const remaining = targetProgress - prev
        const step = targetProgress === 100
          ? Math.max(4, Math.ceil(remaining * 0.35))
          : Math.max(1, Math.ceil(remaining * 0.15))
        return Math.min(prev + step, targetProgress)
      })
    }, 60)

    return () => clearInterval(interval)
  }, [isLoading, session, roleLoading, role])

  // Trigger smooth slide-up exit only after reaching 100% and app is ready
  useEffect(() => {
    if (!isAppStillLoading && loadProgress === 100 && !hasCompletedInitialBoot.current) {
      hasCompletedInitialBoot.current = true

      const exitStartTimer = setTimeout(() => {
        setIsLoaderExiting(true)

        const unmountTimer = setTimeout(() => {
          setShowLoader(false)
        }, 500) // Matches animate-slide-up duration

        return () => clearTimeout(unmountTimer)
      }, 250)

      return () => clearTimeout(exitStartTimer)
    }
  }, [isAppStillLoading, loadProgress])

  // =========================================================
  // ROUTES
  // =========================================================

  return (
    <>
      {showLoader && (
        <Loading progress={loadProgress} isExiting={isLoaderExiting} />
      )}

      {!isAppStillLoading && (
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />

            {/* AUTHENTICATION ROUTES */}
            <Route path="/login" element={<Navigate to="/login/users" replace />} />
            <Route path="/login/staff" element={<Navigate to="/login/users" replace />} />

            {/* User Login */}
            <Route
              path="/login/users"
              element={
                session && role === 'admin' ? (
                  <Navigate to="/admin/reports" replace />
                ) : session && role === 'career_advisor' ? (
                  <Navigate to="/staff/dashboard" replace />
                ) : session && (role === 'user' || role === 'student') ? (
                  <Navigate to="/user/dashboard" replace />
                ) : (
                  <UserLogin />
                )
              }
            />

            {/* PROTECTED STUDENT ROUTES */}
            <Route
              element={
                session && (role === 'user' || role === 'student') ? (
                  <EnrollmentGate />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/interviews" element={<InterviewHistory />} />
              <Route path="/user/interview-results/:sessionId" element={<InterviewResults />} />
              <Route path="/user/interview-results" element={<InterviewResults />} />
              <Route path="/user/waiting-room" element={<WaitingRoom />} />
              <Route path="/user/settings" element={<UserSettings />} />
              <Route path="/user/resume-upload" element={<ResumeUpload />} />
              <Route path="/user/hardware-check" element={<HardwareCheck />} />
              <Route path="/user/live-session" element={<LiveSession />} />
            </Route>

            {/* PROTECTED CAREER ADVISOR ROUTES */}
            <Route
              path="/staff/dashboard"
              element={
                session && role === 'career_advisor' ? (
                  <StaffDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/staff/dashboard/course/:courseId"
              element={
                session && role === "career_advisor" ? (
                  <StaffDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/staff/statistics"
              element={
                session && role === 'career_advisor' ? (
                  <StaffStatistics />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/staff/settings"
              element={
                session && role === 'career_advisor' ? (
                  <StaffSettings />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* PROTECTED ADMIN ROUTES */}
            <Route
              path="/admin/reports"
              element={
                session && role === 'admin' ? (
                  <SystemReport />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/admin/users"
              element={
                session && role === 'admin' ? (
                  <UserManagement />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/admin/avatars"
              element={
                session && role === 'admin' ? (
                  <AvatarManagement />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* FALLBACK */}
            <Route path="*" element={<Error404 />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  )
}

export default App