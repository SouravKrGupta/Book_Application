from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, BookSerializer, ReviewSerializer, LibrarySerializer
from .models import Book, Review, Library
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from django.db.models import Q
from django.http import FileResponse, Http404
import os
from django.conf import settings
import tempfile
from django.utils import timezone
import fitz  # PyMuPDF
import pyttsx3
import requests
from django.shortcuts import redirect
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'mobile': user.mobile,
                    'email': user.email,
                    'type': user.type,
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'mobile': user.mobile,
                    'email': user.email,
                    'type': user.type,
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        books = Book.objects.all()
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not (request.user.is_authenticated and getattr(request.user, 'type', None) == 'admin'):
            return Response({'detail': 'Only admin users can add books.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        serializer = BookSerializer(book)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, id):
        if not (request.user.is_authenticated and getattr(request.user, 'type', None) == 'admin'):
            return Response({'detail': 'Only admin users can update books.'}, status=status.HTTP_403_FORBIDDEN)
        book = get_object_or_404(Book, pk=id)
        serializer = BookSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        if not (request.user.is_authenticated and getattr(request.user, 'type', None) == 'admin'):
            return Response({'detail': 'Only admin users can delete books.'}, status=status.HTTP_403_FORBIDDEN)
        book = get_object_or_404(Book, pk=id)
        book.delete()
        return Response({'detail': 'Book deleted.'}, status=status.HTTP_204_NO_CONTENT)

class ReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, book_id):
        book = get_object_or_404(Book, pk=book_id)
        reviews = Review.objects.filter(book=book)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, book_id):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required to post a review.'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'type', None) == 'admin':
            return Response({'detail': 'Admin users cannot post reviews.'}, status=status.HTTP_403_FORBIDDEN)
        book = get_object_or_404(Book, pk=book_id)
        data = request.data.copy()
        data['book'] = book.id
        user = request.user
        data['user'] = user.id
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReviewAdminListView(APIView):
    def get(self, request):
        if not (request.user.is_authenticated and getattr(request.user, 'type', None) == 'admin'):
            return Response({'detail': 'Only admin users can view all reviews.'}, status=status.HTTP_403_FORBIDDEN)
        reviews = Review.objects.select_related('book').all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TopReviewsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Get top 5 reviews, e.g., by most recent or by rating if available
        reviews = Review.objects.select_related('book').order_by('-id')[:5]
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ReviewDeleteView(APIView):
    def delete(self, request, review_id):
        if not (request.user.is_authenticated and getattr(request.user, 'type', None) == 'admin'):
            return Response({'detail': 'Only admin users can delete reviews.'}, status=status.HTTP_403_FORBIDDEN)
        review = get_object_or_404(Review, pk=review_id)
        review.delete()
        return Response({'detail': 'Review deleted.'}, status=status.HTTP_204_NO_CONTENT)

class BookSearchView(ListAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Book.objects.all()
        self.title = self.request.query_params.get('title', None)
        self.author = self.request.query_params.get('author', None)
        self.genre = self.request.query_params.get('genre', None)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        title = self.title
        author = self.author
        genre = self.genre

        # Build Q objects for flexible matching
        filters = []
        if title:
            filters.append(Q(title__icontains=title))
        if author:
            filters.append(Q(author__icontains=author))
        if genre:
            filters.append(Q(genre=genre))

        # If no filters, return all
        if not filters:
            books = queryset
        else:
            # Any two match logic
            if len(filters) == 3:
                # At least two of the three must match
                books = queryset.filter((filters[0] & filters[1]) | (filters[0] & filters[2]) | (filters[1] & filters[2]))
            elif len(filters) == 2:
                books = queryset.filter(filters[0] & filters[1])
            elif len(filters) == 1:
                books = queryset.filter(filters[0])
            else:
                books = queryset

        # If only genre is provided, and matches, show error
        if genre and not title and not author:
            if books.exists():
                return Response({'detail': 'Search by genre only is not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        # If no results
        if not books.exists():
            return Response({'detail': 'No results found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class BookPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        if book.pdf_document:
            pdf_path = book.pdf_document.path
            if not os.path.exists(pdf_path):
                return Response({'detail': 'PDF file not found.'}, status=status.HTTP_404_NOT_FOUND)
            return FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
        elif book.pdf_document_url:
            return redirect(book.pdf_document_url)
        else:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)

class BookReadAloudView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        if not book.pdf_document:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
        pdf_path = book.pdf_document.path
        if not os.path.exists(pdf_path):
            return Response({'detail': 'PDF file not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Extract text from PDF
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                page_text = page.get_text("text")
                if not page_text.strip():
                    blocks = page.get_text("blocks")
                    block_texts = [b[4] for b in blocks if isinstance(b[4], str)]
                    page_text = " ".join(block_texts)
                text += page_text + " "
            doc.close()
        except Exception as e:
            return Response({'detail': f'Error reading PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if not text.strip():
            return Response({'detail': 'No readable text found in PDF. Try opening the PDF in a text editor to check if the text is selectable. If not, OCR may be required.'}, status=status.HTTP_400_BAD_REQUEST)
        # Convert text to speech using pyttsx3 (offline)
        try:
            engine = pyttsx3.init()
            # Ensure the audio directory exists
            audio_dir = os.path.join(settings.BASE_DIR, 'audio')
            os.makedirs(audio_dir, exist_ok=True)
            # Use a unique filename for the audio file
            audio_filename = f'book_{book.id}_audio.mp3'
            audio_path = os.path.join(audio_dir, audio_filename)
            engine.save_to_file(text, audio_path)
            engine.runAndWait()
        except Exception as e:
            return Response({'detail': f'Error generating audio: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Serve the audio file
        if not os.path.exists(audio_path):
            return Response({'detail': 'Audio file not found after generation.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response = FileResponse(open(audio_path, 'rb'), content_type='audio/mpeg')
        response['Content-Disposition'] = f'attachment; filename="{audio_filename}"'
        return response

class UserLibraryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        library = Library.objects.filter(user=request.user).select_related('book')
        serializer = LibrarySerializer(library, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UpdateLibraryProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        progress = float(request.data.get('progress', 0))
        type_ = request.data.get('type', 'pdf')

        if not book_id or not type_:
            return Response({'detail': 'book_id and type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        book = get_object_or_404(Book, pk=book_id)
        if type_ == 'pdf':
            total = book.total_pages
        else:
            total = float(request.data.get('total', 0))
        library, created = Library.objects.get_or_create(
            user=request.user, book=book, type=type_,
            defaults={'progress': progress, 'total': total}
        )
        if not created:
            library.progress = progress
            library.total = total
            library.last_accessed = timezone.now()
            library.save()
        serializer = LibrarySerializer(library)
        return Response(serializer.data, status=status.HTTP_200_OK)

class BookRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Recommend books by genre/author of books user has started
        user_books = Library.objects.filter(user=request.user).select_related('book')
        genres = set()
        authors = set()
        for entry in user_books:
            genres.add(entry.book.genre)
            authors.add(entry.book.author)
        # Recommend books not already in user's library
        recommended = Book.objects.exclude(id__in=[entry.book.id for entry in user_books]).filter(
            Q(genre__in=genres) | Q(author__in=authors)
        ).distinct()[:10]
        serializer = BookSerializer(recommended, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
