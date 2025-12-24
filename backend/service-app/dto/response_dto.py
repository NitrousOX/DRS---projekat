class AnswerResponseDTO:
    def __init__(self, answer):
        self.id = answer.id
        self.text = answer.text

class QuestionResponseDTO:
    def __init__(self, question):
        self.id = question.id
        self.text = question.text
        self.answers = [AnswerResponseDTO(a).__dict__ for a in question.answers]

class QuizResponseDTO:
    def __init__(self, quiz):
        self.id = quiz.id
        self.title = quiz.title
        self.description = quiz.description
        self.questions = [QuestionResponseDTO(q).__dict__ for q in quiz.questions]

class RankingResponseDTO:
    def __init__(self, ranking):
        self.id = ranking.id
        self.user_id = ranking.user_id
        # Pristupamo User modelu preko relacije koju smo definirali
        self.full_name = f"{ranking.user.first_name} {ranking.user.last_name}"
        self.total_score = ranking.total_score
        self.quizzes_completed = ranking.quizzes_completed

    def to_dict(self):
        return {
            "full_name": self.full_name,
            "total_score": self.total_score,
            "quizzes_completed": self.quizzes_completed
        }
