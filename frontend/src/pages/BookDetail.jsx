import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const BookDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { books, user, addToLibrary, removeFromLibrary, addReview, library, updateReadingStatus, updateReadingProgress } = useApp()
  const book = books.find(b => b.id === parseInt(id))
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [isReading, setIsReading] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [readingMode, setReadingMode] = useState('normal') // normal, ai, voice
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [currentVoice, setCurrentVoice] = useState(null)
  const [pdfContent, setPdfContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extractedContent, setExtractedContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const userLibrary = library.find(l => l.userId === user?.id)
  const bookEntry = userLibrary?.books.find(b => b.id === book?.id)
  const isInLibrary = !!bookEntry
  const bookStatus = bookEntry?.status || 'not_started'
  const bookProgress = bookEntry?.progress || 0

  useEffect(() => {
    if (isReading && bookEntry) {
      setReadingProgress(bookProgress)
    }
  }, [isReading, bookEntry, bookProgress])

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices()
      setCurrentVoice(voices[0])
    }
  }, [])

  const fetchPdfContent = async (url) => {
    try {
      setIsLoading(true)
      const response = await fetch(url)
      const text = await response.text()
      // Basic HTML to text conversion
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = text
      const plainText = tempDiv.textContent || tempDiv.innerText
      setPdfContent(plainText)
      setIsLoading(false)
      return plainText
    } catch (error) {
      console.error('Error fetching PDF content:', error)
      setIsLoading(false)
      return ''
    }
  }

  const extractMainContent = async (htmlContent) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    // Remove header, footer, and navigation elements
    const elementsToRemove = tempDiv.querySelectorAll('header, footer, nav, .header, .footer, .navigation')
    elementsToRemove.forEach(el => el.remove())

    // Get main content
    const mainContent = tempDiv.querySelector('main, article, .content, .main-content, #content')
    if (mainContent) {
      return mainContent.textContent.trim()
    }

    // If no main content found, try to get the body content
    const body = tempDiv.querySelector('body')
    if (body) {
      return body.textContent.trim()
    }

    return tempDiv.textContent.trim()
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Book not found</h2>
          <button
            onClick={() => navigate('/books')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Return to Books
          </button>
        </div>
      </div>
    )
  }

  const handleLibraryToggle = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isInLibrary) {
      removeFromLibrary(book.id)
    } else {
      addToLibrary(book.id)
    }
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    addReview(book.id, reviewForm.rating, reviewForm.comment)
    setReviewForm({ rating: 5, comment: '' })
  }

  const handleDownload = () => {
    if (!book.pdfUrl) return
    window.open(book.pdfUrl, '_blank')
  }

  const handleReadNow = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!isInLibrary) {
      addToLibrary(book.id)
    }
    updateReadingStatus(book.id, 'reading')
    setIsReading(true)
  }

  const handleProgressUpdate = (progress) => {
    setReadingProgress(progress)
    updateReadingProgress(book.id, progress)
  }

  const handleComplete = () => {
    updateReadingStatus(book.id, 'completed', 100)
    setReadingProgress(100)
    setIsReading(false)
  }

  const handleAudioToggle = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (!isAudioPlaying) {
      try {
        setIsLoading(true)
        if (!extractedContent && book.pdfUrl) {
          const response = await fetch(book.pdfUrl)
          const text = await response.text()
          const mainContent = await extractMainContent(text)
          setExtractedContent(mainContent)
          
          const utterance = new SpeechSynthesisUtterance(mainContent)
          utterance.voice = currentVoice
          window.speechSynthesis.speak(utterance)
          setIsAudioPlaying(true)
        } else if (extractedContent) {
          const utterance = new SpeechSynthesisUtterance(extractedContent)
          utterance.voice = currentVoice
          window.speechSynthesis.speak(utterance)
          setIsAudioPlaying(true)
        }
      } catch (error) {
        console.error('Error reading content:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      window.speechSynthesis.cancel()
      setIsAudioPlaying(false)
    }
  }

  const handleAiAssist = async () => {
    if (!book.pdfUrl) return

    setReadingMode('ai')
    setIsAnalyzing(true)

    try {
      const response = await fetch(book.pdfUrl)
      const text = await response.text()
      const mainContent = await extractMainContent(text)

      // Analyze the content and generate suggestions
      const chapterMatch = mainContent.match(/Chapter \d+/g)
      const chapters = chapterMatch || []
      
      // Generate AI suggestions based on content
      const suggestions = [
        {
          type: 'summary',
          content: `This book contains ${chapters.length} chapters. The story follows...`
        },
        {
          type: 'key-points',
          content: [
            'Main characters and their roles',
            'Key plot points and developments',
            'Themes and messages'
          ]
        },
        {
          type: 'questions',
          content: [
            'What are the main themes of the story?',
            'How do the characters develop throughout the book?',
            'What is the significance of the title?'
          ]
        }
      ]

      setAiSuggestions(suggestions)
      setExtractedContent(mainContent)
    } catch (error) {
      console.error('Error analyzing content:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isReading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Reading Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsReading(false)}
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{book.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setReadingMode('normal')}
                  className={`p-2 rounded-lg ${
                    readingMode === 'normal'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  } hover:bg-indigo-50 transition-colors duration-200`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </button>
                <button
                  onClick={handleAiAssist}
                  className={`p-2 rounded-lg ${
                    readingMode === 'ai'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  } hover:bg-indigo-50 transition-colors duration-200`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
                <button
                  onClick={handleAudioToggle}
                  className={`p-2 rounded-lg ${
                    isAudioPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                  } hover:bg-indigo-50 transition-colors duration-200`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                  </svg>
                </button>
              </div>
              <div className="w-48">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleProgressUpdate(Math.min(readingProgress + 10, 100))}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                +10%
              </button>
              {readingProgress >= 100 && (
                <button
                  onClick={handleComplete}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Complete
                </button>
              )}
            </div>
          </div>

          {/* Reading Content */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            {readingMode === 'ai' && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">AI Reading Assistant</h3>
                {isAnalyzing ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                        <h4 className="font-medium text-indigo-800 mb-1">
                          {suggestion.type === 'summary' && 'Chapter Summary'}
                          {suggestion.type === 'key-points' && 'Key Points'}
                          {suggestion.type === 'questions' && 'Questions to Consider'}
                        </h4>
                        {Array.isArray(suggestion.content) ? (
                          <ul className="list-disc list-inside text-indigo-700">
                            {suggestion.content.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-indigo-700">{suggestion.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="w-full h-[calc(100vh-200px)]">
              <iframe
                src={book.pdfUrl}
                className="w-full h-full border-0"
                title={`${book.title} PDF Viewer`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img
              className="h-64 w-full object-cover md:w-48"
              src={book.cover}
              alt={book.title}
            />
          </div>
          <div className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
                <p className="mt-2 text-xl text-gray-600">by {book.author}</p>
              </div>
              <div className="flex space-x-4">
                {isInLibrary && (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      bookStatus === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bookStatus === 'completed' ? 'Completed' : 'Reading'}
                    </span>
                    {bookProgress > 0 && (
                      <span className="text-sm text-gray-600">
                        {bookProgress}%
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={handleReadNow}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {isInLibrary ? 'Continue Reading' : 'Read Now'}
                </button>
                <button
                  onClick={handleLibraryToggle}
                  className={`px-4 py-2 rounded-md ${
                    isInLibrary
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isInLibrary ? 'Remove from Library' : 'Add to Library'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(book.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-gray-600">{book.rating.toFixed(1)}</span>
              </div>
              <span className="mx-4 text-gray-300">|</span>
              <span className="text-gray-600">{book.genre}</span>
              <span className="mx-4 text-gray-300">|</span>
              <span className="text-gray-600">{book.publishedYear}</span>
              <span className="mx-4 text-gray-300">|</span>
              <span className="text-gray-600">{book.pages} pages</span>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900">Description</h2>
              <p className="mt-2 text-gray-600">{book.description}</p>
            </div>

            <div className="mt-6 flex space-x-4">
              {book.pdfUrl && (
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </button>
              )}
              <button
                onClick={handleReadNow}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Read Now
              </button>
              <button
                onClick={handleAudioToggle}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728"
                  />
                </svg>
                Listen
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>

          {/* Review Form */}
          {user && (
            <form onSubmit={handleReviewSubmit} className="mb-8">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <div className="mt-1 flex items-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`h-6 w-6 ${
                          rating <= reviewForm.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700"
                >
                  Your Review
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm(prev => ({ ...prev, comment: e.target.value }))
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Submit Review
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {book.reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
              book.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetail 