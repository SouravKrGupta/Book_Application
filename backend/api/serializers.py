from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser
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