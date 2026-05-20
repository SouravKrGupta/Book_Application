import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'user',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.name || !formData.username || !formData.mobile || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = await register({
      name: formData.name,
      username: formData.username,
      mobile: formData.mobile,
      email: formData.email,
      password: formData.password,
      type: formData.type,
    });

    if (res.success) {
      navigate('/');
    } else if (typeof res.error === 'object') {
      setFieldErrors(res.error);
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="section-hero">
          <div className="relative">
            <span className="section-kicker">Join the library</span>
            <h1 className="section-title">Create your account and shape a reading routine that feels personal.</h1>
            <p className="section-copy">
              Build a library, track your progress, and unlock features that help you move from browsing to focused reading.
            </p>

            <div className="hero-metrics">
              <div className="metric-card">
                <p className="metric-value">Profile</p>
                <p className="metric-label">Save your reading identity in one simple account.</p>
              </div>
              <div className="metric-card">
                <p className="metric-value">Progress</p>
                <p className="metric-label">Keep tabs on what you are reading and what you finished.</p>
              </div>
              <div className="metric-card">
                <p className="metric-value">Tools</p>
                <p className="metric-label">Access summaries, analytics, and audio experiences.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel !max-w-none">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8e766a]">Create account</p>
            <h2 className="mt-3 text-4xl">Start your Book World profile</h2>
            <p className="mt-3 text-sm leading-7">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#7b4636] hover:text-[#955845]">
                Sign in here
              </Link>
            </p>
          </div>

          {error && <div className="error-banner mt-6">{error}</div>}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="field-label">Full name</label>
                <input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange} className="field-input" placeholder="Your full name" />
                {fieldErrors.name && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="username" className="field-label">Username</label>
                <input id="username" name="username" type="text" autoComplete="username" required value={formData.username} onChange={handleChange} className="field-input" placeholder="Choose a username" />
                {fieldErrors.username && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.username}</p>}
              </div>
              <div>
                <label htmlFor="mobile" className="field-label">Mobile</label>
                <input id="mobile" name="mobile" type="text" autoComplete="tel" required value={formData.mobile} onChange={handleChange} className="field-input" placeholder="Your mobile number" />
                {fieldErrors.mobile && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.mobile}</p>}
              </div>
              <div>
                <label htmlFor="email" className="field-label">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="field-input" placeholder="you@example.com" />
                {fieldErrors.email && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="type" className="field-label">Account type</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className="field-select">
                  <option value="user">Reader</option>
                  <option value="admin">Admin</option>
                </select>
                {fieldErrors.type && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.type}</p>}
              </div>
              <div>
                <label htmlFor="password" className="field-label">Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} className="field-input" placeholder="Create a password" />
                {fieldErrors.password && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.password}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} className="field-input" placeholder="Repeat your password" />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Create account
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Register;
