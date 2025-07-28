import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  fetchBookDetail,
  fetchReviews,
  createReview,
  fetchBookAnalytics,
  fetchBookAISummaryAudio,
} from '../data/api';
import BookCard from '../components/BookCard';
import { fetchRecommendations } from '../data/api';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, library } = useApp();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
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
      setError('');
      try {
        const bookData = await fetchBookDetail(id);
        setBook(bookData);
        const reviewsData = await fetchReviews(id);
        setReviews(reviewsData);
        // Fetch recommendations only if user is logged in
        if (user) {
          const recs = await fetchRecommendations();
          setRecommended(recs);
        } else {
          setRecommended([]);
        }
      } catch (err) {
        setError('Failed to load book details');
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line
  }, [id, user]);

  const handleOpenPDF = () => {
    if (!user) return navigate('/login');
    navigate(`/books/${book.id}/pdf-viewer`);
  };

  const handleFetchAnalytics = async () => {
    if (!user) return navigate('/login');
    setAnalyticsLoading(true);
    try {
      const analyticsData = await fetchBookAnalytics(book.id);
      setAnalytics(analyticsData);
      setShowAnalytics(true);
    } catch (err) {
      setError('Failed to fetch book analytics');
    }
    setAnalyticsLoading(false);
  };

  const handleFetchAISummary = async () => {
    if (!user) return navigate('/login');
    setAiSummaryLoading(true);
    setError('');
    try {
      const summaryData = await fetchBookAISummaryAudio(book.id);
      setAiSummary(summaryData.summary);
      setAiAudioUrl(summaryData.audio_url);
      setShowAiSummary(true);
    } catch (err) {
      if (err.message && err.message.includes('too large')) {
        setError('This book is too large for AI summary/audio. Please select a smaller book or use chapter audio.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to fetch AI summary');
      }
    }
    setAiSummaryLoading(false);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!book) return <div className="text-center py-12">Book not found</div>;

  // Find the library entry for this book
  const libraryEntry = library ? library.find(l => l.book.id === book.id) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={book.cover_image_url || (book.cover_image && book.cover_image)}
          alt={book.title}
          className="w-64 h-96 object-cover rounded-lg shadow"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
          <p className="text-lg text-gray-700 mb-1">by {book.author}</p>
          <p className="text-sm text-gray-500 mb-2">Genre: {book.genre} | Year: {book.published_year}</p>
          <p className="mb-4 text-gray-700">{book.description}</p>
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleOpenPDF}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={false}
            >
              Open PDF
            </button>
            <button
              onClick={handleFetchAnalytics}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={analyticsLoading}
            >
              {analyticsLoading ? 'Loading...' : 'View Analytics'}
            </button>
            <button
              onClick={handleFetchAISummary}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={aiSummaryLoading}
            >
              {aiSummaryLoading ? 'Loading...' : 'AI Summary & Audio'}
            </button>
          </div>
          {libraryEntry && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{libraryEntry.progress} / {libraryEntry.total || 100}</span>
                <span>{libraryEntry.percent_complete || 0}% complete</span>
              </div>
            </div>
          )}
          
          {/* Analytics Section */}
          {showAnalytics && analytics && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Book Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Pages:</span>
                  <p className="text-lg font-bold text-blue-600">{analytics.page_count}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Words:</span>
                  <p className="text-lg font-bold text-blue-600">{analytics.word_count?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Reading Time:</span>
                  <p className="text-lg font-bold text-blue-600">{analytics.estimated_reading_time_minutes} min</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Audio Duration:</span>
                  <p className="text-lg font-bold text-blue-600">{analytics.estimated_audio_duration_minutes} min</p>
                </div>
              </div>
              {analytics.top_keywords && analytics.top_keywords.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-gray-600">Top Keywords:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analytics.top_keywords.slice(0, 8).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {keyword.word} ({keyword.frequency})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Summary Section */}
          {showAiSummary && aiSummary && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-green-800">AI Summary</h3>
              <p className="text-gray-700 mb-4">{aiSummary}</p>
              {aiAudioUrl && (
                <div className="mt-4">
                  <audio controls className="w-full">
                    <source src={aiAudioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded shadow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">{review.user_name}</span>
                  <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700">{review.review_text}</p>
              </div>
            ))}
          </div>
        )}
        {user && user.type !== 'admin' && (
          <form className="mt-6" onSubmit={e => {
            e.preventDefault();
            setReviewError('');
            if (!user) return navigate('/login');
            createReview(book.id, { rating: reviewForm.rating, review_text: reviewForm.review_text })
              .then(() => {
                setReviewForm({ rating: 5, review_text: '' });
                return fetchReviews(id);
              })
              .then(setReviews)
              .catch(() => setReviewError('Failed to submit review'));
          }}>
            <h3 className="text-lg font-semibold mb-2">Add a Review</h3>
            {reviewError && <div className="text-red-600 mb-2">{reviewError}</div>}
            <div className="flex gap-2 mb-2">
              <select
                value={reviewForm.rating}
                onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="border rounded px-2 py-1"
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="text"
                value={reviewForm.review_text}
                onChange={e => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                placeholder="Write your review..."
                className="flex-1 border rounded px-2 py-1"
                required
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded">Submit</button>
            </div>
          </form>
        )}
      </div>
      {/* Recommendation Section */}
      {user && recommended.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Recommended Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommended.map((recBook) => (
              <BookCard key={recBook.id} book={recBook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail; 