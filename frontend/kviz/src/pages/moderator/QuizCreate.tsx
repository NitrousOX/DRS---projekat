import QuizEditor from "../../components/quiz/QuizEditor";
import type { QuizDraft } from "../../types/quiz";
import { mapDraftToCreateQuizDTO } from "../../utils/quizMapper";

export default function QuizCreate() {
  async function handleSubmit(draft: QuizDraft) {
    const dto = mapDraftToCreateQuizDTO(draft);

    console.log("CREATE QUIZ DTO:", dto);
    alert("DTO spreman. Pogledaj console.log (CreateQuizRequestDTO).");
  }

  return <QuizEditor onSubmit={handleSubmit} resetAfterSubmit />;

}
