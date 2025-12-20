from flask import Blueprint, request, jsonify
from services.user_service import UserService
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import admin_required

user_bp = Blueprint('user', __name__)
user_service = UserService()

# --- REGULAR USER ROUTES ---

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    user_id = get_jwt_identity()
    response = user_service.get_profile(user_id)
    return jsonify(response.to_dict()), response.status_code

# --- ADMIN ROUTES ---

@user_bp.route('/admin/users', methods=['GET'])
@admin_required # Clean and easy to use
def list_users():
    response = user_service.get_all_users()
    return jsonify(response.to_dict()), response.status_code

@user_bp.route('/admin/users/<int:user_id>/role', methods=['PATCH'])
@admin_required
def change_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    response = user_service.change_user_role(user_id, new_role)
    return jsonify(response.to_dict()), response.status_code
