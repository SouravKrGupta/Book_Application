import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchBookDetail, updateLibraryProgress, getAudioProgress, updateAudioProgress, fetchBookTextExtraction, generateChapterAudio, fetchBookFullAudio } from '../data/api';
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
  
  // New state for text extraction and chapter audio
  const [extractedText, setExtractedText] = useState('');
  const [showTextExtraction, setShowTextExtraction] = useState(false);
  const [textExtractionLoading, setTextExtractionLoading] = useState(false);
  const [chapterAudioLoading, setChapterAudioLoading] = useState(false);
  const [fullAudioLoading, setFullAudioLoading] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [chapterAudioUrl, setChapterAudioUrl] = useState(null);

  // Get page from query string
  const query = new URLSearchParams(location.search);
  const page = query.get('page');

  useEffect(() => {
    let isMounted = true;
    if (userLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const bookData = await fetchBookDetail(id);
        if (!isMounted) return;
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
        // Only update progress if not already set (avoid non-stop API calls)
        try {
          await updateLibraryProgress({ book_id: id, type: 'pdf', progress: 0, total: bookData.total_pages || 100 });
          // Optionally: if (refreshLibrary) refreshLibrary();
        } catch (e) {
          // Optionally handle error (e.g., already in library)
        }
      } catch (err) {
        if (isMounted) setError('Failed to load book or PDF');
      }
    };
    load();
    return () => { isMounted = false; };
  }, [id, user, userLoading, navigate, page]);

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
      // Generate audio for first 5 pages as demo
      const audioData = await generateChapterAudio(book.id, 1, Math.min(5, book.total_pages));
      const url = audioData.audio_url;
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

  const handleTextExtraction = async () => {
    setTextExtractionLoading(true);
    try {
      const textData = await fetchBookTextExtraction(book.id, startPage, endPage);
      setExtractedText(textData.text);
      setShowTextExtraction(true);
    } catch (err) {
      setError('Failed to extract text');
    }
    setTextExtractionLoading(false);
  };

  const handleChapterAudio = async () => {
    setChapterAudioLoading(true);
    setError('');
    try {
      if ((endPage - startPage + 1) > 20) {
        setError('You can only generate audio for up to 20 pages at a time.');
        setChapterAudioLoading(false);
        return;
      }
      const audioData = await generateChapterAudio(book.id, startPage, endPage);
      setChapterAudioUrl(audioData.audio_url);
    } catch (err) {
      if (err.message && err.message.includes('too large')) {
        setError('Selected chapter is too large for audio conversion. Please select a smaller range (max 20 pages or 10,000 characters).');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to generate chapter audio');
      }
    }
    setChapterAudioLoading(false);
  };

  const handleFullAudio = async () => {
    setFullAudioLoading(true);
    setError('');
    try {
      const audioData = await fetchBookFullAudio(book.id);
      const url = audioData.audio_url;
      setAudioUrl(url);
      const audioObj = new window.Audio(url);
      audioRef.current = audioObj;
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
      if (err.message && err.message.includes('too large')) {
        setError('This book is too large for full audio conversion. Please use the summary audio or chapter audio feature.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to generate full audio');
      }
    }
    setFullAudioLoading(false);
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
          {/* Page Range Controls */}
          <div className="flex gap-4 mb-4 items-center">
            <label className="text-sm font-medium">Page Range:</label>
            <input
              type="number"
              min="1"
              max={book.total_pages}
              value={startPage}
              onChange={(e) => setStartPage(Number(e.target.value))}
              className="w-16 px-2 py-1 border rounded text-sm"
              placeholder="Start"
            />
            <span>to</span>
            <input
              type="number"
              min={startPage}
              max={book.total_pages}
              value={endPage}
              onChange={(e) => setEndPage(Number(e.target.value))}
              className="w-16 px-2 py-1 border rounded text-sm"
              placeholder="End"
            />
          </div>
          
          {/* Text Extraction Controls */}
          <div className="flex gap-2 mb-4 flex-wrap justify-center">
            <button
              onClick={handleTextExtraction}
              disabled={textExtractionLoading}
              className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50 text-sm"
            >
              {textExtractionLoading ? 'Extracting...' : 'Extract Text'}
            </button>
            <button
              onClick={handleChapterAudio}
              disabled={chapterAudioLoading}
              className="px-3 py-2 bg-green-500 text-white rounded disabled:opacity-50 text-sm"
            >
              {chapterAudioLoading ? 'Generating...' : 'Chapter Audio'}
            </button>
            <button
              onClick={handleFullAudio}
              disabled={fullAudioLoading}
              className="px-3 py-2 bg-purple-500 text-white rounded disabled:opacity-50 text-sm"
            >
              {fullAudioLoading ? 'Generating...' : 'Full Book Audio'}
            </button>
          </div>
          
          {/* Original Audio Controls */}
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

        {/* Text Extraction Display */}
        {showTextExtraction && extractedText && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">
              Extracted Text (Pages {startPage}-{endPage})
            </h3>
            <div className="max-h-64 overflow-y-auto bg-white p-4 rounded border">
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {extractedText}
              </p>
            </div>
            <button
              onClick={() => setShowTextExtraction(false)}
              className="mt-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Hide Text
            </button>
          </div>
        )}

        {/* Chapter Audio Display */}
        {chapterAudioUrl && (
          <div className="mt-8 p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-green-800">
              Chapter Audio (Pages {startPage}-{endPage})
            </h3>
            <audio controls className="w-full">
              <source src={chapterAudioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPDFViewer; 