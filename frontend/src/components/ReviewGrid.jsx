import { useEffect, useState } from 'react';

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

const getInitials = (name = 'Reader') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R';

const formatReviewDate = (value) => {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const ReviewGrid = ({
  reviews,
  emptyTitle,
  emptyText,
  showBookName = false,
  visibleCount = 3,
  columnsClassName = 'lg:grid-cols-3',
}) => {
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(0);
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="text-2xl">{emptyTitle}</h3>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7">{emptyText}</p>
      </div>
    );
  }

  const canSlide = reviews.length > visibleCount;
  const cardsToShow = Math.min(visibleCount, reviews.length);
  const visibleReviews = Array.from({ length: cardsToShow }, (_, offset) => {
    const index = (startIndex + offset) % reviews.length;
    return reviews[index];
  });

  const handlePrev = () => {
    setStartIndex((current) => (current - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setStartIndex((current) => (current + 1) % reviews.length);
  };

  return (
    <div className="space-y-5">
      <div className={`review-grid ${columnsClassName}`}>
        {visibleReviews.map((review, index) => {
          const rating = Number(review.rating) || 0;
          const reviewText = review.review_text?.trim() || 'No written review provided yet.';

          return (
            <article key={review.id ?? `${review.user_name}-${startIndex + index}`} className="review-grid-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="review-avatar">{getInitials(review.user_name)}</div>
                  <div>
                    {showBookName && review.book_name && <p className="review-chip">{review.book_name}</p>}
                    <h3 className="review-slider-name">{review.user_name || 'Reader'}</h3>
                    <p className="review-slider-date">{formatReviewDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="review-rating">
                  <div className="flex items-center gap-1">{renderStars(rating)}</div>
                  <span className="review-rating-value">{rating}/5</span>
                </div>
              </div>

              <p className="review-grid-copy">{reviewText}</p>
            </article>
          );
        })}
      </div>

      <div className="review-grid-footer">
        <p className="review-grid-status">
          Showing {cardsToShow} of {reviews.length} reviews
        </p>
        <div className="review-slider-controls">
          <button
            onClick={handlePrev}
            className="review-slider-control disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            aria-label="Previous reviews"
            disabled={!canSlide}
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <button
            onClick={handleNext}
            className="review-slider-control disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            aria-label="Next reviews"
            disabled={!canSlide}
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewGrid;
