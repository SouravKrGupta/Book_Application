import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchBookDetail,
  fetchBookPDF,
  updateLibraryProgress,
  getAudioProgress,
  updateAudioProgress,
  fetchBookTextExtraction,
  generateChapterAudio,
  fetchBookFullAudio,
} from '../data/api';
import { useApp } from '../context/AppContext';

const BookPDFViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading, refreshLibrary } = useApp();
  const [book, setBook] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const startTimeRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTotal, setAudioTotal] = useState(0);
  const audioRef = useRef(null);

  const [extractedText, setExtractedText] = useState('');
  const [showTextExtraction, setShowTextExtraction] = useState(false);
  const [textExtractionLoading, setTextExtractionLoading] = useState(false);
  const [chapterAudioLoading, setChapterAudioLoading] = useState(false);
  const [fullAudioLoading, setFullAudioLoading] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [chapterAudioUrl, setChapterAudioUrl] = useState(null);

  const query = new URLSearchParams(location.search);
  const page = query.get('page');

  useEffect(() => {
    let isMounted = true;
    let generatedObjectUrl = null;

    if (userLoading) return undefined;
    if (!user) {
      navigate('/login');
      return undefined;
    }

    const load = async () => {
      try {
        setLoadError('');
        const bookData = await fetchBookDetail(id);
        if (!isMounted) return;

        setBook(bookData);
        setEndPage(bookData.total_pages ? Math.min(1, bookData.total_pages) : 1);

        let url = '';
        if (bookData.pdf_document_url) {
          url = bookData.pdf_document_url;
        } else {
          const pdfBlob = await fetchBookPDF(id);
          generatedObjectUrl = URL.createObjectURL(pdfBlob);
          url = generatedObjectUrl;
        }

        if (page) {
          url += `#page=${page}`;
        }

        setPdfUrl(url);

        try {
          await updateLibraryProgress({
            book_id: id,
            type: 'pdf',
            progress: 0,
            total: bookData.total_pages || 100,
          });
        } catch (err) {
          console.error(err);
        }
      } catch (err) {
        if (isMounted) setLoadError('Failed to load the book or PDF.');
      }
    };

    load();

    return () => {
      isMounted = false;
      if (generatedObjectUrl) URL.revokeObjectURL(generatedObjectUrl);
    };
  }, [id, user, userLoading, navigate, page]);

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

  useEffect(() => {
    if (!book) return;
    getAudioProgress(book.id).then((data) => {
      setAudioProgress(data.progress || 0);
      setAudioTotal(data.total || 0);
    });
  }, [book]);

  useEffect(() => {
    if (!audio || !book) return undefined;

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
    if (!book) return;

    setAudioLoading(true);
    setMessage('');
    try {
      const audioData = await generateChapterAudio(book.id, 1, Math.min(5, book.total_pages));
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
      setMessage('Failed to play audio.');
    }
    setAudioLoading(false);
  };

  const handlePauseAudio = () => {
    if (audio && book) {
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
    if (audio && book) {
      audio.pause();
      audio.currentTime = 0;
      setAudioPlaying(false);
      updateAudioProgress(book.id, 0, audio.duration);
    }
  };

  const handleTextExtraction = async () => {
    if (!book) return;

    setTextExtractionLoading(true);
    setMessage('');
    try {
      const textData = await fetchBookTextExtraction(book.id, startPage, endPage);
      setExtractedText(textData.text);
      setShowTextExtraction(true);
    } catch (err) {
      setMessage('Failed to extract text.');
    }
    setTextExtractionLoading(false);
  };

  const handleChapterAudio = async () => {
    if (!book) return;

    setChapterAudioLoading(true);
    setMessage('');
    try {
      if (endPage - startPage + 1 > 20) {
        setMessage('You can only generate audio for up to 20 pages at a time.');
        setChapterAudioLoading(false);
        return;
      }
      const audioData = await generateChapterAudio(book.id, startPage, endPage);
      setChapterAudioUrl(audioData.audio_url);
    } catch (err) {
      if (err.message && err.message.includes('too large')) {
        setMessage('Selected chapter is too large for audio conversion. Try a smaller page range.');
      } else if (err.message) {
        setMessage(err.message);
      } else {
        setMessage('Failed to generate chapter audio.');
      }
    }
    setChapterAudioLoading(false);
  };

  const handleFullAudio = async () => {
    if (!book) return;

    setFullAudioLoading(true);
    setMessage('');
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
        setMessage('This book is too large for full audio conversion. Use summary audio or chapter audio instead.');
      } else if (err.message) {
        setMessage(err.message);
      } else {
        setMessage('Failed to generate full audio.');
      }
    }
    setFullAudioLoading(false);
  };

  if (userLoading) {
    return (
      <div className="reader-shell">
        <div className="loading-state surface-card-strong">
          <div className="loading-spinner"></div>
          <p>Preparing the reader.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="reader-shell">
        <div className="error-banner">{loadError}</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="reader-shell">
        <div className="loading-state surface-card-strong">
          <div className="loading-spinner"></div>
          <p>Loading reader content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-shell space-y-8">
      <section className="surface-card-dark px-6 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.58)]">Reader mode</p>
            <h1 className="mt-3 text-4xl text-[#fff7ef]">{book.title}</h1>
            <p className="mt-3 text-base font-semibold text-[rgba(255,247,239,0.82)]">by {book.author}</p>
            <p className="mt-3 text-sm text-[rgba(255,247,239,0.62)]">Total pages: {book.total_pages}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Reader tools</p>
            <p className="mt-3 text-sm leading-7">
              Extract passages, generate audio, and keep the reading space focused on the book itself.
            </p>
          </div>
        </div>
      </section>

      {message && <div className="error-banner">{message}</div>}

      <section className="reader-toolbar">
        <div className="grid gap-5 lg:grid-cols-[220px_220px_minmax(0,1fr)] lg:items-end">
          <div>
            <label className="field-label" htmlFor="reader-start-page">Start page</label>
            <input
              id="reader-start-page"
              type="number"
              min="1"
              max={book.total_pages}
              value={startPage}
              onChange={(event) => setStartPage(Number(event.target.value))}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="reader-end-page">End page</label>
            <input
              id="reader-end-page"
              type="number"
              min={startPage}
              max={book.total_pages}
              value={endPage}
              onChange={(event) => setEndPage(Number(event.target.value))}
              className="field-input"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleTextExtraction} disabled={textExtractionLoading} className="btn btn-outline" type="button">
              {textExtractionLoading ? 'Extracting...' : 'Extract text'}
            </button>
            <button onClick={handleChapterAudio} disabled={chapterAudioLoading} className="btn btn-secondary" type="button">
              {chapterAudioLoading ? 'Generating...' : 'Chapter audio'}
            </button>
            <button onClick={handleFullAudio} disabled={fullAudioLoading} className="btn btn-primary" type="button">
              {fullAudioLoading ? 'Generating...' : 'Full-book audio'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleStartAudio} disabled={audioLoading || audioPlaying} className="btn btn-primary" type="button">
            {audioLoading ? 'Loading...' : 'Start audio'}
          </button>
          <button onClick={handlePauseAudio} disabled={!audioPlaying} className="btn btn-outline" type="button">
            Pause
          </button>
          <button onClick={handleResumeAudio} disabled={audioPlaying || !audioUrl} className="btn btn-soft" type="button">
            Resume
          </button>
          <button onClick={handleStopAudio} disabled={!audioPlaying && !audioUrl} className="btn btn-danger" type="button">
            Stop
          </button>
        </div>

        <div>
          <div className="audio-bar">
            <div
              className="audio-bar-fill"
              style={{ width: audioTotal ? `${(audioProgress / audioTotal) * 100}%` : '0%' }}
            />
          </div>
          <div className="meta-row mt-2 justify-between">
            <span>{Math.floor(audioProgress)} seconds</span>
            <span>{audioTotal ? Math.floor(audioTotal) : '--'} seconds</span>
          </div>
        </div>
      </section>

      <section className="reader-panel">
        <div className="reader-frame">
          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            width="100%"
            height="100%"
            className="h-full min-h-[70vh] w-full bg-transparent p-4 sm:p-6"
            style={{ border: 'none' }}
          />
        </div>
      </section>

      {showTextExtraction && extractedText && (
        <section className="surface-card-strong p-6">
          <div className="section-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Extracted text</p>
              <h2 className="mt-3 text-3xl">Pages {startPage} to {endPage}</h2>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[rgba(123,70,54,0.1)] bg-white/80 p-5">
            <p className="whitespace-pre-wrap text-sm leading-8 text-[#5f4c44]">{extractedText}</p>
          </div>
          <button onClick={() => setShowTextExtraction(false)} className="btn btn-outline mt-5" type="button">
            Hide text
          </button>
        </section>
      )}

      {chapterAudioUrl && (
        <section className="surface-card-strong p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Chapter audio</p>
          <h2 className="mt-3 text-3xl">Pages {startPage} to {endPage}</h2>
          <audio controls className="mt-5 w-full">
            <source src={chapterAudioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </section>
      )}
    </div>
  );
};

export default BookPDFViewer;
