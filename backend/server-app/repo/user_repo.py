from datetime import datetime, timezone, timedelta
from extensions import db
from models.user import User
from config import Config 

class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        return User.query.get(user_id)

    @staticmethod
    def get_by_email(email):
        return User.query.filter_by(email=email).first()

    @staticmethod
    def get_all():
        return User.query.all()

    @staticmethod
    def save(user):
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def delete(user):
        db.session.delete(user)
        db.session.commit()

    @staticmethod
    def handle_failed_login(user, lockout_minutes=Config.LOCK_TIME_MINUTES):
        user.failed_logins += 1
        if user.failed_logins >= Config.MAX_FAILED_LOGINS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
        db.session.commit()
        return user

    @staticmethod
    def reset_login_attempts(user):
        user.failed_logins = 0
        user.locked_until = None
        db.session.commit()

    @staticmethod
    def update_role(user, new_role):
        user.role = new_role
        db.session.commit()
        return user

    @staticmethod
    def update_profile_image(user, image_path):
        user.profile_image = image_path
        db.session.commit()
        return user
