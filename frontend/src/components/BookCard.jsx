import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const BookCard = ({ book }) => {
  const { user, addToLibrary, removeFromLibrary, library } = useApp()
  const userLibrary = library.find(l => l.userId === user?.id)
  const bookEntry = userLibrary?.books.find(b => b.id === book.id)
  const isInLibrary = !!bookEntry
  const bookStatus = bookEntry?.status || 'not_started'
  const bookProgress = bookEntry?.progress || 0

  const handleLibraryToggle = (e) => {
    e.preventDefault()
    if (!user) return
    
    if (isInLibrary) {
      removeFromLibrary(book.id)
    } else {
      addToLibrary(book.id)
    }
  }

  return (
    <Link
      to={`/books/${book.id}`}
      className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4]">
        <img
          src={book.cover}
          alt={book.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            bookStatus === 'completed' ? 'opacity-90' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex space-x-2">
            <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200">
              {isInLibrary ? 'Continue Reading' : 'Read Now'}
            </button>
            <button className="p-2 bg-white text-gray-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
              </svg>
            </button>
          </div>
        </div>
        {user && (
          <button
            onClick={handleLibraryToggle}
            className={`absolute top-2 right-2 p-2 rounded-full ${
              isInLibrary
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-indigo-600 hover:text-white'
            } transition-colors duration-200`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </button>
        )}
        {isInLibrary && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              bookStatus === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {bookStatus === 'completed' ? 'Completed' : 'Reading'}
            </span>
          </div>
        )}
        {bookStatus === 'completed' && (
          <div className="absolute top-2 right-2 left-2 flex justify-center">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{book.author}</p>
          </div>
        </div>
        
        {isInLibrary && bookProgress > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-gray-200 rounded-full">
              <div
                className={`h-1 rounded-full ${
                  bookStatus === 'completed' ? 'bg-green-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${bookProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {bookStatus === 'completed' ? 'Completed' : `${bookProgress}% complete`}
            </p>
          </div>
        )}
        
        {book.rating !== undefined && (
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
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
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {book.rating.toFixed(1)}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">{book.genre}</span>
          <span className="text-sm text-gray-500">{book.publishedYear}</span>
        </div>
      </div>
    </Link>
  )
}

export default BookCard 