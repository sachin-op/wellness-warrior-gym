import { useState } from 'react'
import API from '../api/axios'

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await API.post('/api/public/enquiry', form)
      setSuccess('Message sent successfully! We will get back to you soon.')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest border-l-4 border-yellow-400 pl-3">Get In Touch</span>
          <h2 className="text-4xl font-black text-white uppercase mt-2">Contact Us</h2>
          <p className="text-gray-400 mt-2">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
          {success && <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded mb-4">{success}</div>}
          {error   && <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Name</label>
                <input type="text" required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Phone</label>
                <input type="tel"
                  className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input type="email" required
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Subject</label>
              <select
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400"
                value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
              >
                <option value="">Select subject</option>
                <option>Membership Enquiry</option>
                <option>Personal Training</option>
                <option>Nutrition Plan</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Message</label>
              <textarea rows="4" required
                className="w-full bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-yellow-400 resize-none"
                value={form.message} onChange={e => setForm({...form, message: e.target.value})}
              />
            </div>
            <button type="submit" disabled={loading}
              className="bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { label: 'Location',  value: '12 Civil Lines, Prayagraj' },
            { label: 'Phone',     value: '+91 98765 43210' },
            { label: 'Hours',     value: 'Mon–Sat: 5AM – 11PM' },
          ].map(item => (
            <div key={item.label} className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-white text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}