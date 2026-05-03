import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #6d57e8 0%, #8b6ef5 100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          padding: "6px 6px 5px",
        }}
      >
        <div style={{ width: 5, height: 10, background: "rgba(255,255,255,0.55)", borderRadius: 2 }} />
        <div style={{ width: 5, height: 16, background: "white", borderRadius: 2 }} />
        <div style={{ width: 5, height: 8, background: "rgba(255,255,255,0.55)", borderRadius: 2 }} />
        <div style={{ width: 5, height: 13, background: "white", borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}
