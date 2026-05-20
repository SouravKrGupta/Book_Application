import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    const res = await login(formData.username, formData.password);
    if (res.success) {
      navigate('/');
    } else if (typeof res.error === 'object') {
      setFieldErrors(res.error);
    } else {
      setError(res.error || 'Login failed.');
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
            <span className="section-kicker">Welcome back</span>
            <h1 className="section-title">Return to your reading space without losing your rhythm.</h1>
            <p className="section-copy">
              Sign in to reopen saved books, continue from your last page, and keep all of your reading tools within easy reach.
            </p>

            <div className="hero-metrics">
              <div className="metric-card">
                <p className="metric-value">Sync</p>
                <p className="metric-label">Pick up where you left off across your library.</p>
              </div>
              <div className="metric-card">
                <p className="metric-value">Audio</p>
                <p className="metric-label">Resume summaries and narration when needed.</p>
              </div>
              <div className="metric-card">
                <p className="metric-value">Shelf</p>
                <p className="metric-label">Keep your saved books in one organized space.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8e766a]">Sign in</p>
            <h2 className="mt-3 text-4xl">Welcome back</h2>
            <p className="mt-3 text-sm leading-7">
              New here?{' '}
              <Link to="/register" className="font-semibold text-[#7b4636] hover:text-[#955845]">
                Create an account
              </Link>
            </p>
          </div>

          {error && <div className="error-banner mt-6">{error}</div>}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="field-label">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="field-input"
                placeholder="Enter your username"
              />
              {fieldErrors.username && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.username}</p>}
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="field-input"
                placeholder="Enter your password"
              />
              {fieldErrors.password && <p className="mt-2 text-sm text-[#8e2f2a]">{fieldErrors.password}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] bg-white/60 px-4 py-3 text-sm">
              <label className="flex items-center gap-2 text-[#5f4c44]">
                <input type="checkbox" className="h-4 w-4 rounded border-[rgba(123,70,54,0.18)] text-[#7b4636]" />
                Remember me
              </label>
              <span className="text-[#8e766a]">Need help? Contact support.</span>
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Sign in
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
