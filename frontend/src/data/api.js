const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const getBackendHost = () => {
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  try {
    const parsedApiUrl = new URL(API_BASE, fallbackOrigin);
    return `${parsedApiUrl.protocol}//${parsedApiUrl.host}`;
  } catch {
    return fallbackOrigin;
  }
};

const BACKEND_HOST = getBackendHost();

const buildUrl = (path, params) => {
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : BACKEND_HOST;
  const url = new URL(`${API_BASE}${path}`, fallbackOrigin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
};

const createApiError = async (response, fallbackMessage) => {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  const detail =
    data?.detail ||
    (Array.isArray(data?.non_field_errors) ? data.non_field_errors.join(' ') : null) ||
    (typeof data === 'string' ? data : null) ||
    fallbackMessage;

  const error = new Error(detail || fallbackMessage);
  error.response = {
    status: response.status,
    data,
  };
  throw error;
};

const apiRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    data,
    headers = {},
    params,
    responseType = 'json',
    fallbackMessage = 'Request failed.',
  } = options;

  const requestHeaders = { ...headers };
  const config = {
    method,
    headers: requestHeaders,
  };

  if (data !== undefined) {
    if (data instanceof FormData) {
      config.body = data;
    } else {
      requestHeaders['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }
  }

  const response = await fetch(buildUrl(path, params), config);

  if (!response.ok) {
    await createApiError(response, fallbackMessage);
  }

  if (response.status === 204) {
    return null;
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const getCoverUrl = (book) => {
  if (book.cover_image_url) {
    return book.cover_image_url.startsWith('http')
      ? book.cover_image_url
      : `${BACKEND_HOST}${book.cover_image_url.startsWith('/') ? '' : '/'}${book.cover_image_url}`;
  }
  if (book.cover_image) {
    return book.cover_image.startsWith('http')
      ? book.cover_image
      : `${BACKEND_HOST}${book.cover_image.startsWith('/') ? '' : '/'}${book.cover_image}`;
  }
  return '/default-cover.png';
};

const normalizeBook = (book) => ({
  ...book,
  cover_image_url: getCoverUrl(book),
});

const normalizeReview = (review) => ({
  ...review,
  user_name: review.user_name || 'Anonymous reader',
  book_name: review.book_name || 'Untitled book',
});

const getAuthHeaders = () => {
  const access = localStorage.getItem('access');
  return access ? { Authorization: `Bearer ${access}` } : {};
};

const extractApiError = (err, fallbackMessage) => {
  if (err.response?.data?.detail) return err.response.data.detail;
  if (typeof err.response?.data === 'string') return err.response.data;
  if (err.message) return err.message;
  return fallbackMessage;
};

export const loginUser = async (username, password) => {
  return apiRequest('/login/', {
    method: 'POST',
    data: { username, password },
    fallbackMessage: 'Login failed.',
  });
};

export const registerUser = async (data) => {
  return apiRequest('/register/', {
    method: 'POST',
    data,
    fallbackMessage: 'Registration failed.',
  });
};

export const fetchBooks = async () => {
  const data = await apiRequest('/books/', {
    fallbackMessage: 'Failed to fetch books.',
  });
  return data.map(normalizeBook);
};

export const fetchBookDetail = async (id) => {
  const data = await apiRequest(`/books/${id}/`, {
    fallbackMessage: 'Failed to fetch book details.',
  });
  return normalizeBook(data);
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
  if (data.pages) {
    formData.append('total_pages', data.pages);
  }
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
  };
  const response = await apiRequest('/books/', {
    method: 'POST',
    data: formData,
    headers,
    fallbackMessage: 'Failed to create book.',
  });
  return normalizeBook(response);
};

export const updateBook = async (id, data) => {
  const response = await apiRequest(`/books/${id}/`, {
    method: 'PUT',
    data,
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to update book.',
  });
  return normalizeBook(response);
};

export const deleteBook = async (id) => {
  await apiRequest(`/books/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to delete book.',
  });
};

export const fetchReviews = async (bookId) => {
  const data = await apiRequest(`/books/${bookId}/reviews/`, {
    fallbackMessage: 'Failed to fetch reviews.',
  });
  return data.map(normalizeReview);
};

export const createReview = async (bookId, data) => {
  try {
    const response = await apiRequest(`/books/${bookId}/reviews/`, {
      method: 'POST',
      data,
      headers: getAuthHeaders(),
      fallbackMessage: 'Failed to submit review.',
    });
    return normalizeReview(response);
  } catch (err) {
    throw new Error(extractApiError(err, 'Failed to submit review.'));
  }
};

export const deleteReview = async (reviewId) => {
  await apiRequest(`/reviews/${reviewId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to delete review.',
  });
};

export const fetchAdminReviews = async () => {
  const data = await apiRequest('/reviews/', {
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to fetch admin reviews.',
  });
  return data.map(normalizeReview);
};

export const fetchTopReviews = async () => {
  const data = await apiRequest('/topreviews/', {
    fallbackMessage: 'Failed to fetch top reviews.',
  });
  return data.map(normalizeReview);
};

export const searchBooks = async (params) => {
  const data = await apiRequest('/books/search/', {
    params,
    fallbackMessage: 'Failed to search books.',
  });
  return data.map(normalizeBook);
};

export const fetchBookPDF = async (id) => {
  return apiRequest(`/books/${id}/pdf/`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
    fallbackMessage: 'Failed to fetch PDF.',
  });
};

export const getAudioProgress = async (bookId) => {
  return apiRequest('/library/audio-progress/', {
    headers: getAuthHeaders(),
    params: { book_id: bookId },
    fallbackMessage: 'Failed to fetch audio progress.',
  });
};

export const updateAudioProgress = async (bookId, progress, total) => {
  return apiRequest('/library/update/', {
    method: 'POST',
    data: {
      book_id: bookId,
      progress,
      total,
      type: 'audio',
    },
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to update audio progress.',
  });
};

export const fetchLibrary = async () => {
  const data = await apiRequest('/library/', {
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to fetch library.',
  });
  // Normalize book covers in library entries
  return data.map(entry => ({ ...entry, book: normalizeBook(entry.book) }));
};

export const updateLibraryProgress = async (data) => {
  return apiRequest('/library/update/', {
    method: 'POST',
    data,
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to update library progress.',
  });
};

export const fetchRecommendations = async () => {
  const data = await apiRequest('/recommendations/', {
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to fetch recommendations.',
  });
  return data.map(normalizeBook);
};

export const deleteLibraryEntry = async ({ book_id, type }) => {
  // If type is provided, send as query param; if not, omit to delete both types
  const params = { book_id };
  if (type) params.type = type;
  await apiRequest('/library/', {
    method: 'DELETE',
    headers: getAuthHeaders(),
    params,
    fallbackMessage: 'Failed to delete library entry.',
  });
};

// New API endpoints for enhanced book features

export const fetchBookTextExtraction = async (id, startPage = null, endPage = null) => {
  const params = {};
  if (startPage) params.start_page = startPage;
  if (endPage) params.end_page = endPage;

  return apiRequest(`/books/${id}/text/`, {
    headers: getAuthHeaders(),
    params,
    fallbackMessage: 'Failed to extract book text.',
  });
};

export const fetchBookAnalytics = async (id, options = {}) => {
  const params = {};
  if (options.refresh) params.refresh = 1;

  return apiRequest(`/books/${id}/analytics/`, {
    headers: getAuthHeaders(),
    params,
    fallbackMessage: 'Failed to fetch book analytics.',
  });
};

export const generateChapterAudio = async (id, startPage, endPage, options = {}) => {
  try {
    return await apiRequest(`/books/${id}/chapter-audio/`, {
      method: 'POST',
      data: {
        start_page: startPage,
        end_page: endPage,
        refresh: options.refresh ? 1 : 0,
      },
      headers: getAuthHeaders(),
      fallbackMessage: 'Failed to generate chapter audio.',
    });
  } catch (err) {
    throw new Error(extractApiError(err, 'Failed to generate chapter audio.'));
  }
};

export const fetchBookAISummaryAudio = async (id, options = {}) => {
  try {
    return await apiRequest(`/books/${id}/ai-summary-audio/`, {
      headers: getAuthHeaders(),
      params: options.refresh ? { refresh: 1 } : {},
      fallbackMessage: 'Failed to fetch AI summary.',
    });
  } catch (err) {
    throw new Error(extractApiError(err, 'Failed to fetch AI summary.'));
  }
};

export const fetchBookFullAudio = async (id, options = {}) => {
  try {
    return await apiRequest(`/books/${id}/full-audio/`, {
      headers: getAuthHeaders(),
      params: options.refresh ? { refresh: 1 } : {},
      fallbackMessage: 'Failed to generate full audio.',
    });
  } catch (err) {
    throw new Error(extractApiError(err, 'Failed to generate full audio.'));
  }
};

export const fetchUserProfile = async () => {
  return apiRequest('/profile/', {
    headers: getAuthHeaders(),
    fallbackMessage: 'Failed to fetch user profile.',
  });
};
