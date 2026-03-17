"""
API для мониторинга температур контейнеров.
Механик вносит ежедневные температуры, менеджеры видят сводную таблицу.
"""
import json
import os
import psycopg2
from datetime import date, timedelta

SCHEMA = 't_p78311576_logistics_web_app_1'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, X-User-Id',
    'Access-Control-Max-Age': '86400',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def q(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_session_user(conn, token):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.email, u.role FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = {q(token)} AND s.expires_at > NOW()"
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': str(row[0]), 'name': row[1], 'email': row[2], 'role': row[3]}

def handler(event: dict, context) -> dict:
    """Мониторинг температур: CRUD для контейнеров и записей температур."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    token = event.get('headers', {}).get('x-auth-token') or event.get('headers', {}).get('X-Auth-Token')
    conn = get_db()
    user = get_session_user(conn, token)
    if not user:
        conn.close()
        return err('Unauthorized', 401)

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    action = body.get('action') or event.get('queryStringParameters', {}).get('action', '')

    # ──────────────────────────────────────────
    # GET: сводная таблица (контейнеры + температуры за последние N дней)
    # ──────────────────────────────────────────
    if action == 'get_summary':
        days = int((event.get('queryStringParameters') or {}).get('days', 14))
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, container_number, load_temp, note, sort_order "
            f"FROM {SCHEMA}.temp_monitoring_containers "
            f"WHERE is_active = true ORDER BY sort_order, created_at"
        )
        containers = [
            {'id': str(r[0]), 'container_number': r[1], 'load_temp': r[2], 'note': r[3], 'sort_order': r[4]}
            for r in cur.fetchall()
        ]

        if containers:
            ids = ', '.join(q(c['id']) for c in containers)
            since = date.today() - timedelta(days=days)
            cur.execute(
                f"SELECT container_id, record_date, temperature "
                f"FROM {SCHEMA}.temp_monitoring_records "
                f"WHERE container_id IN ({ids}) AND record_date >= {q(str(since))} "
                f"ORDER BY record_date"
            )
            records = {}
            for row in cur.fetchall():
                cid = str(row[0])
                d = str(row[1])
                if cid not in records:
                    records[cid] = {}
                records[cid][d] = row[2]
            for c in containers:
                c['records'] = records.get(c['id'], {})

        conn.close()
        return ok({'containers': containers})

    # ──────────────────────────────────────────
    # Управление контейнерами (только не-механик или любой с нужными правами)
    # ──────────────────────────────────────────
    if action == 'add_container':
        num = body.get('container_number', '').strip()
        if not num:
            conn.close()
            return err('container_number required')
        load_temp = body.get('load_temp', '')
        note = body.get('note', '')
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.temp_monitoring_containers (container_number, load_temp, note, sort_order) "
            f"VALUES ({q(num)}, {q(load_temp)}, {q(note)}, "
            f"(SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.temp_monitoring_containers)) "
            f"RETURNING id"
        )
        new_id = str(cur.fetchone()[0])
        conn.commit()
        conn.close()
        return ok({'id': new_id, 'container_number': num, 'load_temp': load_temp, 'note': note})

    if action == 'update_container':
        cid = body.get('id')
        if not cid:
            conn.close()
            return err('id required')
        fields = []
        if 'container_number' in body:
            fields.append(f"container_number = {q(body['container_number'])}")
        if 'load_temp' in body:
            fields.append(f"load_temp = {q(body['load_temp'])}")
        if 'note' in body:
            fields.append(f"note = {q(body['note'])}")
        if 'sort_order' in body:
            fields.append(f"sort_order = {q(body['sort_order'])}")
        if fields:
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.temp_monitoring_containers SET {', '.join(fields)}, updated_at = NOW() "
                f"WHERE id = {q(cid)}"
            )
            conn.commit()
        conn.close()
        return ok({'ok': True})

    if action == 'delete_container':
        cid = body.get('id')
        if not cid:
            conn.close()
            return err('id required')
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.temp_monitoring_containers SET is_active = false WHERE id = {q(cid)}"
        )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # ──────────────────────────────────────────
    # Запись температуры (механик вносит за дату)
    # ──────────────────────────────────────────
    if action == 'set_temperature':
        cid = body.get('container_id')
        rec_date = body.get('date', str(date.today()))
        temp = body.get('temperature', '')
        if not cid:
            conn.close()
            return err('container_id required')
        cur = conn.cursor()
        if temp == '' or temp is None:
            cur.execute(
                f"DELETE FROM {SCHEMA}.temp_monitoring_records "
                f"WHERE container_id = {q(cid)} AND record_date = {q(rec_date)}"
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.temp_monitoring_records (container_id, record_date, temperature, created_by) "
                f"VALUES ({q(cid)}, {q(rec_date)}, {q(temp)}, {q(user['id'])}) "
                f"ON CONFLICT (container_id, record_date) DO UPDATE SET temperature = {q(temp)}"
            )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    # Массовое внесение температур за одну дату (удобно механику)
    if action == 'bulk_set_temperatures':
        rec_date = body.get('date', str(date.today()))
        entries = body.get('entries', [])  # [{container_id, temperature}, ...]
        cur = conn.cursor()
        for e in entries:
            cid = e.get('container_id')
            temp = e.get('temperature', '')
            if not cid:
                continue
            if temp == '' or temp is None:
                cur.execute(
                    f"DELETE FROM {SCHEMA}.temp_monitoring_records "
                    f"WHERE container_id = {q(cid)} AND record_date = {q(rec_date)}"
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.temp_monitoring_records (container_id, record_date, temperature, created_by) "
                    f"VALUES ({q(cid)}, {q(rec_date)}, {q(temp)}, {q(user['id'])}) "
                    f"ON CONFLICT (container_id, record_date) DO UPDATE SET temperature = {q(temp)}"
                )
        conn.commit()
        conn.close()
        return ok({'ok': True})

    conn.close()
    return err(f'Unknown action: {action}')
