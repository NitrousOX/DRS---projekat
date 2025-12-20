from app import create_app
from extensions import db
from models.user import User, Role
from repo.user_repo import UserRepository
from datetime import date

def seed_admin():
    # 1. Initialize the app and context
    app = create_app()
    with app.app_context():
        # Optional: ensure tables are created (if not using migrate)
        # db.create_all()

        user_repo = UserRepository()

        # 2. Check if admin already exists to avoid duplicates
        admin_email = "admin@kviz.com"
        existing_user = user_repo.get_by_email(admin_email)

        if existing_user:
            print(f"Admin with email {admin_email} already exists. Skipping...")
            return

        # 3. Create the Admin object
        # We pass the raw data; the set_password method handles the hashing
        admin = User(
            first_name="Sistem",
            last_name="Admin",
            email=admin_email,
            birth_date=date(1990, 1, 1),
            gender="M",
            country="Srbija",
            street="Trg Slobode",
            street_number="1",
            role=Role.ADMIN.value
        )
        
        # This uses werkzeug.security.generate_password_hash internally
        admin.set_password("SuperSecretAdmin123!")

        # 4. Save via Repository
        try:
            user_repo.save(admin)
            print(f"Successfully seeded Admin account: {admin_email}")
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding database: {e}")

if __name__ == "__main__":
    seed_admin()
