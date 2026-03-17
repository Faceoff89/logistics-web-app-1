"""
Авторизация и управление пользователями.
Действия передаются через поле action в теле: login, logout, me, get_users, create_user, update_user
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-User-Id',
    'Access-Control-Max-Age': '86400',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def q(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

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
        f"WHERE s.token = {q(token)} AND s.expires_at > NOW()"
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': str(row[0]), 'name': row[1], 'email': row[2], 'role': row[3], 'is_active': row[4]}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token', '')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except (ValueError, TypeError):
            pass

    action = body.get('action', '')

    conn = get_db()
    try:
        # login
        if action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            if not email or not password:
                return err('Укажите email и пароль')
            pw_hash = hash_password(password)
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, name, email, role, is_active FROM {SCHEMA}.users "
                f"WHERE email = {q(email)} AND password_hash = {q(pw_hash)}"
            )
            row = cur.fetchone()
            if not row:
                return err('Неверный email или пароль', 401)
            if not row[4]:
                return err('Аккаунт деактивирован', 403)
            session_token = secrets.token_hex(32)
            expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at, updated_at) "
                f"VALUES ({q(str(row[0]))}, {q(session_token)}, {q(expires)}, NOW())"
            )
            conn.commit()
            return ok({'token': session_token, 'user': {'id': str(row[0]), 'name': row[1], 'email': row[2], 'role': row[3]}})

        # logout
        if action == 'logout':
            if token:
                cur = conn.cursor()
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = {q(token)}")
                conn.commit()
            return ok({'ok': True})

        # me
        if action == 'me':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET updated_at = NOW() WHERE token = {q(token)}")
            conn.commit()
            return ok({'user': user})

        # get_users
        if action == 'get_users':
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

        # create_user
        if action == 'create_user':
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
            if role not in ('logist', 'manager', 'director', 'admin', 'mechanic'):
                return err('Неверная роль')
            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = {q(email)}")
            if cur.fetchone():
                return err('Email уже используется')
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, email, password_hash, role) "
                f"VALUES ({q(name)}, {q(email)}, {q(hash_password(password))}, {q(role)}) RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': str(new_id), 'name': name, 'email': email, 'role': role, 'is_active': True}, 201)

        # update_user
        if action == 'update_user':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            if user['role'] not in ('admin', 'director'):
                return err('Нет доступа', 403)
            target_id = body.get('id', '')
            parts = []
            if 'name' in body:
                parts.append(f"name = {q(body['name'])}")
            if 'email' in body:
                parts.append(f"email = {q(body['email'].lower())}")
            if 'role' in body:
                if body['role'] not in ('logist', 'manager', 'director', 'admin', 'mechanic'):
                    return err('Неверная роль')
                parts.append(f"role = {q(body['role'])}")
            if 'password' in body and body['password']:
                parts.append(f"password_hash = {q(hash_password(body['password']))}")
            if 'is_active' in body:
                parts.append(f"is_active = {'TRUE' if body['is_active'] else 'FALSE'}")
            if not parts:
                return err('Нет данных для обновления')
            parts.append('updated_at = NOW()')
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(parts)} WHERE id = {q(target_id)}")
            conn.commit()
            return ok({'ok': True})

        # delete_user
        if action == 'delete_user':
            user = get_session_user(conn, token)
            if not user:
                return err('Не авторизован', 401)
            if user['role'] not in ('admin', 'director'):
                return err('Нет доступа', 403)
            target_id = body.get('id', '')
            if not target_id:
                return err('Не указан id пользователя')
            if str(user['id']) == target_id:
                return err('Нельзя удалить собственную учётную запись')
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = {q(target_id)}")
            cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = {q(target_id)}")
            conn.commit()
            return ok({'ok': True})

        # get_online_users — список пользователей с активными сессиями за последние 15 мин
        if action == 'get_online_users':
            cur = conn.cursor()
            cur.execute(
                f"SELECT DISTINCT u.id, u.name, u.role FROM {SCHEMA}.sessions s "
                f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
                f"WHERE s.expires_at > NOW() AND s.updated_at > NOW() - INTERVAL '15 minutes' AND u.is_active = TRUE"
            )
            rows = cur.fetchall()
            online = [{'id': str(r[0]), 'name': r[1], 'role': r[2]} for r in rows]
            return ok({'online': online})

        return err('Неизвестное действие', 400)
    finally:
        conn.close()