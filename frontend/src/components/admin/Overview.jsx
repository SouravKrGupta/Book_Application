import { useEffect, useState } from 'react';
import { fetchBooks, fetchLibrary } from '../../data/api';
import axios from 'axios';

const Overview = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalLibraryEntries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const books = await fetchBooks();
        const library = await fetchLibrary();
        // Fetch users and reviews count from admin endpoints if available
        let totalUsers = 0;
        let totalReviews = 0;
        try {
          const usersRes = await axios.get('http://localhost:8000/api/users/', { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } });
          totalUsers = usersRes.data.length;
        } catch (err) {
          console.error('Error fetching users:', err);
        }
        try {
          const reviewsRes = await axios.get('http://localhost:8000/api/reviews/', { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } });
          totalReviews = reviewsRes.data.length;
        } catch (err) {
          console.error('Error fetching reviews:', err);
        }
        setStats({
          totalBooks: books.length,
          totalUsers,
          totalReviews,
          totalLibraryEntries: library.length,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load stats');
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Books</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalBooks}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalUsers}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Reviews</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalReviews}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Library Entries</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.totalLibraryEntries}</p>
      </div>
    </div>
  );
};

export default Overview; 