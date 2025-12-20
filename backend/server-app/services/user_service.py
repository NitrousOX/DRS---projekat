from repo.user_repo import UserRepository
from utils.ApiResponse import ApiResponse, StatusCodes
from models.user import Role

class UserService:
    def __init__(self):
        self.repo = UserRepository()


    def get_profile(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)
        
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
        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)

        for key, value in update_data.items():
            if hasattr(user, key) and key not in ['id', 'email', 'password_hash', 'role']:
                setattr(user, key, value)
        
        self.repo.save(user)
        return ApiResponse("Profile updated successfully", StatusCodes.SUCCESS)


    def get_all_users(self):
        users = self.repo.get_all()
        output = []
        for u in users:
            output.append({
                "id": u.id,
                "full_name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "role": u.role
            })
        return ApiResponse(output, StatusCodes.SUCCESS)

    def delete_user(self, user_id):
        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)
        
        self.repo.delete(user)
        return ApiResponse("User account deleted", StatusCodes.SUCCESS)

    def change_user_role(self, user_id, new_role_name):
        user = self.repo.get_by_id(user_id)
        if not user:
            return ApiResponse("User not found", StatusCodes.NOT_FOUND)

        try:
            target_role = Role[new_role_name].value 
        except KeyError:
            return ApiResponse("Invalid role specified", StatusCodes.BAD_REQUEST)

        user.role = target_role
        self.repo.save(user)

        # TODO: Trigger Email Notification here
        # self.email_service.send_role_change_notification(user.email, target_role)

        return ApiResponse(f"User role updated to {target_role}", StatusCodes.SUCCESS)
