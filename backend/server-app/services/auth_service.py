from datetime import datetime, timezone
from flask_jwt_extended import create_access_token
from models.user import User, Role
from repo.user_repo import UserRepository
from utils.ApiResponse import ApiResponse, StatusCodes
import re

class AuthService:
    def __init__(self):
        self.repo = UserRepository()

    def register_user(self, data):
        required = ['email', 'password', 'first_name', 'last_name']
        
        # Validation checks
        if not all(k in data for k in required) or not data['email'] or not data['password']:
            return ApiResponse({"message": "Missing required fields"}, StatusCodes.BAD_REQUEST)

        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            return ApiResponse({"message": "Invalid email format"}, StatusCodes.BAD_REQUEST)

        if len(data['password']) < 6:
            return ApiResponse({"message": "Password must be at least 6 characters"}, StatusCodes.BAD_REQUEST)
        
        if self.repo.get_by_email(data['email']):
            return ApiResponse({"message": "User with this email already exists"}, StatusCodes.CONFLICT)

        # Data preparation
        password = data.pop('password')
        
        if 'birth_date' in data and isinstance(data['birth_date'], str):
            try:
                data['birth_date'] = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return ApiResponse({"message": "Invalid date format. Use YYYY-MM-DD"}, StatusCodes.BAD_REQUEST)

        try:
            new_user = User(**data) 
            new_user.set_password(password)
            new_user.role = Role.PLAYER.value
            
            self.repo.save(new_user)
            return ApiResponse({"message": "User registered successfully"}, StatusCodes.SUCCESS)
            
        except TypeError as e:
            return ApiResponse({"message": f"Data mapping error: {str(e)}"}, StatusCodes.BAD_REQUEST)

    def login_user(self, email, password):
        if not email or not password:
            return ApiResponse({"message": "Email and password are required"}, StatusCodes.BAD_REQUEST), None

        user = self.repo.get_by_email(email)

        if not user:
            return ApiResponse({"message": "Invalid credentials"}, StatusCodes.UNAUTHORIZED), None

        if user.is_locked():
            remaining_time = (user.locked_until - datetime.now(timezone.utc)).seconds
            return ApiResponse({"message": f"Account locked. Try again in {remaining_time} seconds."}, StatusCodes.FORBIDDEN), None

        if user.check_password(password):
            self.repo.reset_login_attempts(user)
            
            additional_claims = {"role": user.role}
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            
            return ApiResponse({
                "message": "Login successful", 
                "role": user.role
            }, StatusCodes.SUCCESS), access_token
        else:
            self.repo.handle_failed_login(user)
            return ApiResponse({"message": "Invalid credentials"}, StatusCodes.UNAUTHORIZED), None

    def logout_user(self, jti):
        return ApiResponse({"message": "Successfully logged out"}, StatusCodes.SUCCESS)
