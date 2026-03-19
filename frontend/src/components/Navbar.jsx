import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { token, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex flex-col leading-none">
          <span className="text-yellow-400 font-black text-lg uppercase">Wellness</span>
          <span className="text-white font-black text-lg uppercase -mt-1">Warrior</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link to="/"
            className="text-gray-300 hover:text-yellow-400 transition text-sm font-medium px-2 py-1">
            Home
          </Link>
          <Link to="/contact"
            className="text-gray-300 hover:text-yellow-400 transition text-sm font-medium px-2 py-1">
            Contact
          </Link>

          {token && (
            <Link to={role === 'admin' ? '/admin' : '/dashboard'}
              className="text-gray-300 hover:text-yellow-400 transition text-sm font-medium px-2 py-1">
              Dashboard
            </Link>
          )}

          {!token ? (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="text-gray-300 hover:text-yellow-400 transition text-sm font-medium px-2 py-1">
                Login
              </Link>
              <Link to="/register"
                className="bg-yellow-400 text-black font-bold px-3 py-1.5 rounded text-sm hover:bg-yellow-500 transition">
                Register
              </Link>
            </div>
          ) : (
            <button onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded text-sm transition">
              Logout
            </button>
          )}
        </div>

      </div>
    </nav>
  )
}