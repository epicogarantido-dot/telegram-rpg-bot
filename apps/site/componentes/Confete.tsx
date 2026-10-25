"use client";

import { useEffect } from "react";

/** Chuva de confete de boas-vindas (respeita quem desliga animações no sistema). */
export function Confete() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("canvas-confetti").then(({ default: confetti }) => {
      const cores = ["#1d6b4e", "#6fcf9f", "#e0a43a", "#f6d38b", "#ffffff"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 }, colors: cores });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors: cores }), 250);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors: cores }), 400);
    });
  }, []);
  return null;
}
