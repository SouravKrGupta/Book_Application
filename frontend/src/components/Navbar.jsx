import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/books', label: 'Books' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const linkClassName = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <nav className="site-nav">
      <div className="nav-shell">
        <div className="flex items-center gap-8">
          <Link to="/" className="nav-brand">
            <span className="nav-brand-mark">BW</span>
            <span>
              <span className="block text-xs uppercase tracking-[0.3em] text-[#8e766a]">Book World</span>
              <span className="block font-serif text-xl text-[#211714]">Read beautifully</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClassName}>
                {item.label}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/library" className={linkClassName}>
                My Library
              </NavLink>
            )}
            {user?.type === 'admin' && (
              <NavLink to="/admin" className={linkClassName}>
                Admin
              </NavLink>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <NavLink to="/profile" className="surface-card flex items-center gap-3 px-3 py-2">
                <img
                  className="h-11 w-11 rounded-2xl object-cover"
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=F7DFD3&color=7B4636`}
                  alt={user.name}
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#211714]">{user.name}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8e766a]">{user.type}</p>
                </div>
              </NavLink>
              <button onClick={handleLogout} className="btn btn-outline" type="button">
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline">
                Sign in
              </NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Join now
              </NavLink>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(123,70,54,0.16)] bg-white/70 text-[#211714] md:hidden"
          type="button"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="mx-4 mb-4 rounded-[1.75rem] border border-white/70 bg-[rgba(255,251,245,0.96)] p-4 shadow-[0_22px_65px_rgba(61,37,27,0.14)] md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClassName}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/library" className={linkClassName} onClick={() => setIsMenuOpen(false)}>
                My Library
              </NavLink>
            )}
            {user?.type === 'admin' && (
              <NavLink to="/admin" className={linkClassName} onClick={() => setIsMenuOpen(false)}>
                Admin
              </NavLink>
            )}
          </div>

          <div className="mt-4 border-t border-[rgba(123,70,54,0.12)] pt-4">
            {user ? (
              <div className="space-y-4">
                <NavLink
                  to="/profile"
                  className="surface-card flex items-center gap-3 px-3 py-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <img
                    className="h-11 w-11 rounded-2xl object-cover"
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=F7DFD3&color=7B4636`}
                    alt={user.name}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#211714]">{user.name}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#8e766a]">{user.email}</p>
                  </div>
                </NavLink>
                <button onClick={handleLogout} className="btn btn-outline w-full" type="button">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <NavLink to="/login" className="btn btn-outline w-full" onClick={() => setIsMenuOpen(false)}>
                  Sign in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary w-full" onClick={() => setIsMenuOpen(false)}>
                  Create account
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
