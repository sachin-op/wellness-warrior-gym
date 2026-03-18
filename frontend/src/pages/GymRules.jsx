import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function GymRules() {
  const [agreed, setAgreed]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login, user, token, role } = useAuth()
  const navigate                = useNavigate()

  const handleAgree = async () => {
    setLoading(true)
    try {
      await API.post('/api/auth/agree-rules')
      localStorage.setItem('agreed_to_rules', 'true')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏋️</div>
          <h1 className="text-3xl font-black uppercase text-yellow-400">
            Wellness Warrior
          </h1>
          <p className="text-gray-400 mt-1">Unisex Gym — Rules & Regulations</p>
          <p className="text-gray-500 text-sm mt-2">
            Please read all rules carefully before using our facilities.
          </p>
        </div>

        {/* Rules Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6 max-h-[60vh] overflow-y-auto">

          {[
            {
              title: "1. Membership & Registration",
              rules: [
                "Your membership is personal and non-transferable.",
                "Your registration number (WW-XXXX-XXX) must be kept safe.",
                "Membership is valid only for the duration of the paid plan.",
                "Any misuse of membership will result in immediate termination.",
                "Members must carry their registration number when visiting.",
              ]
            },
            {
              title: "2. Gym Timings & Attendance",
              rules: [
                "Morning shift: 5:00 AM – 12:00 PM",
                "Evening shift: 4:00 PM – 10:00 PM",
                "Full day shift: 5:00 AM – 10:00 PM",
                "Members must check in and check out every visit.",
                "Entry is not permitted outside your registered shift hours.",
                "Late arrivals beyond 30 minutes of shift end will not be permitted.",
              ]
            },
            {
              title: "3. Fee & Payment",
              rules: [
                "Monthly fees must be paid before the due date.",
                "A grace period of 5 days is given after due date.",
                "After 5 days of non-payment, account will be marked Overdue.",
                "Overdue members will not be permitted to enter the gym.",
                "No refunds on membership fees once paid.",
                "Fee amount is subject to change with 30 days prior notice.",
              ]
            },
            {
              title: "4. Gym Equipment & Facilities",
              rules: [
                "Handle all gym equipment with care.",
                "Return all weights and equipment to their proper place after use.",
                "Do not monopolize equipment — share with other members.",
                "Report any damaged equipment to staff immediately.",
                "Personal belongings are kept at your own risk.",
                "Lockers are available — bring your own lock.",
              ]
            },
            {
              title: "5. Conduct & Discipline",
              rules: [
                "Wear proper gym attire and clean sports shoes at all times.",
                "Maintain personal hygiene — use deodorant, carry a towel.",
                "Wipe down equipment after use.",
                "No loud music without earphones.",
                "Aggressive, abusive, or disrespectful behavior will result in termination.",
                "No filming or photography of other members without consent.",
                "Mobile phones must be on silent mode on the gym floor.",
              ]
            },
            {
              title: "6. Health & Safety",
              rules: [
                "Inform the trainer of any existing medical conditions.",
                "Warm up properly before exercising.",
                "Do not exercise if you are unwell — rest and recover first.",
                "Ask for trainer guidance before using unfamiliar equipment.",
                "Gym is not responsible for any injury caused by improper use of equipment.",
                "In case of emergency, inform gym staff immediately.",
              ]
            },
            {
              title: "7. Termination Policy",
              rules: [
                "Management reserves the right to terminate membership without refund.",
                "Reasons for termination include: non-payment, misconduct, or rule violations.",
                "Terminated members will lose all access immediately.",
                "Terminated registration numbers cannot be reused.",
              ]
            },
          ].map(section => (
            <div key={section.title} className="mb-6">
              <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Agreement */}
        <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-5 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-yellow-400 flex-shrink-0"
            />
            <span className="text-sm text-gray-300">
              I have read and understood all the rules and regulations of
              <span className="text-yellow-400 font-bold"> Wellness Warrior Unisex Gym</span>.
              I agree to follow all the above rules and accept that violation
              may result in termination of my membership without refund.
            </span>
          </label>
        </div>

        <button
          onClick={handleAgree}
          disabled={!agreed || loading}
          className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl uppercase tracking-wide text-lg hover:bg-yellow-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'I Agree — Enter Dashboard'}
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          By clicking above you digitally accept Wellness Warrior Gym's terms.
        </p>
      </div>
    </div>
  )
}