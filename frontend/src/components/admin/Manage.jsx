import { useEffect, useState } from 'react';
import { fetchBooks, deleteBook } from '../../data/api';

const Manage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const booksData = await fetchBooks();
        setBooks(booksData);
      } catch (err) {
        setError('Failed to load books.');
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleBookDelete = async (bookId) => {
    try {
      await deleteBook(bookId);
      setBooks((current) => current.filter((book) => book.id !== bookId));
    } catch (err) {
      console.error('Error deleting book:', err);
      setError('Failed to delete book.');
    }
  };

  if (loading) {
    return (
      <div className="loading-state surface-card-strong">
        <div className="loading-spinner"></div>
        <p>Loading catalog entries.</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="table-panel">
      <table className="table-shell">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>
                <div className="flex items-center gap-4">
                  <img
                    className="h-12 w-12 rounded-2xl object-cover"
                    src={book.cover_image_url || book.cover_image}
                    alt={book.title}
                  />
                  <div>
                    <p className="font-semibold text-[#211714]">{book.title}</p>
                  </div>
                </div>
              </td>
              <td>{book.author}</td>
              <td>{book.genre}</td>
              <td>{book.published_year}</td>
              <td>
                <button
                  onClick={() => handleBookDelete(book.id)}
                  className="btn btn-danger !px-4 !py-2 text-xs"
                  type="button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Manage;
