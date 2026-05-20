import { useState } from 'react';
import { createBook } from '../../data/api';

const Upload = () => {
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: '',
    publishedYear: '',
    pages: '',
    description: '',
    cover: '',
    pdfUrl: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadType, setUploadType] = useState({
    cover: 'url',
    pdf: 'url',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (type === 'cover') {
      setCoverFile(file);
      setNewBook((prev) => ({ ...prev, cover: '' }));
    } else {
      setPdfFile(file);
      setNewBook((prev) => ({ ...prev, pdfUrl: '' }));
    }
  };

  const handleBookSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const bookData = {
      title: newBook.title,
      author: newBook.author,
      genre: newBook.genre,
      publishedYear: newBook.publishedYear,
      description: newBook.description,
    };

    if (uploadType.cover === 'file' && coverFile) {
      bookData.coverFile = coverFile;
    } else if (uploadType.cover === 'url' && newBook.cover) {
      bookData.cover = newBook.cover;
    }

    if (uploadType.pdf === 'file' && pdfFile) {
      bookData.pdfFile = pdfFile;
    } else if (uploadType.pdf === 'url' && newBook.pdfUrl) {
      bookData.pdfUrl = newBook.pdfUrl;
    }

    if (newBook.pages) {
      bookData.pages = Number(newBook.pages);
    }

    try {
      await createBook(bookData);
      setMessage('Book uploaded successfully.');
      setNewBook({
        title: '',
        author: '',
        genre: '',
        publishedYear: '',
        pages: '',
        description: '',
        cover: '',
        pdfUrl: '',
      });
      setCoverFile(null);
      setPdfFile(null);
    } catch (err) {
      setError(`Failed to upload book: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="surface-card-strong p-6 sm:p-8">
      <div className="section-heading">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e766a]">Add new title</p>
          <h2 className="mt-3 text-3xl">Upload a book to the library</h2>
        </div>
        <p>Keep the submission flow clear by separating URL-based uploads from direct file uploads.</p>
      </div>

      {message && <div className="info-banner mb-6">{message}</div>}
      {error && <div className="error-banner mb-6">{error}</div>}
      <div className="info-banner mb-6">
        URL mode works best with direct public file links. If a website blocks direct access to its PDF or image, use file upload instead.
      </div>

      <form onSubmit={handleBookSubmit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="field-label">Title</label>
            <input
              type="text"
              value={newBook.title}
              onChange={(event) => setNewBook({ ...newBook, title: event.target.value })}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label">Author</label>
            <input
              type="text"
              value={newBook.author}
              onChange={(event) => setNewBook({ ...newBook, author: event.target.value })}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label">Genre</label>
            <input
              type="text"
              value={newBook.genre}
              onChange={(event) => setNewBook({ ...newBook, genre: event.target.value })}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label">Published year</label>
            <input
              type="text"
              value={newBook.publishedYear}
              onChange={(event) => setNewBook({ ...newBook, publishedYear: event.target.value })}
              className="field-input"
              required
            />
          </div>
          <div>
            <label className="field-label">Pages</label>
            <input
              type="number"
              value={newBook.pages}
              onChange={(event) => setNewBook({ ...newBook, pages: event.target.value })}
              className="field-input"
              required
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-5">
            <label className="field-label">Cover image</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setUploadType((prev) => ({ ...prev, cover: 'url' }))}
                className={`filter-chip ${uploadType.cover === 'url' ? 'filter-chip-active' : ''}`}
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => setUploadType((prev) => ({ ...prev, cover: 'file' }))}
                className={`filter-chip ${uploadType.cover === 'file' ? 'filter-chip-active' : ''}`}
              >
                Upload file
              </button>
            </div>

            <div className="mt-4">
              {uploadType.cover === 'url' ? (
                <input
                  type="url"
                  value={newBook.cover}
                  onChange={(event) => setNewBook({ ...newBook, cover: event.target.value })}
                  className="field-input"
                  placeholder="Enter cover image URL"
                />
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-[rgba(123,70,54,0.18)] bg-white/70 p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, 'cover')}
                    className="block w-full text-sm text-[#5f4c44] file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(247,223,211,0.82)] file:px-4 file:py-2 file:font-semibold file:text-[#7b4636]"
                  />
                  {coverFile && <p className="mt-3 text-sm">Selected file: {coverFile.name}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <label className="field-label">PDF document</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setUploadType((prev) => ({ ...prev, pdf: 'url' }))}
                className={`filter-chip ${uploadType.pdf === 'url' ? 'filter-chip-active' : ''}`}
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => setUploadType((prev) => ({ ...prev, pdf: 'file' }))}
                className={`filter-chip ${uploadType.pdf === 'file' ? 'filter-chip-active' : ''}`}
              >
                Upload file
              </button>
            </div>

            <div className="mt-4">
              {uploadType.pdf === 'url' ? (
                <input
                  type="url"
                  value={newBook.pdfUrl}
                  onChange={(event) => setNewBook({ ...newBook, pdfUrl: event.target.value })}
                  className="field-input"
                  placeholder="Enter PDF URL"
                />
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-[rgba(123,70,54,0.18)] bg-white/70 p-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(event) => handleFileChange(event, 'pdf')}
                    className="block w-full text-sm text-[#5f4c44] file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(247,223,211,0.82)] file:px-4 file:py-2 file:font-semibold file:text-[#7b4636]"
                  />
                  {pdfFile && <p className="mt-3 text-sm">Selected file: {pdfFile.name}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            value={newBook.description}
            onChange={(event) => setNewBook({ ...newBook, description: event.target.value })}
            rows={4}
            className="field-textarea"
            required
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Add book
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upload;
