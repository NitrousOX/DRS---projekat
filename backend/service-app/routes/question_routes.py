from flask import Blueprint, request, jsonify
from services.quiz_service import QuizService

question_bp = Blueprint("question_bp", __name__)


@question_bp.route("/quizzes/<int:quiz_id>/questions", methods=["POST"])
def add_question(quiz_id):
    data = request.get_json()
    question = QuizService.add_question(quiz_id, data)

    return jsonify({"question_id": question.id}), 201


@question_bp.route("/questions/<int:question_id>/answers", methods=["POST"])
def add_answer(question_id):
    data = request.get_json()
    answer = QuizService.add_answer(question_id, data)

    return jsonify({"answer_id": answer.id}), 201
