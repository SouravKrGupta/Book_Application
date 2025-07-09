import { useEffect, useState } from 'react';
import { fetchReviews, deleteReview, fetchBooks } from '../../data/api';

const Reviews = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const booksData = await fetchBooks();
        // For each book, fetch its reviews
        const booksWithReviews = await Promise.all(
          booksData.map(async (book) => {
            const reviews = await fetchReviews(book.id);
            return { ...book, reviews };
          })
        );
        setBooks(booksWithReviews);
      } catch (err) {
        setError('Failed to load reviews');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleReviewDelete = async (reviewId, bookId) => {
    try {
      await deleteReview(reviewId);
      setBooks(books => books.map(book => book.id === bookId ? { ...book, reviews: book.reviews.filter(r => r.id !== reviewId) } : book));
    } catch {}
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : books.map((book) => (
        <div key={book.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{book.title}</h3>
            <span className="text-sm text-gray-500">{book.reviews.length} reviews</span>
          </div>
          <div className="space-y-4">
            {book.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{review.created_at && new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleReviewDelete(review.id, book.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-2 text-gray-600">{review.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reviews; 