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
          fontSize: 92,
          fontWeight: 700,
          fontFamily: "monospace",
        }}
      >
        R$
      </div>
    ),
    { width: 192, height: 192 },
  );
}
