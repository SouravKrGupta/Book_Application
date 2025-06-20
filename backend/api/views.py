from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, BookSerializer, ReviewSerializer
from .models import Book, Review
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from django.db.models import Q

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
