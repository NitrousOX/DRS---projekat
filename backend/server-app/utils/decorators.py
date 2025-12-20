from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt
from utils.ApiResponse import StatusCodes

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        # Ensure the role in the JWT matches ADMIN
        if claims.get("role") != "ADMIN":
            return jsonify({
                "value": "Access forbidden: Administrator role required.", 
                "status_code": StatusCodes.FORBIDDEN
            }), StatusCodes.FORBIDDEN
        
        return fn(*args, **kwargs)
    return wrapper
