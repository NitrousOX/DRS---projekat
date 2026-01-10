from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from flask_jwt_extended import jwt_required, get_jwt

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    # Marshmallow validation would happen here
    response = auth_service.register_user(data)
    return jsonify(response.value), response.status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    response = auth_service.login_user(email, password)
    return jsonify(response.value), response.status_code

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Get the unique identifier of the JWT to blocklist it
    jti = get_jwt()["jti"]
    response = auth_service.logout_user(jti)
    return jsonify(response.value), response.status_code
