import { useState } from 'react'
import { createBook } from '../../data/api'

const Upload = () => {
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: '',
    publishedYear: '',
    pages: '',
    description: '',
    cover: '',
    pdfUrl: ''
  })
  const [coverFile, setCoverFile] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadType, setUploadType] = useState({
    cover: 'url',
    pdf: 'url'
  })

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (type === 'cover') {
      setCoverFile(file)
      setNewBook(prev => ({ ...prev, cover: '' }))
    } else {
      setPdfFile(file)
      setNewBook(prev => ({ ...prev, pdfUrl: '' }))
    }
  }

  const handleBookSubmit = async (e) => {
    e.preventDefault()

    let bookData = {
      title: newBook.title,
      author: newBook.author,
      genre: newBook.genre,
      publishedYear: newBook.publishedYear,
      description: newBook.description,
    }

    // Cover
    if (uploadType.cover === 'file' && coverFile) {
      bookData.coverFile = coverFile
    } else if (uploadType.cover === 'url' && newBook.cover) {
      bookData.cover = newBook.cover
    }

    // PDF
    if (uploadType.pdf === 'file' && pdfFile) {
      bookData.pdfFile = pdfFile
    } else if (uploadType.pdf === 'url' && newBook.pdfUrl) {
      bookData.pdfUrl = newBook.pdfUrl
    }

    if (newBook.pages) {
      bookData.pages = Number(newBook.pages);
    }

    try {
      await createBook(bookData)
      alert('Book uploaded successfully!')
      // Reset form
      setNewBook({
        title: '', author: '', genre: '', publishedYear: '', pages: '', description: '', cover: '', pdfUrl: ''
      })
      setCoverFile(null)
      setPdfFile(null)
    } catch (err) {
      alert('Failed to upload book: ' + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Book</h2>
      <form onSubmit={handleBookSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Author</label>
            <input
              type="text"
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Genre</label>
            <input
              type="text"
              value={newBook.genre}
              onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Published Year</label>
            <input
              type="text"
              value={newBook.publishedYear}
              onChange={(e) => setNewBook({ ...newBook, publishedYear: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pages</label>
            <input
              type="number"
              value={newBook.pages}
              onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setUploadType(prev => ({ ...prev, cover: 'url' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                uploadType.cover === 'url'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Use URL
            </button>
            <button
              type="button"
              onClick={() => setUploadType(prev => ({ ...prev, cover: 'file' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                uploadType.cover === 'file'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upload File
            </button>
          </div>
          {uploadType.cover === 'url' ? (
            <input
              type="url"
              value={newBook.cover}
              onChange={(e) => setNewBook({ ...newBook, cover: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter cover image URL"
            />
          ) : (
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'cover')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {coverFile && (
                <p className="mt-2 text-sm text-gray-500">Selected file: {coverFile.name}</p>
              )}
            </div>
          )}
        </div>

        {/* PDF Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">PDF Document</label>
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setUploadType(prev => ({ ...prev, pdf: 'url' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                uploadType.pdf === 'url'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Use URL
            </button>
            <button
              type="button"
              onClick={() => setUploadType(prev => ({ ...prev, pdf: 'file' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                uploadType.pdf === 'file'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upload File
            </button>
          </div>
          {uploadType.pdf === 'url' ? (
            <input
              type="url"
              value={newBook.pdfUrl}
              onChange={(e) => setNewBook({ ...newBook, pdfUrl: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter PDF URL"
            />
          ) : (
            <div className="mt-1">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, 'pdf')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {pdfFile && (
                <p className="mt-2 text-sm text-gray-500">Selected file: {pdfFile.name}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={newBook.description}
            onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Book
          </button>
        </div>
      </form>
    </div>
  )
}

export default Upload 