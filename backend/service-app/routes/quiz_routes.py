from flask import Blueprint, request, jsonify, request
from services.quiz_service import QuizService
from models.quiz import Question, Answer, QuizResult, Quiz
from repo.quiz_repo import QuizRepository
import time
from extensions import db

quiz_bp = Blueprint("quiz_bp", __name__)


@quiz_bp.route("/quizzes", methods=["POST"])
def create_quiz():
    data = request.get_json()

    quiz = QuizRepository.create_quiz(data)

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

@quiz_bp.route("/quizzes/<int:quiz_id>/process", methods=["POST"])
def process_quiz(quiz_id: int):
    payload = request.get_json(silent=True) or {}

    user_id = payload.get("user_id")
    user_email = payload.get("user_email")  # optional (može biti None)
    time_spent_seconds = payload.get("time_spent_seconds")
    answers = payload.get("answers")

    if user_id is None or time_spent_seconds is None or not isinstance(answers, list):
        return jsonify({"error": "Invalid payload"}), 400

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    if quiz.status != "APPROVED":
        return jsonify({"error": "Quiz is not approved"}), 400

    # 1) simulacija duže obrade
    time.sleep(3)

    # 2) priprema mapiranja: question_id -> set(submitted answer_ids)
    submitted = {}
    for item in answers:
        qid = item.get("question_id")
        aids = item.get("answer_ids", [])
        if qid is None or not isinstance(aids, list):
            continue
        submitted[int(qid)] = set(int(x) for x in aids)

    # 3) scoring
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    max_score = sum((q.points or 0) for q in questions)

    score = 0
    correct_count = 0

    for q in questions:
        correct_answers = Answer.query.filter_by(question_id=q.id, is_correct=True).all()
        correct_set = set(a.id for a in correct_answers)

        submitted_set = submitted.get(q.id, set())

        # tačno ako su skupovi identični i postoji bar jedan tačan odgovor
        if len(correct_set) > 0 and submitted_set == correct_set:
            score += int(q.points or 0)
            correct_count += 1

    total_questions = len(questions)

    # 4) upis rezultata u DB2
    result = QuizResult(
        user_id=int(user_id),
        user_email=user_email,
        quiz_id=quiz_id,
        score=int(score),
        time_spent_seconds=int(time_spent_seconds)
    )
    db.session.add(result)
    db.session.commit()

    return jsonify({
        "quiz_id": quiz_id,
        "user_id": int(user_id),
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


