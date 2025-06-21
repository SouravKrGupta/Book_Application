from django.urls import path
from .views import RegisterView, LoginView, BookListCreateView, BookDetailView, ReviewListCreateView, ReviewDeleteView, ReviewAdminListView, BookSearchView, BookPDFView, BookReadAloudView, UserLibraryView, UpdateLibraryProgressView, BookRecommendationView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('books/', BookListCreateView.as_view(), name='book-list-create'),
    path('books/<int:id>/', BookDetailView.as_view(), name='book-detail'),
    path('books/<int:book_id>/reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/', ReviewAdminListView.as_view(), name='review-admin-list'),
    path('reviews/<int:review_id>/', ReviewDeleteView.as_view(), name='review-delete'),
    path('books/search/', BookSearchView.as_view(), name='book-search'),
    path('books/<int:id>/pdf/', BookPDFView.as_view(), name='book-pdf'),
    path('books/<int:id>/read-aloud/', BookReadAloudView.as_view(), name='book-read-aloud'),
    path('library/', UserLibraryView.as_view(), name='user-library'),
    path('library/update/', UpdateLibraryProgressView.as_view(), name='update-library-progress'),
    path('recommendations/', BookRecommendationView.as_view(), name='book-recommendations'),
] 