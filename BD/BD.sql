CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE participantes (
    id          SERIAL          PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    apellido    VARCHAR(100)    NOT NULL,
    telefono    VARCHAR(20),
    email       VARCHAR(150)    UNIQUE,
    dni         VARCHAR(20)     UNIQUE,
    activo      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE participantes IS 'Personas registradas que pueden participar en una o más juntas';

CREATE TYPE junta_estado AS ENUM ('configuracion', 'activa', 'cerrada', 'cancelada');

CREATE TABLE juntas (
    id                  SERIAL          PRIMARY KEY,
    nombre              VARCHAR(150)    NOT NULL,
    total_semanas       SMALLINT        NOT NULL CHECK (total_semanas > 0),
    monto_por_opcion    NUMERIC(10,2)   NOT NULL CHECK (monto_por_opcion > 0),
    fecha_inicio        DATE,
    fecha_fin_estimada  DATE            GENERATED ALWAYS AS (
                            fecha_inicio + (total_semanas * 7 - 7)
                        ) STORED,
    estado              junta_estado    NOT NULL DEFAULT 'configuracion',
    descripcion         TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE juntas IS
  'Junta de dinero. Todos los participantes cobran su acumulado al cierre final.';

CREATE TABLE semanas_junta (
    id              SERIAL      PRIMARY KEY,
    junta_id        INT         NOT NULL REFERENCES juntas(id) ON DELETE CASCADE,
    numero_semana   SMALLINT    NOT NULL CHECK (numero_semana > 0),
    fecha_semana    DATE,
    cerrada         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (junta_id, numero_semana)
);

COMMENT ON TABLE semanas_junta IS 'Cada ronda semanal dentro de una junta';

CREATE TABLE opciones_participante (
    id                  SERIAL      PRIMARY KEY,
    junta_id            INT         NOT NULL REFERENCES juntas(id) ON DELETE CASCADE,
    participante_id     INT         NOT NULL REFERENCES participantes(id),
    cantidad_opciones   SMALLINT    NOT NULL DEFAULT 1 CHECK (cantidad_opciones > 0),
    activo              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (junta_id, participante_id)   -- un registro por participante/junta, con N opciones
);

COMMENT ON TABLE opciones_participante IS
  'Cuántas opciones (cupos) tiene un participante en una junta.
   Un participante con 3 opciones paga 3× el monto semanal y recibe 3× al final.';

CREATE TYPE pago_estado AS ENUM ('pendiente', 'pagado', 'atrasado', 'perdonado');

CREATE TABLE pagos_semanales (
    id                  SERIAL          PRIMARY KEY,
    semana_junta_id     INT             NOT NULL REFERENCES semanas_junta(id) ON DELETE CASCADE,
    participante_id     INT             NOT NULL REFERENCES participantes(id),
    -- Desnormalizado para auditoría: cuántas opciones tenía ese momento
    opciones_cantidad   SMALLINT        NOT NULL DEFAULT 1,
    monto_esperado      NUMERIC(10,2)   NOT NULL,   -- opciones × monto_por_opcion
    monto_pagado        NUMERIC(10,2)   NOT NULL DEFAULT 0,
    fecha_pago          DATE,
    estado              pago_estado     NOT NULL DEFAULT 'pendiente',
    notas               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (semana_junta_id, participante_id)
);

COMMENT ON TABLE pagos_semanales IS 'Pago semanal de cada participante según sus opciones';

CREATE TYPE prestamo_estado AS ENUM ('activo', 'pagado_parcial', 'pagado_total', 'castigado');

CREATE TABLE prestamos (
    id                  SERIAL              PRIMARY KEY,
    junta_id            INT                 NOT NULL REFERENCES juntas(id) ON DELETE CASCADE,
    participante_id     INT                 NOT NULL REFERENCES participantes(id),
    semana_inicio_id    INT                 NOT NULL REFERENCES semanas_junta(id),
    -- Condiciones pactadas al momento del préstamo
    monto_principal     NUMERIC(12,2)       NOT NULL CHECK (monto_principal > 0),
    tasa_interes        NUMERIC(6,4)        NOT NULL DEFAULT 0 CHECK (tasa_interes >= 0),
                                            -- Porcentaje total sobre el capital (ej: 10 = 10%)
    total_cuotas        SMALLINT            NOT NULL CHECK (total_cuotas > 0),
    -- Campos calculados/desnormalizados para consultas rápidas
    interes_total       NUMERIC(12,2)       NOT NULL DEFAULT 0,
                                            -- monto_principal × (tasa_interes/100)
    monto_total         NUMERIC(12,2)       NOT NULL DEFAULT 0,
                                            -- monto_principal + interes_total
    cuota_fija          NUMERIC(12,2)       NOT NULL DEFAULT 0,
                                            -- monto_total / total_cuotas
    -- Seguimiento
    cuotas_pagadas      SMALLINT            NOT NULL DEFAULT 0,
    total_pagado        NUMERIC(12,2)       NOT NULL DEFAULT 0,
    saldo_pendiente     NUMERIC(12,2)       GENERATED ALWAYS AS (
                            (monto_principal
                             + (monto_principal * tasa_interes / 100))
                            - total_pagado
                        ) STORED,
    estado              prestamo_estado     NOT NULL DEFAULT 'activo',
    fecha_prestamo      DATE                NOT NULL DEFAULT CURRENT_DATE,
    notas               TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE prestamos IS
  'Préstamo otorgado a un participante desde la bolsa de la junta.
   La cuota fija = (capital + capital×tasa%) / total_cuotas.
   Un participante puede tener préstamos simultáneos en distintas juntas.';

CREATE TYPE cuota_estado AS ENUM ('pendiente', 'pagada', 'atrasada');

CREATE TABLE cuotas_prestamo (
    id                  SERIAL          PRIMARY KEY,
    prestamo_id         INT             NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    semana_junta_id     INT             REFERENCES semanas_junta(id),
                                        -- Semana en que se espera el pago (puede ser NULL si libre)
    numero_cuota        SMALLINT        NOT NULL CHECK (numero_cuota > 0),
    monto_cuota         NUMERIC(12,2)   NOT NULL,   -- Igual a prestamos.cuota_fija
    monto_capital       NUMERIC(12,2)   NOT NULL,   -- Porción capital de esta cuota
    monto_interes       NUMERIC(12,2)   NOT NULL,   -- Porción interés de esta cuota
    monto_pagado        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    fecha_pago_esperada DATE,
    fecha_pago_real     DATE,
    estado              cuota_estado    NOT NULL DEFAULT 'pendiente',
    notas               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (prestamo_id, numero_cuota)
);

COMMENT ON TABLE cuotas_prestamo IS
  'Plan de pagos del préstamo. Se generan todas las cuotas al crear el préstamo.
   Cada cuota tiene su porción de capital e interés desglosada.';

CREATE TABLE liquidacion_final (
    id                          SERIAL          PRIMARY KEY,
    junta_id                    INT             NOT NULL REFERENCES juntas(id),
    participante_id             INT             NOT NULL REFERENCES participantes(id),
    opciones                    SMALLINT        NOT NULL DEFAULT 1,
    total_aportado              NUMERIC(12,2)   NOT NULL DEFAULT 0,
    -- Intereses generados por préstamos en la junta, repartidos por opciones
    intereses_recibidos         NUMERIC(12,2)   NOT NULL DEFAULT 0,
    -- Si quedó con saldo pendiente de préstamos al cierre
    deuda_prestamos_pendiente   NUMERIC(12,2)   NOT NULL DEFAULT 0,
    -- Devolución neta
    monto_devolucion_final      NUMERIC(12,2)   GENERATED ALWAYS AS (
                                    total_aportado
                                    + intereses_recibidos
                                    - deuda_prestamos_pendiente
                                ) STORED,
    liquidado                   BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_liquidacion           DATE,
    notas                       TEXT,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (junta_id, participante_id)
);

COMMENT ON TABLE liquidacion_final IS
  'Cierre y devolución al terminar la junta.
   monto_devolucion_final = aportado + intereses_proporcionales - deuda_préstamos.';

CREATE INDEX idx_semanas_junta_id          ON semanas_junta(junta_id);
CREATE INDEX idx_opciones_junta            ON opciones_participante(junta_id);
CREATE INDEX idx_opciones_participante     ON opciones_participante(participante_id);
CREATE INDEX idx_pagos_semana              ON pagos_semanales(semana_junta_id);
CREATE INDEX idx_pagos_participante        ON pagos_semanales(participante_id);
CREATE INDEX idx_prestamos_junta           ON prestamos(junta_id);
CREATE INDEX idx_prestamos_participante    ON prestamos(participante_id);
CREATE INDEX idx_prestamos_estado          ON prestamos(estado);
CREATE INDEX idx_cuotas_prestamo           ON cuotas_prestamo(prestamo_id);
CREATE INDEX idx_cuotas_estado             ON cuotas_prestamo(estado);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_participantes_upd  BEFORE UPDATE ON participantes         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_juntas_upd         BEFORE UPDATE ON juntas                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_opciones_upd       BEFORE UPDATE ON opciones_participante  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pagos_upd          BEFORE UPDATE ON pagos_semanales        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prestamos_upd      BEFORE UPDATE ON prestamos              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cuotas_upd         BEFORE UPDATE ON cuotas_prestamo        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION crear_prestamo(
    p_junta_id          INT,
    p_participante_id   INT,
    p_semana_inicio_id  INT,
    p_monto             NUMERIC,
    p_tasa              NUMERIC,
    p_cuotas            SMALLINT
)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
    v_interes_total     NUMERIC(12,2);
    v_monto_total       NUMERIC(12,2);
    v_cuota_fija        NUMERIC(12,2);
    v_interes_cuota     NUMERIC(12,2);
    v_capital_cuota     NUMERIC(12,2);
    v_prestamo_id       INT;
    i                   SMALLINT;
    v_fecha_inicio      DATE;
BEGIN
    -- Cálculos base
    v_interes_total := ROUND(p_monto * (p_tasa / 100), 2);
    v_monto_total   := p_monto + v_interes_total;
    v_cuota_fija    := ROUND(v_monto_total / p_cuotas, 2);

    -- Porción constante de interés por cuota (interés simple distribuido)
    v_interes_cuota := ROUND(v_interes_total / p_cuotas, 2);
    v_capital_cuota := v_cuota_fija - v_interes_cuota;

    -- Insertar préstamo
    INSERT INTO prestamos (
        junta_id, participante_id, semana_inicio_id,
        monto_principal, tasa_interes, total_cuotas,
        interes_total, monto_total, cuota_fija,
        fecha_prestamo
    )
    VALUES (
        p_junta_id, p_participante_id, p_semana_inicio_id,
        p_monto, p_tasa, p_cuotas,
        v_interes_total, v_monto_total, v_cuota_fija,
        CURRENT_DATE
    )
    RETURNING id INTO v_prestamo_id;

    -- Fecha de inicio para calcular fechas esperadas de cuota
    SELECT fecha_semana INTO v_fecha_inicio
    FROM semanas_junta WHERE id = p_semana_inicio_id;

    -- Generar plan de cuotas
    FOR i IN 1..p_cuotas LOOP
        INSERT INTO cuotas_prestamo (
            prestamo_id, numero_cuota,
            monto_cuota, monto_capital, monto_interes,
            fecha_pago_esperada
        )
        VALUES (
            v_prestamo_id, i,
            v_cuota_fija, v_capital_cuota, v_interes_cuota,
            -- Una cuota por semana a partir de la siguiente semana
            CASE WHEN v_fecha_inicio IS NOT NULL
                 THEN v_fecha_inicio + (i * 7)
                 ELSE NULL
            END
        );
    END LOOP;

    RETURN v_prestamo_id;
END;
$$;

COMMENT ON FUNCTION crear_prestamo IS
  'Crea un préstamo y genera automáticamente todas sus cuotas.
   Usa interés simple: interes_total = capital × tasa%.
   Cuota fija = (capital + interes_total) / n_cuotas.';

CREATE OR REPLACE FUNCTION pagar_cuota(
    p_cuota_id      INT,
    p_monto_pagado  NUMERIC,
    p_fecha_pago    DATE DEFAULT CURRENT_DATE
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_prestamo_id   INT;
    v_cuota         cuotas_prestamo%ROWTYPE;
BEGIN
    SELECT * INTO v_cuota FROM cuotas_prestamo WHERE id = p_cuota_id;
    v_prestamo_id := v_cuota.prestamo_id;

    -- Actualizar cuota
    UPDATE cuotas_prestamo
    SET monto_pagado     = p_monto_pagado,
        fecha_pago_real  = p_fecha_pago,
        estado           = CASE
                               WHEN p_monto_pagado >= monto_cuota THEN 'pagada'::cuota_estado
                               ELSE 'pendiente'::cuota_estado
                           END
    WHERE id = p_cuota_id;

    -- Actualizar totales del préstamo
    UPDATE prestamos
    SET total_pagado    = total_pagado + p_monto_pagado,
        cuotas_pagadas  = cuotas_pagadas + 1,
        estado          = CASE
                            WHEN cuotas_pagadas + 1 >= total_cuotas THEN 'pagado_total'::prestamo_estado
                            ELSE 'pagado_parcial'::prestamo_estado
                          END
    WHERE id = v_prestamo_id;
END;
$$;


CREATE OR REPLACE FUNCTION generar_semanas_junta(p_junta_id INT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_junta juntas%ROWTYPE;
    i       SMALLINT;
BEGIN
    SELECT * INTO v_junta FROM juntas WHERE id = p_junta_id;

    FOR i IN 1..v_junta.total_semanas LOOP
        INSERT INTO semanas_junta (junta_id, numero_semana, fecha_semana)
        VALUES (
            p_junta_id,
            i,
            CASE WHEN v_junta.fecha_inicio IS NOT NULL
                 THEN v_junta.fecha_inicio + ((i - 1) * 7)
                 ELSE NULL
            END
        )
        ON CONFLICT (junta_id, numero_semana) DO NOTHING;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION generar_pagos_semana(p_semana_id INT)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
    v_semana    semanas_junta%ROWTYPE;
    v_junta     juntas%ROWTYPE;
    v_op        opciones_participante%ROWTYPE;
    v_count     INT := 0;
BEGIN
    SELECT * INTO v_semana FROM semanas_junta WHERE id = p_semana_id;
    SELECT * INTO v_junta  FROM juntas          WHERE id = v_semana.junta_id;

    FOR v_op IN
        SELECT * FROM opciones_participante
        WHERE junta_id = v_semana.junta_id AND activo = TRUE
    LOOP
        INSERT INTO pagos_semanales (
            semana_junta_id, participante_id,
            opciones_cantidad, monto_esperado
        )
        VALUES (
            p_semana_id, v_op.participante_id,
            v_op.cantidad_opciones,
            v_op.cantidad_opciones * v_junta.monto_por_opcion
        )
        ON CONFLICT (semana_junta_id, participante_id) DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;  -- Devuelve cantidad de registros creados
END;
$$;

CREATE OR REPLACE FUNCTION calcular_liquidacion(p_junta_id INT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_total_opciones        INT;
    v_total_intereses        NUMERIC(12,2);
    v_op                    opciones_participante%ROWTYPE;
    v_aportado               NUMERIC(12,2);
    v_intereses_participante NUMERIC(12,2);
    v_deuda                  NUMERIC(12,2);
BEGIN
    -- Total opciones en la junta (para repartir intereses proporcionalmente)
    SELECT COALESCE(SUM(cantidad_opciones), 1)
    INTO v_total_opciones
    FROM opciones_participante
    WHERE junta_id = p_junta_id AND activo = TRUE;

    -- Total intereses generados por todos los préstamos de la junta
    SELECT COALESCE(SUM(interes_total), 0)
    INTO v_total_intereses
    FROM prestamos
    WHERE junta_id = p_junta_id;

    -- Calcular para cada participante
    FOR v_op IN
        SELECT * FROM opciones_participante
        WHERE junta_id = p_junta_id AND activo = TRUE
    LOOP
        -- Total pagado por este participante en todas las semanas
        SELECT COALESCE(SUM(monto_pagado), 0)
        INTO v_aportado
        FROM pagos_semanales ps
        JOIN semanas_junta sj ON sj.id = ps.semana_junta_id
        WHERE sj.junta_id = p_junta_id
          AND ps.participante_id = v_op.participante_id;

        -- Parte proporcional de intereses según sus opciones
        v_intereses_participante := ROUND(
            v_total_intereses * (v_op.cantidad_opciones::NUMERIC / v_total_opciones),
            2
        );

        -- Saldo pendiente de préstamos activos en esta junta
        SELECT COALESCE(SUM(saldo_pendiente), 0)
        INTO v_deuda
        FROM prestamos
        WHERE junta_id = p_junta_id
          AND participante_id = v_op.participante_id
          AND estado IN ('activo', 'pagado_parcial');

        INSERT INTO liquidacion_final (
            junta_id, participante_id, opciones,
            total_aportado, intereses_recibidos, deuda_prestamos_pendiente
        )
        VALUES (
            p_junta_id, v_op.participante_id, v_op.cantidad_opciones,
            v_aportado, v_intereses_participante, v_deuda
        )
        ON CONFLICT (junta_id, participante_id) DO UPDATE
            SET total_aportado            = EXCLUDED.total_aportado,
                intereses_recibidos       = EXCLUDED.intereses_recibidos,
                deuda_prestamos_pendiente = EXCLUDED.deuda_prestamos_pendiente;
    END LOOP;

    -- Marcar junta como cerrada
    UPDATE juntas SET estado = 'cerrada' WHERE id = p_junta_id;
END;
$$;

-- Resumen de estado por participante en cada junta
CREATE OR REPLACE VIEW v_estado_participante AS
SELECT
    j.id                                                AS junta_id,
    j.nombre                                            AS junta,
    j.estado                                            AS junta_estado,
    p.id                                                AS participante_id,
    p.nombre || ' ' || p.apellido                       AS participante,
    op.cantidad_opciones,
    j.monto_por_opcion * op.cantidad_opciones           AS pago_semanal,
    COALESCE(SUM(ps.monto_esperado), 0)                 AS total_esperado,
    COALESCE(SUM(ps.monto_pagado),   0)                 AS total_pagado,
    COALESCE(SUM(ps.monto_esperado), 0)
        - COALESCE(SUM(ps.monto_pagado), 0)             AS deuda_pagos,
    COALESCE(pr.saldo_prestamos, 0)                     AS saldo_prestamos
FROM juntas j
JOIN opciones_participante op   ON op.junta_id = j.id AND op.activo
JOIN participantes p            ON p.id = op.participante_id
LEFT JOIN semanas_junta sj      ON sj.junta_id = j.id
LEFT JOIN pagos_semanales ps    ON ps.semana_junta_id = sj.id
                                AND ps.participante_id = p.id
LEFT JOIN (
    SELECT junta_id, participante_id, SUM(saldo_pendiente) AS saldo_prestamos
    FROM prestamos
    WHERE estado IN ('activo','pagado_parcial')
    GROUP BY junta_id, participante_id
) pr ON pr.junta_id = j.id AND pr.participante_id = p.id
GROUP BY j.id, j.nombre, j.estado, p.id, p.nombre, p.apellido,
         op.cantidad_opciones, j.monto_por_opcion, pr.saldo_prestamos;

COMMENT ON VIEW v_estado_participante IS
  'Resumen de pagos y préstamos por participante en cada junta activa';


-- Estado de préstamos con cuotas pendientes
CREATE OR REPLACE VIEW v_prestamos_detalle AS
SELECT
    pr.id                                               AS prestamo_id,
    j.nombre                                            AS junta,
    p.nombre || ' ' || p.apellido                       AS participante,
    pr.monto_principal,
    pr.tasa_interes,
    pr.total_cuotas,
    pr.cuotas_pagadas,
    pr.total_cuotas - pr.cuotas_pagadas                 AS cuotas_pendientes,
    pr.cuota_fija,
    pr.monto_total,
    pr.total_pagado,
    pr.saldo_pendiente,
    pr.estado,
    pr.fecha_prestamo
FROM prestamos pr
JOIN juntas       j ON j.id = pr.junta_id
JOIN participantes p ON p.id = pr.participante_id;

COMMENT ON VIEW v_prestamos_detalle IS
  'Vista completa de préstamos con información de junta y participante';


-- Cuotas por vencer o atrasadas
CREATE OR REPLACE VIEW v_cuotas_pendientes AS
SELECT
    cp.id                                               AS cuota_id,
    pr.id                                               AS prestamo_id,
    j.nombre                                            AS junta,
    p.nombre || ' ' || p.apellido                       AS participante,
    cp.numero_cuota,
    pr.total_cuotas,
    cp.monto_cuota,
    cp.monto_capital,
    cp.monto_interes,
    cp.fecha_pago_esperada,
    cp.estado
FROM cuotas_prestamo cp
JOIN prestamos     pr ON pr.id = cp.prestamo_id
JOIN juntas         j ON j.id  = pr.junta_id
JOIN participantes  p ON p.id  = pr.participante_id
WHERE cp.estado IN ('pendiente', 'atrasada')
ORDER BY cp.fecha_pago_esperada NULLS LAST, pr.participante_id;

COMMENT ON VIEW v_cuotas_pendientes IS
  'Cuotas de préstamos que aún no han sido pagadas';


-- Bolsa acumulada semana a semana
CREATE OR REPLACE VIEW v_bolsa_semanal AS
SELECT
    sj.junta_id,
    j.nombre                                            AS junta,
    sj.numero_semana,
    sj.fecha_semana,
    COALESCE(SUM(ps.monto_pagado), 0)                   AS recaudado_semana,
    SUM(COALESCE(SUM(ps.monto_pagado), 0)) OVER (
        PARTITION BY sj.junta_id
        ORDER BY sj.numero_semana
    )                                                   AS bolsa_acumulada,
    sj.cerrada
FROM semanas_junta sj
JOIN juntas j ON j.id = sj.junta_id
LEFT JOIN pagos_semanales ps ON ps.semana_junta_id = sj.id
GROUP BY sj.junta_id, j.nombre, sj.id, sj.numero_semana, sj.fecha_semana, sj.cerrada
ORDER BY sj.junta_id, sj.numero_semana;