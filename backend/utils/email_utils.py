import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_email_notification(to_email: str, subject: str, html_message: str):
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    
    # Per user request, force forward all emails to this address:
    target_email = "vigneshdendi3@gmail.com"

    if not email_user or not email_pass:
        print(f"\n--- MOCK EMAIL SERVER START (No live credentials) ---")
        print(f"To: {target_email} (Original intended: {to_email})\nSubject: {subject}")
        print(f"Body (HTML):\n{html_message}")
        print(f"--- MOCK EMAIL SERVER END ---\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_user
        msg["To"] = target_email
        
        # Attach the HTML body format
        part_html = MIMEText(html_message, "html")
        msg.attach(part_html)

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_user, email_pass)
        server.sendmail(email_user, target_email, msg.as_string())
        server.quit()
        print(f"[Email Service] Successfully sent notification to {target_email}")
    except Exception as e:
        print(f"[Email Service] Failed to send email to {target_email}: {str(e)}")
