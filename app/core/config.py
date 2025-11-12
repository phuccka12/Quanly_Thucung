from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    DATABASE_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    # Thêm các biến mail
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool
    MAIL_TO_ADMIN: str
    # Ngưỡng tồn kho thấp để gửi cảnh báo
    LOW_STOCK_THRESHOLD: int = 5
    # Cancellation window in hours for scheduled events
    CANCEL_WINDOW_HOURS: int = 24
    # Customer support phone number shown in cancellation guidance
    SUPPORT_PHONE: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
