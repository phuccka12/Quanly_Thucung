import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone

from app.models.scheduled_event import ScheduledEvent
from app.models.pet import Pet
from app.core.config import settings

async def check_upcoming_events():
    """
    Công việc này sẽ được chạy định kỳ để kiểm tra và gửi email nhắc nhở bằng smtplib.
    """
    now = datetime.now(timezone.utc)
    search_window_end = now + timedelta(minutes=60)
    
    print(f"\n[{now.strftime('%Y-%m-%d %H:%M:%S')}] Running job (using smtplib): Checking for events...")
    
    upcoming_events = await ScheduledEvent.find(
        ScheduledEvent.is_completed == False,
        ScheduledEvent.reminder_sent == False,
        ScheduledEvent.event_datetime >= now,
        ScheduledEvent.event_datetime <= search_window_end
    ).to_list()
    
    print(f"Found {len(upcoming_events)} events to remind.")

    for event in upcoming_events:
        pet = await Pet.get(event.pet.ref.id)
        if not pet:
            print(f"WARNING: Pet not found for event '{event.title}'.")
            continue

        print(f"Preparing to send email for event: '{event.title}'")
        try:
            # --- LOGIC GỬI EMAIL BẰNG THƯ VIỆN CHUẨN SMTPLIB ---
            msg = EmailMessage()
            
            body = f"""
            Xin chào Admin,
            
            Đây là thông báo nhắc nhở cho một sự kiện sắp diễn ra:
            
            - Thú cưng: {pet.name}
            - Sự kiện: {event.title}
            - Thời gian: {event.event_datetime.strftime('%Y-%m-%d %H:%M')}
            - Mô tả: {event.description or 'Không có mô tả'}
            """
            
            msg.set_content(body)
            msg['Subject'] = f"Nhắc nhở sự kiện: {event.title} cho thú cưng {pet.name}"
            msg['From'] = settings.MAIL_FROM
            msg['To'] = settings.MAIL_TO_ADMIN

            # Kết nối tới server và gửi email
            server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
            server.starttls() # Bật chế độ bảo mật
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(msg)
            server.quit()
            # ----------------------------------------------------
            
            print(f"SUCCESS: Sent reminder for event '{event.title}'.")
            
            event.reminder_sent = True
            await event.save()
        except Exception as e:
            # Lỗi này sẽ cho chúng ta biết chính xác vấn đề (sai pass, sai config...)
            print(f"!!! ERROR: Failed to send email for event '{event.title}'. Error: {e}")