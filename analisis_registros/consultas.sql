-- Consultas de ejemplo sobre registros.duckdb (06_Registros de Calidad)
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
