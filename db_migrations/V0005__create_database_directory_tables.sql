
-- Справочник: Клиенты
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    inn TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Подрядчики
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_contractors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT '',
    inn TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Контейнеры
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_containers (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    size TEXT DEFAULT '40HC',
    owner TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Авто (перевозчики)
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_vehicles (
    id SERIAL PRIMARY KEY,
    plate TEXT NOT NULL,
    driver_name TEXT DEFAULT '',
    driver_phone TEXT DEFAULT '',
    carrier TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Суда
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_vessels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    flag TEXT DEFAULT '',
    imo TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Вагоны
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_wagons (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    type TEXT DEFAULT '',
    owner TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: ДГК
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_dgk (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    owner TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: ЭГК
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_egk (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    owner TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: НДГУ (бывший дженсет)
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_ndgu (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    owner TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Станции
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_stations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    region TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Терминалы
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_terminals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT DEFAULT '',
    address TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Грузы
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_cargo (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    gng_code TEXT DEFAULT '',
    etsnv_code TEXT DEFAULT '',
    temp_mode TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Справочник: Города
CREATE TABLE IF NOT EXISTS t_p78311576_logistics_web_app_1.db_cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
