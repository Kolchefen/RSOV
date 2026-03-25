import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Rides from './pages/Rides'
import Students from './pages/Students'
import Analytics from './pages/Analytics'
import Rewards from './pages/Rewards'
import Settings from './pages/Settings'

function App() {
  return (
    // AuthProvider wraps the app to provide Firebase auth state to all components
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route - login is the landing page */}
          <Route path="/" element={<Login />} />

          {/* Protected routes — require authentication, redirect to / if not logged in */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rides" element={<Rides />} />
            <Route path="/students" element={<Students />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
