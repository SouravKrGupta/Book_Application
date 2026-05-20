import { useState, useEffect } from 'react';
import { fetchBooks, searchBooks } from '../data/api';
import BookCard from '../components/BookCard';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [titleSearch, setTitleSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const booksPerPage = 8;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const booksData = await fetchBooks();
        setBooks(booksData);
        setFilteredBooks(booksData);
      } catch (err) {
        setError('Failed to load books.');
      }
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runSearch = async () => {
      const trimmedTitle = titleSearch.trim();
      const trimmedAuthor = authorSearch.trim();

      if (!trimmedTitle && !trimmedAuthor) {
        const locallyFiltered = books.filter((book) => !selectedGenre || book.genre === selectedGenre);
        if (isMounted) {
          setFilteredBooks(locallyFiltered);
          setSearchLoading(false);
          setError('');
        }
        return;
      }

      setSearchLoading(true);
      setError('');
      try {
        let results = [];
        const params = {};
        if (trimmedTitle) params.title = trimmedTitle;
        if (trimmedAuthor) params.author = trimmedAuthor;
        if (selectedGenre) params.genre = selectedGenre;

        try {
          results = await searchBooks(params);
        } catch (err) {
          const statusCode = err.response?.status;
          if (statusCode === 404 || statusCode === 400) {
            results = [];
          } else {
            throw err;
          }
        }

        if (isMounted) {
          setFilteredBooks(results);
        }
      } catch (err) {
        if (isMounted) {
          setFilteredBooks([]);
          setError('Search is unavailable right now. Please try again.');
        }
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      isMounted = false;
    };
  }, [books, titleSearch, authorSearch, selectedGenre]);

  useEffect(() => {
    setPage(1);
  }, [titleSearch, authorSearch, selectedGenre]);

  const paginatedBooks = filteredBooks.slice(0, page * booksPerPage);
  const hasMore = paginatedBooks.length < filteredBooks.length;
  const genres = [...new Set(books.map((book) => book.genre).filter(Boolean))];

  return (
    <div className="page-shell space-y-10">
      <section className="surface-card-dark px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.58)]">Library catalog</p>
            <h1 className="mt-3 text-5xl text-[#fff7ef]">Browse books with a calmer, more focused shelf view.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(255,247,239,0.72)]">
              Search by title or author, filter by genre, and move through the collection without losing the sense of place.
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Shelf snapshot</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-[1.25rem] bg-white/70 p-4">
                <p className="text-3xl font-semibold text-[#211714]">{books.length}</p>
                <p className="mt-1 text-sm">Books available</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/70 p-4">
                <p className="text-3xl font-semibold text-[#211714]">{genres.length}</p>
                <p className="mt-1 text-sm">Genres to explore</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card-strong p-6 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]">
          <div>
            <label htmlFor="book-title-search" className="field-label">Search by title</label>
            <input
              id="book-title-search"
              type="text"
              placeholder="Search by book title"
              value={titleSearch}
              onChange={(event) => setTitleSearch(event.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="book-author-search" className="field-label">Search by author</label>
            <input
              id="book-author-search"
              type="text"
              placeholder="Search by author name"
              value={authorSearch}
              onChange={(event) => setAuthorSearch(event.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="genre-filter" className="field-label">Filter by genre</label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.target.value)}
              className="field-select"
            >
              <option value="">All genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            Showing <span className="font-semibold text-[#211714]">{filteredBooks.length}</span> matching books.
            {(titleSearch || authorSearch) && <span className="ml-2 text-[#8e766a]">Powered by backend search.</span>}
          </p>
          {(titleSearch || authorSearch || selectedGenre) && (
            <button
              onClick={() => {
                setTitleSearch('');
                setAuthorSearch('');
                setSelectedGenre('');
              }}
              className="btn btn-soft"
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {loading || searchLoading ? (
        <div className="loading-state surface-card-strong">
          <div className="loading-spinner"></div>
          <p>{loading ? 'Loading the catalog.' : 'Searching the catalog.'}</p>
        </div>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <h2 className="text-3xl">No books match that search.</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7">
            Try a broader title, a different author, or remove the current genre filter to reopen the shelf.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setTitleSearch('');
                setAuthorSearch('');
                setSelectedGenre('');
              }}
              className="btn btn-primary"
              type="button"
            >
              Reset the view
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="book-grid">
            {paginatedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button onClick={() => setPage((current) => current + 1)} className="btn btn-primary" type="button">
                Load more books
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookList;
