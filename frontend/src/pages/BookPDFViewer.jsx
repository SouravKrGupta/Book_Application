import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchBookDetail, updateLibraryProgress, addBookToLibrary, fetchBookAudio, getAudioProgress, updateAudioProgress } from '../data/api';
import { useApp } from '../context/AppContext';

const BookPDFViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading, refreshLibrary } = useApp();
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const startTimeRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // seconds
  const [audioTotal, setAudioTotal] = useState(0); // seconds
  const audioRef = useRef(null);

  // Get page from query string
  const query = new URLSearchParams(location.search);
  const page = query.get('page');

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
        let url = '';
        if (bookData.pdf_document_url) {
          url = bookData.pdf_document_url;
        } else {
            const token = localStorage.getItem('access');
            const response = await fetch(`http://localhost:8000/api/books/${id}/pdf/`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const blob = await response.blob();
            url = URL.createObjectURL(blob);
        }
        // If a page is specified, try to append #page=...
        if (page) {
          url += `#page=${page}`;
        }
        setPdfUrl(url);
        // Add book to library (if not already present)
        try {
          await addBookToLibrary({ book_id: id, type: 'pdf' });
          if (refreshLibrary) refreshLibrary();
        } catch (e) {
          // Optionally handle error (e.g., already in library)
        }
      } catch (err) {
        setError('Failed to load book or PDF');
      }
    };
    load();
  }, [id, user, userLoading, navigate, refreshLibrary, page]);

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

  // Fetch audio progress on mount
  useEffect(() => {
    if (!book) return;
    getAudioProgress(book.id).then(data => {
      setAudioProgress(data.progress || 0);
      setAudioTotal(data.total || 0);
    });
  }, [book]);

  // Handle audio events
  useEffect(() => {
    if (!audio) return;
    const handleTimeUpdate = () => {
      setAudioProgress(audio.currentTime);
    };
    const handleEnded = () => {
      setAudioPlaying(false);
      updateAudioProgress(book.id, audio.currentTime, audio.duration);
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio, book]);

  const handleStartAudio = async () => {
    setAudioLoading(true);
    try {
      // For demo, use start_page = 1, end_page = 5 (or all pages)
      const blob = await fetchBookAudio(book.id, 1); // You can add endPage if needed
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audioObj = new window.Audio(url);
      audioRef.current = audioObj;
      // Resume from last progress if available
      if (audioProgress > 0) {
        audioObj.currentTime = audioProgress;
      }
      audioObj.play();
      setAudio(audioObj);
      setAudioPlaying(true);
      audioObj.onended = () => {
        setAudioPlaying(false);
        updateAudioProgress(book.id, audioObj.currentTime, audioObj.duration);
      };
    } catch (err) {
      setError('Failed to play audio');
    }
    setAudioLoading(false);
  };

  const handlePauseAudio = () => {
    if (audio) {
      audio.pause();
      setAudioPlaying(false);
      updateAudioProgress(book.id, audio.currentTime, audio.duration);
    }
  };

  const handleResumeAudio = () => {
    if (audio) {
      audio.play();
      setAudioPlaying(true);
    }
  };

  const handleStopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudioPlaying(false);
      updateAudioProgress(book.id, 0, audio.duration);
    }
  };

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
        <div className="flex flex-col items-center mb-6">
          <div className="flex gap-4 mb-2">
            <button onClick={handleStartAudio} disabled={audioLoading || audioPlaying} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">{audioLoading ? 'Loading...' : 'Start Audio'}</button>
            <button onClick={handlePauseAudio} disabled={!audioPlaying} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Pause</button>
            <button onClick={handleResumeAudio} disabled={audioPlaying || !audioUrl} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Resume</button>
            <button onClick={handleStopAudio} disabled={!audioPlaying && !audioUrl} className="px-4 py-2 bg-red-400 text-white rounded disabled:opacity-50">Stop</button>
          </div>
          <div className="w-full max-w-md">
            <div className="h-2 bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: audioTotal ? `${(audioProgress / audioTotal) * 100}%` : '0%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.floor(audioProgress)}s</span>
              <span>{audioTotal ? Math.floor(audioTotal) : '--'}s</span>
            </div>
          </div>
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