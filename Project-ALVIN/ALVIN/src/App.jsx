import { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

// Your Page Imports
import LandingPage from "./pages/LandingPage/LandingPage.jsx"
import Loading from "./Components/Loading.jsx"
import Error404 from "./Components/Error404.jsx"
import UserLogin from './pages/LoginPage/User-Login';
import StaffLogin from './pages/LoginPage/Staff-Login.jsx';
import UserDashboard from './pages/User/UserDashboard.jsx';
import InterviewHistory from './pages/User/Interview.jsx';
import InterviewResults from './pages/User/InterviewResults.jsx';
import UserSettings from './pages/User/UserSettings.jsx';
import ResumeUpload from './pages/User/ResumeUpload.jsx';
import HardwareCheck from './pages/User/HardwareCheck.jsx';
import LiveSession from './pages/User/LiveSession.jsx';
import StaffDashboard from './pages/Staff/StaffDashboard.jsx';
import StaffSettings from './pages/Staff/StaffSettings.jsx';
import SystemReport from './pages/Admin/SystemReport.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import AvatarManagement from './pages/Admin/AvatarManagement.jsx';

// Email-based role assignment
const ADMIN_EMAILS = ["2204421@ub.edu.ph"];
const STAFF_EMAILS = ["2301565@ub.edu.ph"];

// Helper function to determine role based on email
const getRoleByEmail = (email) => {
  if (ADMIN_EMAILS.includes(email)) return 'admin';
  if (STAFF_EMAILS.includes(email)) return 'staff';
  return 'student';
};

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null) // NEW: Track the user session
  const [role, setRole] = useState(null) // NEW: Track the user role
  const [roleLoading, setRoleLoading] = useState(false) // NEW: Track role fetching state

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // Hide loading screen after 2s (keeping your existing logic)
      setTimeout(() => setIsLoading(false), 2000)
    })

    // 2. Listen for Auth Changes (Sign-in/Sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Determine user role based on email
  useEffect(() => {
    if (!session?.user?.email) {
      setRole(null)
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)
    try {
      const emailBasedRole = getRoleByEmail(session.user.email)
      setRole(emailBasedRole)
    } catch (error) {
      console.error('Error determining role:', error)
      setRole(null)
    } finally {
      setRoleLoading(false)
    }
  }, [session])

  // If loading, show your animation
  if (isLoading) {
    return <Loading />
  }

  // If session exists but role is still loading, show loading screen
  if (session && roleLoading) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes: If logged in with a role, redirect to appropriate dashboard */}
        <Route path="/login/student" element={session && role === 'admin' ? <Navigate to="/admin/reports" /> : session && role === 'staff' ? <Navigate to="/staff/dashboard" /> : session && (role === 'user' || role === 'student') ? <Navigate to="/user/dashboard" /> : <UserLogin />} />
        <Route path="/login/staff" element={session && role === 'admin' ? <Navigate to="/admin/reports" /> : session && role === 'staff' ? <Navigate to="/staff/dashboard" /> : session && (role === 'user' || role === 'student') ? <Navigate to="/user/dashboard" /> : <StaffLogin />} />

        {/* Protected User Routes: Check for session and user role */}
        <Route path="/user/dashboard" element={session && (role === 'user' || role === 'student') ? <UserDashboard /> : <Navigate to="/login/student" />} />
        <Route path="/user/interviews" element={session && (role === 'user' || role === 'student') ? <InterviewHistory /> : <Navigate to="/login/student" />} />
        <Route path="/user/interview-results" element={session && (role === 'user' || role === 'student') ? <InterviewResults /> : <Navigate to="/login/student" />} />
        <Route path="/user/settings" element={session && (role === 'user' || role === 'student') ? <UserSettings /> : <Navigate to="/login/student" />} />
        <Route path="/user/resume-upload" element={session && (role === 'user' || role === 'student') ? <ResumeUpload /> : <Navigate to="/login/student" />} />
        <Route path="/user/hardware-check" element={session && (role === 'user' || role === 'student') ? <HardwareCheck /> : <Navigate to="/login/student" />} />
        <Route path="/user/live-session" element={session && (role === 'user' || role === 'student') ? <LiveSession /> : <Navigate to="/login/student" />} />

        {/* Protected Staff Routes: Check for session and staff role */}
        <Route path="/staff/dashboard" element={session && role === 'staff' ? <StaffDashboard /> : <Navigate to="/login/staff" />} />
        <Route path="/staff/settings" element={session && role === 'staff' ? <StaffSettings /> : <Navigate to="/login/staff" />} />

        {/* Protected Admin Routes: Check for session and admin role */}
        <Route path="/admin/reports" element={session && role === 'admin' ? <SystemReport /> : <Navigate to="/" />} />
        <Route path="/admin/users" element={session && role === 'admin' ? <UserManagement /> : <Navigate to="/" />} />
        <Route path="/admin/avatars" element={session && role === 'admin' ? <AvatarManagement /> : <Navigate to="/" />} />

        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App