// src/hooks/useAdminTheme.js
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "admin-theme";
const EVENT_NAME = "admin-theme-change";

export function useAdminTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "dark";
  });

  useEffect(() => {
    const onChange = () => {
      setIsDark(localStorage.getItem(STORAGE_KEY) === "dark");
    };
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange); // đồng bộ giữa nhiều tab
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      window.dispatchEvent(new Event(EVENT_NAME));
      return next;
    });
  }, []);

  return { isDark, toggle };
}