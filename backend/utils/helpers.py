from datetime import datetime, time, timedelta
import pytz

IST = pytz.timezone("Asia/Kolkata")

SHIFT_WINDOWS = {
    "Morning":  (time(5, 0),  time(11, 30)),
    "Evening":  (time(16, 0), time(21, 30)),
    "Full Day": (time(5, 0),  time(21, 30)),
}

def get_ist_now():
    """Always return current time in IST."""
    return datetime.now(IST)

def get_ist_date():
    """Always return current date in IST."""
    return datetime.now(IST).date()

def is_within_shift_window(shift):
    if shift not in SHIFT_WINDOWS:
        return False
    now = datetime.now(IST).time()
    start, end = SHIFT_WINDOWS[shift]
    return start <= now <= end

def calculate_duration(check_in, check_out):
    delta = check_out - check_in
    return max(0, int(delta.total_seconds() / 60))

def get_expiry_date(admission_date, duration_days):
    return admission_date + timedelta(days=duration_days)

def send_email(mail, subject, recipients, body, html=None):
    from flask_mail import Message
    msg = Message(subject=subject, recipients=recipients, body=body, html=html)
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"[Email Error] {e}")
        return False