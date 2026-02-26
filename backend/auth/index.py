"""
Авторизация и управление пользователями.
Методы: POST /login, GET /users, POST /users, PUT /users/{id}, POST /users/{id}/deactivate
"""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = 't_p78311576_logistics_web_app_1'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_session_user(conn, token: str):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.email, u.role, u.is_active FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': str(row[0]), 'name': row[1], 'email': row[2], 'role': row[3], 'is_active': row[4]}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token', '')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_db()
    try:
        # POST /login
        if path.endswith('/login') and method == 'POST':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            if not email or not password:
                return err('Укажите email и пароль')

            cur = conn.cursor()
            cur.execute(
                f"SELECT id, name, email, role, is_active FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
                (email, hash_password(password))
            )
            row = cur.fetchone()
            if not row:
                return err('Неверный email или пароль', 401)
            if not row[4]:
                return err('Аккаунт деактивирован', 403)

            user_id = row[0]
            session_token = secrets.token_hex(32)
            expires = datetime.now(timezone.utc) + timedelta(days=30)
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (str(user_id), session_token, expires)
            )
            conn.commit()
            return ok({'token': session_token, 'user': {'id': str(row[0]), 'name': row[1], 'email': row[2], 'role': row[3]}})

        # POST /logout
        if path.endswith('/logout') and method == 'POST':
            if token:
                cur = conn.cursor()
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return ok({'ok': True})

        # GET /me
        if path.endswith('/me') and method == 'GET':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            return ok({'user': user})

        # GET /users — список сотрудников (только для admin/director/manager)
        if path.endswith('/users') and method == 'GET':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            if user['role'] not in ('admin', 'director', 'manager'):
                return err('Нет доступа', 403)
            cur = conn.cursor()
            cur.execute(f"SELECT id, name, email, role, is_active, created_at FROM {SCHEMA}.users ORDER BY created_at")
            rows = cur.fetchall()
            users = [{'id': str(r[0]), 'name': r[1], 'email': r[2], 'role': r[3], 'is_active': r[4], 'created_at': str(r[5])} for r in rows]
            return ok({'users': users})

        # POST /users — создать сотрудника (admin/director)
        if path.endswith('/users') and method == 'POST':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            if user['role'] not in ('admin', 'director'):
                return err('Нет доступа', 403)
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            password = body.get('password', '').strip()
            role = body.get('role', 'logist')
            if not name or not email or not password:
                return err('Заполните все поля')
            if role not in ('logist', 'manager', 'director', 'admin'):
                return err('Неверная роль')
            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return err('Email уже используется')
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, email, hash_password(password), role)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': str(new_id), 'name': name, 'email': email, 'role': role, 'is_active': True}, 201)

        # PUT /users/{id} — обновить данные
        if '/users/' in path and method == 'PUT':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            if user['role'] not in ('admin', 'director'):
                return err('Нет доступа', 403)
            target_id = path.split('/users/')[-1].split('/')[0]
            fields = []
            vals = []
            if 'name' in body:
                fields.append('name = %s'); vals.append(body['name'])
            if 'email' in body:
                fields.append('email = %s'); vals.append(body['email'].lower())
            if 'role' in body:
                if body['role'] not in ('logist', 'manager', 'director', 'admin'):
                    return err('Неверная роль')
                fields.append('role = %s'); vals.append(body['role'])
            if 'password' in body and body['password']:
                fields.append('password_hash = %s'); vals.append(hash_password(body['password']))
            if 'is_active' in body:
                fields.append('is_active = %s'); vals.append(bool(body['is_active']))
            if not fields:
                return err('Нет данных для обновления')
            fields.append('updated_at = NOW()')
            vals.append(target_id)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(fields)} WHERE id = %s", vals)
            conn.commit()
            return ok({'ok': True})

        return err('Маршрут не найден', 404)
    finally:
        conn.close()
