import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaUserShield, FaUser } from 'react-icons/fa'

const Register = () => {
  const [userType, setUserType] = useState('user')
  const [form, setForm] = useState({
    name: '',
    username: '',
    mobile: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleTypeChange = (type) => {
    setUserType(type)
    setError('')
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(' http://127.0.0.1:8000/api/register/', {
        ...form,
        type: userType,
      })
      setLoading(false)
      navigate('/login')
    } catch (err) {
      setLoading(false)
      setError(
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).join(' ') ||
        'Registration failed.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Register
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl sm:rounded-2xl sm:px-12 border border-gray-100 animate-fadein">
          {/* Slider Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="slider-toggle">
              <button
                className={`slider-btn ${userType === 'user' ? 'active' : ''}`}
                onClick={() => handleTypeChange('user')}
                type="button"
                aria-label="User Register"
              >
                <FaUser className="inline mr-1 mb-1" /> User
              </button>
              <button
                className={`slider-btn ${userType === 'admin' ? 'active' : ''}`}
                onClick={() => handleTypeChange('admin')}
                type="button"
                aria-label="Admin Register"
              >
                <FaUserShield className="inline mr-1 mb-1" /> Admin
              </button>
              <div className={`slider-indicator ${userType}`}></div>
            </div>
          </div>
          {/* Registration Form */}
          <form className={`space-y-6 ${userType === 'admin' ? 'admin-form' : 'user-form'}`} onSubmit={handleSubmit}>
            <div className="flex items-center justify-center mb-2">
              {userType === 'admin' ? (
                <>
                  <FaUserShield className="text-2xl text-rose-600 mr-2" />
                  <span className="text-lg font-semibold text-rose-600 tracking-wide">Admin Registration</span>
                </>
              ) : (
                <>
                  <FaUser className="text-2xl text-indigo-600 mr-2" />
                  <span className="text-lg font-semibold text-indigo-600 tracking-wide">User Registration</span>
                </>
              )}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="input mt-1"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="input mt-1"
                value={form.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile</label>
              <input
                id="mobile"
                name="mobile"
                type="text"
                autoComplete="tel"
                required
                className="input mt-1"
                value={form.mobile}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input mt-1"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input mt-1"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            {userType === 'admin' && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 animate-fadein">
                <b>Note:</b> Registering as admin will grant full access. Use with caution.
              </div>
            )}
            {error && <div className="text-red-500 text-sm text-center animate-fadein">{error}</div>}
            <div>
              <button
                type="submit"
                className={`btn btn-primary w-full ${userType === 'admin' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                disabled={loading}
              >
                {loading ? 'Registering...' : `Register as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register