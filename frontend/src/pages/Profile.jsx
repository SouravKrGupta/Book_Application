import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import axios from 'axios';

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
        const token = localStorage.getItem('access');
        const res = await axios.get('http://127.0.0.1:8000/api/profile/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        setError('Failed to load profile');
      }
    };
    fetchProfile();
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-indigo-700 text-center">My Profile</h1>
        {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
        {profile ? (
          <div className="space-y-4">
            <div><span className="font-semibold">Name:</span> {profile.name}</div>
            <div><span className="font-semibold">Username:</span> {profile.username}</div>
            <div><span className="font-semibold">Email:</span> {profile.email}</div>
            <div><span className="font-semibold">Mobile:</span> {profile.mobile}</div>
            <div><span className="font-semibold">Type:</span> {profile.type}</div>
            <div><span className="font-semibold">Joined:</span> {new Date(profile.date_joined).toLocaleDateString()}</div>
          </div>
        ) : (
          <div className="text-center text-gray-500">Loading profile...</div>
        )}
      </div>
    </div>
  );
};

export default Profile; 