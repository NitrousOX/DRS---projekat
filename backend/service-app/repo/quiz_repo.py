from extensions import db
from models.quiz import Quiz, Question, Answer, QuizResult
from sqlalchemy import asc, desc

class QuizRepository:
    
    # --- QUIZ METHODS ---
    @staticmethod
    def get_quiz_by_id(quiz_id):
        return Quiz.query.get(quiz_id)

    @staticmethod
    def get_all_quizzes():
        return Quiz.query.all()

    @staticmethod
    def save_quiz(quiz):
        db.session.add(quiz)
        db.session.commit()
        return quiz

    @staticmethod
    def delete_quiz(quiz):
        db.session.delete(quiz)
        db.session.commit()

    # --- QUESTION & ANSWER METHODS ---
    @staticmethod
    def get_question_by_id(question_id):
        return Question.query.get(question_id)

    @staticmethod
    def add_answer(answer):
        db.session.add(answer)
        db.session.commit()
        return answer

    # --- RESULTS & SCORING ---
    @staticmethod
    def save_result(result):
        db.session.add(result)
        db.session.commit()
        return result

    @staticmethod
    def get_user_results(user_id):
        return QuizResult.query.filter_by(user_id=user_id).all()

    

    # --- ANSWER SPECIFIC METHODS ---

    @staticmethod
    def get_answer_by_id(answer_id):
        """Find a specific answer by its primary key."""
        return Answer.query.get(answer_id)

    @staticmethod
    def get_answers_for_question(question_id):
        """Retrieve all possible answers for a specific question."""
        return Answer.query.filter_by(question_id=question_id).all()

    @staticmethod
    def get_correct_answer(question_id):
        """
        Find the correct answer for a question. 
        Useful for server-side validation.
        """
        return Answer.query.filter_by(question_id=question_id, is_correct=True).first()
    
    # --- VALIDATION METHODS ---
    @staticmethod
    def get_questions_for_quiz(quiz_id):
        return Question.query.filter_by(quiz_id=quiz_id).all()

    @staticmethod
    def count_questions_for_quiz(quiz_id):
        return Question.query.filter_by(quiz_id=quiz_id).count()

    @staticmethod
    def count_answers_for_question(question_id):
        return Answer.query.filter_by(question_id=question_id).count()

    @staticmethod
    def has_correct_answer(question_id):
        return Answer.query.filter_by(question_id=question_id, is_correct=True).count() > 0
    
    @staticmethod
    def get_leaderboard_for_quiz(quiz_id: int, limit: int = 10):
        return (
            QuizResult.query
            .filter_by(quiz_id=quiz_id)
            .order_by(
                desc(QuizResult.score),
                asc(QuizResult.time_spent_seconds),
                asc(QuizResult.completed_at)
            )
            .limit(limit)
            .all()
        )

