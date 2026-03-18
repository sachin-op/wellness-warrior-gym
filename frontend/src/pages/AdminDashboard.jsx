import { useEffect, useState, useRef } from 'react'
import API from '../api/axios'

// ── Chart Components ──────────────────────────────────────────────────
function MonthlyRevenueChart({ data }) {
  const ref = useRef()
  useEffect(() => {
    if (!data || data.length === 0) return
    import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js').then(() => {
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      if (ref.current._chart) ref.current._chart.destroy()
      ref.current._chart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels:   data.map(d => d.month),
          datasets: [{
            label:           'Revenue (₹)',
            data:            data.map(d => d.amount),
            backgroundColor: 'rgba(250,162,11,0.7)',
            borderColor:     '#F4A20B',
            borderWidth:     1,
            borderRadius:    4,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#9CA3AF' } } },
          scales: {
            x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
            y: { ticks: { color: '#9CA3AF', callback: v => '₹' + v }, grid: { color: '#374151' } }
          }
        }
      })
    })
  }, [data])
  return <canvas ref={ref} height={120} />
}

function PlanBreakdownChart({ data }) {
  const ref = useRef()
  useEffect(() => {
    if (!data || data.length === 0) return
    import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js').then(() => {
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      if (ref.current._chart) ref.current._chart.destroy()
      const colors = ['#F4A20B','#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B']
      ref.current._chart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels:   data.map(d => `${d.plan_name} (${d.member_count})`),
          datasets: [{
            data:            data.map(d => d.member_count),
            backgroundColor: colors.slice(0, data.length),
            borderColor:     '#111827',
            borderWidth:     2,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', padding: 12 } } }
        }
      })
    })
  }, [data])
  return <canvas ref={ref} height={200} />
}

function FeeStatusChart({ paid, due, overdue }) {
  const ref = useRef()
  useEffect(() => {
    import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js').then(() => {
      const ctx = ref.current?.getContext('2d')
      if (!ctx) return
      if (ref.current._chart) ref.current._chart.destroy()
      ref.current._chart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels:   ['Paid', 'Due', 'Overdue'],
          datasets: [{
            data:            [paid, due, overdue],
            backgroundColor: ['#10B981','#F59E0B','#EF4444'],
            borderColor:     '#111827',
            borderWidth:     2,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', padding: 12 } } }
        }
      })
    })
  }, [paid, due, overdue])
  return <canvas ref={ref} height={200} />
}

// ── Pending Card Component ────────────────────────────────────────────
function PendingCard({ member, plans, onApprove, onReject }) {
  const [planId,  setPlanId]  = useState('')
  const [method,  setMethod]  = useState('Cash')
  const [amount,  setAmount]  = useState('')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)

  const selectedPlan = plans.find(p => p.id === parseInt(planId))

  return (
    <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-5">
      <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
        <div>
          <div className="font-black text-lg text-white">{member.username}</div>
          <div className="text-gray-400 text-sm">{member.email} · {member.phone || 'No phone'}</div>
          <div className="text-gray-500 text-xs mt-1">
            Registered: {new Date(member.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Select Plan *</label>
          <select value={planId} onChange={e => {
            setPlanId(e.target.value)
            const p = plans.find(pl => pl.id === parseInt(e.target.value))
            if (p) setAmount(p.price)
          }}
            className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-yellow-400">
            <option value="">-- Select Plan --</option>
            {['Starter','Pro','Elite'].map(type => (
              <optgroup key={type} label={type}>
                {plans.filter(p => p.plan_type === type && p.is_active).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.duration_label} — ₹{p.price}{p.is_offer ? ` 🔥 ${p.offer_label}` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Payment Method *</label>
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-yellow-400">
            {['Cash','PhonePe','GPay','Bank Transfer'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Amount Received (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder={selectedPlan ? String(selectedPlan.price) : 'Enter amount'}
            className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Notes (optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Paid cash at counter"
            className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {selectedPlan && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm flex gap-4 flex-wrap">
          <div><span className="text-gray-400">Plan: </span><span className="text-white font-bold">{selectedPlan.name}</span></div>
          <div><span className="text-gray-400">Duration: </span><span className="text-yellow-400 font-bold">{selectedPlan.duration_label}</span></div>
          <div><span className="text-gray-400">Price: </span><span className="text-green-400 font-bold">₹{selectedPlan.price}</span></div>
          {selectedPlan.is_offer && (
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              🔥 {selectedPlan.offer_label}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          disabled={!planId || !amount || loading}
          onClick={async () => {
            setLoading(true)
            await onApprove(parseInt(planId), method, parseInt(amount), notes)
            setLoading(false)
          }}
          className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded transition disabled:opacity-40 text-sm">
          {loading ? 'Approving...' : '✅ Approve & Generate Reg Number'}
        </button>
        <button onClick={onReject}
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded transition text-sm">
          ❌ Reject
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]                     = useState(null)
  const [members, setMembers]                 = useState([])
  const [pending, setPending]                 = useState([])
  const [enquiries, setEnquiries]             = useState([])
  const [live, setLive]                       = useState([])
  const [overdue, setOverdue]                 = useState([])
  const [membersStatus, setMembersStatus]     = useState([])
  const [todayVisited, setTodayVisited]       = useState(null)
  const [dateSearch, setDateSearch]           = useState('')
  const [dateResult, setDateResult]           = useState(null)
  const [memberReport, setMemberReport]       = useState(null)
  const [attendMsg, setAttendMsg]             = useState('')
  const [tab, setTab]                         = useState('overview')
  const [revenueStats, setRevenueStats]       = useState(null)
  const [monthlyRevenue, setMonthlyRevenue]   = useState([])
  const [allPlans, setAllPlans]               = useState([])
  const [showPlanForm, setShowPlanForm]       = useState(false)
  const [editingPlan, setEditingPlan]         = useState(null)
  const [planForm, setPlanForm]               = useState({
    name:'', plan_type:'Starter', duration_days:30, duration_label:'1 Month',
    price:'', original_price:'', features:'', is_offer:false, offer_label:'', is_active:true
  })

  // ── Fetch functions ───────────────────────────────────────────────
  const fetchAll = () => {
    API.get('/api/admin/dashboard').then(r => setStats(r.data)).catch(console.error)
    API.get('/api/admin/members').then(r => setMembers(r.data)).catch(console.error)
    API.get('/api/admin/pending').then(r => setPending(r.data)).catch(console.error)
    API.get('/api/admin/enquiries').then(r => setEnquiries(r.data)).catch(console.error)
    API.get('/api/attendance/live').then(r => setLive(r.data)).catch(console.error)
    API.get('/api/admin/overdue').then(r => setOverdue(r.data)).catch(console.error)
  }

  const fetchMembersStatus = () => {
    API.get('/api/attendance/members-status').then(r => setMembersStatus(r.data)).catch(console.error)
  }

  const fetchTodayVisited = () => {
    API.get('/api/attendance/today-visited').then(r => setTodayVisited(r.data)).catch(console.error)
  }

  const fetchRevenueData = () => {
    API.get('/api/admin/revenue-stats').then(r => setRevenueStats(r.data)).catch(console.error)
    API.get('/api/admin/monthly-revenue').then(r => setMonthlyRevenue(r.data)).catch(console.error)
  }

  const fetchAllPlans = () => {
    API.get('/api/admin/plans').then(r => setAllPlans(r.data)).catch(console.error)
  }

  useEffect(() => {
    fetchAll()
    fetchMembersStatus()
    fetchTodayVisited()
    fetchRevenueData()
    fetchAllPlans()
  }, [])

  useEffect(() => {
    if (tab === 'attendance')  { fetchMembersStatus(); fetchTodayVisited() }
    if (tab === 'today')       fetchTodayVisited()
    if (tab === 'pending')     API.get('/api/admin/pending').then(r => setPending(r.data))
    if (tab === 'revenue')     fetchRevenueData()
    if (tab === 'plans')       fetchAllPlans()
  }, [tab])

  // ── Actions ───────────────────────────────────────────────────────
  const adminCheckIn = async (memberId, shift) => {
    setAttendMsg('')
    try {
      const res = await API.post('/api/attendance/admin-checkin', { member_id: memberId, shift })
      setAttendMsg('✅ ' + res.data.message)
      fetchMembersStatus(); fetchAll(); fetchTodayVisited()
    } catch (err) {
      setAttendMsg('❌ ' + (err.response?.data?.error || 'Check-in failed'))
    }
  }

  const adminCheckOut = async (memberId) => {
    setAttendMsg('')
    try {
      const res = await API.post('/api/attendance/admin-checkout', { member_id: memberId })
      setAttendMsg('✅ ' + res.data.message)
      fetchMembersStatus(); fetchAll(); fetchTodayVisited()
    } catch (err) {
      setAttendMsg('❌ ' + (err.response?.data?.error || 'Check-out failed'))
    }
  }

  const searchByDate = async () => {
    if (!dateSearch) return
    try {
      const res = await API.get(`/api/attendance/date-wise?date=${dateSearch}`)
      setDateResult(res.data)
    } catch (err) { console.error(err) }
  }

  const viewMemberReport = async (member) => {
    try {
      const res = await API.get(`/api/attendance/member-full-report/${member.id}`)
      setMemberReport(res.data)
      setTab('investigate')
    } catch (err) { console.error(err) }
  }

  const markPaid = async (id, method = 'Cash') => {
    await API.put(`/api/admin/members/${id}/mark-paid`, { payment_method: method })
    fetchAll(); fetchRevenueData()
  }

  const resolveEnquiry = async (id) => {
    await API.put(`/api/admin/enquiries/${id}/resolve`)
    API.get('/api/admin/enquiries').then(r => setEnquiries(r.data))
  }

  const approveMember = async (id, planId, method, amount, notes) => {
    try {
      const res = await API.post(`/api/admin/approve/${id}`, {
        plan_id: planId, payment_method: method, amount_paid: amount, notes
      })
      alert(`✅ Approved!\n\nRegistration Number: ${res.data.reg_number}\n\nShare this with the member via WhatsApp or in person.`)
      API.get('/api/admin/pending').then(r => setPending(r.data))
      fetchAll(); fetchRevenueData()
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Approval failed'))
    }
  }

  const rejectMember = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    if (reason === null) return
    await API.post(`/api/admin/terminate/${id}`, { reason: reason || 'Registration rejected' })
    API.get('/api/admin/pending').then(r => setPending(r.data))
    fetchAll()
  }

  const terminateMember = async (id, username) => {
    const reason = prompt(`Reason for terminating ${username}:`)
    if (reason === null) return
    try {
      await API.post(`/api/admin/terminate/${id}`, { reason: reason || 'Terminated by admin' })
      fetchAll()
      alert('Member terminated successfully')
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || 'Error'))
    }
  }

  const reactivateMember = async (id) => {
  try {
    const res = await API.post(`/api/admin/reactivate/${id}`)
    fetchAll()
    if (res.data.needs_approval) {
      alert(`⚠️ ${res.data.message}\n\nGo to ⏳ Pending tab to approve with plan selection.`)
      setTab('pending')
      API.get('/api/admin/pending').then(r => setPending(r.data))
    } else {
      alert(`✅ ${res.data.message}`)
    }
  } catch (err) { alert('Failed') }
}

  const savePlan = async () => {
    if (!planForm.name || !planForm.price) return alert('Name and price are required')
    const payload = {
      ...planForm,
      price:          parseInt(planForm.price),
      original_price: planForm.original_price ? parseInt(planForm.original_price) : null,
      features:       planForm.features ? planForm.features.split(',').map(f => f.trim()).filter(Boolean) : [],
    }
    try {
      if (editingPlan) {
        await API.put(`/api/admin/plans/${editingPlan.id}`, payload)
      } else {
        await API.post('/api/admin/plans', payload)
      }
      fetchAllPlans()
      setShowPlanForm(false)
      setEditingPlan(null)
      setPlanForm({ name:'', plan_type:'Starter', duration_days:30, duration_label:'1 Month',
        price:'', original_price:'', features:'', is_offer:false, offer_label:'', is_active:true })
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'Failed'))
    }
  }

  const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'pending',     label: `⏳ Pending${pending.length > 0 ? ` (${pending.length})` : ''}` },
    { key: 'today',       label: "Today's Visits" },
    { key: 'attendance',  label: 'Mark Attendance' },
    { key: 'date-search', label: 'Date Search' },
    { key: 'members',     label: 'Members' },
    { key: 'investigate', label: 'Investigate' },
    { key: 'revenue',     label: '📊 Revenue' },
    { key: 'plans',       label: '💳 Plans' },
    { key: 'enquiries',   label: 'Enquiries' },
    { key: 'overdue',     label: 'Overdue' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase">
            Admin <span className="text-yellow-400">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-1">Wellness Warrior Unisex Gym Management</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Members',  value: stats.total_members,     color: 'text-blue-400' },
              { label: 'Active Plans',   value: stats.active_admissions, color: 'text-green-400' },
              { label: 'Overdue',        value: stats.overdue_members,   color: 'text-red-400' },
              { label: 'Revenue',        value: `₹${stats.total_revenue}`, color: 'text-yellow-400' },
              { label: "Today's Visits", value: stats.today_attendance,  color: 'text-purple-400' },
              { label: 'Pending',        value: pending.length,          color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition ${
                tab === t.key ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="font-bold text-yellow-400 uppercase text-sm mb-4">Currently Inside Gym</h3>
              {live.length === 0 ? <p className="text-gray-400 text-sm">No members currently inside</p> :
                live.slice(0, 5).map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-800">
                    <div>
                      <div className="font-bold text-sm">{r.member_name}</div>
                      <div className="text-xs text-gray-400">{r.shift} · {new Date(r.check_in_time).toLocaleTimeString('en-IN')}</div>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">● LIVE</span>
                  </div>
                ))
              }
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              {pending.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                  <p className="text-orange-400 font-bold text-sm">
                    ⏳ {pending.length} member{pending.length > 1 ? 's' : ''} waiting for approval!
                  </p>
                  <button onClick={() => setTab('pending')} className="text-xs text-orange-400 underline mt-1">
                    Review now →
                  </button>
                </div>
              )}
              <h3 className="font-bold text-yellow-400 uppercase text-sm mb-3">Today's Summary</h3>
              {todayVisited && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Visited',    value: todayVisited.count },
                    { label: 'Inside Now', value: live.length },
                    { label: 'Done',       value: todayVisited.count - live.length },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xl font-black text-yellow-400">{s.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PENDING APPROVALS ══ */}
        {tab === 'pending' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase text-white">Pending Approvals</h2>
                <p className="text-gray-400 text-sm mt-1">Select plan + payment when approving</p>
              </div>
              <button onClick={() => API.get('/api/admin/pending').then(r => setPending(r.data))}
                className="text-xs bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600 transition">
                Refresh
              </button>
            </div>
            {pending.length === 0 ? (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-400">No pending approvals.</p>
              </div>
            ) : (
              pending.map(m => (
                <PendingCard key={m.id} member={m} plans={allPlans}
                  onApprove={(planId, method, amount, notes) => approveMember(m.id, planId, method, amount, notes)}
                  onReject={() => rejectMember(m.id)}
                />
              ))
            )}
          </div>
        )}

        {/* ══ TODAY'S VISITS ══ */}
        {tab === 'today' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase">Today's Visited Members</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
              <button onClick={fetchTodayVisited}
                className="text-xs bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600 transition">
                Refresh
              </button>
            </div>

            {todayVisited && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Visited',    value: todayVisited.count,               color: 'text-yellow-400' },
                  { label: 'Currently Inside', value: live.length,                      color: 'text-green-400' },
                  { label: 'Checked Out',      value: todayVisited.count - live.length, color: 'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                    <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              {!todayVisited || todayVisited.records.length === 0 ? (
                <p className="text-gray-400 p-6">No members visited today yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr className="text-gray-400 uppercase text-xs">
                      {['#','Member','Shift','Check In','Check Out','Duration','Status','Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todayVisited.records.map((r, i) => (
                      <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => {
                            const m = members.find(m => m.id === r.member_id)
                            if (m) viewMemberReport(m)
                          }} className="font-bold text-white hover:text-yellow-400 transition">
                            {r.member_name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full">{r.shift}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {r.check_out_time
                            ? new Date(r.check_out_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
                            : <span className="text-green-400">● Inside</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{r.duration_mins ? `${r.duration_mins} min` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            r.status === 'Checked-Out' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'Present' && (
                            <button onClick={() => adminCheckOut(r.member_id)}
                              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ MARK ATTENDANCE ══ */}
        {tab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Members',  value: membersStatus.length },
                { label: 'Visited Today',  value: membersStatus.filter(m => m.today_status !== 'Not checked in').length },
                { label: 'Inside Now',     value: membersStatus.filter(m => m.today_status === 'Present').length },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                  <div className="text-2xl font-black text-yellow-400">{s.value}</div>
                </div>
              ))}
            </div>

            {attendMsg && (
              <div className={`px-4 py-3 rounded text-sm font-medium border ${
                attendMsg.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>{attendMsg}</div>
            )}

            <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest">
                  Mark Attendance — {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                </h3>
                <button onClick={() => { fetchMembersStatus(); fetchTodayVisited() }}
                  className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded hover:bg-gray-600 transition">
                  Refresh
                </button>
              </div>
              {membersStatus.length === 0 ? (
                <p className="text-gray-400 p-6">No active members found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr className="text-gray-400 uppercase text-xs">
                      {['Member','Phone','Plan','Shift','Check In','Check Out','Duration','Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {membersStatus.map(m => (
                      <tr key={m.member_id} className="border-t border-gray-800 hover:bg-gray-800/40">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{m.username}</div>
                          <div className={`text-xs font-bold mt-0.5 ${
                            m.today_status === 'Present'     ? 'text-green-400' :
                            m.today_status === 'Checked-Out' ? 'text-gray-400'  : 'text-gray-600'
                          }`}>
                            {m.today_status === 'Present' ? '● Inside' : m.today_status === 'Checked-Out' ? '✔ Done' : '○ Not here'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{m.phone || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{m.plan_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full">{m.shift}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {m.check_in_time ? new Date(m.check_in_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {m.check_out_time ? new Date(m.check_out_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{m.duration_mins ? `${m.duration_mins} min` : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 flex-wrap">
                            {m.today_status === 'Not checked in' && (
                              ['Morning','Evening','Full Day'].map(shift => (
                                <button key={shift} onClick={() => adminCheckIn(m.member_id, shift)}
                                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded font-bold transition">
                                  {shift.split(' ')[0]}
                                </button>
                              ))
                            )}
                            {m.today_status === 'Present' && (
                              <button onClick={() => adminCheckOut(m.member_id)}
                                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-bold transition">
                                Check Out
                              </button>
                            )}
                            {m.today_status === 'Checked-Out' && (
                              <span className="text-xs text-gray-500">Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ DATE SEARCH ══ */}
        {tab === 'date-search' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase text-white mb-1">Date-wise Search</h2>
              <p className="text-gray-400 text-sm">Pick any date to see all members who visited.</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Select Date</label>
                  <input type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={dateSearch}
                    onChange={e => setDateSearch(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <button onClick={searchByDate}
                  className="bg-yellow-400 text-black font-bold px-8 py-3 rounded hover:bg-yellow-500 transition">
                  Search
                </button>
                <button onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setDateSearch(today)
                  API.get(`/api/attendance/date-wise?date=${today}`).then(r => setDateResult(r.data))
                }} className="bg-gray-700 text-gray-300 font-bold px-6 py-3 rounded hover:bg-gray-600 transition">
                  Today
                </button>
              </div>
            </div>

            {dateResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Date',          value: new Date(dateResult.date + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) },
                    { label: 'Total Visited', value: dateResult.count },
                    { label: 'Morning',       value: dateResult.records?.filter(r => r.shift === 'Morning').length || 0 },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                      <div className="text-xl font-black text-yellow-400">{s.value}</div>
                    </div>
                  ))}
                </div>
                {dateResult.records?.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                    <p className="text-gray-400">No members visited on this date.</p>
                  </div>
                ) : (
                  <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800">
                        <tr className="text-gray-400 uppercase text-xs">
                          {['#','Member','Shift','Check In','Check Out','Duration','Status'].map(h => (
                            <th key={h} className="text-left px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dateResult.records?.map((r, i) => (
                          <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                            <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => {
                                const m = members.find(m => m.id === r.member_id)
                                if (m) viewMemberReport(m)
                              }} className="font-bold text-white hover:text-yellow-400 transition">
                                {r.member_name}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full">{r.shift}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              {new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-300">{r.duration_mins ? `${r.duration_mins} min` : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                r.status === 'Checked-Out' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ MEMBERS ══ */}
        {tab === 'members' && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr className="text-gray-400 uppercase text-xs">
                  {['Name / Reg No','Email','Phone','Plan','Status','Fee','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <button onClick={() => viewMemberReport(m)}
                        className="font-bold text-white hover:text-yellow-400 transition text-left">
                        {m.username}
                      </button>
                      {m.reg_number && <div className="text-xs text-yellow-400 font-mono mt-0.5">{m.reg_number}</div>}
                      {m.status === 'terminated' && <div className="text-xs text-red-400 mt-0.5">● Terminated</div>}
                      {m.status === 'pending'    && <div className="text-xs text-orange-400 mt-0.5">⏳ Pending</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{m.email}</td>
                    <td className="px-4 py-3 text-gray-400">{m.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {m.admission ? `${m.admission.plan_type} — ${m.admission.duration_label}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        m.status === 'active'     ? 'bg-green-500/20 text-green-400'  :
                        m.status === 'terminated' ? 'bg-red-500/20 text-red-400'      :
                        'bg-orange-500/20 text-orange-400'
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        m.admission?.fee_status === 'Paid'    ? 'bg-green-500/20 text-green-400' :
                        m.admission?.fee_status === 'Overdue' ? 'bg-red-500/20 text-red-400'     :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{m.admission?.fee_status || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {m.admission?.fee_status !== 'Paid' && m.admission && (
                          <button onClick={() => markPaid(m.id)}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
                            Paid
                          </button>
                        )}
                        <button onClick={() => viewMemberReport(m)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition">
                          Report
                        </button>
                        {m.status !== 'terminated' ? (
                          <button onClick={() => terminateMember(m.id, m.username)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                            Terminate
                          </button>
                        ) : (
                          <button onClick={() => reactivateMember(m.id)}
                            className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500 transition">
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ INVESTIGATE ══ */}
        {tab === 'investigate' && (
          <div className="space-y-6">
            {!memberReport ? (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">Click any member name in Members tab to investigate.</p>
                <button onClick={() => setTab('members')}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-500 transition">
                  Go to Members
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-6">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-black uppercase text-yellow-400">{memberReport.member.username}</h2>
                      <p className="text-gray-400 text-sm mt-1">{memberReport.member.email} · {memberReport.member.phone}</p>
                      {memberReport.member.reg_number && (
                        <p className="text-yellow-400 font-mono text-sm mt-1">Reg: {memberReport.member.reg_number}</p>
                      )}
                    </div>
                    <button onClick={() => setMemberReport(null)}
                      className="text-xs bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600 transition">
                      Clear
                    </button>
                  </div>
                  {memberReport.admission && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {[
                        { label: 'Plan',       value: `${memberReport.admission.plan_type} — ${memberReport.admission.duration_label}` },
                        { label: 'Fee Status', value: memberReport.admission.fee_status,
                          color: memberReport.admission.fee_status === 'Paid' ? 'text-green-400' : 'text-red-400' },
                        { label: 'Joined',     value: new Date(memberReport.admission.admission_date).toLocaleDateString('en-IN') },
                        { label: 'Expires',    value: new Date(memberReport.admission.expiry_date).toLocaleDateString('en-IN') },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-800 rounded-lg p-3">
                          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{item.label}</div>
                          <div className={`font-bold text-sm ${item.color || 'text-white'}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Visits',    value: memberReport.total_visits,        color: 'text-yellow-400' },
                    { label: 'Days Since Join', value: memberReport.days_since_join,      color: 'text-blue-400' },
                    { label: 'Attendance %',    value: `${memberReport.attendance_pct}%`,
                      color: memberReport.attendance_pct >= 70 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Total Hours',
                      value: `${Math.floor(memberReport.total_mins / 60)}h ${memberReport.total_mins % 60}m`,
                      color: 'text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                  <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest mb-4">
                    Visited Dates ({memberReport.visited_dates.length} days)
                  </h3>
                  {memberReport.visited_dates.length === 0 ? (
                    <p className="text-gray-400 text-sm">No visits recorded yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {memberReport.visited_dates.map(d => (
                        <span key={d} className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full">
                          {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700">
                    <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest">Complete Visit History</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr className="text-gray-400 uppercase text-xs">
                        {['#','Date','Shift','Check In','Check Out','Duration','Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {memberReport.records.map((r, i) => (
                        <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                          <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 text-white font-medium">
                            {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-1 rounded-full">{r.shift}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{r.duration_mins ? `${r.duration_mins} min` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              r.status === 'Checked-Out' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ REVENUE ══ */}
        {tab === 'revenue' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase text-white">Revenue Analytics</h2>

            {revenueStats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'This Month',       value: `₹${revenueStats.month_collected}`,  color: 'text-green-400' },
                    { label: 'Total Collected',  value: `₹${revenueStats.total_collected}`,  color: 'text-yellow-400' },
                    { label: 'Pending',          value: `₹${revenueStats.pending_amount}`,   color: 'text-blue-400' },
                    { label: 'Overdue',          value: `₹${revenueStats.overdue_amount}`,   color: 'text-red-400' },
                    { label: 'Offer Members',    value: revenueStats.offer_enrollments,       color: 'text-purple-400' },
                    { label: 'Paid Members',     value: revenueStats.paid_count,              color: 'text-teal-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{s.label}</div>
                      <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                  <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest mb-4">Monthly Revenue — Last 12 Months</h3>
                  <MonthlyRevenueChart data={monthlyRevenue} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest mb-4">Members per Plan</h3>
                    <PlanBreakdownChart data={revenueStats.plan_breakdown} />
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest mb-4">Fee Status Breakdown</h3>
                    <FeeStatusChart
                      paid={revenueStats.paid_count}
                      due={revenueStats.due_count}
                      overdue={revenueStats.overdue_count}
                    />
                  </div>
                </div>

                {/* Members plan table */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700">
                    <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest">
                      All Members — Plan & Payment Details
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800">
                        <tr className="text-gray-400 uppercase text-xs">
                          {['Member','Reg No','Plan','Duration','Offer','Amount','Method','Fee Status','Expires','Days Left'].map(h => (
                            <th key={h} className="text-left px-3 py-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {members.filter(m => m.admission).map(m => {
                          const a        = m.admission
                          const exp      = new Date(a.expiry_date)
                          const daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24))
                          const lastPay  = m.payments?.[0]
                          return (
                            <tr key={m.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                              <td className="px-3 py-3 font-bold text-white whitespace-nowrap">{m.username}</td>
                              <td className="px-3 py-3 text-yellow-400 font-mono text-xs">{m.reg_number || '—'}</td>
                              <td className="px-3 py-3 text-gray-300 text-xs">{a.plan_type}</td>
                              <td className="px-3 py-3 text-gray-300 text-xs">{a.duration_label}</td>
                              <td className="px-3 py-3">
                                {a.is_offer ? (
                                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    🔥 {a.offer_label}
                                  </span>
                                ) : <span className="text-gray-600 text-xs">—</span>}
                              </td>
                              <td className="px-3 py-3 text-green-400 font-bold">
                                ₹{lastPay?.amount || a.plan_price || '—'}
                              </td>
                              <td className="px-3 py-3 text-gray-300 text-xs">{lastPay?.payment_method || '—'}</td>
                              <td className="px-3 py-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                                  a.fee_status === 'Paid'    ? 'bg-green-500/20 text-green-400' :
                                  a.fee_status === 'Overdue' ? 'bg-red-500/20 text-red-400'    :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>{a.fee_status}</span>
                              </td>
                              <td className="px-3 py-3 text-gray-300 text-xs whitespace-nowrap">
                                {exp.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`text-xs font-bold ${
                                  daysLeft <= 0  ? 'text-red-400'    :
                                  daysLeft <= 7  ? 'text-orange-400' :
                                  daysLeft <= 14 ? 'text-yellow-400' :
                                  'text-green-400'
                                }`}>
                                  {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ PLANS MANAGER ══ */}
        {tab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-black uppercase text-white">Plan Manager</h2>
                <p className="text-gray-400 text-sm mt-1">Create and manage all membership plans</p>
              </div>
              <button onClick={() => {
                setShowPlanForm(true); setEditingPlan(null)
                setPlanForm({ name:'', plan_type:'Starter', duration_days:30, duration_label:'1 Month',
                  price:'', original_price:'', features:'', is_offer:false, offer_label:'', is_active:true })
              }}
                className="bg-yellow-400 text-black font-bold px-5 py-2 rounded hover:bg-yellow-500 transition text-sm">
                + Add New Plan
              </button>
            </div>

            {showPlanForm && (
              <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-6">
                <h3 className="font-bold text-yellow-400 uppercase text-sm tracking-widest mb-4">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Plan Name *</label>
                    <input type="text" value={planForm.name}
                      onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g. Pro 6 Months Special"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Plan Type *</label>
                    <select value={planForm.plan_type}
                      onChange={e => setPlanForm({ ...planForm, plan_type: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400">
                      {['Starter','Pro','Elite'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Duration</label>
                    <select value={planForm.duration_label}
                      onChange={e => {
                        const map = { '1 Month':30, '2 Months':60, '3 Months':90, '6 Months':180, '1 Year':365 }
                        setPlanForm({ ...planForm, duration_label: e.target.value, duration_days: map[e.target.value] || 30 })
                      }}
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400">
                      {['1 Month','2 Months','3 Months','6 Months','1 Year'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Price (₹) *</label>
                    <input type="number" value={planForm.price}
                      onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                      placeholder="e.g. 1499"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Original Price (₹) — for strikethrough</label>
                    <input type="number" value={planForm.original_price}
                      onChange={e => setPlanForm({ ...planForm, original_price: e.target.value })}
                      placeholder="e.g. 1999 (leave blank if no discount)"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Features (comma separated)</label>
                    <input type="text" value={planForm.features}
                      onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                      placeholder="Unlimited access, All classes, PT sessions"
                      className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={planForm.is_offer}
                        onChange={e => setPlanForm({ ...planForm, is_offer: e.target.checked })}
                        className="accent-yellow-400 w-4 h-4"
                      />
                      <span className="text-sm text-gray-300">Mark as Special Offer 🔥</span>
                    </label>
                  </div>
                  {planForm.is_offer && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Offer Label</label>
                      <input type="text" value={planForm.offer_label}
                        onChange={e => setPlanForm({ ...planForm, offer_label: e.target.value })}
                        placeholder="e.g. Diwali Deal 🪔 or New Year Offer 🎉"
                        className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={savePlan}
                    className="bg-yellow-400 text-black font-bold px-6 py-2 rounded hover:bg-yellow-500 transition text-sm">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                  <button onClick={() => { setShowPlanForm(false); setEditingPlan(null) }}
                    className="bg-gray-700 text-gray-300 font-bold px-6 py-2 rounded hover:bg-gray-600 transition text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {['Starter','Pro','Elite'].map(type => {
              const typePlans = allPlans.filter(p => p.plan_type === type)
              if (typePlans.length === 0) return null
              return (
                <div key={type}>
                  <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-3">{type} Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typePlans.map(p => (
                      <div key={p.id} className={`bg-gray-900 border rounded-xl p-4 ${
                        !p.is_active ? 'border-gray-700 opacity-50' :
                        p.is_offer   ? 'border-amber-500/40'        : 'border-gray-700'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{p.duration_label}</div>
                          </div>
                          <div className="flex gap-1">
                            {p.is_offer && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">🔥</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'
                            }`}>{p.is_active ? 'Active' : 'Hidden'}</span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-black text-yellow-400">₹{p.price}</span>
                          {p.original_price && <span className="text-sm text-gray-500 line-through">₹{p.original_price}</span>}
                        </div>
                        {p.savings && <div className="text-xs text-green-400 mb-1">Save ₹{p.savings}</div>}
                        {p.is_offer && p.offer_label && <div className="text-xs text-amber-400 mb-2">{p.offer_label}</div>}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button onClick={() => {
                            setEditingPlan(p)
                            setPlanForm({
                              name: p.name, plan_type: p.plan_type,
                              duration_days: p.duration_days, duration_label: p.duration_label,
                              price: p.price, original_price: p.original_price || '',
                              features: Array.isArray(p.features) ? p.features.join(', ') : '',
                              is_offer: p.is_offer, offer_label: p.offer_label || '',
                              is_active: p.is_active,
                            })
                            setShowPlanForm(true)
                          }}
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">
                            Edit
                          </button>
                          <button onClick={async () => {
                            await API.put(`/api/admin/plans/${p.id}/toggle`)
                            fetchAllPlans()
                          }}
                            className={`text-xs px-3 py-1 rounded transition ${
                              p.is_active ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-green-500 text-white hover:bg-green-600'
                            }`}>
                            {p.is_active ? 'Hide' : 'Show'}
                          </button>
                          <button onClick={async () => {
                            if (!window.confirm(`Delete "${p.name}"?`)) return
                            await API.delete(`/api/admin/plans/${p.id}`)
                            fetchAllPlans()
                          }}
                            className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {allPlans.length === 0 && !showPlanForm && (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">No plans created yet.</p>
                <button onClick={() => setShowPlanForm(true)}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-500 transition">
                  Create Your First Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ ENQUIRIES ══ */}
        {tab === 'enquiries' && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            {enquiries.length === 0 ? (
              <p className="text-gray-400 p-6">No enquiries yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr className="text-gray-400 uppercase text-xs">
                    {['Name','Email','Subject','Message','Status','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map(e => (
                    <tr key={e.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-bold">{e.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{e.email}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{e.subject || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{e.message}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          e.is_resolved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>{e.is_resolved ? 'Resolved' : 'Pending'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {!e.is_resolved && (
                          <button onClick={() => resolveEnquiry(e.id)}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ══ OVERDUE ══ */}
        {tab === 'overdue' && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            {overdue.length === 0 ? (
              <p className="text-gray-400 p-6">No overdue members 🎉</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr className="text-gray-400 uppercase text-xs">
                    {['Member','Email','Plan','Expiry','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overdue.map(a => (
                    <tr key={a.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-bold">{a.member?.username}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{a.member?.email}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{a.plan_type} — {a.duration_label}</td>
                      <td className="px-4 py-3 text-red-400 text-xs">
                        {new Date(a.expiry_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => markPaid(a.member_id)}
                          className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
