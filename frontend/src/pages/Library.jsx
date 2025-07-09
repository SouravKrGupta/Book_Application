import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchLibrary } from '../data/api';
import BookCard from '../components/BookCard';

const Library = () => {
  const { user } = useApp();
  const [library, setLibrary] = useState([]);
  const [filter, setFilter] = useState('all'); // all, reading, completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const lib = await fetchLibrary();
        setLibrary(lib);
      } catch (err) {
        setError('Failed to load library');
      }
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in to view your library</h2>
          <p className="mt-2 text-gray-600">Sign in to access your saved books and reading progress</p>
        </div>
      </div>
    );
  }

  const filteredLibrary = library.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'reading') return entry.progress > 0 && entry.percent_complete < 100;
    if (filter === 'completed') return entry.percent_complete === 100;
    return true;
  });

  const stats = {
    reading: library.filter(entry => entry.progress > 0 && entry.percent_complete < 100).length,
    completed: library.filter(entry => entry.percent_complete === 100).length,
    total: library.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Library</h1>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Total Books</p>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Currently Reading</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.reading}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-green-600">{stats.completed}</p>
          </div>
        </div>
        {/* Filters */}
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Books
          </button>
          <button
            onClick={() => setFilter('reading')}
            className={`px-4 py-2 rounded-md ${filter === 'reading' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Currently Reading
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Completed
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : filteredLibrary.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No books found</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Add some books to your library to get started'
              : filter === 'completed'
              ? "You haven't completed any books yet"
              : `No ${filter} books in your library`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLibrary.map(entry => (
            <BookCard key={entry.book.id} book={entry.book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library; 