from flask import Flask
from flask_cors import CORS
from extensions import db, migrate, jwt

from models.quiz import Quiz, Question, Answer, QuizResult
from routes.quiz_routes import quiz_bp
from routes.question_routes import question_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    
    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(quiz_bp, url_prefix="/api")
    app.register_blueprint(question_bp, url_prefix="/api")


    return app
