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
from importlib import import_module

import requests
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes

import io
import urllib.request
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


class OptionalDependencyError(RuntimeError):
    """Raised when an optional AI/PDF dependency is unavailable."""


def load_pymupdf():
    try:
        return import_module('fitz')
    except ModuleNotFoundError as exc:
        raise OptionalDependencyError(
            'PyMuPDF is not installed. Install the package `PyMuPDF` to enable PDF text extraction.'
        ) from exc


def load_gtts():
    try:
        return import_module('gtts').gTTS
    except ModuleNotFoundError as exc:
        raise OptionalDependencyError(
            'gTTS is not installed. Install the package `gTTS` to enable audio generation.'
        ) from exc


def load_summarization_stack():
    try:
        pipeline = import_module('transformers').pipeline
    except ModuleNotFoundError as exc:
        raise OptionalDependencyError(
            'transformers is not installed. Install the package `transformers` to enable AI summaries.'
        ) from exc

    try:
        torch = import_module('torch')
    except ModuleNotFoundError as exc:
        raise OptionalDependencyError(
            'torch is not installed. Install the package `torch` to enable AI summaries.'
        ) from exc

    return pipeline, torch


TRUE_VALUES = {'1', 'true', 'yes', 'y', 'on'}
DEFAULT_HTTP_TIMEOUT = 20
MAX_CHAPTER_AUDIO_PAGES = 20
MAX_FULL_AUDIO_CHARACTERS = 50000
COMMON_STOP_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is',
    'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
    'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
}


def parse_bool_param(value):
    return str(value).strip().lower() in TRUE_VALUES


def parse_positive_int(value, param_name, default=None):
    if value in (None, ''):
        return default
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f'{param_name} must be a whole number.') from exc
    if parsed < 1:
        raise ValueError(f'{param_name} must be at least 1.')
    return parsed


def get_book_pdf_source(book):
    if book.pdf_document:
        return book.pdf_document.path
    if book.pdf_document_url:
        return book.pdf_document_url
    return None


def get_audio_storage_dir():
    return os.path.join(settings.BASE_DIR, 'media', 'audio')


def build_media_url(request, *parts):
    relative_path = '/'.join(str(part).strip('/') for part in parts if part is not None)
    media_prefix = settings.MEDIA_URL.rstrip('/')
    if media_prefix:
        return request.build_absolute_uri(f'{media_prefix}/{relative_path}')
    return request.build_absolute_uri(f'/{relative_path}')


def build_audio_cache_filename(book, audio_kind, *extra_parts):
    version = int(book.updated_at.timestamp()) if getattr(book, 'updated_at', None) else 0
    parts = [f'book_{book.id}', audio_kind, *[str(part) for part in extra_parts], f'v{version}']
    return '_'.join(part for part in parts if part) + '.mp3'


def get_cached_audio_url(request, filename):
    audio_path = os.path.join(get_audio_storage_dir(), filename)
    if os.path.exists(audio_path):
        return audio_path, build_media_url(request, 'audio', filename)
    return None, None


def normalize_page_range(start_page, end_page, page_count, max_pages=None):
    if page_count <= 0:
        raise ValueError('The selected book does not contain any readable pages.')

    start_page = parse_positive_int(start_page, 'start_page', default=1)
    end_page = parse_positive_int(end_page, 'end_page', default=page_count)

    if start_page > page_count:
        raise ValueError(f'start_page cannot be greater than the total page count ({page_count}).')
    if end_page > page_count:
        raise ValueError(f'end_page cannot be greater than the total page count ({page_count}).')
    if start_page > end_page:
        raise ValueError('start_page cannot be greater than end_page.')
    if max_pages and (end_page - start_page + 1) > max_pages:
        raise ValueError(f'You can only request up to {max_pages} pages at a time.')

    return start_page, end_page


def dependency_error_response(exc):
    return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


def estimate_minutes(word_count, words_per_minute):
    if word_count <= 0:
        return 0
    return max(1, (word_count + words_per_minute - 1) // words_per_minute)

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

class PDFProcessor:
    """Utility class for processing PDFs from both local files and URLs"""

    @staticmethod
    def _download_pdf_to_tempfile(pdf_url):
        parsed_url = urlparse(pdf_url)
        if parsed_url.scheme not in {'http', 'https'}:
            raise ValueError('Only http and https PDF URLs are supported.')

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        try:
            with requests.get(pdf_url, timeout=DEFAULT_HTTP_TIMEOUT, stream=True) as response:
                response.raise_for_status()
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        temp_file.write(chunk)
            temp_file.close()
            return temp_file.name
        except Exception:
            temp_file.close()
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass
            raise

    @staticmethod
    def _open_document(pdf_source, fitz_module):
        temp_path = None
        if isinstance(pdf_source, str) and pdf_source.startswith(('http://', 'https://')):
            temp_path = PDFProcessor._download_pdf_to_tempfile(pdf_source)
            return fitz_module.open(temp_path), temp_path

        if not os.path.exists(pdf_source):
            raise FileNotFoundError('PDF file not found.')

        return fitz_module.open(pdf_source), temp_path

    @staticmethod
    def _extract_page_text(page):
        page_text = page.get_text('text')
        if page_text.strip():
            return page_text

        blocks = page.get_text('blocks')
        block_texts = [block[4] for block in blocks if isinstance(block[4], str)]
        return ' '.join(block_texts)

    @staticmethod
    def extract_text_from_page_range(pdf_source, start_page=1, end_page=None, max_pages=None):
        fitz = load_pymupdf()
        doc = None
        temp_path = None

        try:
            doc, temp_path = PDFProcessor._open_document(pdf_source, fitz)
            page_count = doc.page_count
            normalized_start, normalized_end = normalize_page_range(start_page, end_page, page_count, max_pages=max_pages)

            page_texts = []
            for page_num in range(normalized_start - 1, normalized_end):
                page = doc.load_page(page_num)
                page_texts.append(PDFProcessor._extract_page_text(page))

            text = ' '.join(part.strip() for part in page_texts if part and part.strip()).strip()
            return {
                'text': text,
                'page_count': page_count,
                'start_page': normalized_start,
                'end_page': normalized_end,
                'character_count': len(text),
                'word_count': len(text.split()),
            }
        finally:
            if doc is not None:
                doc.close()
            if temp_path:
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass

    @staticmethod
    def extract_text_from_pdf(pdf_source):
        result = PDFProcessor.extract_text_from_page_range(pdf_source)
        return result['text'], result['page_count'], None

class AIProcessor:
    """Utility class for AI-related processing"""

    @staticmethod
    def chunk_text(text, max_chunk_size=4000):
        """Split text into chunks for processing"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            word_size = len(word) + 1  # +1 for space
            if current_size + word_size > max_chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_size = word_size
            else:
                current_chunk.append(word)
                current_size += word_size
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    @staticmethod
    def generate_summary(text, max_length=150, min_length=50):
        """Generate AI summary of text"""
        try:
            pipeline, torch = load_summarization_stack()
            # Initialize summarizer
            summarizer = pipeline(
                "summarization", 
                model="sshleifer/distilbart-cnn-12-6",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # If text is too long, chunk it and summarize each chunk
            chunks = AIProcessor.chunk_text(text, max_chunk_size=3000)
            summaries = []
            
            for chunk in chunks[:3]:  # Limit to first 3 chunks to avoid memory issues
                try:
                    summary = summarizer(
                        chunk, 
                        max_length=max_length, 
                        min_length=min_length, 
                        do_sample=False
                    )[0]['summary_text']
                    summaries.append(summary)
                except Exception as e:
                    logger.error(f"Error summarizing chunk: {str(e)}")
                    continue
            
            # If multiple summaries, combine them
            if len(summaries) > 1:
                combined_summary = " ".join(summaries)
                # Summarize the combined summaries if too long
                if len(combined_summary) > 1000:
                    try:
                        final_summary = summarizer(
                            combined_summary, 
                            max_length=max_length, 
                            min_length=min_length, 
                            do_sample=False
                        )[0]['summary_text']
                        return final_summary
                    except:
                        return combined_summary[:500] + "..."
                return combined_summary
            elif summaries:
                return summaries[0]
            else:
                return "Unable to generate summary."

        except Exception as e:
            logger.error(f"Error in AI summarization: {str(e)}")
            # Fallback: simple text truncation
            sentences = text.split('.')[:5]
            return '. '.join(sentences) + '.' if sentences else "Summary unavailable."

    @staticmethod
    def build_keyword_stats(text, limit=10):
        words = [word.lower().strip('.,!?";:()[]{}') for word in text.split()]
        word_freq = {}
        for word in words:
            if len(word) > 3 and word not in COMMON_STOP_WORDS:
                word_freq[word] = word_freq.get(word, 0) + 1

        top_keywords = sorted(word_freq.items(), key=lambda item: item[1], reverse=True)[:limit]
        return [{'word': word, 'frequency': frequency} for word, frequency in top_keywords]

class AudioProcessor:
    """Utility class for audio processing"""

    @staticmethod
    def text_to_speech_gtts(text, language='en', slow=False):
        """Convert text to speech using gTTS"""
        try:
            gTTS = load_gtts()
            # Create gTTS object
            tts = gTTS(text=text, lang=language, slow=slow)
            
            # Save to temporary file
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)

            return audio_buffer, None, status.HTTP_200_OK
        except OptionalDependencyError as exc:
            return None, str(exc), status.HTTP_503_SERVICE_UNAVAILABLE
        except Exception as e:
            return None, f"Error generating audio: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR

    @staticmethod
    def save_audio_file(audio_buffer, filename, audio_dir):
        """Save audio buffer to file"""
        try:
            os.makedirs(audio_dir, exist_ok=True)
            file_path = os.path.join(audio_dir, filename)

            with open(file_path, 'wb') as f:
                f.write(audio_buffer.getvalue())

            return file_path
        except Exception:
            return None

class BookTextExtractionView(APIView):
    """Extract text from PDF for reading purposes"""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)

        pdf_source = get_book_pdf_source(book)
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            start_page = parse_positive_int(request.query_params.get('start_page'), 'start_page', default=1)
            end_page = parse_positive_int(request.query_params.get('end_page'), 'end_page', default=None)
            extraction = PDFProcessor.extract_text_from_page_range(
                pdf_source,
                start_page=start_page,
                end_page=end_page,
            )
        except OptionalDependencyError as exc:
            return dependency_error_response(exc)
        except FileNotFoundError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'detail': f'Error extracting text from PDF: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not extraction['text']:
            return Response({'detail': 'No readable text found in the requested page range.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'text': extraction['text'],
            'page_count': extraction['page_count'],
            'start_page': extraction['start_page'],
            'end_page': extraction['end_page'],
            'character_count': extraction['character_count'],
            'word_count': extraction['word_count'],
            'cached': False,
        }, status=status.HTTP_200_OK)

class BookChapterAudioView(APIView):
    """Generate audio for specific pages/chapters"""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        book = get_object_or_404(Book, pk=id)

        pdf_source = get_book_pdf_source(book)
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            start_page = parse_positive_int(request.data.get('start_page'), 'start_page', default=1)
            end_page = parse_positive_int(request.data.get('end_page'), 'end_page', default=start_page)
            force_refresh = parse_bool_param(request.data.get('refresh'))
            extraction = PDFProcessor.extract_text_from_page_range(
                pdf_source,
                start_page=start_page,
                end_page=end_page,
                max_pages=MAX_CHAPTER_AUDIO_PAGES,
            )
        except OptionalDependencyError as exc:
            return dependency_error_response(exc)
        except FileNotFoundError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'detail': f'Error reading PDF: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not extraction['text']:
            return Response({'detail': 'No readable text found in specified pages.'}, status=status.HTTP_400_BAD_REQUEST)

        audio_filename = build_audio_cache_filename(
            book,
            'chapter_audio',
            extraction['start_page'],
            extraction['end_page'],
        )
        _, cached_audio_url = get_cached_audio_url(request, audio_filename)
        if cached_audio_url and not force_refresh:
            return Response({
                'audio_url': cached_audio_url,
                'start_page': extraction['start_page'],
                'end_page': extraction['end_page'],
                'page_count': extraction['page_count'],
                'text_length': extraction['character_count'],
                'estimated_duration_minutes': estimate_minutes(extraction['word_count'], 150),
                'cached': True,
            }, status=status.HTTP_200_OK)

        audio_buffer, audio_error, audio_status = AudioProcessor.text_to_speech_gtts(extraction['text'])
        if audio_error:
            return Response({'detail': audio_error}, status=audio_status)

        try:
            audio_path = AudioProcessor.save_audio_file(audio_buffer, audio_filename, get_audio_storage_dir())
            if not audio_path:
                raise RuntimeError('Unable to save generated chapter audio.')
            audio_url = build_media_url(request, 'audio', audio_filename)
        except Exception as exc:
            logger.error(f"Error saving audio file: {str(exc)}")
            return Response({'detail': f'Error saving audio file: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'audio_url': audio_url,
            'start_page': extraction['start_page'],
            'end_page': extraction['end_page'],
            'page_count': extraction['page_count'],
            'text_length': extraction['character_count'],
            'estimated_duration_minutes': estimate_minutes(extraction['word_count'], 150),
            'cached': False,
        }, status=status.HTTP_200_OK)

class BookAnalyticsView(APIView):
    """Get analytics and insights about the book"""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)

        if (
            not parse_bool_param(request.query_params.get('refresh'))
            and book.word_count > 0
            and book.character_count > 0
            and book.total_pages > 0
        ):
            return Response({
                'page_count': book.total_pages,
                'word_count': book.word_count,
                'character_count': book.character_count,
                'estimated_reading_time_minutes': book.estimated_reading_time,
                'estimated_audio_duration_minutes': book.estimated_audio_duration,
                'top_keywords': book.top_keywords,
                'average_words_per_page': book.word_count // book.total_pages if book.total_pages > 0 else 0,
                'average_characters_per_page': book.character_count // book.total_pages if book.total_pages > 0 else 0,
                'cached': True,
            }, status=status.HTTP_200_OK)

        pdf_source = get_book_pdf_source(book)
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            extraction = PDFProcessor.extract_text_from_page_range(pdf_source)
        except OptionalDependencyError as exc:
            return dependency_error_response(exc)
        except FileNotFoundError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'detail': f'Error analyzing PDF: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not extraction['text']:
            return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)

        word_count = extraction['word_count']
        character_count = extraction['character_count']
        estimated_reading_time = estimate_minutes(word_count, 200)
        estimated_audio_duration = estimate_minutes(word_count, 150)
        top_keywords = AIProcessor.build_keyword_stats(extraction['text'])

        book.word_count = word_count
        book.character_count = character_count
        book.estimated_reading_time = estimated_reading_time
        book.estimated_audio_duration = estimated_audio_duration
        book.top_keywords = top_keywords
        book.total_pages = extraction['page_count'] if extraction['page_count'] > 0 else book.total_pages
        book.save()

        return Response({
            'page_count': extraction['page_count'],
            'word_count': word_count,
            'character_count': character_count,
            'estimated_reading_time_minutes': estimated_reading_time,
            'estimated_audio_duration_minutes': estimated_audio_duration,
            'top_keywords': top_keywords,
            'average_words_per_page': word_count // extraction['page_count'] if extraction['page_count'] > 0 else 0,
            'average_characters_per_page': character_count // extraction['page_count'] if extraction['page_count'] > 0 else 0,
            'cached': False,
        }, status=status.HTTP_200_OK)

class BookAISummaryAudioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)

        force_refresh = parse_bool_param(request.query_params.get('refresh'))
        cached_audio_filename = build_audio_cache_filename(book, 'ai_summary_audio')
        _, cached_audio_url = get_cached_audio_url(request, cached_audio_filename)
        reusable_audio_url = book.ai_summary_audio_url or cached_audio_url

        if book.ai_summary and book.ai_processing_status == 'completed' and reusable_audio_url and not force_refresh:
            return Response({
                'summary': book.ai_summary,
                'audio_url': reusable_audio_url,
                'page_count': book.total_pages,
                'cached': True,
                'audio_available': True,
                'processing_status': book.ai_processing_status,
            }, status=status.HTTP_200_OK)

        book.ai_processing_status = 'processing'
        book.save(update_fields=['ai_processing_status'])

        pdf_source = get_book_pdf_source(book)
        if not pdf_source:
            book.ai_processing_status = 'failed'
            book.save(update_fields=['ai_processing_status'])
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            extraction = None
            if force_refresh or not book.ai_summary or book.total_pages <= 0:
                extraction = PDFProcessor.extract_text_from_page_range(pdf_source)
                if not extraction['text']:
                    book.ai_processing_status = 'failed'
                    book.save(update_fields=['ai_processing_status'])
                    return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)
                summary = AIProcessor.generate_summary(extraction['text'], max_length=150, min_length=50)
            else:
                summary = book.ai_summary
                extraction = {
                    'page_count': book.total_pages,
                }
        except OptionalDependencyError as exc:
            book.ai_processing_status = 'failed'
            book.save(update_fields=['ai_processing_status'])
            return dependency_error_response(exc)
        except FileNotFoundError as exc:
            book.ai_processing_status = 'failed'
            book.save(update_fields=['ai_processing_status'])
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            book.ai_processing_status = 'failed'
            book.save(update_fields=['ai_processing_status'])
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            book.ai_processing_status = 'failed'
            book.save(update_fields=['ai_processing_status'])
            return Response({'detail': f'Error generating AI summary: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        audio_url = None
        audio_error = None
        if not force_refresh and cached_audio_url:
            audio_url = cached_audio_url
        else:
            audio_buffer, audio_error, audio_status = AudioProcessor.text_to_speech_gtts(summary)
            if audio_buffer:
                try:
                    audio_path = AudioProcessor.save_audio_file(audio_buffer, cached_audio_filename, get_audio_storage_dir())
                    if not audio_path:
                        raise RuntimeError('Unable to save generated AI summary audio.')
                    audio_url = build_media_url(request, 'audio', cached_audio_filename)
                except Exception as exc:
                    logger.error(f"Error saving audio file: {str(exc)}")
                    audio_error = f'Error saving audio file: {str(exc)}'
            elif audio_error and audio_status != status.HTTP_503_SERVICE_UNAVAILABLE:
                logger.error(audio_error)

        book.ai_summary = summary
        book.ai_summary_audio_url = audio_url
        book.total_pages = extraction['page_count'] if extraction.get('page_count', 0) > 0 else book.total_pages
        book.ai_processing_status = 'completed' if summary else 'failed'
        book.last_ai_processed = timezone.now()
        book.save()

        response_payload = {
            'summary': summary,
            'audio_url': audio_url,
            'page_count': book.total_pages,
            'cached': False,
            'audio_available': bool(audio_url),
            'processing_status': book.ai_processing_status,
        }
        if audio_error:
            response_payload['audio_error'] = audio_error

        return Response(response_payload, status=status.HTTP_200_OK)

# class BookReadAloudView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, id):
#         book = get_object_or_404(Book, pk=id)
#         if not book.pdf_document:
#             return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
#         pdf_path = book.pdf_document.path
#         if not os.path.exists(pdf_path):
#             return Response({'detail': 'PDF file not found.'}, status=status.HTTP_404_NOT_FOUND)
#         # Get start_page and end_page from query params
#         start_page = int(request.query_params.get('start_page', 1))
#         end_page = int(request.query_params.get('end_page', start_page))
#         # Extract text from PDF for the given page range
#         try:
#             doc = fitz.open(pdf_path)
#             text = ""
#             for i in range(start_page - 1, min(end_page, doc.page_count)):
#                 page = doc.load_page(i)
#                 page_text = page.get_text("text")
#                 if not page_text.strip():
#                     blocks = page.get_text("blocks")
#                     block_texts = [b[4] for b in blocks if isinstance(b[4], str)]
#                     page_text = " ".join(block_texts)
#                 text += page_text + " "
#             doc.close()
#         except Exception as e:
#             return Response({'detail': f'Error reading PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         if not text.strip():
#             return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)
#         # Convert text to speech using pyttsx3 (offline)
#         try:
#             engine = pyttsx3.init()
#             audio_dir = os.path.join(settings.BASE_DIR, 'audio')
#             os.makedirs(audio_dir, exist_ok=True)
#             audio_filename = f'book_{book.id}_audio_{start_page}_{end_page}.mp3'
#             audio_path = os.path.join(audio_dir, audio_filename)
#             engine.save_to_file(text, audio_path)
#             engine.runAndWait()
#         except Exception as e:
#             return Response({'detail': f'Error generating audio: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         if not os.path.exists(audio_path):
#             return Response({'detail': 'Audio file not found after generation.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         response = FileResponse(open(audio_path, 'rb'), content_type='audio/mpeg')
#         response['Content-Disposition'] = f'attachment; filename="{audio_filename}"'
#         return response

# New endpoint to get audio progress for a user/book
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audio_progress(request):
    user = request.user
    book_id = request.query_params.get('book_id')
    if not book_id:
        return Response({'detail': 'book_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        entry = Library.objects.get(user=user, book_id=book_id, type='audio')
        return Response({'progress': entry.progress, 'total': entry.total}, status=status.HTTP_200_OK)
    except Library.DoesNotExist:
        return Response({'progress': 0, 'total': 0}, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'name': user.name,
            'username': user.username,
            'mobile': user.mobile,
            'email': user.email,
            'type': user.type,
            'date_joined': user.date_joined,
        }, status=status.HTTP_200_OK)

class UserLibraryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        library = Library.objects.filter(user=request.user).select_related('book')
        serializer = LibrarySerializer(library, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        book_id = request.data.get('book_id') or request.query_params.get('book_id')
        type_ = request.data.get('type') or request.query_params.get('type')
        if not book_id:
            return Response({'detail': 'book_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted_types = []
        errors = []
        types_to_delete = [type_] if type_ else ['pdf', 'audio']
        for t in types_to_delete:
            try:
                library_entry = Library.objects.get(user=request.user, book_id=book_id, type=t)
                library_entry.delete()
                deleted_types.append(t)
            except Library.DoesNotExist:
                errors.append(f'No entry for type {t}')
        if deleted_types:
            return Response({'detail': f'Library entry deleted for types: {", ".join(deleted_types)}', 'errors': errors}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'detail': 'Library entry not found for any type', 'errors': errors}, status=status.HTTP_404_NOT_FOUND)

class UpdateLibraryProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        book_id = request.data.get('book_id')
        type_ = request.data.get('type', 'pdf')

        if not book_id or not type_:
            return Response({'detail': 'book_id and type are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if type_ not in {'pdf', 'audio'}:
            return Response({'detail': 'type must be either "pdf" or "audio".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            progress = float(request.data.get('progress', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'progress must be a number.'}, status=status.HTTP_400_BAD_REQUEST)
        if progress < 0:
            return Response({'detail': 'progress cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)

        book = get_object_or_404(Book, pk=book_id)
        if type_ == 'pdf':
            total = book.total_pages
        else:
            try:
                total = float(request.data.get('total', 0))
            except (TypeError, ValueError):
                return Response({'detail': 'total must be a number.'}, status=status.HTTP_400_BAD_REQUEST)
            if total < 0:
                return Response({'detail': 'total cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)
        library, created = Library.objects.get_or_create(
            user=request.user, book=book, type=type_,
            defaults={'progress': progress, 'total': total}
        )
        if not created:
            library.progress = min(progress, total) if total > 0 else progress
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

class BookFullAudioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)

        force_refresh = parse_bool_param(request.query_params.get('refresh'))
        cached_audio_filename = build_audio_cache_filename(book, 'full_audio')
        _, cached_audio_url = get_cached_audio_url(request, cached_audio_filename)

        if book.full_audio_url and not force_refresh:
            return Response({
                'audio_url': book.full_audio_url,
                'page_count': book.total_pages,
                'text_length': book.character_count,
                'estimated_duration_minutes': book.estimated_audio_duration,
                'cached': True,
            }, status=status.HTTP_200_OK)
        if cached_audio_url and not force_refresh:
            if book.full_audio_url != cached_audio_url:
                book.full_audio_url = cached_audio_url
                book.save(update_fields=['full_audio_url'])
            return Response({
                'audio_url': cached_audio_url,
                'page_count': book.total_pages,
                'text_length': book.character_count,
                'estimated_duration_minutes': book.estimated_audio_duration,
                'cached': True,
            }, status=status.HTTP_200_OK)

        pdf_source = get_book_pdf_source(book)
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            extraction = PDFProcessor.extract_text_from_page_range(pdf_source)
        except OptionalDependencyError as exc:
            return dependency_error_response(exc)
        except FileNotFoundError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'detail': f'Error generating full audio: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not extraction['text']:
            return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)

        if extraction['character_count'] > MAX_FULL_AUDIO_CHARACTERS:
            return Response({
                'detail': 'Text is too long for full audio conversion. Please use the summary audio feature instead.',
                'text_length': extraction['character_count'],
                'estimated_duration_minutes': estimate_minutes(extraction['word_count'], 150),
                'max_supported_characters': MAX_FULL_AUDIO_CHARACTERS,
            }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        audio_buffer, audio_error, audio_status = AudioProcessor.text_to_speech_gtts(extraction['text'])
        if audio_error:
            return Response({'detail': audio_error}, status=audio_status)

        try:
            audio_path = AudioProcessor.save_audio_file(audio_buffer, cached_audio_filename, get_audio_storage_dir())
            if not audio_path:
                raise RuntimeError('Unable to save generated full audio.')
            audio_url = build_media_url(request, 'audio', cached_audio_filename)
        except Exception as exc:
            logger.error(f"Error saving audio file: {str(exc)}")
            return Response({'detail': f'Error saving audio file: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        estimated_duration = estimate_minutes(extraction['word_count'], 150)
        book.full_audio_url = audio_url
        book.total_pages = extraction['page_count'] if extraction['page_count'] > 0 else book.total_pages
        book.character_count = extraction['character_count']
        book.word_count = extraction['word_count']
        book.estimated_audio_duration = estimated_duration
        if not book.estimated_reading_time:
            book.estimated_reading_time = estimate_minutes(extraction['word_count'], 200)
        book.save()

        library_entry, created = Library.objects.get_or_create(
            user=request.user,
            book=book,
            type='audio',
            defaults={'total': estimated_duration, 'progress': 0},
        )
        if not created:
            library_entry.total = estimated_duration
            library_entry.save()

        return Response({
            'audio_url': audio_url,
            'page_count': extraction['page_count'],
            'text_length': extraction['character_count'],
            'estimated_duration_minutes': estimated_duration,
            'cached': False,
        }, status=status.HTTP_200_OK)

