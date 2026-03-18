import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api/axios'

export default function Register() {
  const [form, setForm]       = useState({ username: '', email: '', phone: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await API.post('/api/auth/register', form)
      navigate('/login', {
        state: { message: '✅ Registration submitted! Please wait for admin approval. You will receive your registration number after approval.' }
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏋️</div>
          <h2 className="text-3xl font-bold text-yellow-400">Join Wellness Warrior</h2>
          <p className="text-gray-400 mt-1">Create your member account</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Info box */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 px-4 py-3 rounded mb-5 text-sm">
          ℹ️ After registration, your request will be reviewed by the gym admin. You will receive a registration number (WW-XXXX-XXX) once approved.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
            <input type="text" required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
              placeholder="Your full name"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <input type="email" required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Phone Number</label>
            <input type="tel" required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input type="password" required
              className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
              placeholder="Create a strong password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>
          <button type="submit" disabled={loading}
            className="bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-500 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Submitting...' : 'Submit Registration Request'}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}