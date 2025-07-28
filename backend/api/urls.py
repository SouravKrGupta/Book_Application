from django.urls import path
from .views import RegisterView, LoginView, BookListCreateView, BookDetailView, ReviewListCreateView, ReviewDeleteView, ReviewAdminListView, BookSearchView, BookPDFView, UserLibraryView, UpdateLibraryProgressView, BookRecommendationView,TopReviewsView, get_audio_progress, UserProfileView, BookAISummaryAudioView, BookFullAudioView, BookTextExtractionView, BookChapterAudioView, BookAnalyticsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('books/', BookListCreateView.as_view(), name='book-list-create'),
    path('books/<int:id>/', BookDetailView.as_view(), name='book-detail'),
    path('books/<int:book_id>/reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/', ReviewAdminListView.as_view(), name='review-admin-list'),
    path('reviews/<int:review_id>/', ReviewDeleteView.as_view(), name='review-delete'),
    path('topreviews/', TopReviewsView.as_view(), name='top-reviews'),
    path('books/search/', BookSearchView.as_view(), name='book-search'),
    path('books/<int:id>/pdf/', BookPDFView.as_view(), name='book-pdf'),
    path('books/<int:id>/text/', BookTextExtractionView.as_view(), name='book-text-extraction'),
    path('books/<int:id>/analytics/', BookAnalyticsView.as_view(), name='book-analytics'),
    path('books/<int:id>/chapter-audio/', BookChapterAudioView.as_view(), name='book-chapter-audio'),
    path('books/<int:id>/ai-summary-audio/', BookAISummaryAudioView.as_view(), name='book-ai-summary-audio'),
    path('books/<int:id>/full-audio/', BookFullAudioView.as_view(), name='book-full-audio'),
    path('library/', UserLibraryView.as_view(), name='user-library'),
    path('library/update/', UpdateLibraryProgressView.as_view(), name='update-library-progress'),
    path('recommendations/', BookRecommendationView.as_view(), name='book-recommendations'),
    path('library/audio-progress/', get_audio_progress, name='audio-progress'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
] 