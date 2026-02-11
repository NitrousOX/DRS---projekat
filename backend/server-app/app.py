from flask import Flask
from flask_cors import CORS
from extensions import db, migrate, jwt, mail
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    CORS(app, supports_credentials=True, origins=["http://localhost", "http://127.0.0.1", "http://localhost:5173" ],)
    
    # --- INIT EXTENSIONS ---
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints with prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')


    

    return app
