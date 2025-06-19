from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Book
import re

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()
    username = serializers.CharField()
    mobile = serializers.CharField()

    class Meta:
        model = CustomUser
        fields = ('id', 'name', 'username', 'mobile', 'email', 'password', 'type')
        extra_kwargs = {'type': {'default': 'user'}}

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        if not re.match(r'^[\w.@+-]+$', value):
            raise serializers.ValidationError('Username may contain only letters, numbers, and @/./+/-/_ characters.')
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value

    def validate_mobile(self, value):
        if CustomUser.objects.filter(mobile=value).exists():
            raise serializers.ValidationError('Mobile number already exists.')
        if not re.match(r'^\d{10,15}$', value):
            raise serializers.ValidationError('Mobile number must be 10-15 digits.')
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        if not re.search(r'[A-Za-z]', value) or not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain both letters and numbers.')
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            name=validated_data['name'],
            mobile=validated_data['mobile'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data.get('type', 'user')
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('User is deactivated.')
                data['user'] = user
            else:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
        else:
            raise serializers.ValidationError('Must include "username" and "password".')
        return data

class BookSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=255)
    author = serializers.CharField(max_length=255)
    genre = serializers.CharField(max_length=100)
    published_year = serializers.IntegerField()
    description = serializers.CharField(allow_blank=True, required=False)
    cover_image = serializers.ImageField(allow_null=True, required=False)
    cover_image_url = serializers.URLField(allow_blank=True, allow_null=True, required=False)
    pdf_document = serializers.FileField(allow_null=True, required=False)
    pdf_document_url = serializers.URLField(allow_blank=True, allow_null=True, required=False)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'genre', 'published_year', 'description',
            'cover_image', 'cover_image_url', 'pdf_document', 'pdf_document_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('Title is required.')
        if len(value) > 255:
            raise serializers.ValidationError('Title must be at most 255 characters.')
        return value

    def validate_author(self, value):
        if not value.strip():
            raise serializers.ValidationError('Author is required.')
        if len(value) > 255:
            raise serializers.ValidationError('Author must be at most 255 characters.')
        return value

    def validate_genre(self, value):
        if not value.strip():
            raise serializers.ValidationError('Genre is required.')
        if len(value) > 100:
            raise serializers.ValidationError('Genre must be at most 100 characters.')
        return value

    def validate_published_year(self, value):
        import datetime
        current_year = datetime.datetime.now().year
        if value < 0 or value > current_year:
            raise serializers.ValidationError(f'Published year must be between 0 and {current_year}.')
        return value

    def validate(self, data):
        cover_image = data.get('cover_image')
        cover_image_url = data.get('cover_image_url')
        pdf_document = data.get('pdf_document')
        pdf_document_url = data.get('pdf_document_url')

        # Cover image: must provide either file or URL, not both, not neither
        if not cover_image and not cover_image_url:
            raise serializers.ValidationError('You must provide either a cover image file or a cover image URL.')
        if cover_image and cover_image_url:
            raise serializers.ValidationError('Provide either a cover image file or a cover image URL, not both.')

        # PDF document: must provide either file or URL, not both, not neither
        if not pdf_document and not pdf_document_url:
            raise serializers.ValidationError('You must provide either a PDF document file or a PDF document URL.')
        if pdf_document and pdf_document_url:
            raise serializers.ValidationError('Provide either a PDF document file or a PDF document URL, not both.')

        # Optionally, check file types (simple check)
        if pdf_document and hasattr(pdf_document, 'name') and not pdf_document.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('Uploaded document must be a PDF file.')
        return data 