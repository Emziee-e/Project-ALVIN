import { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient' // Make sure this path is correct

// Your Page Imports
import LandingPage from "./pages/LandingPage/LandingPage.jsx"
import Loading from "./Components/Loading.jsx"
import Error404 from "./Components/Error404.jsx"
import UserLogin from './pages/LoginPage/User-Login';
import StaffLogin from './pages/LoginPage/Staff-Login.jsx';
import UserDashboard from './pages/User/UserDashboard.jsx';
import InterviewHistory from './pages/User/Interview'
import UserSettings from './pages/User/UserSettings.jsx';
import ResumeUpload from './pages/User/ResumeUpload.jsx';
import HardwareCheck from './pages/User/HardwareCheck.jsx';
import LiveSession from './pages/User/LiveSession.jsx';
import InterviewResults from './pages/User/InterviewResults.jsx';
import StaffDashboard from './pages/Staff/StaffDashboard.jsx';
import SystemReport from './pages/Admin/SystemReport.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import AvatarManagement from './pages/Admin/AvatarManagement.jsx';

function App() {
  const [isAppLoading, setIsAppLoading] = useState(true) // For initial boot/auth check
  const [isLandingLoading, setIsLandingLoading] = useState(true) // For landing page specific delay
  const [session, setSession] = useState(null)

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsAppLoading(false) // App is ready (auth state known)

      // Separate delay for landing page visual/animation
      setTimeout(() => setIsLandingLoading(false), 2000)
    })

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Global app loading block ONLY for the very first auth check
  // This prevents the "kick back to login" issue by waiting until session is known
  if (isAppLoading) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page: Shows loading screen if isLandingLoading is true */}
        <Route path="/" element={isLandingLoading ? <Loading /> : <LandingPage />} />

        {/* Auth Routes: Only redirects when session is confirmed valid */}
        <Route path="/login/student" element={session ? <Navigate to="/user/dashboard" /> : <UserLogin />} />
        <Route path="/login/staff" element={<StaffLogin />} />

        {/* Protected User Routes: If NOT logged in, redirect to student login */}
        <Route path="/user/dashboard" element={session ? <UserDashboard /> : <Navigate to="/login/student" />} />
        <Route path="/user/interviews" element={session ? <InterviewHistory /> : <Navigate to="/login/student" />} />
        <Route path="/user/settings" element={session ? <UserSettings /> : <Navigate to="/login/student" />} />
        <Route path="/user/resume-upload" element={session ? <ResumeUpload /> : <Navigate to="/login/student" />} />
        <Route path="/user/hardware-check" element={session ? <HardwareCheck /> : <Navigate to="/login/student" />} />
        <Route path="/user/live-session" element={session ? <LiveSession /> : <Navigate to="/login/student" />} />
        <Route path="/user/interview-results" element={session ? <InterviewResults /> : <Navigate to="/login/student" />} />

        {/* Other Routes */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/admin/reports" element={<SystemReport />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/avatars" element={<AvatarManagement />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App