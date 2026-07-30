import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          color: "#f59e0b",
          fontSize: 246,
          fontWeight: 700,
          fontFamily: "monospace",
        }}
      >
        R$
      </div>
    ),
    { width: 512, height: 512 },
  );
}
