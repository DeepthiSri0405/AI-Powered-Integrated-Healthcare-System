import os
import sys
from dotenv import load_dotenv

# Ensure we can import backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load from .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from utils.email_utils import send_email_notification

def run_test():
    email_user = os.getenv("EMAIL_USER")
    
    if not email_user:
        print("Error: EMAIL_USER is not set in the .env file.")
        return
        
    print(f"Testing SMTP connection using sender: {email_user}")
    
    subject = "Smart Health System: SMTP Test Successful"
    html_content = """
    <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px;'>
        <h2 style='color: #10b981;'>Test Email Configuration</h2>
        <p>If you have received this email, your SMTP configuration (Google App Password) is completely successful.</p>
        <p>Your background services can now autonomously send notifications to patients.</p>
    </div>
    """
    
    # Send test email to yourself
    send_email_notification(to_email=email_user, subject=subject, html_message=html_content)
    
if __name__ == "__main__":
    run_test()
