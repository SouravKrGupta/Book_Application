import { useEffect, useState } from 'react';
import { fetchAdminReviews, deleteReview } from '../../data/api';

const renderStars = (rating) =>
  [...Array(5)].map((_, index) => (
    <svg
      key={index}
      className={`h-4 w-4 ${index < rating ? 'text-amber-400' : 'text-[#d7c9bc]'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ));

const Reviews = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const reviewsData = await fetchAdminReviews();
        const groupedReviews = Object.values(
          reviewsData.reduce((accumulator, review) => {
            const bookId = review.book;
            if (!accumulator[bookId]) {
              accumulator[bookId] = {
                id: bookId,
                title: review.book_name,
                reviews: [],
              };
            }
            accumulator[bookId].reviews.push(review);
            return accumulator;
          }, {})
        );
        setBooks(groupedReviews);
      } catch (err) {
        setError('Failed to load reviews.');
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleReviewDelete = async (reviewId, bookId) => {
    try {
      await deleteReview(reviewId);
      setBooks((current) =>
        current.map((book) =>
          book.id === bookId
            ? { ...book, reviews: book.reviews.filter((review) => review.id !== reviewId) }
            : book
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-state surface-card-strong">
        <div className="loading-spinner"></div>
        <p>Loading reader reviews.</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {books.map((book) => (
        <div key={book.id} className="surface-card-strong p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Book</p>
              <h3 className="mt-3 text-3xl">{book.title}</h3>
            </div>
            <span className="genre-pill">{book.reviews.length} reviews</span>
          </div>

          {book.reviews.length === 0 ? (
            <div className="empty-state mt-6">
              <p className="text-base">No reviews for this title yet.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {book.reviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm">{review.created_at && new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleReviewDelete(review.id, book.id)}
                      className="btn btn-danger !px-4 !py-2 text-xs"
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-4 text-base leading-7">{review.review_text}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Reviews;
