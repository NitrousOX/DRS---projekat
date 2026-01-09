from flask import Blueprint, request, jsonify
from services.quiz_service import QuizService

quiz_bp = Blueprint("quiz_bp", __name__)


@quiz_bp.route("/quizzes", methods=["POST"])
def create_quiz():
    data = request.get_json()

    quiz = QuizService.create_quiz(data)

    return jsonify({
        "id": quiz.id,
        "status": quiz.status
    }), 201

@quiz_bp.route("/quizzes/<int:quiz_id>/submit", methods=["POST"])
def submit_quiz(quiz_id: int):
    try:
        quiz = QuizService.submit_quiz(quiz_id)
        return jsonify({"id": quiz.id, "status": quiz.status}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
@quiz_bp.route("/quizzes/<int:quiz_id>/approve", methods=["POST"])
def approve_quiz(quiz_id: int):
    try:
        quiz = QuizService.approve_quiz(quiz_id)
        return jsonify({"id": quiz.id, "status": quiz.status}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@quiz_bp.route("/quizzes/<int:quiz_id>/reject", methods=["POST"])
def reject_quiz(quiz_id: int):
    try:
        data = request.get_json(force=True) if request.data else {}
        reason = data.get("reason", "")
        quiz = QuizService.reject_quiz(quiz_id, reason)
        return jsonify({"id": quiz.id, "status": quiz.status, "reject_reason": quiz.reject_reason}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


