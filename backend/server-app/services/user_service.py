from repo.user_repo import UserRepository
from utils.ApiResponse import ApiResponse, StatusCodes
from models.user import Role
import os
import uuid
from werkzeug.utils import secure_filename
from utils.email_service import send_rolechange_email

class UserService:
    def __init__(self):
        self.repo = UserRepository()

    def update_profile_image(self, user_id, file):
        if not file:
            return ApiResponse("No file uploaded", StatusCodes.BAD_REQUEST)

        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)

        from flask import current_app
        upload_dir = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        original_filename = secure_filename(file.filename)
        extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
        unique_name = f"{uuid.uuid4().hex}.{extension}"
        
        file_path = os.path.join(upload_dir, unique_name)

        try:
            file.save(file_path)
        except Exception as e:
            return ApiResponse(f"File system error: {str(e)}", StatusCodes.INTERNAL_SERVER_ERROR)

        # 4. Update the user record with the filename (or path)
        user.profile_image = unique_name
        self.repo.save(user)

        return ApiResponse({"image_name": unique_name}, StatusCodes.SUCCESS)

    def get_profile(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)
        
        # Mapping model to a dictionary for JSON serialization
        user_data = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "birth_date": str(user.birth_date),
            "gender": user.gender,
            "country": user.country,
            "street": user.street,
            "street_number": user.street_number,
            "role": user.role,
            "profile_image": user.profile_image
        }
        return ApiResponse(user_data, StatusCodes.SUCCESS)

    def update_profile(self, user_id, update_data):
        if not update_data:
            return ApiResponse("No data provided for update", StatusCodes.BAD_REQUEST)

        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)

        # Fields that should NEVER be changed via this endpoint
        protected_fields = ['id', 'email', 'password_hash', 'role', 'created_at', 'failed_logins', 'locked_until']

        # Validation: Prevent clearing names
        if 'first_name' in update_data and not str(update_data['first_name']).strip():
            return ApiResponse("First name cannot be empty", StatusCodes.BAD_REQUEST)
        if 'last_name' in update_data and not str(update_data['last_name']).strip():
            return ApiResponse("Last name cannot be empty", StatusCodes.BAD_REQUEST)

        # HANDLE DATE CONVERSION
        if 'birth_date' in update_data and update_data['birth_date']:
            try:
                if isinstance(update_data['birth_date'], str):
                    update_data['birth_date'] = datetime.strptime(update_data['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return ApiResponse("Invalid date format. Use YYYY-MM-DD", StatusCodes.BAD_REQUEST)

        # Dynamic Update
        for key, value in update_data.items():
            if hasattr(user, key) and key not in protected_fields:
                setattr(user, key, value)
        
        self.repo.save(user)
        return ApiResponse("Profile updated successfully", StatusCodes.SUCCESS)

    def get_all_users(self):
        users = self.repo.get_all()
        output = [
            {
                "id": u.id,
                "full_name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "role": u.role
            } for u in users
        ]
        return ApiResponse(output, StatusCodes.SUCCESS)

    def delete_user(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)
        
        self.repo.delete(user)
        return ApiResponse("User account deleted", StatusCodes.SUCCESS)

    def change_user_role(self, user_id, new_role_name):
        if not new_role_name:
            return ApiResponse("Role name is required", StatusCodes.BAD_REQUEST)

        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)

        try:
            target_role = Role[new_role_name].value 
        except KeyError:
            return ApiResponse("Invalid role specified", StatusCodes.BAD_REQUEST)

        user.role = target_role
        self.repo.save(user)
        send_rolechange_email(user.email, target_role)
        return ApiResponse(f"User role updated to {target_role}", StatusCodes.SUCCESS)
