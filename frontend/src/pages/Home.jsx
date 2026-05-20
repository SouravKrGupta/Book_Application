import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBooks, fetchTopReviews } from '../data/api';
import { useApp } from '../context/AppContext';
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

const getReviewerInitials = (name = 'Reader') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R';

const Home = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeReview, setActiveReview] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useApp();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const booksData = await fetchBooks();
        setFeaturedBooks(booksData.slice(0, 4));
        const reviewsData = await fetchTopReviews();
        setReviews(reviewsData.slice(0, 4));
      } catch (err) {
        setError('Failed to load the home page data.');
      }
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % reviews.length);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [reviews]);

  useEffect(() => {
    if (activeReview >= reviews.length) {
      setActiveReview(0);
    }
  }, [activeReview, reviews.length]);

  const handlePrevReview = () => {
    setActiveReview((current) => (current - 1 + reviews.length) % reviews.length);
  };

  const handleNextReview = () => {
    setActiveReview((current) => (current + 1) % reviews.length);
  };

  return (
    <div className="page-shell space-y-16">
      <section className="section-hero animate-fade-up">
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="section-kicker">Curated reading platform</span>
            <h1 className="section-title">
              Find beautiful books, keep your place, and turn pages into richer experiences.
            </h1>
            <p className="section-copy">
              Book World blends a welcoming library atmosphere with modern tools like AI summaries,
              audio support, and progress-aware reading so every visit feels calm and purposeful.
            </p>
            <div className="section-actions">
              <Link to="/books" className="btn btn-primary">
                Explore the catalog
              </Link>
              <Link to={user ? '/library' : '/register'} className="btn btn-outline">
                {user ? 'Open my library' : 'Create an account'}
              </Link>
            </div>

            <div className="hero-metrics">
              <div className="metric-card">
                <p className="metric-value">AI</p>
                <p className="metric-label">Smart summaries, analytics, and listening support.</p>
              </div>
              <div className="metric-card">
                <p className="metric-value">PDF</p>
                <p className="metric-label">Read inside the app and resume from saved progress.</p>
              </div>
              <div className="metric-card">
                <p className="metric-value">Shelf</p>
                <p className="metric-label">Keep your personal reading list organized in one view.</p>
              </div>
            </div>
          </div>

          <div className="surface-card-dark p-6 sm:p-8">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-[rgba(255,247,239,0.58)]">Why readers stay</p>
              <h2 className="mt-4 text-3xl text-[#fff7ef]">
                A reading flow that feels more like a private study than a busy dashboard.
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  'Browse new titles with clearer covers and richer book details.',
                  'Jump back into unfinished books without losing momentum.',
                  'Use chapter audio, full-book audio, and AI-generated summaries when you need them.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f1c99a]" />
                    <p className="text-sm leading-7 text-[rgba(255,247,239,0.76)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8e766a]">Featured shelf</p>
            <h2 className="mt-3">Popular picks for your next reading session</h2>
          </div>
          <p>Start with a handpicked selection of books that look great, read smoothly, and invite longer visits.</p>
        </div>

        {loading ? (
          <div className="loading-state surface-card-strong">
            <div className="loading-spinner"></div>
            <p>Loading featured books and reviews.</p>
          </div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <div className="book-grid">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      <section className="surface-card-strong p-6 sm:p-8 lg:p-10">
        <div className="section-heading">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8e766a]">Reader notes</p>
            <h2 className="mt-3">What people are saying right now</h2>
          </div>
          <p>Recent impressions from the community help each visit feel alive, social, and grounded in real reading.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Gathering the latest reviews.</p>
          </div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <h3 className="text-2xl">No reviews to highlight yet</h3>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7">
              Once readers start sharing their thoughts, featured reactions will rotate here in a more immersive slider.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-[rgba(123,70,54,0.08)] bg-[linear-gradient(135deg,rgba(255,251,245,0.95),rgba(247,223,211,0.68))] shadow-[0_22px_65px_rgba(61,37,27,0.1)]">
            <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="border-b border-[rgba(123,70,54,0.08)] bg-[rgba(255,255,255,0.55)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8e766a]">Featured testimonials</p>
                <h3 className="mt-4 text-3xl">A rotating shelf of reader reactions.</h3>
                <p className="mt-4 text-base leading-7">
                  Each card slides through recent feedback so the community section feels lively instead of static.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-[1.4rem] bg-white/75 p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Reviews shown</p>
                    <p className="mt-2 text-3xl font-semibold text-[#211714]">{reviews.length}</p>
                  </div>
                  <div className="rounded-[1.4rem] bg-white/75 p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Current card</p>
                    <p className="mt-2 text-3xl font-semibold text-[#211714]">{activeReview + 1}</p>
                  </div>
                  <div className="rounded-[1.4rem] bg-white/75 p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Mode</p>
                    <p className="mt-2 text-lg font-semibold text-[#211714]">Auto-rotating</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
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
                      <div className="review-card h-full rounded-[1.8rem] border border-white/70 bg-white/90 p-6 sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[rgba(247,223,211,0.88)] text-sm font-bold uppercase tracking-[0.18em] text-[#7b4636]">
                              {getReviewerInitials(review.user_name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8e766a]">{review.book_name}</p>
                              <h3 className="mt-2 text-2xl">{review.user_name}</h3>
                              <p className="mt-2 text-sm">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-full bg-[rgba(247,223,211,0.82)] px-4 py-2">
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-8">
                          <span className="text-5xl leading-none text-[rgba(123,70,54,0.22)]">“</span>
                          <p className="-mt-4 border-l-2 border-[rgba(123,70,54,0.14)] pl-5 text-lg leading-8 text-[#3d2f29]">
                            {review.review_text}
                          </p>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(123,70,54,0.08)] pt-5">
                          <p className="text-sm text-[#8e766a]">Community highlight #{index + 1}</p>
                          <div className="flex items-center gap-2 rounded-full bg-[rgba(214,235,230,0.72)] px-4 py-2 text-sm font-semibold text-[#1f5b53]">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#2f746b]" />
                            Featured on the home page
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="surface-card-dark px-6 py-10 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.58)]">Ready to begin</p>
            <h2 className="mt-3 text-4xl text-[#fff7ef]">
              Settle into a better reading routine with tools that stay out of your way.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(255,247,239,0.72)]">
              Whether you want a quiet digital shelf or a feature-rich reading companion, the next step is already waiting.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to={user ? '/profile' : '/register'} className="btn btn-primary">
              {user ? 'Open profile' : 'Join Book World'}
            </Link>
            <Link to="/books" className="btn btn-outline border-white/20 bg-white/5 text-[#fff7ef] hover:bg-white/10">
              Browse books
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
