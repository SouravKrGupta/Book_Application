import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBooks, fetchTopReviews } from '../data/api';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import ReviewGrid from '../components/ReviewGrid';

const Home = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
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
        setReviews(reviewsData.slice(0, 5));
      } catch (err) {
        setError('Failed to load the home page data.');
      }
      setLoading(false);
    };

    load();
  }, []);

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

      <section>
        <div className="section-heading">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8e766a]">Reader reviews</p>
            <h2 className="mt-3">Latest thoughts from the community</h2>
          </div>
          <p>Three review cards stay visible, and the left and right arrows let visitors slide through more feedback.</p>
        </div>

        {loading ? (
          <div className="loading-state surface-card-strong">
            <div className="loading-spinner"></div>
            <p>Gathering the latest reviews.</p>
          </div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <ReviewGrid
            reviews={reviews}
            showBookName
            emptyTitle="No reviews to show yet"
            emptyText="Reviews will appear here once readers start sharing their thoughts."
          />
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
