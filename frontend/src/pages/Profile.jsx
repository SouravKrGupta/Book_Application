import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchUserProfile } from '../data/api';

const Profile = () => {
  const { user, loading } = useApp();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileData = await fetchUserProfile();
        setProfile(profileData);
      } catch (err) {
        setError('Failed to load profile.');
      }
    };

    fetchProfile();
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="page-shell-tight space-y-8">
      <section className="surface-card-dark px-6 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.58)]">My profile</p>
            <h1 className="mt-3 text-5xl text-[#fff7ef]">Your account, reading identity, and library access in one place.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(255,247,239,0.72)]">
              Review the details tied to your account and jump back into the books that matter to you.
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Quick actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link to="/library" className="btn btn-primary w-full">Open my library</Link>
              <Link to="/books" className="btn btn-outline w-full">Browse books</Link>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="surface-card-strong p-6 sm:p-8">
        {!profile ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading profile details.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="surface-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Reader profile</p>
              <h2 className="mt-3 text-3xl">{profile.name}</h2>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[#8e766a]">{profile.type}</p>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-[#8e766a]">Username</p>
                  <p className="mt-1 text-base font-semibold text-[#211714]">{profile.username}</p>
                </div>
                <div>
                  <p className="text-[#8e766a]">Email</p>
                  <p className="mt-1 text-base font-semibold text-[#211714]">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Account details</p>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-[#8e766a]">Mobile</p>
                  <p className="mt-1 text-base font-semibold text-[#211714]">{profile.mobile}</p>
                </div>
                <div>
                  <p className="text-[#8e766a]">Role</p>
                  <p className="mt-1 text-base font-semibold text-[#211714]">{profile.type}</p>
                </div>
                <div>
                  <p className="text-[#8e766a]">Joined</p>
                  <p className="mt-1 text-base font-semibold text-[#211714]">
                    {new Date(profile.date_joined).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
