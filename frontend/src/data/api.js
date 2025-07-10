import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';
const BACKEND_HOST = 'http://localhost:8000';

const getCoverUrl = (book) => {
  if (book.cover_image_url) {
    return book.cover_image_url.startsWith('http')
      ? book.cover_image_url
      : `${BACKEND_HOST}${book.cover_image_url}`;
  }
  if (book.cover_image) {
    return book.cover_image.startsWith('http')
      ? book.cover_image
      : `${BACKEND_HOST}${book.cover_image}`;
  }
  return '/default-cover.png';
};

const normalizeBook = (book) => ({
  ...book,
  cover_image_url: getCoverUrl(book),
});

const getAuthHeaders = () => {
  const access = localStorage.getItem('access');
  return access ? { Authorization: `Bearer ${access}` } : {};
};

export const fetchBooks = async () => {
  const res = await axios.get(`${API_BASE}/books/`);
  return res.data.map(normalizeBook);
};

export const fetchBookDetail = async (id) => {
  const res = await axios.get(`${API_BASE}/books/${id}/`);
  return normalizeBook(res.data);
};

export const fetchBookById = async (id) => {
  // Alias for admin/library use
  return fetchBookDetail(id);
};

export const createBook = async (data) => {
  // If data contains files, use FormData
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('author', data.author);
  formData.append('genre', data.genre);
  formData.append('published_year', data.publishedYear || data.published_year);
  formData.append('description', data.description || '');

  // Cover image: file or URL
  if (data.coverFile) {
    formData.append('cover_image', data.coverFile);
  } else if (data.cover) {
    formData.append('cover_image_url', data.cover);
  }

  // PDF: file or URL
  if (data.pdfFile) {
    formData.append('pdf_document', data.pdfFile);
  } else if (data.pdfUrl) {
    formData.append('pdf_document_url', data.pdfUrl);
  }

  // Add any other fields as needed

  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'multipart/form-data',
  };

  const res = await axios.post(`${API_BASE}/books/`, formData, { headers });
  return normalizeBook(res.data);
};

export const updateBook = async (id, data) => {
  const res = await axios.put(`${API_BASE}/books/${id}/`, data, { headers: getAuthHeaders() });
  return normalizeBook(res.data);
};

export const deleteBook = async (id) => {
  await axios.delete(`${API_BASE}/books/${id}/`, { headers: getAuthHeaders() });
};

export const fetchReviews = async (bookId) => {
  const res = await axios.get(`${API_BASE}/books/${bookId}/reviews/`);
  return res.data;
};

export const createReview = async (bookId, data) => {
  const res = await axios.post(`${API_BASE}/books/${bookId}/reviews/`, data, { headers: getAuthHeaders() });
  return res.data;
};

export const deleteReview = async (reviewId) => {
  await axios.delete(`${API_BASE}/reviews/${reviewId}/`, { headers: getAuthHeaders() });
};

export const fetchTopReviews = async () => {
  const res = await axios.get(`${API_BASE}/topreviews/`);
  return res.data;
};

export const searchBooks = async (params) => {
  const res = await axios.get(`${API_BASE}/books/search/`, { params });
  return res.data.map(normalizeBook);
};

export const fetchBookPDF = async (id) => {
  const res = await axios.get(`${API_BASE}/books/${id}/pdf/`, { headers: getAuthHeaders(), responseType: 'blob' });
  return res.data;
};

export const fetchBookReadAloud = async (id) => {
  const res = await axios.get(`${API_BASE}/books/${id}/read-aloud/`, { headers: getAuthHeaders(), responseType: 'blob' });
  return res.data;
};

export const fetchLibrary = async () => {
  const res = await axios.get(`${API_BASE}/library/`, { headers: getAuthHeaders() });
  // Normalize book covers in library entries
  return res.data.map(entry => ({ ...entry, book: normalizeBook(entry.book) }));
};

export const updateLibraryProgress = async (data) => {
  const res = await axios.post(`${API_BASE}/library/update/`, data, { headers: getAuthHeaders() });
  return res.data;
};

export const fetchRecommendations = async () => {
  const res = await axios.get(`${API_BASE}/recommendations/`, { headers: getAuthHeaders() });
  return res.data.map(normalizeBook);
}; 