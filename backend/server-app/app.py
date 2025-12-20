from flask import Flask
from extensions import db, migrate, jwt
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints with prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')

    return app
