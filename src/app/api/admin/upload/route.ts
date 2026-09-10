import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    const fileObj = file as File;

    // Validar tipo de imagem
    if (fileObj.type && !fileObj.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Apenas arquivos de imagem são permitidos" },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 5MB)
    if (fileObj.size && fileObj.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 5MB" },
        { status: 400 }
      );
    }

    const bytes = await fileObj.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Criar nome de arquivo único
    const ext = (fileObj.name ? path.extname(fileObj.name) : null) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // 1. Tentar Vercel Blob (se configurado no ambiente Vercel)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const mimeType = fileObj.type || "image/jpeg";
        const blobRes = await fetch(
          `https://blob.vercel-storage.com/${filename}?contentType=${encodeURIComponent(mimeType)}`,
          {
            method: "PUT",
            headers: {
              "Access": "public",
              "Authorization": `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
            body: buffer,
          }
        );
        if (blobRes.ok) {
          const blobData = await blobRes.json();
          if (blobData.url) {
            return NextResponse.json({ url: blobData.url, success: true });
          }
        }
      } catch (blobErr) {
        console.warn("Vercel Blob upload falhou, tentando armazenamento local:", blobErr);
      }
    }

    // 2. Tentar salvar no disco local (funciona em dev e servidores com disco gravável)
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      return NextResponse.json({ url: publicUrl, success: true });
    } catch (fsErr) {
      console.warn("Escrita no disco local falhou (ambiente serverless/read-only), usando fallback Data URL:", fsErr);
    }

    // 3. Fallback Universal: Base64 Data URL (funciona em qualquer ambiente serverless sem depender do disco)
    const mimeType = fileObj.type || "image/jpeg";
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ url: dataUrl, success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}
