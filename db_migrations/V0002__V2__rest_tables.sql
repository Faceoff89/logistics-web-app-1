
CREATE TABLE t_p78311576_logistics_web_app_1.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES t_p78311576_logistics_web_app_1.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p78311576_logistics_web_app_1.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  direction TEXT NOT NULL,
  plan_date DATE,
  fact_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ready', 'departed', 'arrived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p78311576_logistics_web_app_1.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'container' CHECK (type IN ('container', 'dgk', 'genset')),
  status TEXT NOT NULL DEFAULT 'unchecked' CHECK (status IN ('checked', 'unchecked', 'broken')),
  location TEXT DEFAULT '',
  last_check DATE,
  comment TEXT DEFAULT '',
  size TEXT DEFAULT '40HC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p78311576_logistics_web_app_1.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  request TEXT DEFAULT '',
  client TEXT DEFAULT '',
  container_number TEXT DEFAULT '',
  footage TEXT DEFAULT '',
  delivery_date DATE,
  docs_date DATE,
  inspection_date DATE,
  places INTEGER DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  cargo TEXT DEFAULT '',
  temp_mode TEXT DEFAULT '',
  vsd_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_ready' CHECK (status IN ('ready', 'not_ready', 'in_transit', 'delayed')),
  shipment_type TEXT NOT NULL DEFAULT 'import' CHECK (shipment_type IN ('import', 'rf', 'transit')),
  terminal TEXT DEFAULT '',
  destination TEXT DEFAULT '',
  gng_code TEXT DEFAULT '',
  etsnv_code TEXT DEFAULT '',
  request_name TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  dt_number TEXT DEFAULT '',
  bill_of_lading TEXT DEFAULT '',
  subsidy TEXT DEFAULT '',
  flight_id UUID REFERENCES t_p78311576_logistics_web_app_1.flights(id),
  edited_by TEXT DEFAULT '',
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p78311576_logistics_web_app_1.auto_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'movement' CHECK (type IN ('movement', 'loading', 'unloading')),
  date DATE,
  container_number TEXT DEFAULT '',
  client TEXT DEFAULT '',
  carrier TEXT DEFAULT '',
  time TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  terminal_from TEXT DEFAULT '',
  terminal_to TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  temp_mode TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done', 'cancelled')),
  comment TEXT DEFAULT '',
  krk_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p78311576_logistics_web_app_1.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
