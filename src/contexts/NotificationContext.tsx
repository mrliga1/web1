"use client";

import { createContext, useContext } from "react";

export type ShowNotification = (message: string, type: "success" | "error") => void;

export const NotificationContext = createContext<ShowNotification | null>(null);

export function useNotification(): ShowNotification {
  const showNotification = useContext(NotificationContext);
  if (!showNotification) {
    throw new Error("Thiếu bộ cung cấp thông báo giao diện.");
  }
  return showNotification;
}
