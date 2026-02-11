import os
import json
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from services.user_service import UserService
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import admin_required
from extensions import cache

user_bp = Blueprint('user', __name__)
user_service = UserService()

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    user_id = get_jwt_identity()
    cache_key = f"user_profile:{user_id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return jsonify(json.loads(cached_data)), 200

    response = user_service.get_profile(user_id)
    if response.status_code == 200:
        cache.setex(cache_key, 600, json.dumps(response.value))
    return jsonify(response.value), response.status_code

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_my_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    response = user_service.update_profile(user_id, data)
    if response.status_code == 200:
        cache.delete(f"user_profile:{user_id}")
    return jsonify(response.value), response.status_code

@user_bp.route('/profile/image', methods=['POST'])
@jwt_required()
def upload_image():
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({"message": "No file part in the request"}), 400
    file = request.files['file']
    response = user_service.update_profile_image(user_id, file)
    if response.status_code == 200:
        cache.delete(f"user_profile:{user_id}")
    return jsonify(response.value), response.status_code

@user_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_my_account():
    user_id = get_jwt_identity()
    response = user_service.delete_user(user_id)
    if response.status_code == 200:
        cache.delete(f"user_profile:{user_id}")
    return jsonify(response.value), response.status_code

@user_bp.route('/profile/image/<filename>', methods=['GET'])
def get_profile_image(filename):
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'static/uploads/profiles')
    file_path = os.path.join(upload_dir, filename)
    if not os.path.exists(file_path):
        return send_from_directory('static/assets', 'default-avatar.png')
    return send_from_directory(upload_dir, filename)

@user_bp.route('/', methods=['GET'])
@admin_required 
def list_users():
    response = user_service.get_all_users()
    return jsonify(response.value), response.status_code

@user_bp.route('/<int:user_id>', methods=['GET'])
@admin_required
def get_user_by_id(user_id):
    response = user_service.get_profile(user_id)
    return jsonify(response.value), response.status_code

@user_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    response = user_service.delete_user(user_id)
    if response.status_code == 200:
        cache.delete(f"user_profile:{user_id}")
    return jsonify(response.value), response.status_code

@user_bp.route('/<int:user_id>/role', methods=['PATCH'])
@admin_required
def change_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    response = user_service.change_user_role(user_id, new_role)
    if response.status_code == 200:
        cache.delete(f"user_profile:{user_id}")
    return jsonify(response.value), response.status_code
