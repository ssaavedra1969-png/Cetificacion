# Portal SGC – Grupo Falpat SRL

Portal interno de certificación y seguimiento del Sistema de Gestión de Calidad (SGC) para el área de cemento, orientado a la planta principal y sus plantas de Campana y Luján.

## Visión general

Este es un portal web full-stack construido con **Next.js + TypeScript + Tailwind CSS**, diseñado para ser desplegado gratuitamente en **GitHub + Vercel**. El sistema sirve como:

- **Agenda de trabajo** - Los 10 puntos relevados en la visita del 5/11/2026
- **Tablero de pendientes** - Estado actual del SGC con KPIs
- **Documentoteca** - Repositorio de PDFs y documentación de soporte
- **Área de administración** - Editar puntos, cambiar estados, subir evidencia

## Stack tecnológico

- **Next.js 16** con App Router
- **TypeScript** para tipos seguros
- **Tailwind CSS v4** para estilizado
- **Persistencia en archivos JSON** dentro del repositorio
- **PDFs en `public/documentos/`** con subida mediante API de GitHub
- **Deploy gratuito** en Vercel (plan Free)

## Arquitectura y flujo de datos

### Persistencia de datos

Los datos se almacenan en archivos JSON dentro del repositorio:

- `data/agenda.json` - Los 10 puntos SGC con sus estados, responsables, fechas e historial
- `data/documentos.json` - Catálogo de documentos PDF con metadatos

Los PDFs se almacenan en `public/documentos/` dentro del repositorio. La carga desde la interfaz web utiliza una **función serverless de Vercel** que llama a la **API de GitHub** para commitear los archivos de vuelta al repositorio.

### Flujo de carga de PDFs

1. El usuario selecciona un archivo PDF y llena el formulario en la sección de Administración
2. El formulario envía los datos a `/api/upload/pdf` (función serverless de Vercel)
3. La función:
   - Verifica la contraseña de administración (variable de entorno `ADMIN_PASSWORD`)
   - Sube el PDF a `public/documentos/` usando la API de GitHub
   - Crea/actualiza `data/documentos.json` en el repositorio
   - Si hay un `puntoId` asociado, actualiza el punto SGC con el nuevo `documentosIds`
   - Devuelve la URL pública del PDF alojado en GitHub
4. La interfaz muestra la confirmación y actualiza la documentoteca

### Variables de entorno en Vercel

Para que la carga de PDFs funcione, configurar en el panel de Vercel (Settings > Environment Variables):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GITHUB_TOKEN` | Token de acceso personal de GitHub con permisos `repo` | `ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `GITHUB_REPO` | Repositorio en formato `usuario/repo` (opcional, por defecto `grupo-falpat/portal-sgc`) | `grupo-falpat/portal-sgc` |
| `ADMIN_PASSWORD` | Contraseña para acceder al área de administración | `falpat-admin-2026` |

**Nunca exponer estos secretos en el cliente** - se usan solo en funciones serverless.

## Páginas y secciones

### 1. Inicio / Dashboard

- Nombre: "Grupo Falpat SRL" y "Portal SGC – Certificación"
- KPIs: total de puntos, pendientes, en curso, bloqueados, completados, % de avance
- Últimos documentos subidos y próximos vencimientos
- Filtro por planta: Campana, Luján, General

### 2. Agenda de trabajo SGC

- Tabla con los 10 puntos precargados
- Campos por punto: ID, título, descripción, planta(s), categoría, responsable, prioridad, estado, fecha compromiso, fecha última actualización, evidencias vinculadas, notas e historial de cambios
- Edición de responsable, estado, fechas y notas
- Búsqueda y filtros por estado, responsable, planta y categoría
- Vista tabla y vista tarjetas

### 3. Documentoteca / Evidencias

- Repositorio de PDFs y documentos de soporte
- Buscador, filtros y previsualización/descarga
- Categorías iniciales (11 categorías):
  - Resguardo de información
  - Muestras de Campana
  - Certificados de calibración
  - Layout de Luján
  - Seguridad vial interna
  - Teléfono del laboratorio
  - Plan de muestreo
  - Control de calidad de áridos de cantera propia
  - Control de calidad del agua
  - Documentación del laboratorio
  - SGC general

### 4. Administración

- Editar los 10 puntos, cambiar estados/fechas/responsables y agregar notas
- Subir PDFs mediante GitHub API
- Mostrar confirmación de cambios y manejo de errores
- Login con cookie firmada y contraseña en variable de entorno

## Datos seed (10 puntos SGC)

El sistema precarga exactamente estos 10 puntos con estado inicial "Pendiente":

1. **Resguardo de información** - evaluar la migración de la información almacenada en la PC a una nube corporativa, con accesos controlados y una rutina de backups periódicos.
2. **Muestras de Campana** - regularizar el envío de muestras al laboratorio de Luján para realizar los ensayos correspondientes. Continuación pendiente de la visita anterior.
3. **Certificados de calibración** - reunir los certificados vigentes de las balanzas de camiones y de laboratorio de ambas plantas.
4. **Layout de Luján** - conseguir una imagen aérea actualizada del predio para analizar la distribución de las instalaciones, los flujos de circulación y las oportunidades de mejora del layout.
5. **Seguridad vial interna** - reforzar las buenas prácticas de manejo defensivo y circulación dentro del predio, considerando la convivencia entre vehículos livianos y equipos pesados. Establecer y señalar el criterio de estacionamiento en reversa.
6. **Teléfono del laboratorio** - revisar el uso del teléfono particular del laboratorista para gestionar información de la empresa, considerando el resguardo, la disponibilidad y la continuidad de esa información.
7. **Plan de muestreo** - revisar la frecuencia de toma de muestras de materias primas en relación con los volúmenes recibidos y los ensayos requeridos.
8. **Control de calidad de áridos de cantera propia** - solicitar y centralizar los informes de ensayos granulométricos y sus respectivas curvas, para evaluar la calidad y uniformidad de los materiales utilizados en la elaboración del hormigón. Coordinar con el responsable de cantera el envío periódico de esta información.
9. **Control de calidad del agua** - verificar la disponibilidad y vigencia de los análisis del agua utilizada para elaborar hormigón en ambas plantas, su aptitud conforme a los requisitos técnicos aplicables y la necesidad de establecer una frecuencia de control según su procedencia.
10. **Documentación del laboratorio** - centralizar los registros de ensayos y controles, asegurando su disponibilidad y trazabilidad para ambas plantas.

## Deploy en GitHub + Vercel (gratuito)

### Paso 1: Crear repositorio en GitHub

1. Crear una cuenta gratuita en [GitHub](https://github.com)
2. Crear un nuevo repositorio público llamado `portal-sgc` (o el nombre que prefiera)
3. No inicializar con README, .gitignore ni license (vamos a subir nuestro proyecto existente)

### Paso 2: Subir código al repositorio

```bash
# Clonar el repositorio vacío
git clone https://github.com/TU-USUARIO/portal-sgc.git
cd portal-sgc

# Copiar todos los archivos del proyecto creado en /portal-sgc
# (o usar los comandos siguiente)

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "feat: portal SGC - Grupo Falpat SRL - versión inicial"

# Agregar remote y empujar
git remote add origin https://github.com/TU-USUARIO/portal-sgc.git
git branch -M main
git push -u origin main
```

### Paso 3: Importar en Vercel

1. Crear una cuenta gratuita en [Vercel](https://vercel.com)
2. Hacer clic en "New Project" e importar el repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto Next.js
4. En la sección "Environment Variables", agregar las variables configuradas en el paso 5

### Paso 4: Configurar variables de entorno en Vercel

En la configuración del proyecto en Vercel (Settings > Environment Variables), agregar:

- `GITHUB_TOKEN`: Token de acceso personal de GitHub con permisos `repo` (generar en https://github.com/settings/tokens). Este token permitirá a la función serverless commitear archivos de vuelta al repositorio.
- `GITHUB_REPO`: (Opcional) Formato `usuario/repositorio`, ej: `grupo-falpat/portal-sgc`
- `ADMIN_PASSWORD`: Contraseña para el área de administración (cualquier cadena, ej: `falpat-admin-2026`)

### Paso 5: Deploy

Hacer clic en "Deploy". Vercel ejecutará `npm run build` y desplegará la aplicación.

La aplicación estará disponible en la URL proporcionada por Vercel (ej: `portal-sgc.vercel.app`).

## Uso después del deploy

### Acceso al área de administración

1. Acceder a la URL del despliegue
2. Al intentar entrar a `/administracion`, se verificará la autenticación
3. Ingresar la contraseña configurada en la variable `ADMIN_PASSWORD`
4. Una vez autenticado, podrás editar puntos, subir PDFs y ver el historial

### Flujo de trabajo típico

1. **Ver dashboard**: Ver KPIs generales y estado de los 10 puntos
2. **Filtrar agenda**: Usar filtros por estado, planta o categoría
3. **Editar punto**: En administración, seleccionar un punto y cambiar su estado, responsable, fechas o notas
4. **Subir PDF**: En administración, seleccionar un punto y subir un documento PDF. El sistema lo guardará en `public/documentos/` y lo asociará al punto correspondiente.
5. **Ver documentoteca**: Revisar todos los PDFs cargados, filtrar por categoría y descargar los archivos

## Desarrollo local

Para correr el proyecto en local:

```bash
cd /portal-sgc
npm install  # o yarn install
npm run dev  # Para modo desarrollo
```

La aplicación estará disponible en `http://localhost:3000`.

## Estructura del proyecto

```
/portal-sgc/
  ├── data/                  # Archivos JSON de persistencia
  │   ├── agenda.json        # 10 puntos SGC seed data
  │   └── documentos.json    # Catálogo de documentos
  ├── public/
  │   └── documentos/        # PDFs subidos (y archivos estáticos)
  ├── src/
  │   ├── app/               # Next.js App Router
  │   │   ├── layout.tsx     # Layout principal con metadata
  │   │   ├── page.tsx       # Página Dashboard principal
  │   │   ├── documentoteca/ # Página Documentoteca
  │   │   ├── administracion/ # Página Administración
  │   │   ├── login/         # Página de login
  │   │   └── api/           # Routes serverless
  │   │       ├── agenda/route.ts    # Lectura/escritura agenda
  │   │       ├── documentos/route.ts # Lectura/escritura documentos
  │   │       ├── login/route.ts     # Autenticación simple
  │   │       └── upload/route.ts    # Subida PDFs via GitHub API
  │   │       └── upload/route.ts
  │   ├── components/        # Componentes React
  │   │   ├── KPIs.tsx       # KPIs del dashboard
  │   │   ├── AgendaTable.tsx # Tabla de puntos SGC
  │   │   ├── AgendaFilters.tsx # Filtros de agenda
  │   │   └── ...
  │   ├── types/             # TypeScript types
  │   │   ├── models.ts      # Interfaces PuntoSGC, Documento, HistorialCambio
  │   │   └── index.ts
  │   └── lib/
  │       └── storage.ts     # Utilidades de lectura/escritura JSON
  ├── tailwind.config.js     # Configuración de Tailwind (v4)
  ├── vercel.json            # Configuración de despliegue Vercel
  └── package.json           # Dependencias del proyecto
```

## Critérios de aceptación

- [x] El sitio compila y se puede desplegar en Vercel sin costos
- [x] Se ven los 10 puntos precargados y se puede filtrar/buscar
- [x] Se puede ver el dashboard con métricas calculadas
- [x] Se puede agregar/editar información según la solución elegida
- [x] Los PDFs se pueden listar y abrir/descargar
- [x] La interfaz es responsive y está en español
- [x] El README permite replicar el deploy desde cero

## Próximos pasos

1. **Configurar GitHub repo**: Subir el código al repositorio creado
2. **Importar a Vercel**: Conectar el repo con Vercel y configurar las variables de entorno
3. **Probar flujo de PDF**: Subir un documento de prueba desde la administración
4. **Personalizar categorías**: Agregar/quitar categorías en `data/documentos.json` y el componente correspondiente
5. **Mejorar UI**: Ajustes finos de diseño según la identidad visual de Grupo Falpat SRL
6. **Autenticación robusta**: Para producción, reemplazar la contraseña simple por integración con proveedor de identidad (Auth0, Google Workspace, etc.)

## Aviso importante

Este proyecto fue creado con la restricción de usar solo servicios gratuitos (GitHub Free, Vercel Free). Para un entorno de producción con datos confidenciales y múltiples usuarios, se recomienda:

- Implementar autenticación más robusta (Auth0, AWS Cognito, etc.)
- Usar base de datos segura (PostgreSQL con Superset Free Tier, o MongoDB Atlas)
- Implementar encriptación de PDFs sensibles
- Configurar auditoría completa de cambios
- Revisar las tarifas y límites de la API de GitHub para el volumen de esperarse

---

**Grupo Falpat SRL** - Área de Certificación/SGC
Planta de cemento | Campana | Luján