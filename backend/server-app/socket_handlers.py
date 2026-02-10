from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import join_room
from extensions import socketio

@socketio.on("connect")
def on_connect(auth):
    token = request.args.get("token")
    if not token:
        print("Socket rejected (reason): missing token")
        return False  # reject connect

    try:
        decoded = decode_token(token)  # valid signature + exp
        role = decoded.get("role")
        print("Socket connected: valid JWT")
        if role == "ADMIN":
            join_room("admins")
        return True
    except Exception as e:
        print("Socket rejected (reason):", repr(e))
        return False
    
    
