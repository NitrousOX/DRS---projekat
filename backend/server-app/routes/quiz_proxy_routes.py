import os
import requests
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from extensions import socketio

quiz_proxy_bp = Blueprint("quiz_proxy_bp", __name__)
QUIZ_SERVICE_URL = os.getenv("QUIZ_SERVICE_URL", "http://127.0.0.1:5000")

@quiz_proxy_bp.route("/quizzes/<int:quiz_id>/submit", methods=["POST"])
@jwt_required()
def submit_quiz_proxy(quiz_id: int):
    claims = get_jwt()
    role = claims.get("role")

    if role not in ["MODERATOR", "ADMIN"]:
        return jsonify({"error": "Forbidden"}), 403

    r = requests.post(f"{QUIZ_SERVICE_URL}/api/quizzes/{quiz_id}/submit")
    data = r.json() if r.headers.get("Content-Type","").startswith("application/json") else {"raw": r.text}

    if r.status_code == 200 and data.get("status") == "PENDING":
        socketio.emit("quiz:new_pending", {"quiz_id": quiz_id}, room="admins")

    return jsonify(data), r.status_code

@quiz_proxy_bp.route("/quizzes", methods=["GET"])
@jwt_required()
def list_quizzes_proxy():
    claims = get_jwt()
    role = claims.get("role")

    include = request.args.get("include", "summary")
    r = requests.get(f"{QUIZ_SERVICE_URL}/api/quizzes", params={"include": include})

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

