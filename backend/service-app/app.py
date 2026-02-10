from flask import Flask
from flask_cors import CORS
from extensions import db, migrate, jwt, socketio, mail
from routes.quiz_routes import quiz_bp
from routes.question_routes import question_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    # Initialize CORS
    CORS(app, 
         supports_credentials=True,
         origins=["http://localhost:3000", "http://localhost:5173"],
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type", "Authorization"]
    )
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize Socket.IO last
    socketio.init_app(app, 
                      cors_allowed_origins="*",
                      async_mode="eventlet",
                      logger=True,
                      engineio_logger=True
    )
    
    # Register blueprints
    app.register_blueprint(quiz_bp, url_prefix="/api")
    app.register_blueprint(question_bp, url_prefix="/api")
    
    # Import socket handlers to register them
    try:
        import socket_handler
    except ImportError:
        pass  # It's okay if sockets.py doesn't exist yet
    
    return app
