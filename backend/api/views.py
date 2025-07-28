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

import requests
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes

import fitz  # PyMuPDF
import pyttsx3
from gtts import gTTS
import io
import tempfile
import urllib.request
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

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
        
import torch

class PDFProcessor:
    """Utility class for processing PDFs from both local files and URLs"""
    
    @staticmethod
    def extract_text_from_pdf(pdf_source):
        """
        Extract text from PDF source (local file path or URL)
        Returns: (text, page_count, error_message)
        """
        try:
            doc = None
            temp_file = None
            
            # Handle URL-based PDFs
            if isinstance(pdf_source, str) and (pdf_source.startswith('http://') or pdf_source.startswith('https://')):
                try:
                    # Download PDF from URL to temporary file
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                    urllib.request.urlretrieve(pdf_source, temp_file.name)
                    doc = fitz.open(temp_file.name)
                except Exception as e:
                    return "", 0, f"Error downloading PDF from URL: {str(e)}"
            else:
                # Handle local file
                if not os.path.exists(pdf_source):
                    return "", 0, "PDF file not found"
                doc = fitz.open(pdf_source)
            
            text = ""
            page_count = doc.page_count
            
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                page_text = page.get_text("text")
                
                # If no text found, try extracting from blocks
                if not page_text.strip():
                    blocks = page.get_text("blocks")
                    block_texts = [b[4] for b in blocks if isinstance(b[4], str)]
                    page_text = " ".join(block_texts)
                
                text += page_text + " "
            
            doc.close()
            
            # Clean up temporary file
            if temp_file:
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
            
            return text.strip(), page_count, None
            
        except Exception as e:
            return "", 0, f"Error processing PDF: {str(e)}"

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

class AudioProcessor:
    """Utility class for audio processing"""
    
    @staticmethod
    def text_to_speech_gtts(text, language='en', slow=False):
        """Convert text to speech using gTTS"""
        try:
            # Create gTTS object
            tts = gTTS(text=text, lang=language, slow=slow)
            
            # Save to temporary file
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            return audio_buffer, None
            
        except Exception as e:
            return None, f"Error generating audio: {str(e)}"
    
    @staticmethod
    def save_audio_file(audio_buffer, filename, audio_dir):
        """Save audio buffer to file"""
        try:
            os.makedirs(audio_dir, exist_ok=True)
            file_path = os.path.join(audio_dir, filename)
            
            with open(file_path, 'wb') as f:
                f.write(audio_buffer.getvalue())
            
            return file_path
            
        except Exception as e:
            return None

class BookTextExtractionView(APIView):
    """Extract text from PDF for reading purposes"""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        
        # Determine PDF source
        pdf_source = None
        if book.pdf_document:
            pdf_source = book.pdf_document.path
        elif book.pdf_document_url:
            pdf_source = book.pdf_document_url
        
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Extract text from PDF
        text, page_count, error = PDFProcessor.extract_text_from_pdf(pdf_source)
        if error:
            return Response({'detail': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not text.strip():
            return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get page range if specified
        start_page = int(request.query_params.get('start_page', 1))
        end_page = int(request.query_params.get('end_page', page_count))
        
        # If specific pages requested, extract only those
        if start_page > 1 or end_page < page_count:
            try:
                # Re-extract with page range
                doc = None
                temp_file = None
                
                if pdf_source.startswith('http'):
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                    urllib.request.urlretrieve(pdf_source, temp_file.name)
                    doc = fitz.open(temp_file.name)
                else:
                    doc = fitz.open(pdf_source)
                
                page_text = ""
                for page_num in range(start_page - 1, min(end_page, doc.page_count)):
                    page = doc.load_page(page_num)
                    page_content = page.get_text("text")
                    if not page_content.strip():
                        blocks = page.get_text("blocks")
                        block_texts = [b[4] for b in blocks if isinstance(b[4], str)]
                        page_content = " ".join(block_texts)
                    page_text += page_content + " "
                
                doc.close()
                if temp_file:
                    try:
                        os.unlink(temp_file.name)
                    except:
                        pass
                
                text = page_text.strip()
            except Exception as e:
                return Response({'detail': f'Error extracting page range: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'text': text,
            'page_count': page_count,
            'start_page': start_page,
            'end_page': min(end_page, page_count),
            'character_count': len(text)
        }, status=status.HTTP_200_OK)

class BookChapterAudioView(APIView):
    """Generate audio for specific pages/chapters"""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        book = get_object_or_404(Book, pk=id)
        
        # Get parameters
        start_page = int(request.data.get('start_page', 1))
        end_page = int(request.data.get('end_page', start_page))
        
        # Determine PDF source
        pdf_source = None
        if book.pdf_document:
            pdf_source = book.pdf_document.path
        elif book.pdf_document_url:
            pdf_source = book.pdf_document_url
        
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Extract text for specific pages
        try:
            doc = None
            temp_file = None
            
            if pdf_source.startswith('http'):
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                urllib.request.urlretrieve(pdf_source, temp_file.name)
                doc = fitz.open(temp_file.name)
            else:
                doc = fitz.open(pdf_source)
            
            text = ""
            for page_num in range(start_page - 1, min(end_page, doc.page_count)):
                page = doc.load_page(page_num)
                page_text = page.get_text("text")
                if not page_text.strip():
                    blocks = page.get_text("blocks")
                    block_texts = [b[4] for b in blocks if isinstance(b[4], str)]
                    page_text = " ".join(block_texts)
                text += page_text + " "
            
            doc.close()
            if temp_file:
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
                    
        except Exception as e:
            return Response({'detail': f'Error reading PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not text.strip():
            return Response({'detail': 'No readable text found in specified pages.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate audio
        audio_buffer, audio_error = AudioProcessor.text_to_speech_gtts(text)
        
        if audio_error:
            return Response({'detail': audio_error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        audio_url = None
        if audio_buffer:
            try:
                audio_dir = os.path.join(settings.BASE_DIR, 'media', 'audio')
                audio_filename = f'book_{book.id}_pages_{start_page}_{end_page}.mp3'
                audio_path = AudioProcessor.save_audio_file(audio_buffer, audio_filename, audio_dir)
                
                if audio_path:
                    audio_url = request.build_absolute_uri(settings.MEDIA_URL + f'audio/{audio_filename}')
            except Exception as e:
                logger.error(f"Error saving audio file: {str(e)}")
                return Response({'detail': f'Error saving audio file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'audio_url': audio_url,
            'start_page': start_page,
            'end_page': min(end_page, doc.page_count if 'doc' in locals() else end_page),
            'text_length': len(text)
        }, status=status.HTTP_200_OK)

class BookAnalyticsView(APIView):
    """Get analytics and insights about the book"""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        
        # Determine PDF source
        pdf_source = None
        if book.pdf_document:
            pdf_source = book.pdf_document.path
        elif book.pdf_document_url:
            pdf_source = book.pdf_document_url
        
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Extract text for analysis
        text, page_count, error = PDFProcessor.extract_text_from_pdf(pdf_source)
        if error:
            return Response({'detail': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not text.strip():
            return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Basic analytics
        word_count = len(text.split())
        character_count = len(text)
        estimated_reading_time = word_count // 200  # Average reading speed: 200 words per minute
        estimated_audio_duration = word_count // 150  # Average speaking speed: 150 words per minute
        
        # Simple keyword extraction (most common words, excluding common stop words)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
        words = [word.lower().strip('.,!?";:()[]{}') for word in text.split()]
        word_freq = {}
        for word in words:
            if len(word) > 3 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top 10 keywords
        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Update book analytics in database
        book.word_count = word_count
        book.character_count = character_count
        book.estimated_reading_time = estimated_reading_time
        book.estimated_audio_duration = estimated_audio_duration
        book.top_keywords = [{'word': word, 'frequency': freq} for word, freq in top_keywords]
        book.total_pages = page_count if page_count > 0 else book.total_pages
        book.save()
        
        return Response({
            'page_count': page_count,
            'word_count': word_count,
            'character_count': character_count,
            'estimated_reading_time_minutes': estimated_reading_time,
            'estimated_audio_duration_minutes': estimated_audio_duration,
            'top_keywords': [{'word': word, 'frequency': freq} for word, freq in top_keywords],
            'average_words_per_page': word_count // page_count if page_count > 0 else 0
        }, status=status.HTTP_200_OK)

from transformers import pipeline

class BookAISummaryAudioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        
        # Check if we already have cached AI summary and audio
        if book.ai_summary and book.ai_summary_audio_url and book.ai_processing_status == 'completed':
            return Response({
                'summary': book.ai_summary,
                'audio_url': book.ai_summary_audio_url,
                'page_count': book.total_pages,
                'cached': True
            }, status=status.HTTP_200_OK)
        
        # Update processing status
        book.ai_processing_status = 'processing'
        book.save()
        
        # Determine PDF source (local file or URL)
        pdf_source = None
        if book.pdf_document:
            pdf_source = book.pdf_document.path
        elif book.pdf_document_url:
            pdf_source = book.pdf_document_url
        
        if not pdf_source:
            book.ai_processing_status = 'failed'
            book.save()
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Extract text from PDF using enhanced processor
        text, page_count, error = PDFProcessor.extract_text_from_pdf(pdf_source)
        if error:
            book.ai_processing_status = 'failed'
            book.save()
            return Response({'detail': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not text.strip():
            book.ai_processing_status = 'failed'
            book.save()
            return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate AI summary using enhanced processor
        summary = AIProcessor.generate_summary(text, max_length=150, min_length=50)
        
        # Generate audio using gTTS
        audio_buffer, audio_error = AudioProcessor.text_to_speech_gtts(summary)
        
        audio_url = None
        if audio_buffer and not audio_error:
            try:
                audio_dir = os.path.join(settings.BASE_DIR, 'media', 'audio')
                audio_filename = f'book_{book.id}_ai_summary.mp3'
                audio_path = AudioProcessor.save_audio_file(audio_buffer, audio_filename, audio_dir)
                
                if audio_path:
                    audio_url = request.build_absolute_uri(settings.MEDIA_URL + f'audio/{audio_filename}')
            except Exception as e:
                logger.error(f"Error saving audio file: {str(e)}")
        
        # Update book with AI-generated content
        book.ai_summary = summary
        book.ai_summary_audio_url = audio_url
        book.total_pages = page_count if page_count > 0 else book.total_pages
        book.ai_processing_status = 'completed' if audio_url else 'failed'
        book.last_ai_processed = timezone.now()
        book.save()
        
        return Response({
            'summary': summary,
            'audio_url': audio_url,
            'page_count': page_count,
            'cached': False
        }, status=status.HTTP_200_OK)

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

class BookFullAudioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        book = get_object_or_404(Book, pk=id)
        
        # Determine PDF source (local file or URL)
        pdf_source = None
        if book.pdf_document:
            pdf_source = book.pdf_document.path
        elif book.pdf_document_url:
            pdf_source = book.pdf_document_url
        
        if not pdf_source:
            return Response({'detail': 'No PDF available for this book.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Extract text from PDF using enhanced processor
        text, page_count, error = PDFProcessor.extract_text_from_pdf(pdf_source)
        if error:
            return Response({'detail': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not text.strip():
            return Response({'detail': 'No readable text found in PDF.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # For very long texts, we might need to chunk and process separately
        # or provide a warning about processing time
        if len(text) > 50000:  # Approximately 50k characters
            return Response({
                'detail': 'Text is too long for full audio conversion. Please use the summary audio feature instead.',
                'text_length': len(text),
                'estimated_duration_minutes': len(text) // 1000  # Rough estimate
            }, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        
        # Generate audio using gTTS
        audio_buffer, audio_error = AudioProcessor.text_to_speech_gtts(text)
        
        if audio_error:
            return Response({'detail': audio_error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        audio_url = None
        if audio_buffer:
            try:
                audio_dir = os.path.join(settings.BASE_DIR, 'media', 'audio')
                audio_filename = f'book_{book.id}_full_audio.mp3'
                audio_path = AudioProcessor.save_audio_file(audio_buffer, audio_filename, audio_dir)
                
                if audio_path:
                    audio_url = request.build_absolute_uri(settings.MEDIA_URL + f'audio/{audio_filename}')
                    
                    # Update book with full audio URL
                    book.full_audio_url = audio_url
                    book.save()
                    
                    # Update library with audio total duration (rough estimate)
                    estimated_duration = len(text) // 150  # Rough words per minute calculation
                    Library.objects.update_or_create(
                        user=request.user,
                        book=book,
                        type='audio',
                        defaults={'total': estimated_duration, 'progress': 0}
                    )
            except Exception as e:
                logger.error(f"Error saving audio file: {str(e)}")
                return Response({'detail': f'Error saving audio file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'audio_url': audio_url,
            'page_count': page_count,
            'text_length': len(text)
        }, status=status.HTTP_200_OK)

