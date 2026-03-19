import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'

export default function Home() {
  const [plans, setPlans]       = useState([])
  const [trainers, setTrainers] = useState([])

  useEffect(() => {
    API.get('/api/public/plans').then(r => setPlans(r.data))
    API.get('/api/public/trainers').then(r => setTrainers(r.data))
  }, [])

  return (
    <div className="bg-gray-950 text-white">

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-red-500/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded mb-6">
              Unisex Gym — Prayagraj
            </span>
            <h1 className="text-7xl md:text-8xl font-black uppercase leading-none mb-6">
              Wellness<br/>
              <span className="text-yellow-400">Warrior</span><br/>
              <span className="text-red-500">Gym</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              Elite bodybuilding and fitness training. World-class equipment,
              expert coaches, and a community that pushes you to your maximum.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/register" className="bg-yellow-400 text-black font-bold px-8 py-4 rounded uppercase tracking-wide hover:bg-yellow-500 transition">
                Join Now
              </Link>
              <Link to="/contact" className="border border-gray-600 text-white font-medium px-8 py-4 rounded uppercase tracking-wide hover:border-yellow-400 transition">
                Contact Us
              </Link>
            </div>
            <div className="flex gap-8 mt-10 pt-8 border-t border-gray-800">
              {[['1200+','Active Members'],['15','Expert Trainers'],['6yr','In Business']].map(([num, label]) => (
                <div key={label}>
                  <div className="text-3xl font-black text-yellow-400">{num}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4">
            {[
              { icon: '🏋️', title: 'Pro Equipment',  sub: '50+ machines' },
              { icon: '⚡', title: 'Open 24/7',       sub: 'Always available' },
              { icon: '🔥', title: 'PT Sessions',     sub: '1-on-1 coaching' },
              { icon: '🥗', title: 'Nutrition Plans', sub: 'Expert guidance' },
            ].map(card => (
              <div key={card.title} className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-yellow-400/50 transition">
                <div className="text-3xl mb-3">{card.icon}</div>
                <div className="font-bold text-white">{card.title}</div>
                <div className="text-sm text-gray-400">{card.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      {/* ── PRICING ── */}
<section className="py-20 px-6 bg-gray-900">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-14">
      <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest border-l-4 border-yellow-400 pl-3">Membership Plans</span>
      <h2 className="text-5xl font-black uppercase mt-2">Invest In Your Body</h2>
      <p className="text-gray-400 mt-3">No hidden fees. Cancel anytime.</p>
    </div>

    {['Starter','Pro','Elite'].map(type => {
      const typePlans = plans.filter(p => p.plan_type === type)
      if (typePlans.length === 0) return null
      return (
        <div key={type} className="mb-12">
          <h3 className="text-2xl font-black uppercase text-white mb-6 border-b border-gray-700 pb-3">
            {type}
            {type === 'Starter' && <span className="text-sm text-gray-400 font-normal ml-3">— Basic Access</span>}
            {type === 'Pro'     && <span className="text-sm text-gray-400 font-normal ml-3">— Full Access</span>}
            {type === 'Elite'   && <span className="text-sm text-gray-400 font-normal ml-3">— Premium Access</span>}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {typePlans.map(plan => (
              <div key={plan.id} className={`relative bg-gray-950 border rounded-xl p-7 flex flex-col hover:-translate-y-1 transition-transform ${
                plan.is_offer ? 'border-amber-500/50' : 'border-gray-700'
              }`}>
                {/* Offer badge */}
                {plan.is_offer && plan.offer_label && (
                  <div className="absolute -top-3 left-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase">
                    🔥 {plan.offer_label}
                  </div>
                )}

                <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">
                  {plan.duration_label}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-1">
                  <div className="text-5xl font-black text-yellow-400">₹{plan.price}</div>
                </div>
                {plan.original_price && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 line-through text-sm">₹{plan.original_price}</span>
                    <span className="text-green-400 text-xs font-bold">Save ₹{plan.savings}</span>
                  </div>
                )}
                <div className="text-gray-500 text-xs mb-5">{plan.duration_days} days validity</div>

                <hr className="border-gray-700 mb-5" />
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`block text-center py-3 rounded font-bold uppercase text-sm transition ${
                    plan.is_offer
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'border border-gray-600 text-white hover:border-yellow-400 hover:text-yellow-400'
                  }`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      )
    })}

    {plans.length === 0 && (
      <div className="text-center py-12">
        <p className="text-gray-400">Membership plans coming soon. Contact us for details.</p>
      </div>
    )}
  </div>
</section>

      {/* ── TRAINERS ── */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-14 flex-wrap gap-4">
            <div>
              <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest border-l-4 border-yellow-400 pl-3">Our Team</span>
              <h2 className="text-5xl font-black uppercase mt-2">Elite Trainers</h2>
            </div>
            <p className="text-gray-400 max-w-sm">Certified professionals with proven results.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trainers.map(trainer => (
              <div key={trainer.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden hover:-translate-y-1 hover:border-yellow-400/50 transition-all">
                <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-6xl">
                  💪
                </div>
                <div className="p-5">
                  <div className="font-black text-lg uppercase">{trainer.name}</div>
                  <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1 mb-3">{trainer.role}</div>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{trainer.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specializations.map((s, i) => (
                      <span key={i} className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="text-2xl font-black uppercase">
            Wellness<span className="text-yellow-400">Warrior</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/"        className="hover:text-yellow-400 transition">Home</Link>
            <Link to="/contact" className="hover:text-yellow-400 transition">Contact</Link>
            <Link to="/login"   className="hover:text-yellow-400 transition">Login</Link>
            <Link to="/register" className="hover:text-yellow-400 transition">Register</Link>
          </div>
          <p className="text-gray-600 text-sm"> Unisex Gym - WellnessWarrior.</p>
        </div>
      </footer>

    </div>
  )
}