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
        if not all(k in data for k in required) or not data['email'] or not data['password']:
            return ApiResponse("Missing required fields", StatusCodes.BAD_REQUEST)

        if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            return ApiResponse("Invalid email format", StatusCodes.BAD_REQUEST)

        if len(data['password']) < 6:
            return ApiResponse("Password must be at least 6 characters", StatusCodes.BAD_REQUEST)

        if self.repo.get_by_email(data['email']):
            return ApiResponse("User with this email already exists", StatusCodes.CONFLICT)

        password = data.pop('password')
        
        if 'birth_date' in data and isinstance(data['birth_date'], str):
            try:
                # Assuming format 'YYYY-MM-DD' from the frontend
                data['birth_date'] = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return ApiResponse("Invalid date format. Use YYYY-MM-DD", StatusCodes.BAD_REQUEST)

        try:
            new_user = User(**data) 
            new_user.set_password(password)
            new_user.role = Role.PLAYER.value
            
            self.repo.save(new_user)
            return ApiResponse("User registered successfully", StatusCodes.SUCCESS)
            
        except TypeError as e:
            # This usually happens if 'data' has a key that doesn't exist in the User model
            return ApiResponse(f"Data mapping error: {str(e)}", StatusCodes.BAD_REQUEST)

    def login_user(self, email, password):
        if not email or not password:
            return ApiResponse("Email and password are required", StatusCodes.BAD_REQUEST), None

        user = self.repo.get_by_email(email)

        if not user:
            return ApiResponse("Invalid credentials", StatusCodes.UNAUTHORIZED), None

        if user.is_locked():
            remaining_time = (user.locked_until - datetime.now(timezone.utc)).seconds
            return ApiResponse(f"Account locked. Try again in {remaining_time} seconds.", StatusCodes.FORBIDDEN), None

        if user.check_password(password):
            self.repo.reset_login_attempts(user)
            
            additional_claims = {"role": user.role}
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            
            # Return data for the body and the token for the cookie
            return ApiResponse({"message": "Login successful", "role": user.role}, StatusCodes.SUCCESS), access_token
        else:
            self.repo.handle_failed_login(user)
            return ApiResponse("Invalid credentials", StatusCodes.UNAUTHORIZED), None

    def logout_user(self, jti):
        # In the controller, you'll extract the 'jti' (JWT ID) from the token
        # and you can save it to a blocklist here.
        return ApiResponse("Successfully logged out", StatusCodes.SUCCESS)
