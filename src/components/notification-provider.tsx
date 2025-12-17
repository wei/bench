"use client";

import { Toaster } from "sonner";

export function NotificationProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      style={{ zIndex: 2147483647, pointerEvents: "auto" }}
      toastOptions={{
        style: { zIndex: 2147483647 },
        className: "pointer-events-auto",
      }}
    />
  );
}
