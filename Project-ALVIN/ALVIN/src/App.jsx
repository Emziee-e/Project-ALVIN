import { useState, useEffect } from 'react'
import LandingPage from "./pages/LandingPage/LandingPage.jsx"
import Loading from "./Components/Loading.jsx"
import Error404 from "./Components/Error404.jsx"
import { BrowserRouter, Route , Routes } from 'react-router-dom'
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
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      // Wait for the slide-up animation to finish before removing from DOM
      setTimeout(() => {
        setIsLoading(false)
      }, 800) // Match the 0.8s duration in CSS
    }, 2000) // 2000ms ensures at least one full 2s spin completes

    return () => clearTimeout(timer)
  }, [])

  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={isLoading ? <Loading /> : <LandingPage />} />
        <Route path="/login/student" element={<UserLogin />} />
        <Route path="/login/staff" element={<StaffLogin />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/interviews" element={<InterviewResults />} />
        <Route path="/user/settings" element={<UserSettings />} />
        <Route path="/user/resume-upload" element={<ResumeUpload />} />
        <Route path="/user/hardware-check" element={<HardwareCheck />} />
        <Route path="/user/live-session" element={<LiveSession />} />
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
