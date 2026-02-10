# sockets/sockets.py
from flask import request
from flask_jwt_extended import decode_token
from extensions import socketio

@socketio.on('connect', namespace='/admin')
def on_connect():
    token = request.cookies.get('access_token')
    if not token:
        return False
    try:
        decoded = decode_token(token)
        if decoded.get("role") != "ADMIN":
            return False
        print(f"Admin connected: {decoded.get('sub')}")
    except:
        return False
