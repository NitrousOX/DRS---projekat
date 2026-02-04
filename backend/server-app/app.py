from flask import Flask
from flask_cors import CORS
from extensions import db, migrate, jwt, socketio, mail
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.quiz_proxy_routes import quiz_proxy_bp
from routes.play_routes import play_bp
import socket_handlers


def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])
    
    # --- INIT EXTENSIONS ---
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)


    # --- INIT SOCKETIO ---
    socketio.init_app(app, cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    # Register blueprints with prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(quiz_proxy_bp, url_prefix="/api")
    app.register_blueprint(play_bp, url_prefix="/api")


    
    

    return app
