
INSERT INTO t_p78311576_logistics_web_app_1.users (id, name, email, password_hash, role)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, 'Алексей Петров', 'logist@polarstar.ru', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'logist'
WHERE NOT EXISTS (SELECT 1 FROM t_p78311576_logistics_web_app_1.users WHERE email = 'logist@polarstar.ru');

INSERT INTO t_p78311576_logistics_web_app_1.users (id, name, email, password_hash, role)
SELECT '00000000-0000-0000-0000-000000000002'::uuid, 'Марина Соколова', 'manager@polarstar.ru', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'manager'
WHERE NOT EXISTS (SELECT 1 FROM t_p78311576_logistics_web_app_1.users WHERE email = 'manager@polarstar.ru');

INSERT INTO t_p78311576_logistics_web_app_1.users (id, name, email, password_hash, role)
SELECT '00000000-0000-0000-0000-000000000003'::uuid, 'Игорь Директоров', 'director@polarstar.ru', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'director'
WHERE NOT EXISTS (SELECT 1 FROM t_p78311576_logistics_web_app_1.users WHERE email = 'director@polarstar.ru');
