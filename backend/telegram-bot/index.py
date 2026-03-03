import json
import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta

import psycopg2
import requests


def send_message(chat_id: int, text: str, reply_markup: dict = None) -> None:
    """Отправка сообщения пользователю через Telegram Bot API."""
    bot_token = os.environ["TELEGRAM_BOT_TOKEN"]
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    requests.post(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        json=payload,
        timeout=10
    )


def handle_web_auth(chat_id: int, user: dict) -> None:
    """Генерирует токен авторизации и отправляет ссылку для входа."""
    token = str(uuid.uuid4())
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cursor = conn.cursor()
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    cursor.execute(f"""
        INSERT INTO {schema}.telegram_auth_tokens
        (token_hash, telegram_id, telegram_username, telegram_first_name,
         telegram_last_name, telegram_photo_url, expires_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        token_hash,
        str(user.get("id")),
        user.get("username"),
        user.get("first_name"),
        user.get("last_name"),
        None,
        datetime.now(timezone.utc) + timedelta(minutes=5)
    ))
    conn.commit()
    conn.close()

    site_url = os.environ["SITE_URL"]
    auth_url = f"{site_url}/auth/telegram/callback?token={token}"
    send_message(
        chat_id,
        "Авторизация готова!\n\nНажмите кнопку ниже 👇\n\nСсылка действительна 5 минут",
        reply_markup={"inline_keyboard": [[{"text": "Войти на сайт", "url": auth_url}]]}
    )


def handler(event: dict, context) -> dict:
    """Обработчик webhook-событий от Telegram бота."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": ""
        }

    webhook_secret = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
    if webhook_secret:
        headers = event.get("headers") or {}
        if not isinstance(headers, dict):
            headers = {}
        incoming = headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if incoming != webhook_secret:
            return {"statusCode": 403, "headers": {"Access-Control-Allow-Origin": "*"}, "body": "Forbidden"}

    raw_body = event.get("body", "{}")
    if isinstance(raw_body, dict):
        body = raw_body
    elif isinstance(raw_body, str) and raw_body.strip():
        body = json.loads(raw_body)
    else:
        body = {}
    message = body.get("message") if isinstance(body, dict) else None
    if not message:
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": "ok"}

    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id")
    user = message.get("from", {})

    if text.startswith("/start"):
        parts = text.split(" ", 1)
        if len(parts) > 1 and parts[1] == "web_auth":
            handle_web_auth(chat_id, user)
        else:
            send_message(chat_id, "Привет! Используйте кнопку «Войти через Telegram» на сайте.")

    return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": "ok"}