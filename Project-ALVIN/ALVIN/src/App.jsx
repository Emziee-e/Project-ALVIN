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
import InterviewResults from './pages/User/InterviewResults.jsx';
import UserSettings from './pages/User/UserSettings.jsx';
import ResumeUpload from './pages/User/ResumeUpload.jsx';
import HardwareCheck from './pages/User/HardwareCheck.jsx';
import LiveSession from './pages/User/LiveSession.jsx';
import StaffDashboard from './pages/Staff/StaffDashboard.jsx';
import SystemReport from './pages/Admin/SystemReport.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import AvatarManagement from './pages/Admin/AvatarManagement.jsx';

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState(null) // NEW: Track the user session

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

  // If loading, show your animation
  if (isLoading) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes: If logged in, redirect away from login back to dashboard */}
        <Route path="/login/student" element={session ? <Navigate to="/user/dashboard" /> : <UserLogin />} />
        <Route path="/login/staff" element={<StaffLogin />} />

        {/* Protected User Routes: If NOT logged in, redirect to student login */}
        <Route path="/user/dashboard" element={session ? <UserDashboard /> : <Navigate to="/login/student" />} />
        <Route path="/user/interviews" element={session ? <InterviewResults /> : <Navigate to="/login/student" />} />
        <Route path="/user/settings" element={session ? <UserSettings /> : <Navigate to="/login/student" />} />
        <Route path="/user/resume-upload" element={session ? <ResumeUpload /> : <Navigate to="/login/student" />} />
        <Route path="/user/hardware-check" element={session ? <HardwareCheck /> : <Navigate to="/login/student" />} />
        <Route path="/user/live-session" element={session ? <LiveSession /> : <Navigate to="/login/student" />} />

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