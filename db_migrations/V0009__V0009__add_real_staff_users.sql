
-- Деактивируем тестовых пользователей
UPDATE users SET is_active = false WHERE email IN ('logist@polarstar.ru', 'manager@polarstar.ru', 'director@polarstar.ru');

-- Добавляем реальных сотрудников
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
(
  gen_random_uuid(),
  'Сасюк Алла Юрьевна',
  'a.sasyuk@polar-star.ru',
  encode(sha256('PolarStar#7Kx2'::bytea), 'hex'),
  'director',
  true
),
(
  gen_random_uuid(),
  'Крылова Ольга Михайловна',
  'o.krylova@polar-star.ru',
  encode(sha256('PolarStar#3Mn8'::bytea), 'hex'),
  'manager',
  true
),
(
  gen_random_uuid(),
  'Фролочкин Филипп Андреевич',
  'f.frolochkin@polar-star.ru',
  encode(sha256('PolarStar#9Qw4'::bytea), 'hex'),
  'logist',
  true
),
(
  gen_random_uuid(),
  'Львова Ирина Юрьевна',
  'i.lvova@polar-star.ru',
  encode(sha256('PolarStar#5Rp1'::bytea), 'hex'),
  'logist',
  true
),
(
  gen_random_uuid(),
  'Левандовский Алексей Алексеевич',
  'a.levandovskiy.sl@gmail.com',
  encode(sha256('PolarStar#2Tz6'::bytea), 'hex'),
  'manager',
  true
),
(
  gen_random_uuid(),
  'Чичеров Юрий Германович',
  'yu.chicherov@polar-star.ru',
  encode(sha256('PolarStar#8Lb3'::bytea), 'hex'),
  'logist',
  true
),
(
  gen_random_uuid(),
  'Горбачёв Андрей Вячеславович',
  'a.gorbachev@polar-star.ru',
  encode(sha256('PolarStar#4Vn7'::bytea), 'hex'),
  'director',
  true
),
(
  gen_random_uuid(),
  'Лазун Кирилл Игоревич',
  'k.lazun@polar-star.ru',
  encode(sha256('PolarStar#6Wh0'::bytea), 'hex'),
  'logist',
  true
);
