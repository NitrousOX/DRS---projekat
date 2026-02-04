import os
import requests
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import socketio

quiz_proxy_bp = Blueprint("quiz_proxy_bp", __name__)
QUIZ_SERVICE_URL = os.getenv("QUIZ_SERVICE_URL", "http://127.0.0.1:5000")

def _forward_cookies():
    # prosledi access_token ka service-app
    token = request.cookies.get("access_token")
    if not token:
        return {}
    return {"access_token": token}

@quiz_proxy_bp.route("/quizzes/<int:quiz_id>/submit", methods=["POST"])
@jwt_required()
def submit_quiz_proxy(quiz_id: int):
    claims = get_jwt()
    role = claims.get("role")

    if role not in ["MODERATOR", "ADMIN"]:
        return jsonify({"error": "Forbidden"}), 403

    r = requests.post(f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/submit", cookies=_forward_cookies())
    data = r.json() if r.headers.get("Content-Type","").startswith("application/json") else {"raw": r.text}

    if r.status_code == 200:
        data = r.json()

        # emituj adminima kad ode na odobravanje
        if data.get("status") == "PENDING":
            socketio.emit(
                "quiz:new_pending",
                {"quiz_id": quiz_id, "status": "PENDING"},
                room="admins"
        )

    return jsonify(data), r.status_code

@quiz_proxy_bp.route("/quizzes", methods=["GET"])
@jwt_required()
def list_quizzes_proxy():
    claims = get_jwt()
    role = claims.get("role")

    include = request.args.get("include", "summary")
    r = requests.get(f"{QUIZ_SERVICE_URL}/api/quizzes", params={"include": include}, cookies=_forward_cookies())

    if r.status_code != 200:
        return jsonify({"error": "Quiz service error"}), r.status_code

    data = r.json()

    # 🔒 Filter vidljivosti za front (bitno!)
    # - IGRAČ: samo APPROVED
    # - MODERATOR: sve (za faks može), ili samo njegove + approved
    # - ADMIN: sve
    if role == "PLAYER":
        data = [q for q in data if q.get("status") == "APPROVED"]

        # BONUS: za PLAYER nikad nemoj slati is_correct
        if include == "full":
            for qz in data:
                for qu in qz.get("questions", []):
                    for ans in qu.get("answers", []):
                        ans.pop("is_correct", None)

    return jsonify(data), 200

@quiz_proxy_bp.route("/quizzes", methods=["POST"])
@jwt_required()
def create_quiz_proxy():
    # ko je ulogovan
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    # samo MODERATOR/ADMIN sme da kreira
    if role not in ["MODERATOR", "ADMIN"]:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}

    # author_id se setuje ovde (backend), front ne šalje
    data["author_id"] = user_id

    r = requests.post(f"{QUIZ_SERVICE_URL}/api/quizzes", json=data, cookies=_forward_cookies())
    return jsonify(r.json()), r.status_code

@quiz_proxy_bp.route("/quizzes/<int:quiz_id>/approve", methods=["POST"])
@jwt_required()
def approve_quiz_proxy(quiz_id: int):
    claims = get_jwt()
    role = claims.get("role")

    if role != "ADMIN":
        return jsonify({"error": "Forbidden"}), 403

    r = requests.post(
        f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/approve",
        cookies=_forward_cookies()
    )

    data = r.json() if r.headers.get("Content-Type", "").startswith("application/json") else {"raw": r.text}
    return jsonify(data), r.status_code

@quiz_proxy_bp.route("/quizzes/<int:quiz_id>/reject", methods=["POST"])
@jwt_required()
def reject_quiz_proxy(quiz_id: int):
    claims = get_jwt()
    role = claims.get("role")

    if role != "ADMIN":
        return jsonify({"error": "Forbidden"}), 403

    payload = request.get_json(silent=True) or {}
    reason = (payload.get("reason") or "").strip()

    if not reason:
        return jsonify({"error": "Reason is required"}), 400

    r = requests.post(
        f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/reject",
        json={"reason": reason},
        cookies=_forward_cookies()
    )

    data = r.json() if r.headers.get("Content-Type", "").startswith("application/json") else {"raw": r.text}
    return jsonify(data), r.status_code

@quiz_proxy_bp.route("/quizzes/<int:quiz_id>/full", methods=["GET"])
@jwt_required()
def get_full_quiz_proxy(quiz_id: int):
    r = requests.get(
        f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/full",
        cookies=_forward_cookies()
    )
    data = r.json() if r.headers.get("Content-Type","").startswith("application/json") else {"raw": r.text}
    return jsonify(data), r.status_code
