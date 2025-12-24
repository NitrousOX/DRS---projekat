# Quiz Submission (When a user finishes a quiz)
# Expected JSON: {"quiz_id": 1, "answers": [{"question_id": 10, "answer_id": 42}, ...]}
class QuizSubmissionDTO:
    def __init__(self, data):
        self.quiz_id = data.get('quiz_id')
        self.answers = data.get('answers', []) 
        # answers format: [{"question_id": 1, "answer_id": 10}, {"question_id": 2, "answer_id": 15}]

    def is_valid(self):
        return self.quiz_id is not None and isinstance(self.answers, list)

class QuizCreateDTO:
    def __init__(self, data):
        self.title = data.get('title')
        self.description = data.get('description')
        self.questions = data.get('questions', []) 
        # questions format: [{"text": "Pitanje?", "answers": [{"text": "Odg", "is_correct": True}, ...]}, ...]

    def validate(self):
        if not self.title or len(self.questions) == 0:
            return False
        return True
