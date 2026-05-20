import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';

const Library = () => {
  const { user, library, libraryLoading } = useApp();
  const [filter, setFilter] = useState('all');

  if (!user) {
    return (
      <div className="page-shell">
        <div className="section-hero">
          <div className="relative max-w-3xl">
            <span className="section-kicker">Private shelf</span>
            <h1 className="section-title">Sign in to open your personal library.</h1>
            <p className="section-copy">
              Your library stores saved books, reading progress, and the titles you want to return to later.
            </p>
            <div className="section-actions">
              <Link to="/login" className="btn btn-primary">Sign in</Link>
              <Link to="/register" className="btn btn-outline border-white/20 bg-white/5 text-[#fff7ef] hover:bg-white/10">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredLibrary = library.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'reading') return entry.progress > 0 && entry.percent_complete < 100;
    if (filter === 'completed') return entry.percent_complete === 100;
    return true;
  });

  const stats = {
    reading: library.filter((entry) => entry.progress > 0 && entry.percent_complete < 100).length,
    completed: library.filter((entry) => entry.percent_complete === 100).length,
    total: library.length,
  };

  const filters = [
    { id: 'all', label: 'All books' },
    { id: 'reading', label: 'Currently reading' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="page-shell space-y-10">
      <section className="surface-card-dark px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.58)]">My library</p>
            <h1 className="mt-3 text-5xl text-[#fff7ef]">A clean shelf for the books you are saving, reading, and finishing.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(255,247,239,0.72)]">
              Track progress, revisit favorites, and keep your active titles separated from the ones you already completed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-[rgba(255,247,239,0.56)]">Total</p>
              <p className="mt-3 text-4xl font-semibold text-[#fff7ef]">{stats.total}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-[rgba(255,247,239,0.56)]">Reading</p>
              <p className="mt-3 text-4xl font-semibold text-[#fff7ef]">{stats.reading}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-[rgba(255,247,239,0.56)]">Completed</p>
              <p className="mt-3 text-4xl font-semibold text-[#fff7ef]">{stats.completed}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card-strong p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Filter view</p>
            <h2 className="mt-3 text-3xl">Choose the shelf state you want to see</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {filters.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`filter-chip ${filter === item.id ? 'filter-chip-active' : ''}`}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {libraryLoading ? (
        <div className="loading-state surface-card-strong">
          <div className="loading-spinner"></div>
          <p>Loading your library.</p>
        </div>
      ) : filteredLibrary.length === 0 ? (
        <div className="empty-state">
          <h2 className="text-3xl">Nothing on this shelf yet</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7">
            {filter === 'all'
              ? 'Save a few books from the catalog and they will show up here.'
              : filter === 'completed'
                ? 'You have not completed any books yet.'
                : 'You do not have any books in progress right now.'}
          </p>
          <div className="mt-6">
            <Link to="/books" className="btn btn-primary">Browse books</Link>
          </div>
        </div>
      ) : (
        <div className="book-grid">
          {filteredLibrary.map((entry) => (
            <BookCard key={entry.book.id} book={entry.book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
