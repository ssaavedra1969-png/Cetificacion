# -*- coding: utf-8 -*-
"""Convierte las planillas de 06_Registros de Calidad a Parquet y a una base DuckDB.

- Detecta la fila de encabezado de cada hoja.
- Guarda un Parquet por hoja (tidy) + un DuckDB con todas las tablas.
- Une las hojas mensuales de Humedad de aridos y Temperatura de agua.
"""
import os, re, unicodedata
import pandas as pd
import duckdb

BASE = r"C:\AI\Antigravity\FALPAT srl\Certificacion\SGC\06_Registros de Calidad"
OUT = r"C:\AI\Antigravity\FALPAT srl\Certificacion\analisis_registros"
PARQ = os.path.join(OUT, "parquet")
DB = os.path.join(OUT, "registros.duckdb")

MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO",
         "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]


def slug(s):
    s = unicodedata.normalize("NFD", str(s))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_").lower()
    return s[:60] or "x"


def text_score(row):
    c = 0
    for v in row:
        if pd.isna(v):
            continue
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            continue
        try:
            float(str(v).replace(",", "."))
            continue
        except ValueError:
            pass
        c += 1
    return c


def find_header(df):
    n = min(10, len(df))
    best_r, best_s = None, 0
    for r in range(n):
        s = text_score(df.iloc[r])
        if s > best_s:
            best_r, best_s = r, s
    if best_r is not None and best_s >= 2:
        return best_r
    best_r, best_c = None, 0
    for r in range(n):
        cnt = int(df.iloc[r].notna().sum())
        if cnt > best_c:
            best_r, best_c = r, cnt
    return best_r


def unique(cols):
    seen, out = {}, []
    for c in cols:
        c = str(c).strip() if pd.notna(c) else ""
        c = c or "col"
        if c in seen:
            seen[c] += 1
            c = "%s_%d" % (c, seen[c])
        else:
            seen[c] = 1
        out.append(c)
    return out


def coerce(df):
    for c in df.columns:
        s = df[c]
        if s.dtype == object:
            nn = s.notna()
            if int(nn.sum()) == 0:
                df[c] = s.astype(str)
                continue
            num = pd.to_numeric(s, errors="coerce")
            if int(num.notna().sum()) >= int(nn.sum()) * 0.9:
                df[c] = num
                continue
            txt = s[nn].astype(str)
            if txt.str.contains(r"[-/]", regex=True).mean() > 0.6:
                dt = pd.to_datetime(s, errors="coerce")
                if int(dt.notna().sum()) >= int(nn.sum()) * 0.9:
                    df[c] = dt
                    continue
            df[c] = s.where(~nn, s.astype(str))
    return df


def mes_of(name):
    up = str(name).upper()
    for m in MESES:
        if m in up:
            return m
    return None


def sheet_to_df(raw, archivo, hoja):
    df = raw.dropna(axis=1, how="all").dropna(axis=0, how="all").reset_index(drop=True)
    if df.shape[0] < 2 or df.shape[1] < 1:
        return None
    hr = find_header(df)
    if hr is None:
        return None
    cols = unique(df.iloc[hr].tolist())
    data = df.iloc[hr + 1:].reset_index(drop=True)
    data.columns = cols
    data = data.dropna(axis=0, how="all")
    if data.empty:
        return None
    data.insert(0, "_hoja", hoja)
    data.insert(0, "_archivo", archivo)
    return data


def main():
    os.makedirs(PARQ, exist_ok=True)
    for f in os.listdir(PARQ):
        if f.endswith(".parquet"):
            os.remove(os.path.join(PARQ, f))
    if os.path.exists(DB):
        os.remove(DB)

    files = []
    for root, dirs, fs in os.walk(BASE):
        for f in fs:
            if os.path.splitext(f)[1].lower() in (".xls", ".xlsx", ".csv"):
                files.append(os.path.join(root, f))

    tables = {}
    humedad, temperatura = [], []

    for path in sorted(files):
        archivo = os.path.splitext(os.path.basename(path))[0]
        try:
            xls = pd.ExcelFile(path)
        except Exception as e:
            print("ERROR abriendo", archivo, e)
            continue
        for hoja in xls.sheet_names:
            try:
                raw = xls.parse(hoja, header=None)
            except Exception as e:
                print("  hoja", hoja, "error", e)
                continue
            df = sheet_to_df(raw, archivo, hoja)
            if df is None:
                continue
            df = coerce(df)
            name = slug(archivo)[:34] + "__" + slug(hoja)
            if name in tables:
                name += "_" + str(len(tables))
            tables[name] = df

            if "HUMEDAD" in archivo.upper() and mes_of(hoja):
                h = df.copy()
                h.insert(0, "_mes", mes_of(hoja))
                humedad.append(h)
            if "TEMPERATURA" in archivo.upper() and mes_of(hoja):
                t = df.copy()
                t.insert(0, "_mes", mes_of(hoja))
                temperatura.append(t)

    if humedad:
        tables["humedad_aridos_2026"] = coerce(pd.concat(humedad, ignore_index=True))
    if temperatura:
        tables["temperatura_agua_2026"] = coerce(pd.concat(temperatura, ignore_index=True))

    con = duckdb.connect(DB)
    total = 0
    for name, df in sorted(tables.items()):
        con.register("t", df)
        con.execute('CREATE OR REPLACE TABLE "%s" AS SELECT * FROM t' % name)
        con.unregister("t")
        con.execute("COPY (SELECT * FROM \"%s\") TO ? (FORMAT PARQUET)" % name,
                    [os.path.join(PARQ, name + ".parquet")])
        total += len(df)
        print("%-52s %6d filas x %2d col" % (name, len(df), df.shape[1]))
    con.close()

    size = sum(os.path.getsize(os.path.join(PARQ, f)) for f in os.listdir(PARQ))
    print("-" * 80)
    print("Tablas: %d | filas totales: %d" % (len(tables), total))
    print("Parquet: %.0f KB en %s" % (size / 1024, PARQ))
    print("DuckDB : %s" % DB)


if __name__ == "__main__":
    main()
