import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  fetchBookDetail,
  fetchReviews,
  createReview,
  fetchBookAnalytics,
  fetchBookAISummaryAudio,
  fetchRecommendations,
} from '../data/api';
import BookCard from '../components/BookCard';

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

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, library } = useApp();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [activeReview, setActiveReview] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiAudioUrl, setAiAudioUrl] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setPageError('');
      setMessage('');
      try {
        const bookData = await fetchBookDetail(id);
        setBook(bookData);
        const reviewsData = await fetchReviews(id);
        setReviews(reviewsData);

        if (user) {
          const recs = await fetchRecommendations();
          setRecommended(recs.filter((item) => item.id !== bookData.id).slice(0, 4));
        } else {
          setRecommended([]);
        }
      } catch (err) {
        setPageError('Failed to load book details.');
      }
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    if (reviews.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [reviews]);

  useEffect(() => {
    if (activeReview >= reviews.length) {
      setActiveReview(0);
    }
  }, [activeReview, reviews.length]);

  const handleOpenPDF = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/books/${book.id}/pdf-viewer`);
  };

  const handleFetchAnalytics = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAnalyticsLoading(true);
    setMessage('');
    try {
      const analyticsData = await fetchBookAnalytics(book.id);
      setAnalytics(analyticsData);
      setShowAnalytics(true);
    } catch (err) {
      setMessage('Failed to fetch book analytics.');
    }
    setAnalyticsLoading(false);
  };

  const handleFetchAISummary = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAiSummaryLoading(true);
    setMessage('');
    try {
      const summaryData = await fetchBookAISummaryAudio(book.id);
      setAiSummary(summaryData.summary);
      setAiAudioUrl(summaryData.audio_url);
      setShowAiSummary(true);
    } catch (err) {
      if (err.message && err.message.includes('too large')) {
        setMessage('This book is too large for AI summary or audio. Try a smaller title or use chapter audio.');
      } else if (err.message) {
        setMessage(err.message);
      } else {
        setMessage('Failed to fetch AI summary.');
      }
    }
    setAiSummaryLoading(false);
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    if (!user) {
      navigate('/login');
      return;
    }

    setReviewSubmitting(true);

    createReview(book.id, {
      rating: reviewForm.rating,
      review_text: reviewForm.review_text.trim(),
    })
      .then(() => {
        setReviewForm({ rating: 5, review_text: '' });
        setReviewSuccess('Your review has been added.');
        return fetchReviews(id);
      })
      .then(setReviews)
      .catch((err) => setReviewError(err.message || 'Failed to submit review.'))
      .finally(() => setReviewSubmitting(false));
  };

  if (loading) {
    return (
      <div className="page-shell-tight">
        <div className="loading-state surface-card-strong">
          <div className="loading-spinner"></div>
          <p>Loading book details.</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="page-shell-tight">
        <div className="error-banner">{pageError}</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="page-shell-tight">
        <div className="empty-state">
          <h2 className="text-3xl">Book not found</h2>
        </div>
      </div>
    );
  }

  const libraryEntry = library ? library.find((entry) => entry.book.id === book.id) : null;
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handlePrevReview = () => {
    setActiveReview((current) => (current - 1 + reviews.length) % reviews.length);
  };

  const handleNextReview = () => {
    setActiveReview((current) => (current + 1) % reviews.length);
  };

  return (
    <div className="page-shell-tight space-y-10">
      {message && <div className="error-banner">{message}</div>}

      <section className="surface-card-strong p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[1.8rem] border border-white/70 shadow-[0_22px_65px_rgba(61,37,27,0.18)]">
              <img
                src={book.cover_image_url || book.cover_image}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Edition facts</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#8e766a]">Genre</p>
                  <p className="mt-1 font-semibold text-[#211714]">{book.genre || 'General'}</p>
                </div>
                <div>
                  <p className="text-[#8e766a]">Year</p>
                  <p className="mt-1 font-semibold text-[#211714]">{book.published_year || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[#8e766a]">Pages</p>
                  <p className="mt-1 font-semibold text-[#211714]">{book.total_pages || 'Not listed'}</p>
                </div>
                <div>
                  <p className="text-[#8e766a]">Reviews</p>
                  <p className="mt-1 font-semibold text-[#211714]">{reviews.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="genre-pill">{book.genre || 'Featured title'}</span>
            <h1 className="mt-4 text-4xl sm:text-5xl">{book.title}</h1>
            <p className="mt-3 text-lg font-semibold text-[#5f4c44]">by {book.author}</p>
            <p className="mt-5 max-w-3xl text-base leading-8">{book.description}</p>

            <div className="meta-row mt-6">
              <span>{book.published_year || 'Year unavailable'}</span>
              <span className="h-1 w-1 rounded-full bg-[#8e766a]" />
              <span>{book.total_pages ? `${book.total_pages} pages` : 'Page count unavailable'}</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={handleOpenPDF} className="btn btn-primary" type="button">
                Open PDF reader
              </button>
              <button
                onClick={handleFetchAnalytics}
                className="btn btn-outline"
                disabled={analyticsLoading}
                type="button"
              >
                {analyticsLoading ? 'Loading analytics...' : 'View analytics'}
              </button>
              <button
                onClick={handleFetchAISummary}
                className="btn btn-secondary"
                disabled={aiSummaryLoading}
                type="button"
              >
                {aiSummaryLoading ? 'Preparing summary...' : 'AI summary and audio'}
              </button>
            </div>

            {libraryEntry && (
              <div className="mt-8 surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8e766a]">Reading progress</p>
                    <p className="mt-2 text-2xl font-semibold text-[#211714]">{libraryEntry.percent_complete || 0}% complete</p>
                  </div>
                  <span className={`status-pill ${libraryEntry.percent_complete === 100 ? 'status-complete' : 'status-reading'}`}>
                    {libraryEntry.percent_complete === 100 ? 'Finished' : 'In progress'}
                  </span>
                </div>
                <div className="audio-bar mt-4">
                  <div
                    className="audio-bar-fill"
                    style={{ width: `${libraryEntry.percent_complete || 0}%` }}
                  />
                </div>
                <div className="meta-row mt-2 justify-between">
                  <span>{libraryEntry.progress || 0} pages tracked</span>
                  <span>{libraryEntry.total || book.total_pages || '--'} total pages</span>
                </div>
              </div>
            )}

            {showAnalytics && analytics && (
              <div className="mt-8 surface-card p-6">
                <div className="section-heading !mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Analytics</p>
                    <h2 className="mt-3 text-3xl">Reading snapshot</h2>
                  </div>
                  <p>Quick facts generated from the book to help readers understand the scope before they start.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.35rem] bg-white/80 p-4">
                    <p className="text-sm text-[#8e766a]">Pages</p>
                    <p className="mt-2 text-3xl font-semibold text-[#211714]">{analytics.page_count}</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-white/80 p-4">
                    <p className="text-sm text-[#8e766a]">Words</p>
                    <p className="mt-2 text-3xl font-semibold text-[#211714]">{analytics.word_count?.toLocaleString?.() || analytics.word_count}</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-white/80 p-4">
                    <p className="text-sm text-[#8e766a]">Reading time</p>
                    <p className="mt-2 text-3xl font-semibold text-[#211714]">{analytics.estimated_reading_time_minutes} min</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-white/80 p-4">
                    <p className="text-sm text-[#8e766a]">Audio duration</p>
                    <p className="mt-2 text-3xl font-semibold text-[#211714]">{analytics.estimated_audio_duration_minutes} min</p>
                  </div>
                </div>

                {analytics.top_keywords && analytics.top_keywords.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8e766a]">Top keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {analytics.top_keywords.slice(0, 10).map((keyword, index) => (
                        <span
                          key={`${keyword.word}-${index}`}
                          className="rounded-full bg-[rgba(247,223,211,0.82)] px-3 py-1.5 text-sm font-semibold text-[#7b4636]"
                        >
                          {keyword.word} ({keyword.frequency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showAiSummary && aiSummary && (
              <div className="mt-8 surface-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">AI companion</p>
                <h2 className="mt-3 text-3xl">Summary and listening mode</h2>
                <p className="mt-4 text-base leading-8">{aiSummary}</p>
                {aiAudioUrl && (
                  <audio controls className="mt-6 w-full">
                    <source src={aiAudioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="surface-card-strong p-6 sm:p-8">
          <div className="section-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Community reviews</p>
              <h2 className="mt-3">Reader impressions</h2>
            </div>
            <p>
              Browse reactions from other readers, then leave your own note once you have spent time with the book.
              {averageRating && <span className="ml-2 font-semibold text-[#211714]">Average rating: {averageRating}/5</span>}
            </p>
          </div>

          {reviews.length === 0 ? (
            <div className="empty-state">
              <h3 className="text-2xl">No reviews yet</h3>
              <p className="mx-auto mt-3 max-w-lg text-base leading-7">Be the first reader to share what stood out, what surprised you, or what made this book worth revisiting.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.8rem] border border-[rgba(123,70,54,0.08)] bg-[linear-gradient(135deg,rgba(255,251,245,0.98),rgba(247,223,211,0.66))] shadow-[0_20px_45px_rgba(61,37,27,0.08)]">
              <div className="grid gap-0 xl:grid-cols-[0.78fr_1.22fr]">
                <div className="border-b border-[rgba(123,70,54,0.08)] bg-white/55 p-6 sm:p-7 xl:border-b-0 xl:border-r">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Review slider</p>
                  <h3 className="mt-3 text-3xl">Move through reader impressions one card at a time.</h3>
                  <p className="mt-4 text-base leading-7">
                    This keeps feedback easier to scan while still letting each review feel featured.
                  </p>

                  <div className="mt-7 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-[1.3rem] bg-white/80 p-4">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Total reviews</p>
                      <p className="mt-2 text-3xl font-semibold text-[#211714]">{reviews.length}</p>
                    </div>
                    <div className="rounded-[1.3rem] bg-white/80 p-4">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Average</p>
                      <p className="mt-2 text-3xl font-semibold text-[#211714]">{averageRating}/5</p>
                    </div>
                    <div className="rounded-[1.3rem] bg-white/80 p-4">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Current card</p>
                      <p className="mt-2 text-3xl font-semibold text-[#211714]">{activeReview + 1}</p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handlePrevReview}
                      className="btn btn-outline !h-12 !w-12 !rounded-full !p-0"
                      type="button"
                      aria-label="Previous review"
                    >
                      <span aria-hidden="true">←</span>
                    </button>
                    <button
                      onClick={handleNextReview}
                      className="btn btn-primary !h-12 !w-12 !rounded-full !p-0"
                      type="button"
                      aria-label="Next review"
                    >
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {reviews.map((review, index) => (
                      <button
                        key={review.id}
                        onClick={() => setActiveReview(index)}
                        className={`h-3 rounded-full transition-all duration-300 ${
                          index === activeReview ? 'w-10 bg-[#7b4636]' : 'w-3 bg-[rgba(123,70,54,0.24)]'
                        }`}
                        type="button"
                        aria-label={`Go to review ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden p-3 sm:p-4">
                  <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${activeReview * 100}%)` }}
                  >
                    {reviews.map((review, index) => (
                      <article key={review.id} className="min-w-full p-2">
                        <div className="review-card h-full rounded-[1.6rem] border border-white/70 bg-white/92 p-6 sm:p-8">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(247,223,211,0.9)] text-sm font-bold uppercase tracking-[0.18em] text-[#7b4636]">
                                {getInitials(review.user_name)}
                              </div>
                              <div>
                                <h3 className="text-xl">{review.user_name}</h3>
                                <p className="mt-1 text-sm">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="rounded-full bg-[rgba(247,223,211,0.82)] px-4 py-2">
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8e766a]">Review #{index + 1}</p>
                            <p className="mt-4 border-l-2 border-[rgba(123,70,54,0.14)] pl-4 text-base leading-8">{review.review_text}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Share your review</p>
            <h2 className="mt-3 text-2xl">Tell other readers what stood out.</h2>

            {!user && (
              <div className="mt-5 space-y-4">
                <p className="text-sm leading-7">
                  Sign in as a reader to rate this book and add your thoughts to the community section.
                </p>
                <Link to="/login" className="btn btn-primary w-full">
                  Sign in to review
                </Link>
              </div>
            )}

            {user?.type === 'admin' && (
              <div className="info-banner mt-5">
                Admin accounts can manage reviews, but only reader accounts can post them.
              </div>
            )}

            {user && user.type !== 'admin' && (
              <form className="mt-5 space-y-5" onSubmit={handleReviewSubmit}>
                {reviewSuccess && <div className="info-banner">{reviewSuccess}</div>}
                {reviewError && <div className="error-banner">{reviewError}</div>}
                <div>
                  <label htmlFor="review-rating" className="field-label">Rating</label>
                  <select
                    id="review-rating"
                    value={reviewForm.rating}
                    onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
                    className="field-select"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} star{rating > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="review-text" className="field-label">Your thoughts</label>
                  <textarea
                    id="review-text"
                    value={reviewForm.review_text}
                    onChange={(event) => setReviewForm({ ...reviewForm, review_text: event.target.value })}
                    placeholder="Write your review here"
                    className="field-textarea"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting review...' : 'Submit review'}
                </button>
              </form>
            )}
          </div>

          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Reading notes</p>
            <h2 className="mt-3 text-2xl">Ways to use this page</h2>
            <div className="mt-5 space-y-4">
              {[
                'Open the PDF reader to start or resume the book.',
                'Use analytics before diving in if you want a sense of scale.',
                'Generate an AI summary when you need a quick orientation.',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-[1.2rem] bg-white/70 p-4">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#b8785b]" />
                  <p className="text-sm leading-7">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {user && recommended.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Recommended next</p>
              <h2 className="mt-3">Similar books you may want to open next</h2>
            </div>
            <p>Suggestions based on your available recommendations so the next good read is already lined up.</p>
          </div>
          <div className="book-grid">
            {recommended.map((recBook) => (
              <BookCard key={recBook.id} book={recBook} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BookDetail;
