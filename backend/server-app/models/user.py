from datetime import datetime, timezone, timedelta
from enum import Enum
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class Role(Enum):
    PLAYER = "IGRAC"
    MODERATOR = "MODERATOR"
    ADMIN = "ADMIN"

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    birth_date = db.Column(db.Date)
    gender = db.Column(db.String(10))
    country = db.Column(db.String(50))
    street = db.Column(db.String(100))
    street_number = db.Column(db.String(10))

    # Storing as string for better SQL Server compatibility
    role = db.Column(db.String(20), nullable=False, default=Role.PLAYER.value)

    profile_image = db.Column(db.String(255), nullable=True)
    failed_logins = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
            
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    # --- Enhanced Lockout Logic ---
    def is_locked(self) -> bool:
        if self.locked_until and self.locked_until > datetime.now(timezone.utc):
            return True
        return False

    def handle_failed_login(self):
        self.failed_logins += 1
        if self.failed_logins >= 3:
            # Set lock for 1 minute as per your testing requirement
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=1)
        db.session.commit()

    def reset_login_attempts(self):
        self.failed_logins = 0
        self.locked_until = None
        db.session.commit()

# --- For JWT Logout Implementation ---
class TokenBlocklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
