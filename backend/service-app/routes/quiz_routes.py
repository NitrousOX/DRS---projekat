from flask import Blueprint, request, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from services.quiz_service import QuizService
from models.quiz import Question, Answer, QuizResult, Quiz
from repo.quiz_repo import QuizRepository
import time
from extensions import db

quiz_bp = Blueprint("quiz_bp", __name__)

@quiz_bp.route("/quizzes", methods=["POST"])
@jwt_required()
def create_quiz():
    data = request.get_json() or {}

    current_user_id = get_jwt_identity()

    # napravi ORM objekat (NE dict)
    quiz = Quiz(
        title=data.get("title"),
        duration_seconds=data.get("duration_seconds", 60),
        status="DRAFT",   # ili pusti da model defaultuje na DRAFT
        author_id= current_user_id
    )

    QuizRepository.save_quiz(quiz)  # save_quiz očekuje ORM model i to je OK

    return jsonify({
        "id": quiz.id,
        "status": quiz.status
    }), 201

@quiz_bp.route("/quizzes", methods=["GET"])
def list_quizzes():
    include = request.args.get("include", "summary")

    if include == "full":
        quizzes = QuizRepository.get_all_quizzes_full()
        return jsonify([
            q.to_dict(
                include_questions=True,
                include_answers=True,
                include_correct=True
            )
            for q in quizzes
        ]), 200

    quizzes = QuizRepository.get_all_quizzes()
    return jsonify([
        q.to_dict(include_questions=False)
        for q in quizzes
    ]), 200


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

@quiz_bp.route("/quizzes/<int:quiz_id>/full", methods=["GET"])
def get_full_quiz(quiz_id: int):
    quiz = QuizRepository.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).all()

    payload = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "status": quiz.status,
        "duration_seconds": quiz.duration_seconds,
        "questions": []
    }

    for q in questions:
        answers = Answer.query.filter_by(question_id=q.id).all()
        payload["questions"].append({
            "id": q.id,
            "text": q.text,
            "points": q.points,
            "answers": [
                {"id": a.id, "text": a.text, "is_correct": a.is_correct}
                for a in answers
            ]
        })

    return jsonify(payload), 200

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt, jwt_required
from models.quiz import Quiz, Question, Answer, QuizResult
from extensions import db
import time

@quiz_bp.route("/quizzes/<int:quiz_id>/process", methods=["POST"])
@jwt_required()
def process_quiz(quiz_id: int):
    payload = request.get_json(silent=True) or {}

    # 1. Identity & Claims extraction
    # current_user_id comes from the 'sub' field in JWT
    current_user_id = get_jwt_identity()
    
    # claims comes from the 'additional_claims' we added in AuthService
    claims = get_jwt()
    user_email = claims.get("email", "Unknown")

    time_spent_seconds = payload.get("time_spent_seconds")
    answers = payload.get("answers")

    # Basic Validation
    if time_spent_seconds is None or not isinstance(answers, list):
        return jsonify({"error": "Invalid payload"}), 400

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    if quiz.status != "APPROVED":
        return jsonify({"error": "Quiz is not approved"}), 400

    # 1) Simulation of heavy processing
    time.sleep(3)

    # 2) Mapping: question_id -> set of submitted answer_ids
    submitted = {}
    for item in answers:
        qid = item.get("question_id")
        aids = item.get("answer_ids", [])
        if qid is None or not isinstance(aids, list):
            continue
        submitted[int(qid)] = set(int(x) for x in aids)

    # 3) Scoring Logic
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    max_score = sum((q.points or 0) for q in questions)

    score = 0
    correct_count = 0

    for q in questions:
        # Get correct answer IDs from DB
        correct_answers = Answer.query.filter_by(question_id=q.id, is_correct=True).all()
        correct_set = set(a.id for a in correct_answers)

        # Get what the user sent for this specific question
        submitted_set = submitted.get(q.id, set())

        # Correct only if sets match perfectly
        if len(correct_set) > 0 and submitted_set == correct_set:
            score += int(q.points or 0)
            correct_count += 1

    total_questions = len(questions)

    # 4) Save result to Database
    # We use user_id and user_email extracted directly from the secure JWT
    result = QuizResult(
        user_id=int(current_user_id),
        user_email=user_email,
        quiz_id=quiz_id,
        score=int(score),
        time_spent_seconds=int(time_spent_seconds)
    )
    
    try:
        db.session.add(result)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error while saving result"}), 500

    # 5) Return data to Frontend
    return jsonify({
        "quiz_id": quiz_id,
        "user_id": int(current_user_id),
        "user_email": user_email,
        "score": int(score),
        "max_score": int(max_score),
        "correct_count": int(correct_count),
        "total_questions": int(total_questions),
        "time_spent_seconds": int(time_spent_seconds)
    }), 200
@quiz_bp.route("/quizzes/<int:quiz_id>/leaderboard", methods=["GET"])
def quiz_leaderboard(quiz_id: int):
    # query param limit, default 10
    limit = request.args.get("limit", default=10, type=int)
    if limit <= 0:
        limit = 10
    if limit > 100:
        limit = 100

    results = QuizRepository.get_leaderboard_for_quiz(quiz_id, limit=limit)

    payload = []
    for r in results:
        payload.append({
            "result_id": r.id,
            "user_id": r.user_id,
            "user_email": r.user_email,
            "score": r.score,
            "time_spent_seconds": r.time_spent_seconds,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None
        })

    return jsonify({
        "quiz_id": quiz_id,
        "limit": limit,
        "results": payload
    }), 200


