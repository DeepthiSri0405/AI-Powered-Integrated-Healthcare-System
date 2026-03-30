import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# To support the user's request of "one default mail" to receive all alerts during MVP
DEFAULT_RECIPIENT = EMAIL_USER 

def send_medical_id_email(recipient_email: str, name: str, medical_id: str):
    """
    Emails the generated Medical ID directly to the user (or default email) 
    instead of displaying it on the screen for enhanced security.
    """
    if not EMAIL_USER or not EMAIL_PASS:
        print("WARNING: Email Credentials missing in .env")
        return False
        
    try:
        # Override to single default email as requested for this exact hackathon setup
        target_email = DEFAULT_RECIPIENT 
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to Hybrid Health Identity System - Your Medical ID"
        msg["From"] = f"Smart Health Admin <{EMAIL_USER}>"
        msg["To"] = target_email

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #2563eb; text-align: center;">Welcome, {name}!</h2>
                <p style="color: #4b5563; line-height: 1.6;">
                    Your native Citizen Medical Profile has been successfully generated via Aadhaar Linkage. 
                    For security purposes, we do not project your ID during the registration flow.
                </p>
                
                <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">Your Secure Medical ID</p>
                    <h1 style="color: #1e40af; letter-spacing: 2px; margin: 0; font-size: 32px;">{medical_id}</h1>
                </div>
                
                <p style="color: #4b5563; font-size: 14px;">
                    Use this ID alongside your chosen password to access the Web Portal and manage your Family Network securely.
                </p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                    Hybrid Health Verification Engine &copy; 2026. This is an automated message.
                </p>
            </div>
          </body>
        </html>
        """
        
        part = MIMEText(html, "html")
        msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, target_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error dispatching medical ID email: {e}")
        return False
