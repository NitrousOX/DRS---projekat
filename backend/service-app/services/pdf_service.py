from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def build_quiz_report_pdf(quiz_id: int, leaderboard: dict) -> bytes:
    """
    leaderboard format:
    {
      "quiz_id": 1,
      "limit": 10,
      "results": [ {user_email, score, time_spent_seconds, completed_at, ...}, ...]
    }
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, f"Quiz Report (Quiz ID: {quiz_id})")
    y -= 20

    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Generated at: {datetime.utcnow().isoformat()}Z")
    y -= 30

    # Header row
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Rank")
    c.drawString(100, y, "User")
    c.drawString(330, y, "Score")
    c.drawString(390, y, "Time(s)")
    c.drawString(460, y, "Completed")
    y -= 15

    c.setFont("Helvetica", 10)

    results = leaderboard.get("results", [])
    for idx, r in enumerate(results, start=1):
        if y < 60:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)

        user = r.get("user_email") or f"user_id={r.get('user_id')}"
        score = r.get("score")
        tsec = r.get("time_spent_seconds")
        completed = (r.get("completed_at") or "")[:19].replace("T", " ")

        c.drawString(50, y, str(idx))
        c.drawString(100, y, str(user)[:35])
        c.drawString(330, y, str(score))
        c.drawString(390, y, str(tsec))
        c.drawString(460, y, completed)
        y -= 14

    c.showPage()
    c.save()
    return buffer.getvalue()
