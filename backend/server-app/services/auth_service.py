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
# BASIC VALIDATION
        required = ['email', 'password', 'first_name', 'last_name']
        if not all(k in data for k in required) or not data['email'] or not data['password']:
            return ApiResponse("Missing required fields", StatusCodes.BAD_REQUEST)

        # Basic Email Regex
        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            return ApiResponse("Invalid email format", StatusCodes.BAD_REQUEST)

        if len(data['password']) < 6:
            return ApiResponse("Password must be at least 6 characters", StatusCodes.BAD_REQUEST)

        if self.repo.get_by_email(data['email']):
            return ApiResponse("User with this email already exists", StatusCodes.CONFLICT)

        password = data.pop('password') 

        try:
            new_user = User(**data) 
            new_user.set_password(password)
            new_user.role = Role.PLAYER.value # Ensure role is set
            
            self.repo.save(new_user)
            return ApiResponse("User registered successfully", StatusCodes.SUCCESS)
        except TypeError as e:
            return ApiResponse(f"Data mapping error: {str(e)}", StatusCodes.BAD_REQUEST)

    def login_user(self, email, password):
        if not email or not password:
            return ApiResponse("Email and password are required", StatusCodes.BAD_REQUEST)

        user = self.repo.get_by_email(email)

        # 1. Check if user exists
        if not user:
            return ApiResponse("Invalid credentials", StatusCodes.UNAUTHORIZED)

        # 2. Check if account is locked
        if user.is_locked():
            remaining_time = (user.locked_until - datetime.now(timezone.utc)).seconds
            return ApiResponse(f"Account locked. Try again in {remaining_time} seconds.", StatusCodes.FORBIDDEN)

        # 3. Verify password
        if user.check_password(password):
            # Success: Reset failed attempts and generate token
            self.repo.reset_login_attempts(user)
            
            # Add role to claims so frontend/backend can restrict access easily
            additional_claims = {"role": user.role}
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            
            return ApiResponse({"token": access_token, "role": user.role}, StatusCodes.SUCCESS)
        else:
            # Failure: Increment count and check for lockout
            self.repo.handle_failed_login(user)
            return ApiResponse("Invalid credentials", StatusCodes.UNAUTHORIZED)

    def logout_user(self, jti):
        # In the controller, you'll extract the 'jti' (JWT ID) from the token
        # and you can save it to a blocklist here.
        return ApiResponse("Successfully logged out", StatusCodes.SUCCESS)
