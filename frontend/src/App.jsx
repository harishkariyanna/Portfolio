import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import FloatingTech from './components/FloatingTech'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatbotWidget from './components/ChatbotWidget'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/admin/DashboardPage'
import AdminProjectsPage from './pages/admin/AdminProjectsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import ResumePage from './pages/admin/ResumePage'
import ContactsPage from './pages/admin/ContactsPage'
import ProfilePage from './pages/admin/ProfilePage'
import ContentPage from './pages/admin/ContentPage'
import './App.css'

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <FloatingTech />
            <div className="App">
              <Routes>
                {/* Public Routes with Sidebar */}
                <Route path="/" element={<><Navbar /><main className="main-content"><HomePage /></main><Footer /></>} />
                <Route path="/projects" element={<><Navbar /><main className="main-content"><ProjectsPage /></main><Footer /></>} />
                <Route path="/contact" element={<><Navbar /><main className="main-content"><ContactPage /></main><Footer /></>} />

                {/* Auth Pages (No Sidebar) */}
                <Route path="/admin/login" element={<main><LoginPage /></main>} />
                <Route path="/forgot-password" element={<main><ForgotPasswordPage /></main>} />

                {/* Admin Routes (AdminLayout has own sidebar) */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="projects" element={<AdminProjectsPage />} />
                  <Route path="content" element={<ContentPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="resume" element={<ResumePage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Routes>
              <ChatbotWidget />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App
