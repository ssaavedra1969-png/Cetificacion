import { NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "grupo-falpat/portal-sgc";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "falpat-admin-2026";

interface UploadPDFResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function githubAPI(
  endpoint: string,
  options: {
    method?: string;
    headers?: { [key: string]: string };
    body?: string | Buffer;
  }
): Promise<any> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "User-Agent": "portal-sgc",
      ...(options.headers || {}),
    },
    body: options.body != null ? options.body : undefined,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }

  return res.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const file: File = body.get("file") as unknown as File;
    const password = body.get("password") as string;
    const puntoId = body.get("puntoId") as string;
    const categoria = body.get("categoria") as string;
    const planta = body.get("planta") as string;
    const version = body.get("version") as string || "1.0";
    const responsable = body.get("responsable") as string;
    const descripcion = body.get("descripcion") as string;
    const nombre = body.get("nombre") as string;

    // Verificar contraseña
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No se envió ningún archivo" },
        { status: 400 }
      );
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "Configuración del servidor incompleta (falta GITHUB_TOKEN)" },
        { status: 500 }
      );
    }

    // Convertir archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Nombre seguro para el archivo en GitHub
    const safeName = nombre
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .toLowerCase() || "documento";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const githubFilename = `public/documentos/${timestamp}-${safeName}.pdf`;

    // 1. Subir el archivo PDF (crear nuevo archivo - GitHub API permite crear sin SHA)
    const uploadRes = await githubAPI(
      `/contents/${githubFilename}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `docs: agregar ${nombre} - SGC Grupo Falpat`,
          content: buffer.toString("base64"),
        }),
      }
    );

    // 2. Obtener la URL pública del PDF
    const pdfUrl = uploadRes.content?.html_url || 
      `https://github.com/${GITHUB_REPO}/raw/main/${githubFilename}`;

    // 3. Actualizar documentos.json en el repositorio
    // Primero, obtener el SHA actual de documentos.json
    let docsSha: string | undefined;
    try {
      const docsGet = await githubAPI(
        `/contents/data/documentos.json`,
        { method: "GET" }
      );
      docsSha = docsGet.sha;
    } catch (e) {
      // Si el archivo no existe aún, iniciaremos desde vacío
      docsSha = undefined;
    }

    // Construir el nuevo documento registro
    const nuevoDocumento = {
      id: Date.now().toString(),
      nombre,
      categoria,
      puntoId,
      planta,
      fecha: new Date().toISOString().split("T")[0],
      version,
      responsable,
      descripcion,
      archivoUrl: pdfUrl,
      tipo: "pdf",
    };

    // Obtener contenido actual de documentos.json o crear uno nuevo
    let currentDocs: any = { documentos: [], categorias: [] };
    if (docsSha) {
      // Ya existe - ya obtuvimos el contenido arriba en docsGet
      // Re-structurar: el resultado de GET ya incluye content (base64) y sha
      currentDocs = JSON.parse(Buffer.from(docsGet.content, "base64").toString());
    }

    // Agregar nuevo documento
    currentDocs.documentos = currentDocs.documentos || [];
    currentDocs.documentos.push(nuevoDocumento);

    // Asegurar categoría en la lista
    currentDocs.categorias = currentDocs.categorias || [];
    if (!currentDocs.categorias.includes(categoria)) {
      currentDocs.categorias.push(categoria);
    }

    // 4. Commit de documentos.json
    await githubAPI(
      `/contents/data/documentos.json`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `docs: actualizar ${nombre} - SGC Grupo Falpat`,
          content: Buffer.from(JSON.stringify(currentDocs, null, 2)).toString("base64"),
          ...(docsSha ? { sha: docsSha } : {}), // SHA solo para actualizaciones
        }),
      }
    );

    // 5. Actualizar el punto SGC correspondiente si tiene puntoId
    if (puntoId) {
      // Obtener puntos actuales
      const puntosRes = await githubAPI(`/contents/data/agenda.json`, { method: "GET" });
      const currentAgenda = JSON.parse(Buffer.from(puntosRes.content, "base64").toString());
      const punto = currentAgenda.puntos.find((p: any) => p.id === puntoId);
      
      if (punto && !punto.documentosIds?.includes(nuevoDocumento.id)) {
        punto.documentosIds = [...(punto.documentosIds || []), nuevoDocumento.id];
        punto.fechaActualizacion = new Date().toISOString();

        // Agregar historial de cambio
        const nuevoHistorial: any = {
          fecha: new Date().toISOString(),
          campo: "documentos",
          valorAnterior: punto.documentosIds?.join(",") || "",
          valorNuevo: punto.documentosIds.concat(nuevoDocumento.id).join(","),
        };
        punto.historial = punto.historial || [];
        punto.historial.push(nuevoHistorial);

        // Commit del agenda.json
        await githubAPI(
          `/contents/data/agenda.json`,
          {
            method: "PUT",
            body: JSON.stringify({
              message: `sGC: agregar documento ${nombre} a punto ${puntoId} - SGC Grupo Falpat`,
              content: Buffer.from(JSON.stringify(currentAgenda, null, 2)).toString("base64"),
              sha: puntosRes.sha,
            }),
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: pdfUrl,
      documento: nuevoDocumento,
    });
  } catch (error: any) {
    console.error("Error en upload PDF:", error);
    return NextResponse.json(
      { error: error.message || "Error desconocido al subir PDF" },
      { status: 500 }
    );
  }
}