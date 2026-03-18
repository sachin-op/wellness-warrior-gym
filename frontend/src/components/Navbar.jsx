import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { token, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="text-xl font-bold text-yellow-400 uppercase tracking-wide">
          Wellness<span className="text-white"> Warrior</span>
        </Link>

      <div className="flex gap-6 items-center">
        <Link to="/" className="hover:text-yellow-400 transition">Home</Link>
        <Link to="/contact" className="hover:text-yellow-400 transition">Contact</Link>

        {!token && <>
          <Link to="/login" className="hover:text-yellow-400 transition">Login</Link>
          <Link to="/register" className="bg-yellow-400 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 transition">
            Join Now
          </Link>
        </>}

        {token && role === 'admin' && (
          <Link to="/admin" className="hover:text-yellow-400 transition">Dashboard</Link>
        )}

        {token && role === 'member' && (
          <Link to="/dashboard" className="hover:text-yellow-400 transition">My Dashboard</Link>
        )}

        {token && (
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}