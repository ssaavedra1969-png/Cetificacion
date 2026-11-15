# -*- coding: utf-8 -*-
"""Importa todos los documentos del SGC al portal local,
borra los documentos existentes y actualiza data/documentos.json.

- Excluye la carpeta Manuales\ (respaldo).
- Preserva la estructura de carpetas bajo documentos/.
- Genera ids UUID y categorias a partir del nombre de carpeta.
- Copia los archivos físicos a certificacion/documentos/.
"""
import os, shutil, uuid, json, re
from datetime import datetime

BASE_SGC = r"C:\AI\Antigravity\FALPAT srl\Certificacion\SGC"
BASE_PORTAL = r"C:\AI\Antigravity\FALPAT srl\Certificacion"

# Mapeo de carpetas SGC a categorías del portal
CATEGORIA_MAP = {
    "00_Manual del SGC": "Manual del SGC",
    "01_Documentos de Calidad": "Documentos de Calidad",
    "02_Procedimientos Generales": "Procedimientos Generales",
    "03_Procedimientos Operativos": "Procedimientos Operativos",
    "04_Instructivos de Trabajo": "Instructivos de Trabajo",
    "05_Formularios": "Formularios",
    "06_Registros de Calidad": "Registros de Calidad",
    "07_Documentos Externos": "Documentos Externos",
    "08_Soporte": "Soporte",
    "99_Obsoletos": "Obsoletos",
}

# Carpetas a excluir (rutas relativas desde BASE_SGC)
EXCLUDE_DIRS = set()

# Archivos que NO son documentos del SGC (scripts, sistema, etc.)
EXCLUDE_FILES = {"Thumbs.db", "desktop.ini", ".gitkeep", ".DS_Store"}

# Extensiones que NO se suben al portal
EXCLUDE_EXTS = {".bat", ".ps1", ".html", ".url", ".ini", ".lnk", ".db"}


def es_archivo_valido(fname):
    if fname in EXCLUDE_FILES:
        return False
    if fname.startswith("~$"):
        return False
    ext = os.path.splitext(fname)[1].lower()
    if ext in EXCLUDE_EXTS:
        return False
    return True

# Extensiones a tipo de archivo
EXT_TIPO = {
    ".pdf": "pdf",
    ".docx": "word",
    ".doc": "word",
    ".xlsx": "excel",
    ".xls": "excel",
    ".jpg": "imagen",
    ".jpeg": "imagen",
    ".png": "imagen",
}


def get_categoria(carpeta_nombre):
    for key, val in CATEGORIA_MAP.items():
        if key in carpeta_nombre:
            return val
    return "Otros"


def ext_a_tipo(ext):
    ext = ext.lower()
    return EXT_TIPO.get(ext, "otro")


def walk_sgc(base):
    """Genera (archivo_fullpath, rel_path_from_sgc) para cada archivo,
    excluyendo carpetas en EXCLUDE_DIRS."""
    for root, dirs, files in os.walk(base):
        # Quitar carpetas excluidas de walk para no entrar en ellas
        dirs[:] = [d for d in dirs if os.path.join(root, d) not in [os.path.join(BASE_SGC, exc) for exc in EXCLUDE_DIRS]
                   and os.path.join(root, d) not in [os.path.join(BASE_SGC, exc) for exc in EXCLUDE_DIRS]]
        # También filtrar recursivamente: quitar subcarpetas que coinciden
        # Simple: si root empieza con una carpeta excluida, subamos un nivel
        # Más robusto: compute relative and check
        rel_to_base = os.path.relpath(root, BASE_SGC)
        if rel_to_base.startswith(".."):
            continue  # should not happen
        # Si la ruta relativa comienza con una carpeta excluida, skip entire tree
        parts = rel_to_base.split(os.sep)
        if parts and parts[0] in EXCLUDE_DIRS:
            continue
        for fname in files:
            if not es_archivo_valido(fname):
                continue
            full = os.path.join(root, fname)
            # relative path from SGC base, using forward slashes for consistency
            rel = os.path.relpath(full, BASE_SGC).replace(os.sep, "/")
            yield full, rel


def main():
    # 1. Limpiar portal: borrar data/documentos.json y todos los archivos en documentos/
    docs_dir = os.path.join(BASE_PORTAL, "documentos")
    if os.path.exists(docs_dir):
        for f in os.listdir(docs_dir):
            fp = os.path.join(docs_dir, f)
            if os.path.isfile(fp):
                os.remove(fp)
            elif os.path.isdir(fp):
                shutil.rmtree(fp)
    # También remover posibles subdirectorios dentro de documentos que no sean carpetas de origen
    # (ya removidos arriba)

    # 2. Borrar data/documentos.json si existe
    json_path = os.path.join(BASE_PORTAL, "data", "documentos.json")
    if os.path.exists(json_path):
        os.remove(json_path)

    # 3. Recorrer SGC y copiar archivos
    entries = []
    id_counter = 1

    for full_rel, rel_from_sgc in walk_sgc(BASE_SGC):
        # rel_from_sgc ej: "06_Registros de Calidad/INFORME NOYA S.A 2026/XLS/informe resultados a compresion NOYA 638 SA 26082026.docx"
        # Separar carpeta y archivo
        parts = rel_from_sgc.split("/")
        if len(parts) < 2:
            # archivo suelto en raiz SGC (raro pero posible)
            folder_rel = ""
            file_rel = rel_from_sgc
        else:
            folder_rel = "/".join(parts[:-1])
            file_rel = parts[-1]

        # Destination under portal documentos/
        if folder_rel:
            dest_dir = os.path.join(docs_dir, folder_rel)
        else:
            dest_dir = docs_dir
        dest_file = os.path.join(dest_dir, file_rel)

        os.makedirs(dest_dir, exist_ok=True)

        # Copiar archivo (sobreescribe si existe)
        try:
            shutil.copy2(full_rel, dest_file)
        except Exception as e:
            print("ERROR copiando", full_rel, e)
            continue

        # Derivar campos
        nombre = file_rel  # filename con extension
        _, ext = os.path.splitext(nombre)
        tipo = ext_a_tipo(ext)

        # Categoría desde la carpeta padre inmediata (o búsqueda)
        # folder_rel es tipo "06_Registros de Calidad/INFORME NOYA S.A 2026"
        # La carpeta padre es la primera parte
        top_folder = folder_rel.split("/")[0] if folder_rel else ""
        categoria = get_categoria(top_folder) if top_folder else "Otros"

        # id UUID
        doc_id = str(uuid.uuid4())

        # fecha: fecha de ultima modificacion del archivo
        try:
            mtime = os.path.getmtime(full_rel)
            fecha_iso = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")
        except Exception:
            fecha_iso = ""

        # responsable
        responsable = "SGC"

        # descripcion vacia
        descripcion = ""

        # planta "General"
        planta = "General"

        # ruta relative under documentos/
        ruta = rel_from_sgc  # ej "06_Registros de Calidad/INFORME NOYA S.A 2026/..."

        # archivoUrl: ruta pública (asumiendo que el servidor sirve de /documentos/)
        # El API /api/files?id= usa el id, pero también puede servir archivos estaticos.
        # Pondremos archivoUrl al path relativo para que el front lo pueda usar.
        archivo_url = "/documentos/" + rel_from_sgc.replace(" ", "%20")  # simple encode

        entry = {
            "id": doc_id,
            "nombre": nombre,
            "categoria": categoria,
            "puntoId": "",
            "planta": planta,
            "fecha": fecha_iso,
            "version": "1",
            "responsable": responsable,
            "descripcion": descripcion,
            "archivoUrl": archivo_url,
            "ruta": ruta,
            "tipo": tipo,
        }
        entries.append(entry)
        id_counter += 1

    # 5. Escribir data/documentos.json con el formato que espera la app:
    #    { "documentos": [...], "categorias": [...], "metadata": {...} }
    orden_categorias = [
        "Manual del SGC",
        "Documentos de Calidad",
        "Procedimientos Generales",
        "Procedimientos Operativos",
        "Instructivos de Trabajo",
        "Formularios",
        "Registros de Calidad",
        "Documentos Externos",
        "Soporte",
        "Obsoletos",
        "Otros",
    ]
    presentes = {e["categoria"] for e in entries}
    categorias = [c for c in orden_categorias if c in presentes]
    for e in entries:
        if e["categoria"] not in categorias:
            categorias.append(e["categoria"])

    salida = {
        "documentos": entries,
        "categorias": categorias,
        "metadata": {"generadoEl": datetime.now().strftime("%Y-%m-%d"),
                     "empresa": "Grupo Falpat SRL"},
    }

    json_out = os.path.join(BASE_PORTAL, "data", "documentos.json")
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    print("Importación completada.")
    print(" - Archivos copiados a:", docs_dir)
    print(" - Entradas en data/documentos.json: %d" % len(entries))


if __name__ == "__main__":
    main()