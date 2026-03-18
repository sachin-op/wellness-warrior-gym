import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Contact from './pages/Contact'
import AdminDashboard from './pages/AdminDashboard'
import MemberDashboard from './pages/MemberDashboard'
import GymRules from './pages/GymRules'

function ProtectedRoute({ children, allowedRole }) {
  const { token, role } = useAuth()
  if (!token) return <Navigate to="/login" />
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />
  return children
}

function MemberRoute({ children }) {
  const { token, role, user } = useAuth()
  if (!token) return <Navigate to="/login" />
  if (role !== 'member') return <Navigate to="/" />
  // if member hasn't agreed to rules yet → show rules page
  const agreed = localStorage.getItem('agreed_to_rules')
  if (!agreed || agreed === 'false') return <Navigate to="/gym-rules" />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/contact"    element={<Contact />} />
        <Route path="/gym-rules"  element={
          <ProtectedRoute allowedRole="member">
            <GymRules />
          </ProtectedRoute>
        }/>
        <Route path="/admin"      element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/dashboard"  element={
          <MemberRoute>
            <MemberDashboard />
          </MemberRoute>
        }/>
      </Routes>
    </>
  )
}