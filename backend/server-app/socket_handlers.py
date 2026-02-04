from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import join_room
from extensions import socketio

@socketio.on("connect")
def on_connect(auth):
    # 1) cookie auth (spec)
    token = request.cookies.get("access_token")

    # 2) fallback za testiranje (ako koristiš python skriptu)
    if not token:
        token = request.args.get("token")

    if not token:
        print("Socket rejected (reason): missing token")
        return False

    try:
        decoded = decode_token(token)
        role = decoded.get("role")

        if role == "ADMIN":
            join_room("admins")

        print("Socket connected OK, role:", role)
        return True
    except Exception as e:
        print("Socket rejected (reason):", repr(e))
        return False
    
    
