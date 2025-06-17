import { useState } from 'react'
import { useApp } from '../context/AppContext'
import BookCard from '../components/BookCard'

const Library = () => {
  const { user, books, library } = useApp()
  const [filter, setFilter] = useState('all') // all, reading, completed

  const userLibrary = library.find(l => l.userId === user?.id)
  const userBooks = userLibrary 
    ? books.filter(book => userLibrary.books.some(b => b.id === book.id))
      .map(book => ({
        ...book,
        status: userLibrary.books.find(b => b.id === book.id).status,
        progress: userLibrary.books.find(b => b.id === book.id).progress
      }))
    : []

  const filteredBooks = userBooks.filter(book => {
    if (filter === 'all') return true
    if (filter === 'reading') return book.status === 'reading'
    if (filter === 'completed') return book.status === 'completed'
    return true
  })

  const stats = {
    reading: userBooks.filter(book => book.status === 'reading').length,
    completed: userBooks.filter(book => book.status === 'completed').length,
    total: userBooks.length
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in to view your library</h2>
          <p className="mt-2 text-gray-600">Sign in to access your saved books and reading progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Library</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Total Books</p>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Currently Reading</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.reading}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-green-600">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Books
          </button>
          <button
            onClick={() => setFilter('reading')}
            className={`px-4 py-2 rounded-md ${
              filter === 'reading'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Currently Reading
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md ${
              filter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No books found</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Add some books to your library to get started'
              : filter === 'completed'
              ? 'You haven\'t completed any books yet'
              : `No ${filter} books in your library`}
          </p>
        </div>
      ) : (
        <>
          {filter === 'completed' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-800">
                  You've completed {stats.completed} {stats.completed === 1 ? 'book' : 'books'}! Keep up the great reading!
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Library 