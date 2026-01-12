import os
import urllib.parse
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), "static/uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "1433")
    DB_NAME = os.getenv("DB_NAME", "master")
    DB_USER = os.getenv("DB_USER", "sa")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    # Default to Driver 17 so Windows teammates don't need to change anything
    DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

    # Driver 18 defaults to encryption; for local dev, disable it unless you explicitly want TLS
    encrypt = "no"
    trust_cert = "yes"

    odbc_str = (
        f"DRIVER={{{DB_DRIVER}}};"
        f"SERVER={DB_HOST},{DB_PORT};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
    )

    # Only add these when using Driver 18 (safe on macOS, avoids TLS errors)
    if "ODBC Driver 18" in DB_DRIVER:
        odbc_str += f"Encrypt={encrypt};TrustServerCertificate={trust_cert};"

    SQLALCHEMY_DATABASE_URI = "mssql+pyodbc:///?odbc_connect=" + urllib.parse.quote_plus(odbc_str)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

<<<<<<< HEAD
    # Auth / Security rules
=======
# Set to None to remove Flask-level upload limits
    MAX_CONTENT_LENGTH = None 
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads/profiles')

# Auth / Security rules
>>>>>>> 91aff327e7b6f78b443e36c238a53b717ea27ee7
    MAX_FAILED_LOGINS = 3
    LOCK_TIME_MINUTES = 1  # testing

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
