import os
import uuid
import requests
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import time
from multiprocessing import get_context
from workers.quiz_worker import process_quiz_attempt
from services.pdf_service import build_quiz_report_pdf

play_bp = Blueprint("play_bp", __name__)

QUIZ_SERVICE_URL = os.getenv("QUIZ_SERVICE_URL", "http://127.0.0.1:5000")

# jednostavna memorijska sesija (dovoljno za faks)
ACTIVE_ATTEMPTS = {}  # attempt_id -> {user_id, quiz_id, started_at}

@play_bp.route("/quizzes/<int:quiz_id>/start", methods=["POST"])
@jwt_required()
def start_quiz(quiz_id: int):
    user_id = get_jwt_identity()

    # 1) povuci kviz + pitanja + odgovore iz service-app
    r = requests.get(f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/full")
    if r.status_code != 200:
        return jsonify({"error": "Quiz not found"}), 404

    quiz = r.json()

    # 2) mora biti APPROVED
    if quiz.get("status") != "APPROVED":
        return jsonify({"error": "Quiz is not approved"}), 400

    attempt_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()

    ACTIVE_ATTEMPTS[attempt_id] = {
        "user_id": user_id,
        "quiz_id": quiz_id,
        "started_at": started_at,
        "started_at_epoch": int(time.time())
    }

    # 3) vrati podatke za igru (po potrebi sakrij is_correct)
    for q in quiz.get("questions", []):
        for a in q.get("answers", []):
            a.pop("is_correct", None)

    return jsonify({
        "attempt_id": attempt_id,
        "quiz": quiz,
        "started_at": started_at
    }), 200

@play_bp.route("/attempts/<string:attempt_id>/answers", methods=["POST"])
@jwt_required()
def submit_answers(attempt_id: str):
    user_id = get_jwt_identity()

    attempt = ACTIVE_ATTEMPTS.get(attempt_id)
    if not attempt:
        return jsonify({"error": "Invalid attempt_id"}), 404

    if attempt["user_id"] != user_id:
        return jsonify({"error": "Forbidden"}), 403

    payload = request.get_json(silent=True) or {}
    answers_payload = payload.get("answers")

    # očekujemo:
    # { "answers": [ {"question_id": 1, "answer_ids": [1]}, ... ] }
    if not isinstance(answers_payload, list) or len(answers_payload) == 0:
        return jsonify({"error": "answers must be a non-empty list"}), 400

    quiz_id = attempt["quiz_id"]
    started_at_epoch = int(attempt.get("started_at_epoch", int(time.time())))
    time_spent_seconds = int(time.time()) - started_at_epoch
    if time_spent_seconds < 0:
        time_spent_seconds = 0

    # Windows-safe multiprocessing
    ctx = get_context("spawn")
    p = ctx.Process(
        target=process_quiz_attempt,
        args=(user_id, quiz_id, attempt_id, time_spent_seconds, answers_payload)
    )
    p.daemon = True
    p.start()

    # spreči dupli submit istog attempt-a
    ACTIVE_ATTEMPTS.pop(attempt_id, None)

    return jsonify({"status": "processing", "attempt_id": attempt_id}), 202

@play_bp.route("/quizzes/<int:quiz_id>/report.pdf", methods=["GET"])
@jwt_required()
def quiz_report_pdf(quiz_id: int):
    # samo ADMIN može report
    claims = get_jwt()
    role = claims.get("role")
    if role != "ADMIN":
        return jsonify({"error": "Forbidden"}), 403

    # povuci leaderboard iz service-app
    r = requests.get(f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/leaderboard?limit=10")
    if r.status_code != 200:
        return jsonify({"error": "Leaderboard not available"}), 400

    leaderboard = r.json()
    pdf_bytes = build_quiz_report_pdf(quiz_id, leaderboard)

    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="quiz_{quiz_id}_report.pdf"'
        }
    )

@play_bp.route("/quizzes/<int:quiz_id>/report/send", methods=["POST"])
@jwt_required()
def send_quiz_report_mock(quiz_id: int):
    # samo ADMIN
    claims = get_jwt()
    role = claims.get("role")
    if role != "ADMIN":
        return jsonify({"error": "Forbidden"}), 403

    # povuci leaderboard
    r = requests.get(f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/leaderboard?limit=10")
    if r.status_code != 200:
        return jsonify({"error": "Leaderboard not available"}), 400

    leaderboard = r.json()

    # napravi PDF bytes
    pdf_bytes = build_quiz_report_pdf(quiz_id, leaderboard)

    # MOCK “slanje”
    admin_email = claims.get("email", "admin@kviz.com")
    print(f"[PDF MOCK MAIL] Sent quiz_{quiz_id}_report.pdf to {admin_email} ({len(pdf_bytes)} bytes)")

    return jsonify({
        "status": "sent_mock",
        "to": admin_email,
        "quiz_id": quiz_id,
        "pdf_size_bytes": len(pdf_bytes)
    }), 200


