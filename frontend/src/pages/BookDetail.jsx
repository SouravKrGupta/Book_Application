import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  fetchBookDetail,
  fetchReviews,
  createReview,
  fetchBookPDF,
  fetchBookReadAloud,
  fetchLibrary,
  updateLibraryProgress,
} from '../data/api';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const bookData = await fetchBookDetail(id);
        setBook(bookData);
        const reviewsData = await fetchReviews(id);
        setReviews(reviewsData);
        if (user) {
          const lib = await fetchLibrary();
          const entry = lib.find(l => l.book.id === bookData.id);
          setLibraryEntry(entry);
          setProgress(entry ? entry.progress : 0);
        }
      } catch (err) {
        setError('Failed to load book details');
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line
  }, [id, user]);

  const handleAddToLibrary = async () => {
    if (!user) return navigate('/login');
    try {
      await updateLibraryProgress({ book_id: book.id, progress: 0, type: 'pdf' });
      const lib = await fetchLibrary();
      const entry = lib.find(l => l.book.id === book.id);
      setLibraryEntry(entry);
      setProgress(0);
    } catch (err) {
      setError('Failed to add to library');
    }
  };

  const handleProgressUpdate = async (val) => {
    setProgress(val);
    try {
      await updateLibraryProgress({ book_id: book.id, progress: val, type: 'pdf' });
      const lib = await fetchLibrary();
      const entry = lib.find(l => l.book.id === book.id);
      setLibraryEntry(entry);
    } catch (err) {
      setError('Failed to update progress');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!user) return navigate('/login');
    try {
      await createReview(book.id, { rating: reviewForm.rating, review_text: reviewForm.review_text });
      setReviewForm({ rating: 5, review_text: '' });
      const reviewsData = await fetchReviews(id);
      setReviews(reviewsData);
    } catch (err) {
      setReviewError('Failed to submit review');
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const blob = await fetchBookPDF(book.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${book.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF');
    }
    setPdfLoading(false);
  };

  const handleReadAloud = async () => {
    setAudioLoading(true);
    try {
      const blob = await fetchBookReadAloud(book.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      setError('Failed to play audio');
    }
    setAudioLoading(false);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!book) return <div className="text-center py-12">Book not found</div>;

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
              onClick={handleAddToLibrary}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              disabled={!!libraryEntry}
            >
              {libraryEntry ? 'In Library' : 'Add to Library'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handleReadAloud}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={audioLoading}
            >
              {audioLoading ? 'Loading audio...' : 'Read Aloud'}
            </button>
          </div>
          {libraryEntry && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
              <input
                type="range"
                min={0}
                max={libraryEntry.total || 100}
                value={progress}
                onChange={e => handleProgressUpdate(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{progress} / {libraryEntry.total || 100}</span>
                <span>{libraryEntry.percent_complete || 0}% complete</span>
              </div>
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
          <form className="mt-6" onSubmit={handleReviewSubmit}>
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
    </div>
  );
};

export default BookDetail; 