import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication


def send_results_email(to_email: str, quiz_id: int, score: int, max_score: int, time_spent_seconds: int):
    """
    Minimalan SMTP mail sender.
    Radi sa Gmail App Password (MAIL_USERNAME + MAIL_PASSWORD).
    """
    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    sender = os.getenv("MAIL_DEFAULT_SENDER", username)

    # Ako nema kredencijala, samo log 
    if not username or not password:
        print(f"[MAIL MOCK] To={to_email} Quiz={quiz_id} Score={score}/{max_score} Time={time_spent_seconds}s")
        return

    subject = f"Rezultat kviza #{quiz_id}"
    body = f"Osvojili ste {score}/{max_score} bodova. Vreme: {time_spent_seconds}s."

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(username, password)
            smtp.sendmail(sender, [to_email], msg.as_string())
        print(f"[MAIL SENT] To={to_email}")
    except Exception as e:
        # ✅ ne ruši proces, samo loguj
        print(f"[MAIL FAILED -> MOCK] {e}")
        print(f"[MAIL MOCK] To={to_email} | Quiz={quiz_id} | Score={score}/{max_score} | Time={time_spent_seconds}s")

def send_pdf_email(to_email: str, subject: str, body: str, filename: str, pdf_bytes: bytes):
    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    sender = os.getenv("MAIL_DEFAULT_SENDER", username)

    # ako nema creds -> MOCK
    if not username or not password:
        print(f"[PDF MAIL MOCK] To={to_email} file={filename} bytes={len(pdf_bytes)}")
        return

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    msg.attach(MIMEText(body, "plain", "utf-8"))

    attach = MIMEApplication(pdf_bytes, _subtype="pdf")
    attach.add_header("Content-Disposition", "attachment", filename=filename)
    msg.attach(attach)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(username, password)
            smtp.sendmail(sender, [to_email], msg.as_string())
        print(f"[PDF MAIL SENT] To={to_email} file={filename}")
    except Exception as e:
        print(f"[PDF MAIL FAILED] {e}")
        print(f"[PDF MAIL MOCK] To={to_email} file={filename} bytes={len(pdf_bytes)}")