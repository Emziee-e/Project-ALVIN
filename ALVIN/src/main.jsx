import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UserDashboard from './UserDashboard.jsx'
import ResumeUpload from './ResumeUpload.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ResumeUpload />
  </StrictMode>,
)
