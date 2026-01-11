import os
import time
import requests

from services.mail_service import send_results_email
from repo.user_repo import UserRepository

QUIZ_SERVICE_URL = os.getenv("QUIZ_SERVICE_URL", "http://127.0.0.1:5000")


def process_quiz_attempt(user_id: int, quiz_id: int, attempt_id: str, time_spent_seconds: int, answers_payload: list):
    # import inside to avoid circular import
    from app import create_app

    app = create_app()
    with app.app_context():
        # 1) uzmi user iz DB1 PRE nego što ga koristiš
        user = UserRepository.get_by_id(user_id)
        if not user:
            print("PROCESS ERROR: user not found:", user_id)
            return

        # 2) pozovi service-app obradu
        r = requests.post(
            f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/process",
            json={
                "user_id": user_id,
                "user_email": user.email,
                "time_spent_seconds": time_spent_seconds,
                "answers": answers_payload
            },
            timeout=60
        )

        if r.status_code != 200:
            print("PROCESS ERROR:", r.status_code, r.text)
            return

        result = r.json()

        # 3) pošalji mail (ili mock)
        send_results_email(
            to_email=user.email,
            quiz_id=quiz_id,
            score=result.get("score"),
            max_score=result.get("max_score"),
            time_spent_seconds=time_spent_seconds
        )

        print("PROCESS DONE:", attempt_id, result)

