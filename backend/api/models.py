from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.

class CustomUserManager(BaseUserManager):
    def create_user(self, username, name, mobile, email, password=None, user_type='user'):
        if not username:
            raise ValueError('The Username must be set')
        if not mobile:
            raise ValueError('The Mobile number must be set')
        if not email:
            raise ValueError('The Email must be set')
        user = self.model(username=username, name=name, mobile=mobile, email=email, type=user_type)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, name, mobile, email, password=None):
        user = self.create_user(username, name, mobile, email, password, user_type='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class CustomUser(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    name = models.CharField(max_length=255)
    username = models.CharField(max_length=150, unique=True)
    mobile = models.CharField(max_length=15, unique=True)
    email = models.EmailField(max_length=255, unique=True, blank=True, null=True)
    type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='user')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name', 'mobile', 'email']

    def __str__(self):
        return self.username

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.CharField(max_length=100)
    published_year = models.PositiveIntegerField()
    cover_image = models.ImageField(upload_to='covers/', blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True)
    pdf_document = models.FileField(upload_to='pdfs/', blank=True, null=True)
    pdf_document_url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Review(models.Model):
    book = models.ForeignKey(Book, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey('CustomUser', related_name='reviews', on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveSmallIntegerField()
    review_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not (1 <= self.rating <= 5):
            raise ValidationError('Rating must be between 1 and 5.')

    def __str__(self):
        return f'Review for {self.book.title} ({self.rating} stars)'
