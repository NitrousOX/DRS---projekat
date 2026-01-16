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

# In services/user_service.py

    def upload_user_image(self, user_id, file):
        if not file or file.filename == '':
            return ApiResponse("No file selected", StatusCodes.BAD_REQUEST)

        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)

        # 1. Setup Upload Directory
        from flask import current_app
        upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads/profiles')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # 2. Secure Filename and Create Unique Path
        original_filename = secure_filename(file.filename)
        extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
        unique_name = f"user_{user_id}_{uuid.uuid4().hex}.{extension}"
        file_path = os.path.join(upload_dir, unique_name)

        try:
            # 3. Save file to filesystem
            file.save(file_path)
            
            # 4. Update the user record in DB with the new path/filename
            user.profile_image = unique_name
            self.repo.save(user)

            return ApiResponse({
                "message": "Image uploaded successfully",
                "image_path": unique_name
            }, StatusCodes.SUCCESS)

        except Exception as e:
            return ApiResponse(f"Upload failed: {str(e)}", StatusCodes.INTERNAL_SERVER_ERROR)

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
