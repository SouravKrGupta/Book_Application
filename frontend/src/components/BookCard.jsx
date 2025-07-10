import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchLibrary, updateLibraryProgress, deleteLibraryEntry } from '../data/api';
import { useEffect, useState } from 'react';

const BookCard = ({ book }) => {
  const { user, refreshLibrary } = useApp();
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const lib = await fetchLibrary();
        const entry = lib.find(l => l.book.id === book.id);
        setLibraryEntry(entry);
      }
    };
    load();
    // eslint-disable-next-line
  }, [user, book.id]);

  const handleLibraryToggle = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (libraryEntry) {
        // Remove from library
        await deleteLibraryEntry({ book_id: book.id, type: 'pdf' });
        setLibraryEntry(null);
        if (refreshLibrary) refreshLibrary();
      } else {
        // Add or update progress to 0
        await updateLibraryProgress({ book_id: book.id, progress: 0, type: 'pdf' });
        const lib = await fetchLibrary();
        const entry = lib.find(l => l.book.id === book.id);
        setLibraryEntry(entry);
        if (refreshLibrary) refreshLibrary();
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Link
      to={`/books/${book.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div className="relative aspect-[3/4]">
        <img
          src={
            book.cover_image_url ||
            book.cover_image 
          }
          alt={book.title}
          className="w-full h-full object-cover"
        />
        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex space-x-2">
            <button className="flex-1 bg-indigo-600 text-white py-2 rounded-md text-sm font-medium">
              {libraryEntry ? 'Continue Reading' : 'Read Now'}
            </button>
          </div>
        </div>
        {/* Library Toggle Button */}
        {user && (
          <button
            onClick={handleLibraryToggle}
            className={`absolute top-2 right-2 p-2 rounded-md ${
              libraryEntry ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
            }`}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </button>
        )}
        {/* Reading Status Badge */}
        {libraryEntry && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
              libraryEntry.percent_complete === 100
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {libraryEntry.percent_complete === 100 ? 'Completed' : 'Reading'}
            </span>
          </div>
        )}
      </div>
      {/* Book Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{book.author}</p>
          </div>
        </div>
        {/* Progress Bar */}
        {libraryEntry && libraryEntry.progress > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div
                className={`h-full rounded-full ${
                  libraryEntry.percent_complete === 100 ? 'bg-green-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${libraryEntry.percent_complete}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {libraryEntry.percent_complete === 100 ? 'Completed' : `${libraryEntry.percent_complete}% complete`}
            </p>
          </div>
        )}
        {/* Book Metadata */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">{book.genre}</span>
          <span className="text-sm text-gray-500">{book.published_year}</span>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;