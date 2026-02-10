from flask_mail import Message
from extensions import mail

def send_rolechange_email(recipient_email, role):
    msg = Message(
        subject="Your results",
        recipients=[recipient_email],
        body=f"Your role has been changed to: {role}"
    )
    # You can also use msg.html = "<b>HTML content here</b>"
    mail.send(msg)
