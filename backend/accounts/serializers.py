from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserAddress, UserDevice

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    """
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone', 'role', 'avatar', 'avatar_url',
            'is_active', 'is_verified', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_verified']
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone', 'password', 
            'password_confirm', 'role'
        ]
        extra_kwargs = {
            'email': {'required': False},
            'phone': {'required': False},
        }
    
    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('phone'):
            raise serializers.ValidationError(
                "Either email or phone must be provided."
            )
        
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        
        if attrs.get('email'):
            try:
                validate_email(attrs.get('email'))
            except:
                raise serializers.ValidationError(
                    {"email": "Invalid email address."}
                )
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login with email/phone and password.
    """
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = PhoneNumberField(required=False)
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('phone'):
            raise serializers.ValidationError(
                "Either email or phone must be provided."
            )
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user data.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        token['name'] = user.name
        token['email'] = user.email
        token['phone'] = str(user.phone) if user.phone else None
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['user'] = UserSerializer(self.user, context=self.context).data
        
        return data


class UserAddressSerializer(serializers.ModelSerializer):
    """
    Serializer for UserAddress model.
    """
    
    class Meta:
        model = UserAddress
        fields = [
            'id', 'label', 'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude', 'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserDeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for UserDevice model.
    """
    
    class Meta:
        model = UserDevice
        fields = [
            'id', 'device_type', 'device_token', 'device_name',
            'is_active', 'last_used_at', 'created_at'
        ]
        read_only_fields = ['id', 'last_used_at', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        request = self.context['request']
        validated_data['ip_address'] = self.get_client_ip(request)
        validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    
    class Meta:
        model = User
        fields = ['name', 'email', 'phone', 'avatar']
        extra_kwargs = {
            'email': {'required': False},
            'phone': {'required': False},
        }
