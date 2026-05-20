import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchLibrary, updateLibraryProgress, deleteLibraryEntry } from '../data/api';
import { useEffect, useState } from 'react';

const BookCard = ({ book }) => {
  const { user, refreshLibrary } = useApp();
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (user) {
        const lib = await fetchLibrary();
        const entry = lib.find((item) => item.book.id === book.id);
        setLibraryEntry(entry);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, book.id]);

  const handleLibraryToggle = async (event) => {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (libraryEntry) {
        await deleteLibraryEntry({ book_id: book.id });
        setLibraryEntry(null);
      } else {
        await updateLibraryProgress({ book_id: book.id, progress: 0, type: 'pdf' });
        const lib = await fetchLibrary();
        const entry = lib.find((item) => item.book.id === book.id);
        setLibraryEntry(entry);
      }

      if (refreshLibrary) refreshLibrary();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleRead = (event) => {
    event.preventDefault();
    if (libraryEntry && libraryEntry.progress > 0) {
      navigate(`/books/${book.id}/pdf-viewer?page=${libraryEntry.progress}`);
      return;
    }
    navigate(`/books/${book.id}/pdf-viewer`);
  };

  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-card-image">
        <img
          src={book.cover_image_url || book.cover_image}
          alt={book.title}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="genre-pill">{book.genre || 'Featured'}</span>
          {user && (
            <button
              onClick={handleLibraryToggle}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                libraryEntry
                  ? 'border-white/20 bg-[#211714]/85 text-[#fff7ef]'
                  : 'border-white/80 bg-white/85 text-[#5f4c44]'
              }`}
              disabled={loading}
              type="button"
              aria-label={libraryEntry ? 'Remove from library' : 'Save to library'}
            >
              {loading ? '...' : libraryEntry ? 'Saved' : 'Save'}
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-[#1d1411] via-[#1d1411]/80 to-transparent px-4 pb-4 pt-16">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/70">
            <span>{book.published_year || 'Classic shelf'}</span>
            {libraryEntry && (
              <span className={`status-pill ${libraryEntry.percent_complete === 100 ? 'status-complete' : 'status-reading'}`}>
                {libraryEntry.percent_complete === 100 ? 'Completed' : 'In progress'}
              </span>
            )}
          </div>

          <button onClick={handleRead} className="btn btn-primary w-full" type="button">
            {libraryEntry ? 'Continue reading' : 'Read now'}
          </button>
        </div>
      </div>

      <div className="book-card-body">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-xl">{book.title}</h3>
          <p className="text-sm font-medium text-[#5f4c44]">{book.author}</p>
          {book.description && (
            <p className="line-clamp-3 text-sm leading-6">{book.description}</p>
          )}
        </div>

        {libraryEntry && libraryEntry.progress > 0 && (
          <div className="mt-5">
            <div className="audio-bar">
              <div
                className="audio-bar-fill"
                style={{ width: `${libraryEntry.percent_complete}%` }}
              />
            </div>
            <div className="meta-row mt-2 justify-between">
              <span>{libraryEntry.progress} pages tracked</span>
              <span>{libraryEntry.percent_complete}% complete</span>
            </div>
          </div>
        )}

        <div className="meta-row mt-5 justify-between">
          <span>{book.genre || 'General'}</span>
          <span>Details</span>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;
