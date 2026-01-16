from flask import Blueprint, request, jsonify, make_response
from services.auth_service import AuthService
from flask_jwt_extended import jwt_required, get_jwt, set_access_cookies, unset_jwt_cookies

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    response = auth_service.register_user(data)
    return jsonify(response.value), response.status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    api_response, token = auth_service.login_user(email, password)
    
    flask_resp = make_response(jsonify(api_response.value), api_response.status_code)
    
    if token:
        set_access_cookies(flask_resp, token)
        
    return flask_resp

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    api_response = auth_service.logout_user(jti)
    
    flask_resp = make_response(jsonify(api_response.value), api_response.status_code)
    unset_jwt_cookies(flask_resp)
    
    return flask_resp
