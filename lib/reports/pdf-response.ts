import { NextResponse } from "next/server";

/** Resposta padrão dos 8 Route Handlers de PDF — mesmo formato de `/api/me/export`. */
export function pdfResponse(pdf: Buffer, filenameStub: string): NextResponse {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filenameStub}-prospecta-${dateStamp}.pdf"`,
    },
  });
}
