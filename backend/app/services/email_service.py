"""
email_service.py — Sends transactional emails via Resend API.
All email sending is non-blocking (FastAPI BackgroundTasks).
Templates are defined as HTML strings in this file.
"""

import logging
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_layout(content: str) -> str:
    """Wrapped HTML layout with Learnova branding."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1e293b; margin: 0; padding: 0; }}
        .wrapper {{ background-color: #f8fafc; padding: 40px 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }}
        .header {{ background-color: #1d4ed8; padding: 24px; text-align: center; color: white; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }}
        .content {{ padding: 32px; }}
        .footer {{ padding: 24px; text-align: center; font-size: 12px; color: #64748b; background-color: #f1f5f9; }}
        .button {{ display: inline-block; background-color: #1d4ed8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 24px; }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header"><h1>Learnova</h1></div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                &copy; 2024 Learnova eLearning Platform
            </div>
        </div>
    </div>
</body>
</html>
"""

def send_course_invitation(to_email: str, to_name: str, course_title: str, instructor_name: str, login_url: str):
    """Sends a course invitation email to an attendee."""
    content = f"""
<p>Hi {to_name or 'Learner'},</p>
<p><strong>{instructor_name}</strong> has invited you to join the course: <strong>{course_title}</strong>.</p>
<p>Click the button below to sign in and start learning.</p>
<a href="{login_url}" class="button">Start Learning</a>
<p style="margin-top: 32px; font-size: 14px; color: #64748b;">If you haven't set a password yet, use the 'Forgot Password' link on the login page.</p>
"""
    subject = f"You've been invited to: {course_title}"
    send_email(to_email, subject, _get_layout(content))

def send_instructor_message(to_email: str, to_name: str, course_title: str, subject: str, body: str):
    """Sends a message from an instructor to an enrolled attendee."""
    content = f"""
<p>Hi {to_name or 'Learner'},</p>
<p>New message regarding your course <strong>{course_title}</strong>:</p>
<div style="background: #f8fafc; border-left: 4px solid #1d4ed8; padding: 16px; margin: 24px 0;">
    {body}
</div>
<p style="font-size: 14px; color: #64748b;">Visit the course dashboard for more details.</p>
"""
    send_email(to_email, subject, _get_layout(content))

def send_email(to: str, subject: str, html: str):
    """Low-level email sending via Resend API."""
    if not settings.resend_api_key:
        logger.warning(f"Email skip (no API key): To={to}, Subject={subject}")
        return

    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"Email sent successfully: To={to}, Subject={subject}")
    except Exception as e:
        logger.error(f"Failed to send email: To={to}, Subject={subject}, Error={e}")
