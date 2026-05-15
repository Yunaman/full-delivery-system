"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(14px)",
          borderRadius: "16px",
          padding: "12px 14px",
        },
      }}
    />
  );
}

