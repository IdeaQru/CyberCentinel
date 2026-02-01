import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

GMAIL_USER = os.environ.get('GMAIL_USER')
GMAIL_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL')

async def send_down_notification(monitor_name: str, monitor_type: str, target: str, error_message: str = None):
    """Send email notification when a monitor goes down"""
    try:
        message = MIMEMultipart('alternative')
        message['Subject'] = f'🚨 Monitor Down Alert: {monitor_name}'
        message['From'] = GMAIL_USER
        message['To'] = NOTIFICATION_EMAIL

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #EF4444; border-radius: 8px; background-color: #FEF2F2;">
              <h2 style="color: #DC2626; margin-top: 0;">⚠️ Monitor Alert</h2>
              <p><strong>Status:</strong> <span style="color: #DC2626;">DOWN</span></p>
              <hr style="border: 1px solid #FECACA;">
              <p><strong>Monitor Name:</strong> {monitor_name}</p>
              <p><strong>Type:</strong> {monitor_type.upper()}</p>
              <p><strong>Target:</strong> {target}</p>
              <p><strong>Time:</strong> {timestamp}</p>
              {f'<p><strong>Error:</strong> {error_message}</p>' if error_message else ''}
              <hr style="border: 1px solid #FECACA;">
              <p style="font-size: 12px; color: #666; margin-bottom: 0;">This is an automated alert from Cyber-Sentinel Monitoring System</p>
            </div>
          </body>
        </html>
        """
        
        html_part = MIMEText(html_content, 'html')
        message.attach(html_part)

        await aiosmtplib.send(
            message,
            hostname='smtp.gmail.com',
            port=587,
            start_tls=True,
            username=GMAIL_USER,
            password=GMAIL_PASSWORD,
        )
        
        logger.info(f"Email notification sent for monitor: {monitor_name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        return False