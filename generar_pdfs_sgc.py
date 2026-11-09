# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import ParagraphStyle

RUTA_SALIDA = r"C:\AI\Antigravity\FALPAT srl\Certificacion\documentos"
MARGEN = 56.7
ANCHO, ALTO = A4
ANCHO_UTIL = ANCHO - 2 * MARGEN

COLOR_FONDO = HexColor("#FFFFFF")
COLOR_PRIMARIO = HexColor("#0F172A")
COLOR_ACENTO = HexColor("#0284C7")
COLOR_GRIS = HexColor("#64748B")
COLOR_BORDE = HexColor("#E2E8F0")
COLOR_CUERPO = HexColor("#334155")

Y_PIE = 34
ESPACIO_SUPERIOR = 35
ALTO_ENCABEZADO = 105

DOCUMENTOS_SGC = [
    {
        "codigo": "IT-SGC-001",
        "archivo": "resguardo_de_informacion.pdf",
        "titulo": "Resguardo de información",
        "secciones": [
            (
                "OBJETIVO OPERATIVO DEL SGC",
                "Dictaminar formalmente el cese inmediato del almacenamiento crítico de información de ensayos, registros analíticos y calibraciones en discos duros de PC locales expuestos a fallas lógicas o mecánicas de hardware aisladas."
            ),
            (
                "PROTOCOLO DE MIGRACIÓN CLOUD",
                "Migrar la totalidad de los datos históricos del laboratorio hacia la estructura de la nube corporativa segura de la empresa, utilizando entornos encriptados (cifrado AES-256 en reposo y TLS 1.3 en tránsito)."
            ),
            (
                "RUTINA AUTOMÁTICA DE BACKUPS",
                "Configurar y auditar un servicio automatizado en caliente con una periodicidad estricta de ejecución cada 4 horas (RPO < 4hs) con replicación cruzada interplanta (Luján - Campana) bajo el amparo de la Ley Nº 25.326. El control de acceso se restringirá mediante asignación de permisos jerárquicos basados en roles y doble factor de autenticación (2FA)."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-002",
        "archivo": "muestras_de_campana.pdf",
        "titulo": "Muestras de Campana",
        "secciones": [
            (
                "REGULARIZACIÓN URGENTE DE ENVÍOS",
                "Resolver de manera mandatoria e inmediata el desvío técnico crítico por falta de remisión sistemática de contramuestras físicas de cemento desde la molienda de la planta de Campana hacia el laboratorio central de Luján, el cual continuaba pendiente desde la visita técnica anterior."
            ),
            (
                "CRONOGRAMA LOGÍSTICO Y ENSAYOS MÍNIMOS",
                "Establecer un cronograma diario de recolección matutina y despacho vehicular. Cada lote debe identificarse con rotulado normalizado por código de barras. Al ingresar a Luján, se ejecutarán prioritariamente ensayos de finura por permeabilidad Blaine, tiempos de fraguado inicial y final mediante aparato de Vicat, y roturas mecánicas por compresión a los 2, 7 y 28 días conforme las exigencias de la serie de Normas IRAM 50.000."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-003",
        "archivo": "certificados_de_calibracion.pdf",
        "titulo": "Certificados de calibración",
        "secciones": [
            (
                "ALCANCE METROLÓGICO DEL REPOSITORIO",
                "Reunir, centralizar digitalmente y auditar la vigencia técnica de las certificaciones anuales de la totalidad de los equipos de pesaje comercial y analítico que operan en ambas plantas industriales."
            ),
            (
                "REQUISITOS TÉCNICOS E INTERVALOS DE CONTROL",
                "Toda calibración e inspección debe poseer trazabilidad formal ante el Instituto Nacional de Tecnología Industrial (INTI) o laboratorios validados por el Servicio Argentino de Calibración (SAC) bajo lineamientos normativos ISO/IEC 17025. Los límites admisibles máximos de desvío tolerados por el SGC son de ±0.1% para básculas de camiones de gran porte y de ±0.01% para balanzas analíticas críticas de precisión del laboratorio de dosificación."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-004",
        "archivo": "layout_de_lujan.pdf",
        "titulo": "Layout de Luján",
        "secciones": [
            (
                "DIAGNÓSTICO DE CIRCULACIÓN INDUSTRIAL",
                "Optimizar la distribución de las instalaciones e infraestructura del predio de Luján. Se establece como requerimiento técnico la obtención y digitalización de una imagen aérea fotogramétrica actualizada de alta resolución del predio para modelar flujos operativos."
            ),
            (
                "SEGREGACIÓN VIAL Y LOGÍSTICA PESADA",
                "Realizar un análisis vectorial para desarticular cuellos de botella e interferencias. El layout final debe delimitar con precisión circuitos exclusivos para camiones tolva de materia prima y configuraciones bitrén de transporte pesado de hasta 75 toneladas, garantizando su segregación física completa de zonas de circulación de vehículos livianos y sendas peatonales protegidas bajo la Ley de Higiene y Seguridad Nº 19.587 (Decreto 351/79)."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-005",
        "archivo": "seguridad_vial_interna.pdf",
        "titulo": "Seguridad vial interna",
        "secciones": [
            (
                "MANUAL DE CONDUCCIÓN DEFENSIVA Y VELOCIDADES",
                "Reforzar e institucionalizar las buenas prácticas de manejo defensivo dentro de los predios industriales ante la convivencia diaria de camiones pesados, autoelevadores y vehículos livianos de personal, alineado a las normas de seguridad ISO 39001 e ISO 45001. Se fija un límite de velocidad restrictivo estricto de 15 km/h en calzadas generales y de 10 km/h en la zona de tolvas, silos y plataformas de despacho."
            ),
            (
                "OBLIGATORIEDAD DE ESTACIONAMIENTO EN REVERSA",
                "Establecer, pintar y señalizar de forma vertical el criterio obligatorio de estacionamiento en reversa para todo rodado que ingrese a las plantas. Las unidades deben quedar orientadas de forma permanente hacia la salida para permitir una evacuación inmediata y fluida ante contingencias o emergencias de planta."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-006",
        "archivo": "telefono_del_laboratorio.pdf",
        "titulo": "Teléfono del laboratorio",
        "secciones": [
            (
                "RESTRICCIÓN DE USO DE DISPOSITIVOS PARTICULARES",
                "Prohibir de forma taxativa la utilización del teléfono celular particular del laboratorista de turno para registrar, almacenar, fotografiar o transmitir datos, planillas de ensayos o información estratégica de la empresa, mitigando riesgos de fuga o pérdida de propiedad intelectual."
            ),
            (
                "CONTINUIDAD DE LA INFORMACIÓN Y DISPONIBILIDAD",
                "Desplegar un dispositivo móvil institucional encriptado y controlado bajo el sistema MDM de la compañía. La terminal se mantendrá en el laboratorio bajo custodia, operativa las 24 horas durante los relevos de turno, y programada con sincronización automática cifrada en red para asegurar la disponibilidad, trazabilidad y continuidad de los datos ingresados al SGC."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-007",
        "archivo": "plan_de_muestreo.pdf",
        "titulo": "Plan de muestreo",
        "secciones": [
            (
                "REESTRUCTURACIÓN ESTADÍSTICA DE RECOLECCIÓN",
                "Revisar y modificar las frecuencias fijas de toma de muestras de materias primas e insumos ligándolas directamente de forma proporcional a las fluctuaciones de los volúmenes métricos o toneladas reales recibidas por lote en las tolvas de recepción."
            ),
            (
                "MUESTREADORES AUTOMÁTICOS Y ENSAYOS MÍNIMOS",
                "El protocolo exige la extracción mediante muestreadores automáticos con divisores mecánicos tipo Jones en la tubería de carga a silos (estableciendo ensayos cada 500t de Caliza/Clinker y 200t de adiciones). El procedimiento debe asegurar el resguardo de contramuestras herméticas por 90 días en cumplimiento de las exigencias del PEC según la Resolución SIC Nº 236/2024."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-008",
        "archivo": "control_de_calidad_de_aridos_de_cantera_propia.pdf",
        "titulo": "Control de calidad de áridos de cantera propia",
        "secciones": [
            (
                "EVALUACIÓN DE UNIFORMIDAD GRANULOMÉTRICA",
                "Mandatar la centralización e indexación semanal obligatoria en el SGC de los informes emitidos por el responsable operativo de cantera propia, incluyendo las curvas granulométricas completas del material extraído."
            ),
            (
                "CARACTERIZACIÓN MECÁNICA DE DISEÑO (IRAM 1505/1531)",
                "Evaluar analíticamente la calidad del material destinado a la elaboración de hormigón para corregir dispersiones hídricas. Se controlarán estrictamente el coeficiente de desgaste mediante la Máquina de Los Ángeles (fijando un máximo admisible del 30% de pérdida de masa estructural) y el porcentaje de finos pasantes por tamiz Malla #200."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-009",
        "archivo": "control_de_calidad_del_agua.pdf",
        "titulo": "Control de calidad del agua",
        "secciones": [
            (
                "CONTROL QUÍMICO DEL AGUA DE AMASADO",
                "Revisar de forma inmediata la vigencia de los análisis químicos del agua de amasado utilizada en Luján y Campana, regulando su aptitud técnica mediante el control estricto de límites de sulfatos y cloruros, y fijando una frecuencia de muestreo diferencial según el origen del agua (red pública, pozo propio o sistema de recirculado)."
            ),
            (
                "MONITOREO Y TRAZABILIDAD HÍDRICA",
                "Establecer registros de laboratorio con resultados de dureza, pH, sólidos disueltos y cloruros libres por lote de producción, vinculados al SGC con firma digital del responsable de calidad y alertas automáticas ante superación de los valores límite normativos."
            ),
        ],
    },
    {
        "codigo": "IT-SGC-010",
        "archivo": "documentacion_del_laboratorio.pdf",
        "titulo": "Documentación del laboratorio",
        "secciones": [
            (
                "CENTRALIZACIÓN DE REGISTROS Y CONTROLES",
                "Centralizar los registros de ensayos y controles, asegurando su disponibilidad y trazabilidad para ambas plantas, eliminando duplicados y versiones desactualizadas de planillas y actas de rotura de probetas."
            ),
            (
                "GESTIÓN DE VERSIONES Y ACCESO RESTRINGIDO",
                "Implementar un repositorio documental con control de versiones, permisos por rol y registro de auditoría para cada modificación, garantizando que solo personal autorizado del SGC pueda editar o retirar documentación técnica vigente de los laboratorios de Luján y Campana."
            ),
        ],
    },
]

ESTILO_SECCION = ParagraphStyle(
    "seccion",
    fontName="Helvetica-Bold",
    fontSize=10.5,
    textColor=COLOR_PRIMARIO,
    spaceBefore=2,
    spaceAfter=4,
    alignment=TA_JUSTIFY,
)

ESTILO_PARRAFO = ParagraphStyle(
    "parrafo",
    fontName="Helvetica",
    fontSize=9.5,
    textColor=COLOR_CUERPO,
    leading=14,
    alignment=TA_JUSTIFY,
)


class SGCNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for estado in self._saved_page_states:
            self.__dict__.update(estado)
            self.dibujar_pie(total)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def dibujar_pie(self, total_paginas):
        self.setStrokeColor(COLOR_BORDE)
        self.setLineWidth(0.5)
        self.line(MARGEN, Y_PIE + 10, ANCHO - MARGEN, Y_PIE + 10)
        self.setFillColor(COLOR_GRIS)
        self.setFont("Helvetica-Oblique", 6.5)
        self.drawString(
            MARGEN,
            Y_PIE,
            "DOCUMENTO TÉCNICO INTERNO REGULADO - Propiedad industrial confidencial de Grupo Falpat SRL.",
        )
        self.setFillColor(COLOR_GRIS)
        self.setFont("Helvetica-Oblique", 6.5)
        self.drawRightString(
            ANCHO - MARGEN,
            Y_PIE,
            f"Página {self._pageNumber} de {total_paginas}",
        )


def dibujar_encabezado(c, doc):
    ancho, alto = ANCHO, ALTO
    y_contenedor = alto - ESPACIO_SUPERIOR - ALTO_ENCABEZADO

    c.setFillColor(COLOR_FONDO)
    c.setStrokeColor(COLOR_BORDE)
    c.setLineWidth(1)
    c.roundRect(MARGEN, y_contenedor, ANCHO_UTIL, ALTO_ENCABEZADO, 8, stroke=1, fill=1)

    c.setFillColor(COLOR_ACENTO)
    c.rect(MARGEN + 8, y_contenedor + 18, 3, ALTO_ENCABEZADO - 36, stroke=0, fill=1)

    c.setFillColor(COLOR_PRIMARIO)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGEN + 20, y_contenedor + ALTO_ENCABEZADO - 22, "GRUPO FALPAT SRL")

    c.setFillColor(COLOR_GRIS)
    c.setFont("Helvetica", 9)
    c.drawString(
        MARGEN + 20,
        y_contenedor + ALTO_ENCABEZADO - 36,
        "Control de Stock de Materiales",
    )
    c.drawString(
        MARGEN + 20,
        y_contenedor + ALTO_ENCABEZADO - 48,
        "Ruta 6 y 34 km 156, Luján, Provincia de Buenos Aires, Argentina",
    )
    c.drawString(
        MARGEN + 20,
        y_contenedor + ALTO_ENCABEZADO - 60,
        "https://www.grupofalpat.com.ar",
    )

    c.setFillColor(COLOR_ACENTO)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(
        ANCHO - MARGEN - 8,
        y_contenedor + ALTO_ENCABEZADO - 22,
        f"INFORME TÉCNICO: {doc.codigo_titulo.upper()}",
    )

    c.setFillColor(COLOR_GRIS)
    c.setFont("Helvetica", 8.5)
    c.drawRightString(
        ANCHO - MARGEN - 8,
        y_contenedor + ALTO_ENCABEZADO - 38,
        f"Código SGC: {doc.codigo_sgc}",
    )
    c.drawRightString(
        ANCHO - MARGEN - 8,
        y_contenedor + ALTO_ENCABEZADO - 50,
        "Vigencia: Noviembre 2026",
    )
    c.drawRightString(
        ANCHO - MARGEN - 8,
        y_contenedor + ALTO_ENCABEZADO - 62,
        "Revisión: v1.0",
    )


def dibujar_filtros(c):
    y_barra = ALTO - ESPACIO_SUPERIOR - ALTO_ENCABEZADO - 18
    y_texto = y_barra - 14
    c.setStrokeColor(COLOR_ACENTO)
    c.setLineWidth(1)
    c.line(MARGEN, y_barra, ANCHO - MARGEN, y_barra)
    c.setFillColor(COLOR_GRIS)
    c.setFont("Helvetica", 8.5)
    c.drawString(
        MARGEN,
        y_texto,
        "PLANTA Y UBICACIÓN: Planta Luján / Planta Campana — Eje de Fiscalización SGC",
    )


def dibujar_marco(canvas_obj, doc):
    dibujar_encabezado(canvas_obj, doc)
    dibujar_filtros(canvas_obj)


def generar_pdf(datos, ruta):
    doc = BaseDocTemplate(
        ruta,
        pagesize=A4,
        leftMargin=MARGEN,
        rightMargin=MARGEN,
        topMargin=MARGEN,
        bottomMargin=MARGEN + 40,
    )
    doc.codigo_sgc = datos["codigo"]
    doc.codigo_titulo = datos["titulo"]

    y_inferior_frame = MARGEN + 40
    y_superior_frame = ALTO - ESPACIO_SUPERIOR - ALTO_ENCABEZADO - 45
    alto_frame = y_superior_frame - y_inferior_frame

    frame = Frame(
        MARGEN,
        y_inferior_frame,
        ANCHO_UTIL,
        alto_frame,
        id="cuerpo",
        leftPadding=6,
        rightPadding=6,
        topPadding=6,
        bottomPadding=6,
    )
    template = PageTemplate(id="principal", frames=[frame], onPage=dibujar_marco)
    doc.addPageTemplates([template])

    story = []
    for indice, (titulo_seccion, texto_seccion) in enumerate(datos["secciones"], 1):
        story.append(
            HRFlowable(
                width="100%",
                thickness=1.2,
                color=COLOR_ACENTO,
                spaceBefore=8,
                spaceAfter=4,
            )
        )
        story.append(Paragraph(f"Sección {indice}. {titulo_seccion}", ESTILO_SECCION))
        story.append(Paragraph(texto_seccion, ESTILO_PARRAFO))
        story.append(Spacer(1, 10))

    doc.build(story, canvasmaker=SGCNumberedCanvas)


def main():
    os.makedirs(RUTA_SALIDA, exist_ok=True)
    for datos in DOCUMENTOS_SGC:
        ruta_completa = os.path.join(RUTA_SALIDA, datos["archivo"])
        generar_pdf(datos, ruta_completa)
        print(ruta_completa)


if __name__ == "__main__":
    main()
