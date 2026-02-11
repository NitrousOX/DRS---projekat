import os
import urllib.parse
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_TOKEN_LOCATION = ['cookies']
    JWT_ACCESS_COOKIE_NAME = 'access_token'
    JWT_COOKIE_CSRF_PROTECT = False  
    JWT_COOKIE_HTTPONLY = True      
    JWT_COOKIE_SECURE = False       
    JWT_COOKIE_SAMESITE = 'Lax'

    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  

    # Database connection parameters
    DB_HOST = os.getenv("DB_HOST", "db2-sql")  # Service app usually hits the second DB
    DB_PORT = os.getenv("DB_PORT", "1433")
    DB_NAME = os.getenv("DB_NAME", "master")
    DB_USER = os.getenv("DB_USER", "sa")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    
    # Default to 18 to match your Docker setup
    DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")

    # Build the ODBC string exactly like the working server-app
    odbc_str = (
        f"DRIVER={{{DB_DRIVER}}};"
        f"SERVER={DB_HOST},{DB_PORT};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
    )

    # Apply the Driver 18 security bypass
    if "ODBC Driver 18" in DB_DRIVER:
        odbc_str += "Encrypt=no;TrustServerCertificate=yes;"

    # Final SQLAlchemy URI
    SQLALCHEMY_DATABASE_URI = "mssql+pyodbc:///?odbc_connect=" + urllib.parse.quote_plus(odbc_str)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
