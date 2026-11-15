# -*- coding: utf-8 -*-
"""Refina el analisis de 06_Registros: limpia probetas, agrega resumenes,
genera consultas.sql e INFORME.md.
"""
import os
import duckdb
import pandas as pd

OUT = r"C:\AI\Antigravity\FALPAT srl\Certificacion\analisis_registros"
DB = os.path.join(OUT, "registros.duckdb")
REF = os.path.join(OUT, "refinado")
T_PROB = "fo_05_02_registro_de_probetas_y_cu__probetas"
T_HUM = "humedad_aridos_2026"
T_TEMP = "temperatura_agua_2026"

con = duckdb.connect(DB)
os.makedirs(REF, exist_ok=True)

con.execute("""
CREATE OR REPLACE TABLE probetas_limpio AS
SELECT
  row_number() OVER (ORDER BY "Fecha moldeo (IRAM 1524)", "N° probeta") AS id,
  "N° probeta"                              AS n_probeta,
  "Fecha moldeo (IRAM 1524)"                AS fecha_moldeo,
  "Fecha ensayo"                            AS fecha_ensayo,
  year("Fecha moldeo (IRAM 1524)")          AS anio,
  month("Fecha moldeo (IRAM 1524)")         AS mes,
  date_diff('day', "Fecha moldeo (IRAM 1524)", "Fecha ensayo") AS edad_calc,
  "Edad (días)"                             AS edad_planilla,
  "Clase"                                   AS clase,
  "f'c (MPa)"                               AS fc_mpa,
  "Asent. (cm) IRAM 1536"                   AS asent_cm,
  "Carga (kN)"                              AS carga_kn,
  "Resistencia (MPa) IRAM 1546"             AS resistencia_mpa,
  CASE WHEN "Cumple f'c (28 d)" = 'SI' THEN 'SI'
       WHEN "Cumple f'c (28 d)" = 'NO' THEN 'NO'
       ELSE 'NA' END                        AS cumple,
  CASE WHEN upper(coalesce("Cliente",'')) LIKE '%%LUJAN%%'   THEN 'Lujan'
       WHEN upper(coalesce("Cliente",'')) LIKE '%%CAMPANA%%' THEN 'Campana'
       WHEN upper(coalesce("Cliente",'')) LIKE '%%CORDOBA%%' THEN 'Cordoba'
       ELSE 'Sin dato' END                  AS planta,
  nullif(regexp_extract("Observaciones", 'PP\\s*(\\d+/\\d+)', 1), '') AS material,
  "Cliente"                                 AS cliente,
  "Obra / elemento"                         AS obra,
  "Observaciones"                           AS observaciones
FROM "%s"
""" % T_PROB)

con.execute("""
CREATE OR REPLACE TABLE probetas_resumen_mensual AS
SELECT
  strftime(fecha_moldeo, '%Y-%m') AS periodo,
  clase,
  count(*) AS n,
  round(avg(fc_mpa), 1) AS fc_objetivo_prom,
  round(avg(resistencia_mpa), 1) AS resistencia_prom,
  round(100.0 * sum(CASE WHEN cumple='SI' THEN 1 ELSE 0 END)
        / nullif(sum(CASE WHEN cumple IN ('SI','NO') THEN 1 ELSE 0 END), 0), 1) AS pct_cumple
FROM probetas_limpio
GROUP BY 1, 2
ORDER BY 1, 2
""")

con.execute("""
CREATE OR REPLACE TABLE humedad_aridos_limpio AS
SELECT
  "MATERIAL" AS material,
  "FECHA"    AS fecha,
  year("FECHA")  AS anio,
  month("FECHA") AS mes,
  "PESO"     AS peso,
  "PESO_2"   AS peso_seco,
  "HUMEDAD"  AS humedad,
  "ABSOR"    AS absorcion
FROM "%s"
WHERE "MATERIAL" IS NOT NULL
""" % T_HUM)

temp_cols = [c[0] for c in con.execute('DESCRIBE "%s"' % T_TEMP).fetchall()
             if c[0].upper().startswith("TEMPERATURA")]
# Solo las columnas de AGUA (sufijo par: TEMPERATURA_2, _4, _6).
# Las impares (TEMPERATURA, _3, _5) corresponden a temperatura ambiente.
agua_cols = []
for c in temp_cols:
    suf = c.upper().replace("TEMPERATURA", "").strip("_")
    if suf == "" or suf.isdigit() and int(suf) % 2 == 1:
        continue
    agua_cols.append(c)
if not agua_cols:
    agua_cols = [c for c in temp_cols if c.upper().endswith(("2", "4", "6"))]
unnest = ", ".join(
    "TRY_CAST(replace(regexp_replace(trim(\"%s\"), '[^0-9,.-]', ''), ',', '.') AS DOUBLE)" % c for c in agua_cols)
con.execute("""
CREATE OR REPLACE TABLE temperatura_agua_limpio AS
SELECT mes, fecha, count(*) AS lecturas,
       round(avg(temp_c), 1) AS temp_prom,
       min(temp_c) AS temp_min, max(temp_c) AS temp_max
FROM (
  SELECT "_mes" AS mes, "FECHA" AS fecha, unnest([%s]) AS temp_c
  FROM "%s"
) WHERE temp_c IS NOT NULL
GROUP BY 1, 2 ORDER BY 2
""" % (unnest, T_TEMP))

refined = ["probetas_limpio", "probetas_resumen_mensual",
           "humedad_aridos_limpio", "temperatura_agua_limpio"]
for t in refined:
    con.execute('COPY (SELECT * FROM "%s") TO ? (FORMAT PARQUET)'
                % t, [os.path.join(REF, t + ".parquet")])

con.execute("""
CREATE OR REPLACE VIEW v_probetas_por_clase AS
SELECT clase, count(*) AS n, round(avg(fc_mpa),1) AS fc_objetivo,
       round(avg(resistencia_mpa),1) AS resistencia_prom,
       round(100.0*sum(CASE WHEN cumple='SI' THEN 1 ELSE 0 END)
             /nullif(sum(CASE WHEN cumple IN ('SI','NO') THEN 1 ELSE 0 END),0),1) AS pct_cumple
FROM probetas_limpio GROUP BY 1 ORDER BY n DESC
""")

# ---- consultas.sql ----
consultas = """-- Consultas de ejemplo sobre registros.duckdb (06_Registros de Calidad)
-- Uso:  py -c "import duckdb;print(duckdb.connect('registros.duckdb').execute(open('consultas.sql').read()).df())"
-- o en Python/DuckDB: con.sql('...')  |  Tablas: ver SHOW TABLES;

-- 1) Resumen por clase (cantidad, resistencia promedio, % de cumplimiento)
SELECT * FROM v_probetas_por_clase;

-- 2) Evolucion mensual por clase
SELECT * FROM probetas_resumen_mensual WHERE periodo >= '2026-01' ORDER BY periodo, clase;

-- 3) Probetas que NO cumplen f'c
SELECT n_probeta, fecha_moldeo, clase, fc_mpa, resistencia_mpa, obra
FROM probetas_limpio WHERE cumple='NO' ORDER BY fecha_moldeo DESC;

-- 4) Humedad promedio de aridos por material y mes
SELECT material, mes, round(avg(humedad),2) AS humedad_prom, count(*) n
FROM humedad_aridos_limpio GROUP BY 1,2 ORDER BY 1,2;

-- 5) Temperatura del agua de curado por mes (min/prom/max)
SELECT mes, round(avg(temp_prom),1) AS temp_prom, min(temp_min) AS t_min, max(temp_max) AS t_max
FROM temperatura_agua_limpio GROUP BY 1 ORDER BY 1;

-- 6) Edades de ensayo anormales (negativas o > 28 dias)
SELECT n_probeta, fecha_moldeo, fecha_ensayo, edad_calc FROM probetas_limpio
WHERE edad_calc < 0 OR edad_calc > 28 ORDER BY edad_calc;
"""
with open(os.path.join(OUT, "consultas.sql"), "w", encoding="utf-8") as f:
    f.write(consultas)


def md(sql):
    df = con.execute(sql).df()
    if df.empty:
        return "_(sin datos)_\n"
    cols = list(df.columns)
    out = "| " + " | ".join(cols) + " |\n"
    out += "|" + "|".join(["---"] * len(cols)) + "|\n"
    for _, r in df.iterrows():
        out += "| " + " | ".join("" if pd.isna(v) else str(v) for v in r) + " |\n"
    return out


tot = con.execute("SELECT count(*), min(fecha_moldeo), max(fecha_moldeo) FROM probetas_limpio").fetchone()
info = [
    "# Informe de Registros de Calidad (06_Registros)",
    "",
    "Generado a partir de `registros.duckdb` (5 planillas Excel convertidas a Parquet).",
    "",
    "## Probetas (FO 05-02)",
    "",
    "- Total de probetas: **%s**  |  Rango de moldeo: **%s** a **%s**" % (tot[0], tot[1], tot[2]),
    "",
    "### Por clase",
    "",
    md("SELECT * FROM v_probetas_por_clase"),
    "### Cumplimiento f'c (28 d)",
    "",
    md("SELECT cumple, count(*) AS n FROM probetas_limpio GROUP BY 1 ORDER BY 2 DESC"),
    "### Resumen mensual por clase (desde 2026)",
    "",
    md("SELECT * FROM probetas_resumen_mensual WHERE periodo >= '2026-01' ORDER BY periodo, clase"),
    "## Humedad de aridos (2026)",
    "",
    md("SELECT material, count(*) n, round(avg(humedad),2) humedad_prom, round(avg(absorcion),2) absorcion_prom "
       "FROM humedad_aridos_limpio GROUP BY 1 ORDER BY n DESC"),
    "## Temperatura del agua de curado (2026)",
    "",
    md("SELECT mes, round(avg(temp_prom),1) temp_prom, min(temp_min) t_min, max(temp_max) t_max "
       "FROM temperatura_agua_limpio GROUP BY 1 ORDER BY 1"),
    "## Calidad de datos",
    "",
    md("SELECT "
       "sum(CASE WHEN edad_calc < 0 THEN 1 ELSE 0 END) AS edad_negativa, "
       "sum(CASE WHEN edad_calc > 28 THEN 1 ELSE 0 END) AS edad_mayor_28, "
       "sum(CASE WHEN planta='Sin dato' THEN 1 ELSE 0 END) AS planta_sin_dato, "
       "sum(CASE WHEN material IS NULL THEN 1 ELSE 0 END) AS material_sin_dato "
       "FROM probetas_limpio"),
]
with open(os.path.join(OUT, "INFORME.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(info) + "\n")

con.close()
print("Refinado OK ->", REF)
for t in refined:
    print("  ", t + ".parquet")
print("  consultas.sql, INFORME.md")
