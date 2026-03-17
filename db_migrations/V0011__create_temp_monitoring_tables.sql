
CREATE TABLE t_p78311576_logistics_web_app_1.temp_monitoring_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_number VARCHAR(50) NOT NULL,
    load_temp VARCHAR(20),
    note TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p78311576_logistics_web_app_1.temp_monitoring_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id UUID NOT NULL REFERENCES t_p78311576_logistics_web_app_1.temp_monitoring_containers(id),
    record_date DATE NOT NULL,
    temperature VARCHAR(20),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(container_id, record_date)
);

CREATE INDEX idx_temp_records_container ON t_p78311576_logistics_web_app_1.temp_monitoring_records(container_id);
CREATE INDEX idx_temp_records_date ON t_p78311576_logistics_web_app_1.temp_monitoring_records(record_date);
