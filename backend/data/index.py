"""
CRUD API для всех сущностей: shipments, flights, equipment, auto_tasks, action_logs.
GET /data/{entity} — список
POST /data/{entity} — создать
PUT /data/{entity}/{id} — обновить
DELETE /data/{entity}/{id} — удалить (помечает флагом или удаляет)
"""
import json
import os
import psycopg2

SCHEMA = 't_p78311576_logistics_web_app_1'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
}

ALLOWED_ENTITIES = {'shipments', 'flights', 'equipment', 'auto_tasks', 'action_logs'}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data, status=200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_session_user(conn, token: str):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.email, u.role FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': str(row[0]), 'name': row[1], 'email': row[2], 'role': row[3]}

def row_to_shipment(r):
    return {
        'id': str(r[0]), 'number': r[1], 'request': r[2], 'client': r[3],
        'containerNumber': r[4], 'footage': r[5],
        'deliveryDate': str(r[6]) if r[6] else '', 'docsDate': str(r[7]) if r[7] else '',
        'inspectionDate': str(r[8]) if r[8] else '',
        'places': r[9], 'weight': float(r[10]) if r[10] else 0,
        'cargo': r[11], 'tempMode': r[12], 'vsdNumber': r[13],
        'status': r[14], 'shipmentType': r[15], 'terminal': r[16],
        'destination': r[17], 'gngCode': r[18], 'etsnvCode': r[19],
        'requestName': r[20], 'comment': r[21], 'dtNumber': r[22],
        'billOfLading': r[23], 'subsidy': r[24],
        'flightId': str(r[25]) if r[25] else '',
        'editedBy': r[26] or '', 'editedAt': str(r[27]) if r[27] else '',
    }

def row_to_flight(r):
    return {
        'id': str(r[0]), 'number': r[1], 'direction': r[2],
        'planDate': str(r[3]) if r[3] else '', 'factDate': str(r[4]) if r[4] else '',
        'status': r[5],
    }

def row_to_equipment(r):
    return {
        'id': str(r[0]), 'number': r[1], 'type': r[2], 'status': r[3],
        'location': r[4], 'lastCheck': str(r[5]) if r[5] else '',
        'comment': r[6] or '', 'size': r[7] or '40HC',
    }

def row_to_auto_task(r):
    return {
        'id': str(r[0]), 'type': r[1], 'date': str(r[2]) if r[2] else '',
        'containerNumber': r[3], 'client': r[4], 'carrier': r[5],
        'time': r[6], 'address': r[7], 'contact': r[8],
        'terminalFrom': r[9], 'terminalTo': r[10],
        'cargo': r[11], 'tempMode': r[12], 'status': r[13],
        'comment': r[14] or '', 'krkNumber': r[15] or '',
    }

def row_to_log(r):
    return {
        'id': str(r[0]), 'userId': r[1], 'userName': r[2],
        'action': r[3], 'entity': r[4], 'entityId': r[5],
        'timestamp': str(r[6]),
    }

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

    # Разбираем путь: /data/{entity} или /data/{entity}/{id}
    parts = [p for p in path.split('/') if p]
    # parts может быть ['data', 'shipments'] или ['data', 'shipments', 'uuid']
    entity = parts[1] if len(parts) > 1 else ''
    record_id = parts[2] if len(parts) > 2 else None

    if entity not in ALLOWED_ENTITIES:
        return err(f'Неизвестная сущность: {entity}', 404)

    conn = get_db()
    try:
        user = get_session_user(conn, token)
        if not user:
            return err('Не авторизован', 401)

        cur = conn.cursor()

        # ─── SHIPMENTS ───────────────────────────────────────────────────────
        if entity == 'shipments':
            if method == 'GET':
                cur.execute(
                    f"SELECT id, number, request, client, container_number, footage, "
                    f"delivery_date, docs_date, inspection_date, places, weight, cargo, temp_mode, "
                    f"vsd_number, status, shipment_type, terminal, destination, gng_code, etsnv_code, "
                    f"request_name, comment, dt_number, bill_of_lading, subsidy, flight_id, "
                    f"edited_by, edited_at FROM {SCHEMA}.shipments ORDER BY created_at"
                )
                return ok({'shipments': [row_to_shipment(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = body
                cur.execute(
                    f"INSERT INTO {SCHEMA}.shipments "
                    f"(number, request, client, container_number, footage, delivery_date, docs_date, "
                    f"inspection_date, places, weight, cargo, temp_mode, vsd_number, status, "
                    f"shipment_type, terminal, destination, gng_code, etsnv_code, request_name, "
                    f"comment, dt_number, bill_of_lading, subsidy, flight_id, edited_by) "
                    f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) "
                    f"RETURNING id",
                    (b.get('number',''), b.get('request',''), b.get('client',''),
                     b.get('containerNumber',''), b.get('footage',''),
                     b.get('deliveryDate') or None, b.get('docsDate') or None,
                     b.get('inspectionDate') or None,
                     int(b.get('places', 0)), float(b.get('weight', 0)),
                     b.get('cargo',''), b.get('tempMode',''), b.get('vsdNumber',''),
                     b.get('status','not_ready'), b.get('shipmentType','import'),
                     b.get('terminal',''), b.get('destination',''),
                     b.get('gngCode',''), b.get('etsnvCode',''), b.get('requestName',''),
                     b.get('comment',''), b.get('dtNumber',''), b.get('billOfLading',''),
                     b.get('subsidy',''), b.get('flightId') or None, b.get('editedBy',''))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': str(new_id)}, 201)

            if method == 'PUT' and record_id:
                b = body
                cur.execute(
                    f"UPDATE {SCHEMA}.shipments SET "
                    f"number=%s, request=%s, client=%s, container_number=%s, footage=%s, "
                    f"delivery_date=%s, docs_date=%s, inspection_date=%s, places=%s, weight=%s, "
                    f"cargo=%s, temp_mode=%s, vsd_number=%s, status=%s, shipment_type=%s, "
                    f"terminal=%s, destination=%s, gng_code=%s, etsnv_code=%s, request_name=%s, "
                    f"comment=%s, dt_number=%s, bill_of_lading=%s, subsidy=%s, flight_id=%s, "
                    f"edited_by=%s, edited_at=NOW(), updated_at=NOW() WHERE id=%s",
                    (b.get('number',''), b.get('request',''), b.get('client',''),
                     b.get('containerNumber',''), b.get('footage',''),
                     b.get('deliveryDate') or None, b.get('docsDate') or None,
                     b.get('inspectionDate') or None,
                     int(b.get('places', 0)), float(b.get('weight', 0)),
                     b.get('cargo',''), b.get('tempMode',''), b.get('vsdNumber',''),
                     b.get('status','not_ready'), b.get('shipmentType','import'),
                     b.get('terminal',''), b.get('destination',''),
                     b.get('gngCode',''), b.get('etsnvCode',''), b.get('requestName',''),
                     b.get('comment',''), b.get('dtNumber',''), b.get('billOfLading',''),
                     b.get('subsidy',''), b.get('flightId') or None, b.get('editedBy',''),
                     record_id)
                )
                conn.commit()
                return ok({'ok': True})

            if method == 'DELETE' and record_id:
                cur.execute(f"UPDATE {SCHEMA}.shipments SET status='not_ready' WHERE id=%s", (record_id,))
                cur.execute(f"INSERT INTO {SCHEMA}.action_logs (user_id, user_name, action, entity, entity_id) VALUES (%s,%s,%s,%s,%s)",
                            (user['id'], user['name'], 'Удаление', 'Отправка', record_id))
                conn.commit()
                return ok({'ok': True})

        # ─── FLIGHTS ─────────────────────────────────────────────────────────
        if entity == 'flights':
            if method == 'GET':
                cur.execute(f"SELECT id, number, direction, plan_date, fact_date, status FROM {SCHEMA}.flights ORDER BY created_at")
                return ok({'flights': [row_to_flight(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = body
                cur.execute(
                    f"INSERT INTO {SCHEMA}.flights (number, direction, plan_date, fact_date, status) "
                    f"VALUES (%s,%s,%s,%s,%s) RETURNING id",
                    (b.get('number',''), b.get('direction','moscow'),
                     b.get('planDate') or None, b.get('factDate') or None,
                     b.get('status','planned'))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': str(new_id)}, 201)

            if method == 'PUT' and record_id:
                b = body
                cur.execute(
                    f"UPDATE {SCHEMA}.flights SET number=%s, direction=%s, plan_date=%s, fact_date=%s, status=%s, updated_at=NOW() WHERE id=%s",
                    (b.get('number',''), b.get('direction','moscow'),
                     b.get('planDate') or None, b.get('factDate') or None,
                     b.get('status','planned'), record_id)
                )
                conn.commit()
                return ok({'ok': True})

        # ─── EQUIPMENT ───────────────────────────────────────────────────────
        if entity == 'equipment':
            if method == 'GET':
                cur.execute(f"SELECT id, number, type, status, location, last_check, comment, size FROM {SCHEMA}.equipment ORDER BY created_at")
                return ok({'equipment': [row_to_equipment(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = body
                cur.execute(
                    f"INSERT INTO {SCHEMA}.equipment (number, type, status, location, last_check, comment, size) "
                    f"VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                    (b.get('number',''), b.get('type','container'), b.get('status','unchecked'),
                     b.get('location',''), b.get('lastCheck') or None, b.get('comment',''), b.get('size','40HC'))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': str(new_id)}, 201)

            if method == 'PUT' and record_id:
                b = body
                cur.execute(
                    f"UPDATE {SCHEMA}.equipment SET number=%s, type=%s, status=%s, location=%s, "
                    f"last_check=%s, comment=%s, size=%s, updated_at=NOW() WHERE id=%s",
                    (b.get('number',''), b.get('type','container'), b.get('status','unchecked'),
                     b.get('location',''), b.get('lastCheck') or None, b.get('comment',''),
                     b.get('size','40HC'), record_id)
                )
                cur.execute(
                    f"INSERT INTO {SCHEMA}.action_logs (user_id, user_name, action, entity, entity_id) VALUES (%s,%s,%s,%s,%s)",
                    (user['id'], user['name'], 'Редактирование оборудования', 'Оборудование', record_id)
                )
                conn.commit()
                return ok({'ok': True})

            if method == 'DELETE' and record_id:
                cur.execute(f"UPDATE {SCHEMA}.equipment SET status='broken' WHERE id=%s", (record_id,))
                conn.commit()
                return ok({'ok': True})

        # ─── AUTO TASKS ──────────────────────────────────────────────────────
        if entity == 'auto_tasks':
            if method == 'GET':
                cur.execute(
                    f"SELECT id, type, date, container_number, client, carrier, time, address, "
                    f"contact, terminal_from, terminal_to, cargo, temp_mode, status, comment, krk_number "
                    f"FROM {SCHEMA}.auto_tasks ORDER BY created_at"
                )
                return ok({'auto_tasks': [row_to_auto_task(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = body
                cur.execute(
                    f"INSERT INTO {SCHEMA}.auto_tasks "
                    f"(type, date, container_number, client, carrier, time, address, contact, "
                    f"terminal_from, terminal_to, cargo, temp_mode, status, comment, krk_number) "
                    f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                    (b.get('type','movement'), b.get('date') or None,
                     b.get('containerNumber',''), b.get('client',''), b.get('carrier',''),
                     b.get('time',''), b.get('address',''), b.get('contact',''),
                     b.get('terminalFrom',''), b.get('terminalTo',''),
                     b.get('cargo',''), b.get('tempMode',''), b.get('status','planned'),
                     b.get('comment',''), b.get('krkNumber',''))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': str(new_id)}, 201)

            if method == 'PUT' and record_id:
                b = body
                cur.execute(
                    f"UPDATE {SCHEMA}.auto_tasks SET type=%s, date=%s, container_number=%s, client=%s, "
                    f"carrier=%s, time=%s, address=%s, contact=%s, terminal_from=%s, terminal_to=%s, "
                    f"cargo=%s, temp_mode=%s, status=%s, comment=%s, krk_number=%s, updated_at=NOW() WHERE id=%s",
                    (b.get('type','movement'), b.get('date') or None,
                     b.get('containerNumber',''), b.get('client',''), b.get('carrier',''),
                     b.get('time',''), b.get('address',''), b.get('contact',''),
                     b.get('terminalFrom',''), b.get('terminalTo',''),
                     b.get('cargo',''), b.get('tempMode',''), b.get('status','planned'),
                     b.get('comment',''), b.get('krkNumber',''), record_id)
                )
                conn.commit()
                return ok({'ok': True})

            if method == 'DELETE' and record_id:
                cur.execute(f"UPDATE {SCHEMA}.auto_tasks SET status='cancelled' WHERE id=%s", (record_id,))
                conn.commit()
                return ok({'ok': True})

        # ─── ACTION LOGS ─────────────────────────────────────────────────────
        if entity == 'action_logs':
            if method == 'GET':
                cur.execute(
                    f"SELECT id, user_id, user_name, action, entity, entity_id, timestamp "
                    f"FROM {SCHEMA}.action_logs ORDER BY timestamp DESC LIMIT 500"
                )
                return ok({'action_logs': [row_to_log(r) for r in cur.fetchall()]})

            if method == 'POST':
                b = body
                cur.execute(
                    f"INSERT INTO {SCHEMA}.action_logs (user_id, user_name, action, entity, entity_id) "
                    f"VALUES (%s,%s,%s,%s,%s) RETURNING id",
                    (b.get('userId',''), b.get('userName',''), b.get('action',''),
                     b.get('entity',''), b.get('entityId',''))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({'id': str(new_id)}, 201)

        return err('Метод не поддерживается', 405)
    finally:
        conn.close()
