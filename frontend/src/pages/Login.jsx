import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Login() {
  const [step, setStep]         = useState(1)  // 1 = email+password, 2 = reg number
  const [form, setForm]         = useState({ email: '', password: '' })
  const [regNumber, setRegNumber] = useState('')
  const [userId, setUserId]     = useState(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const successMsg              = location.state?.message

  // ── Step 1 — email + password ──────────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await API.post('/api/auth/login', form)
      if (res.data.step === 'done') {
        // admin — login complete
        login(res.data.user, res.data.access_token, res.data.role, res.data.agreed_to_rules)
        navigate('/admin')
      } else if (res.data.step === 'verify_reg') {
        // member — move to step 2
        setUserId(res.data.user_id)
        setStep(2)
      }
    } catch (err) {
      const errData = err.response?.data
      if (errData?.status === 'pending') {
        setError('⏳ Your account is pending admin approval. Please wait.')
      } else if (errData?.status === 'terminated') {
        setError('🚫 ' + (errData?.error || 'Account terminated. Contact gym owner.'))
      } else {
        setError(errData?.error || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2 — registration number ──────────────────────────────────
  const handleStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await API.post('/api/auth/verify-reg', {
        user_id:    userId,
        reg_number: regNumber.trim().toUpperCase(),
      })
      login(res.data.user, res.data.access_token, res.data.role, res.data.agreed_to_rules)
      if (res.data.agreed_to_rules) {
        navigate('/dashboard')
      } else {
        navigate('/gym-rules')
      }
    } catch (err) {
      const errData = err.response?.data
      if (errData?.status === 'terminated') {
        setError('🚫 ' + errData.error)
      } else {
        setError(errData?.error || 'Invalid registration number')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏋️</div>
          <h1 className="text-2xl font-black uppercase text-yellow-400">
            Wellness Warrior
          </h1>
          <p className="text-gray-500 text-sm mt-1">Unisex Gym — Member Portal</p>
        </div>

        <div className="bg-gray-900 p-8 rounded-xl border border-gray-700">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= 1 ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'
            }`}>1</div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-700'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= 2 ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'
            }`}>2</div>
          </div>

          {/* Step labels */}
          <div className="flex justify-between text-xs text-gray-500 mb-6 -mt-4">
            <span className={step === 1 ? 'text-yellow-400' : ''}>Email & Password</span>
            <span className={step === 2 ? 'text-yellow-400' : ''}>Registration Number</span>
          </div>

          {/* Success message from register */}
          {successMsg && step === 1 && (
            <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded mb-4 text-sm">
              {successMsg}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 1 FORM ── */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-gray-400 text-sm mb-5">Login to Wellness Warrior Gym</p>
              <form onSubmit={handleStep1} className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest mb-1 block">Email</label>
                  <input type="email" required
                    className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest mb-1 block">Password</label>
                  <input type="password" required
                    className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-500 transition disabled:opacity-50 mt-2">
                  {loading ? 'Verifying...' : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2 FORM ── */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Enter Registration Number</h2>
              <p className="text-gray-400 text-sm mb-2">
                Enter the registration number given to you by the gym owner.
              </p>
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mb-5">
                <p className="text-yellow-400 text-xs">
                  💡 Format: <span className="font-mono font-bold">WW-2026-001</span> — ask the gym owner if you don't have it.
                </p>
              </div>
              <form onSubmit={handleStep2} className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest mb-1 block">Registration Number</label>
                  <input type="text" required
                    className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400 font-mono text-lg tracking-widest text-center uppercase"
                    placeholder="WW-2026-001"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value.toUpperCase())}
                    maxLength={12}
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-500 transition disabled:opacity-50">
                  {loading ? 'Verifying...' : '✅ Login'}
                </button>
                <button type="button" onClick={() => { setStep(1); setError(''); setRegNumber('') }}
                  className="text-gray-400 text-sm hover:text-white transition text-center">
                  ← Back to email & password
                </button>
              </form>
            </>
          )}

          <p className="text-gray-400 text-center mt-5 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-yellow-400 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}