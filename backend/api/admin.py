from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Book, Review

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('id', 'username', 'email', 'name', 'mobile', 'type', 'is_staff', 'is_active')
    list_filter = ('type', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'name', 'mobile')
    ordering = ('id',)
    readonly_fields = ('date_joined',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('name', 'email', 'mobile', 'type')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'name', 'email', 'mobile', 'type', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

admin.site.register(CustomUser, CustomUserAdmin)

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'genre', 'published_year', 'created_at', 'updated_at')
    search_fields = ('title', 'author', 'genre')
    list_filter = ('genre', 'published_year')
    ordering = ('id',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'book', 'user', 'rating', 'review_text', 'created_at')
    search_fields = ('book__title', 'user__username', 'review_text')
    list_filter = ('rating', 'created_at')
    ordering = ('id',)
