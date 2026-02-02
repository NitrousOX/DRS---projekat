from extensions import db
from datetime import datetime, timezone

class QuizStatus:
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Quiz(db.Model):
    __tablename__ = 'quizzes'

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    # workflow
    status = db.Column(db.String(20), nullable=False, default=QuizStatus.DRAFT)
    reject_reason = db.Column(db.Text, nullable=True)

    # config
    duration_seconds = db.Column(db.Integer, nullable=False, default=60)

    # author snapshot (DB2 nema user tabelu; iako je master, mi ovde NE zavisimo od users)
    author_id = db.Column(db.Integer, nullable=False)
    author_email = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    questions = db.relationship(
        'Question',
        backref='quiz',
        lazy=True,
        cascade="all, delete-orphan"
    )

    results = db.relationship(
        'QuizResult',
        backref='quiz',
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self, include_questions=True, include_answers=True, include_correct=True):
        data = {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "duration_seconds": self.duration_seconds,
            "author_id": self.author_id,
            "rejection_reason": self.reject_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if getattr(self, "updated_at", None) else None,
        }
        if include_questions:
            data["questions"] = [
                q.to_dict(include_answers=include_answers, include_correct=include_correct)
                for q in self.questions
            ]
        return data


class Question(db.Model):
    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)

    text = db.Column(db.Text, nullable=False)
    points = db.Column(db.Integer, nullable=False, default=1)

    answers = db.relationship(
        'Answer',
        backref='question',
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self, include_answers=True, include_correct=True):
        data = {
            "id": self.id,
            "text": self.text,
            "points": self.points
        }
        if include_answers:
            data["answers"] = [a.to_dict(include_correct=include_correct) for a in self.answers]
        return data


class Answer(db.Model):
    __tablename__ = 'answers'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)

    text = db.Column(db.String(255), nullable=False)
    is_correct = db.Column(db.Boolean, default=False, nullable=False)
    
    def to_dict(self, include_correct=True):
        data = {
            "id": self.id,
            "text": self.text
        }
        if include_correct:
            data["is_correct"] = self.is_correct
        return data


class QuizResult(db.Model):
    __tablename__ = 'quiz_results'

    id = db.Column(db.Integer, primary_key=True)

    # snapshot user-a (bez FK)
    user_id = db.Column(db.Integer, nullable=False)
    user_email = db.Column(db.String(255), nullable=True)

    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)

    score = db.Column(db.Integer, nullable=False, default=0)
    time_spent_seconds = db.Column(db.Integer, nullable=True)

    completed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

