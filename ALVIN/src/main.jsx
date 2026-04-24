import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UserDashboard from './UserDashboard.jsx'
import ResumeUpload from './ResumeUpload.jsx'
import HardwareCheck from './HardwareCheck.jsx'
import LiveSession from './LiveSession.jsx'
import InterviewResults from './InterviewResults.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InterviewResults />
  </StrictMode>,
)
