from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from services.quiz_service import QuizService
from services.mail_service import send_results_email, send_pdf_email
from services.pdf_service import build_quiz_report_pdf
from models.quiz import Question, Answer, QuizResult, Quiz
from repo.quiz_repo import QuizRepository
from utils.decorators import admin_required
import time
from extensions import db, socketio

quiz_bp = Blueprint("quiz_bp", __name__)

# --- QUIZ LIFECYCLE ROUTES ---

@quiz_bp.route("/quizzes", methods=["POST"])
@jwt_required()
def create_quiz():

    data = request.get_json() or {}
    data["author_id"] = get_jwt_identity()
    
    quiz = QuizService.create_quiz(data)

    return jsonify({
        "id": quiz.id,
        "status": quiz.status
    }), 201

@quiz_bp.route("/quizzes/<int:quiz_id>/submit", methods=["POST"])
@jwt_required()
def submit_quiz(quiz_id: int):
    try:
        quiz = QuizService.submit_quiz(quiz_id)
        
        # --- WEBSOCKET NOTIFICATION ---
        # Notify admins that a new quiz needs approval
        socketio.emit('new_pending_quiz', {
            "id": quiz.id,
            "title": quiz.title,
            "status": quiz.status,
            "duration_seconds": quiz.duration_seconds,
            "author_id": quiz.author_id
        }, namespace='/admin')
        
        return jsonify({"id": quiz.id, "status": quiz.status}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@quiz_bp.route("/quizzes/<int:quiz_id>/approve", methods=["POST"])
@admin_required
def approve_quiz(quiz_id: int):
    """Admin approves the quiz. Status: PENDING -> APPROVED"""
    try:
        quiz = QuizService.approve_quiz(quiz_id)
        return jsonify({"id": quiz.id, "status": quiz.status}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@quiz_bp.route("/quizzes/<int:quiz_id>/reject", methods=["POST"])
@admin_required
def reject_quiz(quiz_id: int):
    """Admin rejects the quiz. Status: PENDING -> REJECTED"""
    try:
        data = request.get_json(force=True) if request.data else {}
        reason = data.get("reason", "")
        quiz = QuizService.reject_quiz(quiz_id, reason)
        return jsonify({
            "id": quiz.id, 
            "status": quiz.status, 
            "reject_reason": quiz.reject_reason
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

# --- FETCHING ROUTES ---

@quiz_bp.route("/quizzes", methods=["GET"])
@jwt_required()
def list_quizzes():
    include = request.args.get("include", "summary")

    if include == "full":
        quizzes = QuizRepository.get_all_quizzes_full()
        return jsonify([
            q.to_dict(
                include_questions=True,
                include_answers=True,
                include_correct=True
            ) for q in quizzes
        ]), 200

    quizzes = QuizRepository.get_all_quizzes()
    return jsonify([
        q.to_dict(include_questions=False) for q in quizzes
    ]), 200

@quiz_bp.route("/quizzes/<int:quiz_id>/full", methods=["GET"])
@jwt_required()
def get_full_quiz(quiz_id: int):
    quiz = QuizRepository.get_quiz_by_id(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    # Manual payload building to ensure structure for frontend
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

# --- PLAYING / SCORING ROUTES ---

@quiz_bp.route("/quizzes/<int:quiz_id>/process", methods=["POST"])
@jwt_required()
def process_quiz(quiz_id: int):
    """
    Student submits their answers.
    Calculates score and saves to QuizResult.
    """
    payload = request.get_json(silent=True) or {}
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    user_email = claims.get("email", "Unknown")

    time_spent_seconds = payload.get("time_spent_seconds")
    answers = payload.get("answers")

    if time_spent_seconds is None or not isinstance(answers, list):
        return jsonify({"error": "Invalid payload"}), 400

    quiz = Quiz.query.get(quiz_id)
    if not quiz or quiz.status != "APPROVED":
        return jsonify({"error": "Quiz not found or not available"}), 400

    # Simulate processing delay
    time.sleep(3)

    # Scoring Logic
    submitted = {int(item.get("question_id")): set(int(x) for x in item.get("answer_ids", [])) 
                 for item in answers if item.get("question_id") is not None}

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    score = 0
    correct_count = 0
    max_score = sum((q.points or 0) for q in questions)

    for q in questions:
        correct_answers = Answer.query.filter_by(question_id=q.id, is_correct=True).all()
        correct_set = set(a.id for a in correct_answers)
        submitted_set = submitted.get(q.id, set())

        if len(correct_set) > 0 and submitted_set == correct_set:
            score += int(q.points or 0)
            correct_count += 1

    # Database Persistance
    result = QuizResult(
        user_id=int(current_user_id),
        user_email=user_email,
        quiz_id=quiz_id,
        score=int(score),
        time_spent_seconds=int(time_spent_seconds)
    )

    send_results_email(
        to_email=user_email,
        quiz_id=quiz_id,
        score=result.score,
        max_score=max_score,
        time_spent_seconds=time_spent_seconds
    )
    
    try:
        db.session.add(result)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error while saving result"}), 500

    return jsonify({
        "quiz_id": quiz_id,
        "score": int(score),
        "max_score": int(max_score),
        "correct_count": correct_count,
        "total_questions": len(questions),
        "time_spent_seconds": time_spent_seconds
    }), 200

@quiz_bp.route("/quizzes/<int:quiz_id>/leaderboard", methods=["GET"])
def quiz_leaderboard(quiz_id: int):
    limit = request.args.get("limit", default=10, type=int)
    limit = max(1, min(limit, 100))

    results = QuizRepository.get_leaderboard_for_quiz(quiz_id, limit=limit)
    payload = [{
        "result_id": r.id,
        "user_id": r.user_id,
        "user_email": r.user_email,
        "score": r.score,
        "time_spent_seconds": r.time_spent_seconds,
        "completed_at": r.completed_at.isoformat() if r.completed_at else None
    } for r in results]

    return jsonify({
        "quiz_id": quiz_id,
        "results": payload
    }), 200


@quiz_bp.route("/quizzes/<int:quiz_id>/send-report", methods=["POST"])
@jwt_required()
def send_quiz_report(quiz_id: int):

    claims = get_jwt()
    user_email = claims.get("email")
    
    if not user_email:
        return jsonify({"error": "User email not found in token"}), 400

    try:
        results = QuizRepository.get_leaderboard_for_quiz(quiz_id, limit=20)
        

        leaderboard_data = {
            "quiz_id": quiz_id,
            "results": [
                {
                    "user_email": r.user_email,
                    "score": r.score,
                    "time_spent_seconds": r.time_spent_seconds,
                    "completed_at": r.completed_at.isoformat() if r.completed_at else None
                } for r in results
            ]
        }
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leaderboard: {str(e)}"}), 500

    try:
        pdf_bytes = build_quiz_report_pdf(quiz_id, leaderboard_data)
    except Exception as e:
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500

    # 4. Send the Email
    subject = f"Izveštaj o rezultatima - Kviz #{quiz_id}"
    body = f"U prilogu se nalazi PDF izveštaj sa najboljim rezultatima za kviz {quiz_id}."
    filename = f"quiz_{quiz_id}_report.pdf"

    send_pdf_email(
        to_email=user_email,
        subject=subject,
        body=body,
        filename=filename,
        pdf_bytes=pdf_bytes
    )

    return jsonify({
        "message": "Report has been generated and sent to your email.",
        "recipient": user_email
    }), 200
