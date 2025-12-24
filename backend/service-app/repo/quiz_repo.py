from extensions import db
from models.quiz import Quiz, Question, Answer, QuizResult, Ranking
from sqlalchemy import desc

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

    # --- RANKING / LEADERBOARD ---
    @staticmethod
    def get_top_rankings(limit=10):
        """Returns users ordered by total_score descending"""
        return Ranking.query.order_by(desc(Ranking.total_score)).limit(limit).all()

    @staticmethod
    def update_user_ranking(user_id, score_increment):
        """
        Updates an existing ranking or creates a new one 
        when a user finishes a quiz.
        """
        # 1. Look for existing ranking record for this specific user
        ranking = Ranking.query.filter_by(user_id=user_id).first()
        
        # 2. If the user has never played before, create a new record
        if not ranking:
            ranking = Ranking(
                user_id=user_id, 
                total_score=0, 
                quizzes_completed=0
            )
            db.session.add(ranking)
        
        # 3. Increment the stats
        ranking.total_score += score_increment
        ranking.quizzes_completed += 1
        
        # 4. Commit the changes to the DB
        db.session.commit()
        return ranking

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
