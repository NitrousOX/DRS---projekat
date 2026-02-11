from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_mail import Mail
import redis

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
cache = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
