import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'


// ── WaterChart Component ──────────────────────────────────────────────
function WaterChart({ week }) {
  const ref = useRef()
  useEffect(() => {
    if (!week || week.length === 0) return
    import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js').then(() => {
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      if (ref.current._chart) ref.current._chart.destroy()
      ref.current._chart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels:   week.map(w => w.day),
          datasets: [
            {
              label:           'Glasses',
              data:            week.map(w => w.glasses_count),
              backgroundColor: week.map(w =>
                w.goal_achieved ? 'rgba(34,211,238,0.8)' : 'rgba(56,189,248,0.5)'
              ),
              borderColor:     week.map(w =>
                w.goal_achieved ? '#22d3ee' : '#38bdf8'
              ),
              borderWidth:     1,
              borderRadius:    4,
            },
            {
              label:       'Goal',
              data:        week.map(w => w.goal_glasses),
              type:        'line',
              borderColor: '#F4A20B',
              borderDash:  [5, 5],
              borderWidth: 2,
              pointRadius: 0,
              fill:        false,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#9CA3AF' } },
          },
          scales: {
            x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
            y: {
              ticks: { color: '#9CA3AF', stepSize: 1 },
              grid:  { color: '#374151' },
              min:   0,
            }
          }
        }
      })
    })
  }, [week])
  return <canvas ref={ref} height={120} />
}
// ── WeightChart Component ─────────────────────────────────────────────
function WeightChart({ logs, goalWeight }) {
  const ref = useRef()
  useEffect(() => {
    if (!logs || logs.length === 0) return
    import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js').then(() => {
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      if (ref.current._chart) ref.current._chart.destroy()
      const weights = logs.map(l => l.weight_kg)
      const isLosing = weights[weights.length - 1] <= weights[0]
      const datasets = [{
        label: 'Weight (kg)',
        data: weights,
        borderColor: isLosing ? '#10B981' : '#EF4444',
        backgroundColor: isLosing ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: isLosing ? '#10B981' : '#EF4444',
        tension: 0.3,
        fill: true,
      }]
      if (goalWeight) {
        datasets.push({
          label: 'Goal Weight',
          data: logs.map(() => goalWeight),
          borderColor: '#3B82F6',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        })
      }
      ref.current._chart = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: logs.map(l => new Date(l.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
          datasets,
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#9CA3AF' } } },
          scales: {
            x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
            y: { ticks: { color: '#9CA3AF', callback: v => v + ' kg' }, grid: { color: '#374151' } }
          }
        }
      })
    })
  }, [logs, goalWeight])
  return <canvas ref={ref} height={120} />
}

// ── PlanProgress Component ────────────────────────────────────────────
function PlanProgress() {
  const [rep, setRep] = useState(null)
  useEffect(() => {
    API.get('/api/attendance/my-report').then(r => setRep(r.data)).catch(() => { })
  }, [])
  if (!rep) return null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Visits', value: rep.total_visits },
          { label: 'Days in Gym', value: `${rep.days_since_join} / ${rep.plan_days}` },
          {
            label: 'Attendance %', value: `${rep.attendance_pct}%`,
            color: rep.attendance_pct >= 70 ? 'text-green-400' : 'text-red-400'
          },
          { label: 'Total Hours', value: `${Math.floor(rep.total_mins / 60)}h ${rep.total_mins % 60}m` },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`text-xl font-black ${s.color || 'text-yellow-400'}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Plan used: {rep.days_since_join} days</span>
          <span>{rep.plan_days} day plan</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-yellow-400 h-2.5 rounded-full"
            style={{ width: `${Math.min((rep.days_since_join / rep.plan_days) * 100, 100)}%` }} />
        </div>
      </div>
      {rep.visited_dates.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Days you visited:</p>
          <div className="flex flex-wrap gap-1.5">
            {rep.visited_dates.slice(0, 20).map(d => (
              <span key={d} className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
                {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            ))}
            {rep.visited_dates.length > 20 && (
              <span className="text-xs text-gray-400 px-2 py-1">+{rep.visited_dates.length - 20} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkMsg, setCheckMsg] = useState('')
  const [enrollMsg, setEnrollMsg] = useState('')
  const [tab, setTab] = useState('home')
  const [searchDate, setSearchDate] = useState('')
  const [dateResult, setDateResult] = useState(null)
  const [weightHistory, setWeightHistory] = useState(null)
  const [weightForm, setWeightForm] = useState({ weight_kg: '', note: '' })
  const [profileForm, setProfileForm] = useState({ height_cm: '', goal_weight_kg: '' })
  const [weightMsg, setWeightMsg] = useState('')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [waterToday, setWaterToday] = useState(null)
  const [waterHistory, setWaterHistory] = useState(null)
  const [waterGoalInput, setWaterGoalInput] = useState('')
  const [showGoalEdit, setShowGoalEdit] = useState(false)

  const fetchAll = async () => {
    try {
      const [dash, today, hist, sum, pl, wh] = await Promise.all([
        API.get('/api/member/dashboard'),
        API.get('/api/attendance/today'),
        API.get('/api/attendance/history'),
        API.get('/api/attendance/summary'),
        API.get('/api/member/plans'),
        API.get('/api/member/weight-history'),
      ])
      setDashboard(dash.data)
      setAttendance(today.data)
      setHistory(hist.data)
      setSummary(sum.data)
      setPlans(pl.data)
      setWeightHistory(wh.data)

      // water fetched separately
      API.get('/api/member/water-today').then(r => setWaterToday(r.data)).catch(() => { })
      API.get('/api/member/water-history').then(r => setWaterHistory(r.data)).catch(() => { })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleEnroll = async (planId) => {
    setEnrollMsg('')
    try {
      const res = await API.post('/api/member/enroll', { plan_id: planId })
      setEnrollMsg('✅ ' + res.data.message)
      fetchAll()
      setTab('home')
    } catch (err) {
      setEnrollMsg('❌ ' + (err.response?.data?.error || 'Enrollment failed'))
    }
  }

  const handleCheckIn = async (shift) => {
    setCheckMsg('')
    try {
      const res = await API.post('/api/attendance/checkin', { shift })
      setCheckMsg('✅ ' + res.data.message)
      fetchAll()
    } catch (err) {
      setCheckMsg('❌ ' + (err.response?.data?.error || 'Check-in failed'))
    }
  }

  const handleCheckOut = async () => {
    setCheckMsg('')
    try {
      const res = await API.post('/api/attendance/checkout')
      setCheckMsg('✅ ' + res.data.message)
      fetchAll()
    } catch (err) {
      setCheckMsg('❌ ' + (err.response?.data?.error || 'Check-out failed'))
    }
  }

  const searchByDate = async () => {
    if (!searchDate) return
    try {
      const res = await API.get(`/api/attendance/date-wise?date=${searchDate}`)
      setDateResult(res.data)
    } catch (err) {
      console.error(err)
    }
  }
  const logWater = async (action, goal = null) => {
    try {
      const body = { action }
      if (goal) body.goal_glasses = goal
      const res = await API.post('/api/member/water-log', body)
      setWaterToday(res.data)
      API.get('/api/member/water-history').then(r => setWaterHistory(r.data))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
    </div>
  )

  const admission = dashboard?.admission

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase">
            Welcome, <span className="text-yellow-400">{dashboard?.username}</span>
          </h1>
          <p className="text-gray-400 mt-1">Wellness Warrior — Your personal gym dashboard</p>
          {dashboard?.reg_number && (
            <div className="mt-2 inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-4 py-2 rounded-lg">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Reg No:</span>
              <span className="text-yellow-400 font-mono font-bold text-lg">{dashboard.reg_number}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { key: 'home', label: '🏠 Home' },
            { key: 'attendance', label: '📋 Attendance', disabled: !admission },
            { key: 'weight', label: '⚖️ Weight', disabled: !admission },
            { key: 'water', label: '💧 Water', disabled: !admission },
            { key: 'plans', label: '💳 Plans', disabled: !!admission },
          ].map(t => (
            <button key={t.key}
              onClick={() => !t.disabled && setTab(t.key)}
              className={`px-5 py-2 rounded font-bold text-sm uppercase tracking-wide transition ${tab === t.key
                  ? 'bg-yellow-400 text-black'
                  : t.disabled
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ HOME TAB ══ */}
        {tab === 'home' && (
          <div className="space-y-6">

            {admission ? (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4">My Membership</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Reg Number', value: dashboard?.reg_number || '—', color: 'text-yellow-400' },
                    { label: 'Plan', value: `${admission.plan_type} — ${admission.duration_label || ''}` },
                    {
                      label: 'Fee Status', value: admission.fee_status,
                      color: admission.fee_status === 'Paid' ? 'text-green-400' : 'text-red-400'
                    },
                    { label: 'Expires', value: new Date(admission.expiry_date).toLocaleDateString('en-IN') },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-800 rounded-lg p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{item.label}</div>
                      <div className={`font-bold text-lg ${item.color || 'text-white'}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {admission.is_offer && admission.offer_label && (
                  <div className="mt-3">
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                      🔥 Enrolled on: {admission.offer_label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-900 border border-yellow-400/40 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">🏋️</div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Membership</h3>
                <p className="text-gray-400 mb-6">Choose a plan to start your fitness journey.</p>
                <button onClick={() => setTab('plans')}
                  className="bg-yellow-400 text-black font-bold px-8 py-3 rounded hover:bg-yellow-500 transition">
                  Browse Plans
                </button>
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Visits This Month', value: summary.total_visits_this_month, icon: '📅' },
                  { label: 'Avg Session', value: `${summary.avg_duration_mins} min`, icon: '⏱️' },
                  { label: "Today's Status", value: attendance?.status || 'Not checked in', icon: '📍' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-xl font-black text-yellow-400">{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {admission && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-2">Today's Attendance</h2>
                <p className="text-gray-400 text-sm">
                  Go to the{' '}
                  <button onClick={() => setTab('attendance')} className="text-yellow-400 underline">
                    Attendance tab
                  </button>{' '}
                  to check in / check out.
                </p>
              </div>
            )}

            {/* Water quick widget */}
            {waterToday && admission && (
              <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Today's Water</h3>
                  <button onClick={() => setTab('water')} className="text-xs text-blue-400 hover:underline">
                    View full tracker →
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-blue-400">
                    {waterToday.glasses_count}
                    <span className="text-lg text-gray-400">/{waterToday.goal_glasses}</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-1">
                      <div className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(waterToday.percentage, 100)}%` }} />
                    </div>
                    <div className="text-xs text-gray-400">{waterToday.ml_consumed}ml of {waterToday.ml_goal}ml</div>
                  </div>
                  {waterToday.goal_achieved && <span className="text-xl">🎉</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => logWater('add')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded text-sm transition">
                    + Glass
                  </button>
                  {waterToday.glasses_count > 0 && (
                    <button onClick={() => logWater('remove')}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold px-4 py-2 rounded text-sm transition">
                      − Undo
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══ ATTENDANCE TAB ══ */}
        {tab === 'attendance' && admission && (
          <div className="space-y-6">

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-1">Daily Check-In / Check-Out</h2>
              <p className="text-gray-500 text-sm mb-6">
                Registered plan: <span className="text-white font-bold">{admission.plan_type} — {admission.duration_label}</span>
              </p>

              {checkMsg && (
                <div className={`px-4 py-3 rounded mb-6 text-sm font-medium border ${checkMsg.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>{checkMsg}</div>
              )}

              {(!attendance?.status || attendance?.status === 'Not checked in') && (
                <div>
                  <p className="text-gray-400 mb-4 text-sm">Select your shift to check in:</p>
                  <div className="flex gap-3 flex-wrap">
                    {['Morning', 'Evening', 'Full Day'].map(shift => (
                      <button key={shift} onClick={() => handleCheckIn(shift)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-4 rounded-xl transition text-base">
                        ✅ Check In — {shift}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs mt-3">
                    Morning: 5AM–11:30AM &nbsp;|&nbsp; Evening: 4PM–9:30PM &nbsp;|&nbsp; Full Day: 5AM–9:30PM
                  </p>
                </div>
              )}

              {attendance?.status === 'Present' && (
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 font-bold text-lg">Currently Inside Gym</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Shift</div>
                        <div className="text-white font-bold">{attendance.record?.shift}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Checked In At</div>
                        <div className="text-white font-bold">
                          {new Date(attendance.record?.check_in_time).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleCheckOut}
                    className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-5 rounded-xl transition text-lg">
                    🚪 Check Out
                  </button>
                </div>
              )}

              {attendance?.status === 'Checked-Out' && (
                <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-5">
                  <div className="text-gray-300 font-bold text-lg mb-3">✔ Completed for Today</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><div className="text-gray-400">Shift</div><div className="text-white font-bold">{attendance.record?.shift}</div></div>
                    <div><div className="text-gray-400">Check In</div><div className="text-white font-bold">{new Date(attendance.record?.check_in_time).toLocaleTimeString('en-IN')}</div></div>
                    <div><div className="text-gray-400">Check Out</div><div className="text-white font-bold">{new Date(attendance.record?.check_out_time).toLocaleTimeString('en-IN')}</div></div>
                    <div><div className="text-gray-400">Duration</div><div className="text-yellow-400 font-bold">{attendance.record?.duration_mins} mins</div></div>
                  </div>
                </div>
              )}
            </div>

            {/* Plan Progress */}
            {admission && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">Plan Progress</h3>
                <PlanProgress />
              </div>
            )}

            {/* Date search */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4">Search Any Date</h3>
              <div className="flex gap-3 flex-wrap">
                <input type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded focus:outline-none focus:border-yellow-400 text-sm"
                />
                <button onClick={searchByDate}
                  className="bg-yellow-400 text-black font-bold px-6 py-2 rounded hover:bg-yellow-500 transition text-sm">
                  Search
                </button>
              </div>
              {dateResult && (
                <div className={`mt-4 p-4 rounded-xl border ${dateResult.record ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800 border-gray-600'
                  }`}>
                  {dateResult.record ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><div className="text-gray-400 text-xs">Date</div><div className="font-bold text-white">{dateResult.date}</div></div>
                      <div><div className="text-gray-400 text-xs">Shift</div><div className="font-bold text-yellow-400">{dateResult.record.shift}</div></div>
                      <div><div className="text-gray-400 text-xs">Check In</div><div className="font-bold text-white">{new Date(dateResult.record.check_in_time).toLocaleTimeString('en-IN')}</div></div>
                      <div><div className="text-gray-400 text-xs">Duration</div><div className="font-bold text-green-400">{dateResult.record.duration_mins ? `${dateResult.record.duration_mins} min` : 'Present'}</div></div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">You did not visit on {dateResult.date}.</p>
                  )}
                </div>
              )}
            </div>

            {/* Visit History */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Visit History</h3>
                <span className="text-xs text-gray-400">{history.length} total visits</span>
              </div>
              {history.length === 0 ? (
                <p className="text-gray-400 p-6">No visits recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr className="text-gray-400 uppercase text-xs">
                        {['Date', 'Shift', 'Check In', 'Check Out', 'Duration', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(r => (
                        <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                          <td className="px-4 py-3 text-white font-medium">
                            {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full">{r.shift}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{new Date(r.check_in_time).toLocaleTimeString('en-IN')}</td>
                          <td className="px-4 py-3 text-gray-300">
                            {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('en-IN') : <span className="text-green-400">● Inside</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{r.duration_mins ? `${r.duration_mins} min` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === 'Checked-Out' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══ WEIGHT TAB ══ */}
        {tab === 'weight' && admission && (
          <div className="space-y-6">

            {/* Health profile setup */}
            {(!dashboard?.height_cm || !dashboard?.goal_weight_kg || showProfileSetup) && (
              <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-1">Setup Health Profile</h3>
                <p className="text-gray-400 text-sm mb-4">Enter your height and goal weight to enable BMI tracking.</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Height (cm)</label>
                    <input type="number" value={profileForm.height_cm}
                      onChange={e => setProfileForm({ ...profileForm, height_cm: e.target.value })}
                      placeholder="e.g. 175"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Goal Weight (kg)</label>
                    <input type="number" value={profileForm.goal_weight_kg}
                      onChange={e => setProfileForm({ ...profileForm, goal_weight_kg: e.target.value })}
                      placeholder="e.g. 70"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
                <button onClick={async () => {
                  try {
                    await API.put('/api/member/health-profile', {
                      height_cm: parseFloat(profileForm.height_cm),
                      goal_weight_kg: parseFloat(profileForm.goal_weight_kg),
                    })
                    fetchAll()
                    setShowProfileSetup(false)
                  } catch (err) { console.error(err) }
                }}
                  className="bg-yellow-400 text-black font-bold px-6 py-2 rounded hover:bg-yellow-500 transition text-sm">
                  Save Profile
                </button>
              </div>
            )}

            {/* Stats cards */}
            {weightHistory && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Starting Weight', value: weightHistory.starting_weight ? `${weightHistory.starting_weight} kg` : '—' },
                  { label: 'Current Weight', value: weightHistory.current_weight ? `${weightHistory.current_weight} kg` : '—', color: 'text-yellow-400' },
                  {
                    label: 'Total Change',
                    value: weightHistory.total_change !== 0 ? `${weightHistory.total_change > 0 ? '+' : ''}${weightHistory.total_change} kg` : '—',
                    color: weightHistory.total_change < 0 ? 'text-green-400' : weightHistory.total_change > 0 ? 'text-red-400' : 'text-gray-400'
                  },
                  { label: 'Goal Weight', value: weightHistory.goal_weight ? `${weightHistory.goal_weight} kg` : '—', color: 'text-blue-400' },
                  {
                    label: 'BMI',
                    value: weightHistory.bmi ? `${weightHistory.bmi} — ${weightHistory.bmi_category}` : '—',
                    color: weightHistory.bmi_category === 'Normal' ? 'text-green-400' :
                      weightHistory.bmi_category === 'Underweight' ? 'text-blue-400' :
                        weightHistory.bmi_category === 'Overweight' ? 'text-amber-400' : 'text-red-400'
                  },
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                    <div className={`text-lg font-black ${s.color || 'text-white'}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Goal progress bar */}
            {weightHistory?.starting_weight && weightHistory?.goal_weight && weightHistory?.current_weight && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress to goal</span>
                  <span className="text-white font-bold">
                    {Math.abs(weightHistory.current_weight - weightHistory.goal_weight).toFixed(1)} kg to go
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-yellow-400 h-3 rounded-full transition-all" style={{
                    width: `${Math.min(
                      Math.abs(weightHistory.starting_weight - weightHistory.current_weight) /
                      Math.abs(weightHistory.starting_weight - weightHistory.goal_weight) * 100, 100
                    )}%`
                  }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Start: {weightHistory.starting_weight} kg</span>
                  <span>Goal: {weightHistory.goal_weight} kg</span>
                </div>
                <button onClick={() => setShowProfileSetup(true)}
                  className="text-xs text-gray-500 hover:text-yellow-400 mt-2 transition">
                  Change goal weight
                </button>
              </div>
            )}

            {/* Log weight */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4">Log Today's Weight</h3>
              {weightMsg && (
                <div className={`px-4 py-3 rounded mb-4 text-sm border ${weightMsg.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>{weightMsg}</div>
              )}
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Weight (kg)</label>
                  <input type="number" step="0.1" value={weightForm.weight_kg}
                    onChange={e => setWeightForm({ ...weightForm, weight_kg: e.target.value })}
                    placeholder="e.g. 72.5"
                    className="bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400 w-36"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Note (optional)</label>
                  <input type="text" value={weightForm.note}
                    onChange={e => setWeightForm({ ...weightForm, note: e.target.value })}
                    placeholder="e.g. After morning workout"
                    className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <button onClick={async () => {
                  if (!weightForm.weight_kg) return
                  setWeightMsg('')
                  try {
                    const res = await API.post('/api/member/weight-log', {
                      weight_kg: parseFloat(weightForm.weight_kg),
                      note: weightForm.note,
                    })
                    setWeightMsg('✅ ' + res.data.message)
                    setWeightForm({ weight_kg: '', note: '' })
                    API.get('/api/member/weight-history').then(r => setWeightHistory(r.data))
                  } catch (err) {
                    setWeightMsg('❌ ' + (err.response?.data?.error || 'Failed'))
                  }
                }}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-500 transition">
                  Log Weight
                </button>
              </div>
            </div>

            {/* Weight chart */}
            {weightHistory?.logs && weightHistory.logs.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4">Weight Progress Chart</h3>
                <WeightChart logs={weightHistory.logs} goalWeight={weightHistory.goal_weight} />
              </div>
            )}

            {/* Weight history table */}
            {weightHistory?.logs && weightHistory.logs.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">
                    Weight History ({weightHistory.logs.length} entries)
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr className="text-gray-400 uppercase text-xs">
                      {['Date', 'Weight', 'Change', 'Note'].map(h => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...weightHistory.logs].reverse().map((log, i, arr) => {
                      const prev = arr[i + 1]
                      const change = prev ? +(log.weight_kg - prev.weight_kg).toFixed(1) : null
                      return (
                        <tr key={log.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                          <td className="px-4 py-3 text-white font-medium">
                            {new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-yellow-400 font-bold">{log.weight_kg} kg</td>
                          <td className="px-4 py-3">
                            {change !== null ? (
                              <span className={`text-xs font-bold ${change < 0 ? 'text-green-400' : change > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {change > 0 ? '+' : ''}{change} kg
                              </span>
                            ) : <span className="text-gray-600 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{log.note || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {(!weightHistory?.logs || weightHistory.logs.length === 0) && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">⚖️</div>
                <p className="text-gray-400 mb-2">No weight entries yet.</p>
                <p className="text-gray-500 text-sm">Log your first weight above to start tracking progress!</p>
              </div>
            )}

          </div>
        )}

        {/* ══ WATER TAB ══ */}
        {tab === 'water' && admission && (
          <div className="space-y-6">

            {/* Header */}
            <div>
              <h2 className="text-2xl font-black uppercase text-white">💧 Hydration Tracker</h2>
              <p className="text-gray-400 text-sm mt-1">
                Track your daily water intake. Goal: {waterToday?.goal_glasses || 8} glasses = {(waterToday?.goal_glasses || 8) * 250}ml
              </p>
            </div>

            {/* Stats row */}
            {waterHistory && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Today', value: `${waterToday?.glasses_count || 0} / ${waterToday?.goal_glasses || 8}`, color: 'text-blue-400' },
                  { label: 'Weekly Avg', value: `${waterHistory.weekly_avg} glasses`, color: 'text-teal-400' },
                  {
                    label: 'Streak 🔥', value: `${waterHistory.streak} days`,
                    color: waterHistory.streak >= 3 ? 'text-amber-400' : 'text-gray-400'
                  },
                  { label: 'Total Glasses', value: waterHistory.total_glasses, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Main water bottle UI */}
            <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-8 items-center">

                {/* Water bottle visual */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-48">
                    {/* Bottle shape */}
                    <div className="absolute inset-0 rounded-b-3xl rounded-t-xl border-2 border-blue-500/40 overflow-hidden bg-gray-800">
                      {/* Water fill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all duration-500 rounded-b-3xl"
                        style={{
                          height: `${Math.min((waterToday?.glasses_count || 0) / (waterToday?.goal_glasses || 8) * 100, 100)}%`,
                          background: waterToday?.goal_achieved
                            ? 'linear-gradient(180deg, #22d3ee 0%, #0ea5e9 100%)'
                            : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                          opacity: 0.7,
                        }}
                      />
                      {/* Bubbles when filling */}
                      {(waterToday?.glasses_count || 0) > 0 && (
                        <div className="absolute inset-0 flex items-end justify-center pb-2">
                          <div className="text-white font-black text-lg">
                            {waterToday?.glasses_count || 0}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Bottle cap */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-4 bg-blue-500/40 rounded-t-lg border border-blue-500/40" />
                  </div>

                  {/* Goal achieved badge */}
                  {waterToday?.goal_achieved && (
                    <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold px-4 py-2 rounded-full">
                      🎉 Daily Goal Achieved!
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-5">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-bold">
                        {waterToday?.glasses_count || 0} of {waterToday?.goal_glasses || 8} glasses
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div
                        className="h-4 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(waterToday?.percentage || 0, 100)}%`,
                          background: (waterToday?.percentage || 0) >= 100
                            ? '#10B981'
                            : '#0ea5e9',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{waterToday?.ml_consumed || 0}ml consumed</span>
                      <span>{waterToday?.ml_goal || 2000}ml goal</span>
                    </div>
                  </div>

                  {/* Glass buttons */}
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => logWater('add')}
                      disabled={(waterToday?.glasses_count || 0) >= 20}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-black px-8 py-4 rounded-xl transition text-lg disabled:opacity-40">
                      💧 + Glass
                    </button>
                    <button onClick={() => logWater('remove')}
                      disabled={(waterToday?.glasses_count || 0) === 0}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold px-6 py-4 rounded-xl transition disabled:opacity-40">
                      ↩ Undo
                    </button>
                  </div>

                  {/* Quick add buttons */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Quick add</p>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={async () => {
                          for (let i = 0; i < n; i++) {
                            await API.post('/api/member/water-log', { action: 'add' })
                          }
                          API.get('/api/member/water-today').then(r => setWaterToday(r.data))
                          API.get('/api/member/water-history').then(r => setWaterHistory(r.data))
                        }}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold px-4 py-2 rounded-lg transition border border-gray-700">
                          +{n} {n === 1 ? 'glass' : 'glasses'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change goal */}
                  <div>
                    <button onClick={() => setShowGoalEdit(!showGoalEdit)}
                      className="text-xs text-gray-500 hover:text-blue-400 transition">
                      ⚙ Change daily goal (current: {waterToday?.goal_glasses || 8} glasses)
                    </button>
                    {showGoalEdit && (
                      <div className="flex gap-3 mt-2 items-center">
                        <input type="number" min="1" max="20" value={waterGoalInput}
                          onChange={e => setWaterGoalInput(e.target.value)}
                          placeholder="e.g. 10"
                          className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm w-24 focus:outline-none focus:border-blue-400"
                        />
                        <button onClick={async () => {
                          if (!waterGoalInput) return
                          await logWater('set', parseInt(waterGoalInput))
                          setShowGoalEdit(false)
                          setWaterGoalInput('')
                        }}
                          className="bg-blue-500 text-white font-bold px-4 py-2 rounded text-sm hover:bg-blue-600 transition">
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gym day notice */}
            {attendance?.status && attendance.status !== 'Not checked in' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 font-bold">💪 Gym day! Drink extra water today.</p>
                <p className="text-gray-400 text-sm mt-1">
                  You visited the gym today — aim for {(waterToday?.goal_glasses || 8) + 2} glasses minimum.
                </p>
              </div>
            )}

            {/* Weekly chart */}
            {waterHistory?.week && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4">
                  Last 7 Days
                </h3>
                <WaterChart week={waterHistory.week} />
              </div>
            )}

            {/* Weekly history table */}
            {waterHistory?.week && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Weekly Summary</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr className="text-gray-400 uppercase text-xs">
                      {['Day', 'Date', 'Glasses', 'ml', 'Goal', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...waterHistory.week].reverse().map((w, i) => (
                      <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-bold text-white">{w.day}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(w.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-blue-400 font-bold">{w.glasses_count}</td>
                        <td className="px-4 py-3 text-gray-300">{w.glasses_count * 250}ml</td>
                        <td className="px-4 py-3 text-gray-400">{w.goal_glasses} glasses</td>
                        <td className="px-4 py-3">
                          {w.glasses_count === 0 ? (
                            <span className="text-xs text-gray-600">—</span>
                          ) : w.goal_achieved ? (
                            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">✓ Goal hit</span>
                          ) : (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-full">
                              {w.goal_glasses - w.glasses_count} to go
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ══ PLANS TAB ══ */}
        {tab === 'plans' && !admission && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black uppercase text-white">Choose Your Plan</h2>
              <p className="text-gray-400 mt-1">Select a membership to activate your account.</p>
            </div>

            {enrollMsg && (
              <div className={`px-4 py-3 rounded mb-6 text-sm font-medium border ${enrollMsg.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>{enrollMsg}</div>
            )}

            {['Starter', 'Pro', 'Elite'].map(type => {
              const typePlans = plans.filter(p => p.plan_type === type)
              if (typePlans.length === 0) return null
              return (
                <div key={type} className="mb-8">
                  <h3 className="text-lg font-black uppercase text-gray-400 mb-4 border-b border-gray-800 pb-2">{type}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {typePlans.map(plan => (
                      <div key={plan.id} className={`relative bg-gray-900 border rounded-xl p-6 flex flex-col hover:-translate-y-1 transition-transform ${plan.is_offer ? 'border-amber-500/50' : 'border-gray-700'
                        }`}>
                        {plan.is_offer && plan.offer_label && (
                          <div className="absolute -top-3 left-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                            🔥 {plan.offer_label}
                          </div>
                        )}
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{plan.duration_label}</div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <div className="text-4xl font-black text-yellow-400">₹{plan.price}</div>
                        </div>
                        {plan.original_price && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-500 line-through text-sm">₹{plan.original_price}</span>
                            <span className="text-green-400 text-xs font-bold">Save ₹{plan.savings}</span>
                          </div>
                        )}
                        <div className="text-gray-500 text-xs mb-4">{plan.duration_days} days validity</div>
                        <hr className="border-gray-700 mb-4" />
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button onClick={() => handleEnroll(plan.id)}
                          className={`w-full py-3 rounded font-bold uppercase text-sm transition ${plan.is_offer
                              ? 'bg-amber-500 text-black hover:bg-amber-400'
                              : 'border border-gray-600 text-white hover:border-yellow-400 hover:text-yellow-400'
                            }`}>
                          Enroll Now — ₹{plan.price}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {plans.length === 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-400">No plans available yet. Contact the gym owner.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}