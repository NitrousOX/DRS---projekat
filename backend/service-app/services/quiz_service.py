from models.quiz import Quiz, QuizStatus, Question, Answer
from extensions import db
from repo.quiz_repo import QuizRepository


class QuizService:

    @staticmethod
    def create_quiz(data):
        quiz = Quiz(
            title=data["title"],
            description=data.get("description"),
            duration_seconds=data.get("duration_seconds", 60),
            author_id=data["author_id"],
            author_email=data.get("author_email"),
            status=QuizStatus.DRAFT
        )
        db.session.add(quiz)
        db.session.commit()
        return quiz

    @staticmethod
    def add_question(quiz_id, data):
        question = Question(
            quiz_id=quiz_id,
            text=data["text"],
            points=data.get("points", 1)
        )
        db.session.add(question)
        db.session.commit()
        return question
    
    @staticmethod
    def add_answer(question_id, data):
        answer = Answer(
            question_id=question_id,
            text=data["text"],
            is_correct=data.get("is_correct", False)
        )
        db.session.add(answer)
        db.session.commit()
        return answer

    @staticmethod
    def validate_quiz_for_submit(quiz_id: int):
        quiz = QuizRepository.get_quiz_by_id(quiz_id)
        if not quiz:
            return False, "Quiz not found"

        questions = QuizRepository.get_questions_for_quiz(quiz_id)
        if len(questions) < 1:
            return False, "Quiz must have at least 1 question"

        for q in questions:
            if QuizRepository.count_answers_for_question(q.id) < 2:
                return False, f"Question {q.id} must have at least 2 answers"
            if not QuizRepository.has_correct_answer(q.id):
                return False, f"Question {q.id} must have at least 1 correct answer"

        return True, "OK"

    @staticmethod
    def submit_quiz(quiz_id: int):
        quiz = QuizRepository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")

        if quiz.status not in [QuizStatus.DRAFT, QuizStatus.REJECTED]:
            raise ValueError("Quiz cannot be submitted in current status")

        ok, msg = QuizService.validate_quiz_for_submit(quiz_id)
        if not ok:
            raise ValueError(msg)

        quiz.status = QuizStatus.PENDING
        quiz.reject_reason = None
        db.session.commit()
        return quiz
    
    @staticmethod
    def approve_quiz(quiz_id: int):
        quiz = QuizRepository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")

        if quiz.status != QuizStatus.PENDING:
            raise ValueError("Only PENDING quizzes can be approved")

        quiz.status = QuizStatus.APPROVED
        quiz.reject_reason = None
        db.session.commit()
        return quiz

    @staticmethod
    def reject_quiz(quiz_id: int, reason: str):
        quiz = QuizRepository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")

        if quiz.status != QuizStatus.PENDING:
            raise ValueError("Only PENDING quizzes can be rejected")

        if not reason or not reason.strip():
            raise ValueError("Reject reason is required")

        quiz.status = QuizStatus.REJECTED
        quiz.reject_reason = reason.strip()
        db.session.commit()
        return quiz


        
