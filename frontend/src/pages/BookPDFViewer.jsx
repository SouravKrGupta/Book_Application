import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookDetail, updateLibraryProgress } from '../data/api';
import { useApp } from '../context/AppContext';

const BookPDFViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshLibrary } = useApp();
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const bookData = await fetchBookDetail(id);
        setBook(bookData);
        if (bookData.pdf_document_url) {
          setPdfUrl(bookData.pdf_document_url);
        } else {
            const token = localStorage.getItem('access');
            const response = await fetch(`http://localhost:8000/api/books/${id}/pdf/`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        }
      } catch (err) {
        setError('Failed to load book or PDF');
      }
    };
    load();
  }, [id, user, userLoading, navigate]);

  // Start timer on mount
  useEffect(() => {
    if (book) {
      startTimeRef.current = Date.now();
    }
    return () => {
      if (book && startTimeRef.current) {
        const endTime = Date.now();
        const minutesSpent = (endTime - startTimeRef.current) / 60000;
        const avgMinutesPerPage = 0.5;
        const pagesRead = Math.min(
          Math.round(minutesSpent / avgMinutesPerPage),
          book.total_pages
        );
        if (pagesRead > 0) {
          updateLibraryProgress({
            book_id: book.id,
            progress: pagesRead,
            type: 'pdf',
          }).then(() => {
            if (refreshLibrary) refreshLibrary();
          });
        }
      }
    };
  }, [book, refreshLibrary]);

  if (userLoading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!book) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100 py-8">
      <div className="w-full max-w-4xl px-2 sm:px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2 text-gray-800 drop-shadow-sm">{book.title}</h1>
          <p className="text-lg font-serif mb-1 text-gray-700">by {book.author}</p>
          <p className="text-sm text-gray-500 mb-4">Total Pages: {book.total_pages}</p>
        </div>
        <div className="relative flex justify-center items-center" style={{ minHeight: '70vh' }}>
          {/* Book effect container */}
          <div className="relative w-full max-w-3xl h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex items-stretch border border-yellow-200" style={{ boxShadow: '0 8px 32px 0 rgba(60, 40, 10, 0.12)' }}>
            {/* PDF iframe */}
            <iframe
              src={pdfUrl}
              title="PDF Viewer"
              width="100%"
              height="100%"
              className="p-6 sm:p-10 bg-transparent"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookPDFViewer; 