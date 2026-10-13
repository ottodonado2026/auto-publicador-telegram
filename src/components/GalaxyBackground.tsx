"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  color: string;
}

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Inicializar estrellas celestiales
    const starCount = Math.floor((width * height) / 14000);
    const starColors = isDark
      ? ["#38BDF8", "#818CF8", "#A78BFA", "#F472B6", "#FFFFFF"]
      : ["#0284C7", "#6366F1", "#8B5CF6", "#0D9488", "#475569"];

    const stars: Star[] = Array.from({ length: Math.min(120, Math.max(50, starCount)) }, () => {
      const baseAlpha = Math.random() * (isDark ? 0.75 : 0.35) + 0.2;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (isDark ? 1.8 : 1.3) + 0.5,
        alpha: baseAlpha,
        baseAlpha,
        twinkleSpeed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      };
    });

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dibujar estrellas y nebulosas
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > star.baseAlpha + 0.3 || star.alpha < star.baseAlpha - 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, star.alpha));
        ctx.shadowBlur = isDark ? 6 : 2;
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Nebulosas cósmicas de fondo con glow espacial */}
      <div
        className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[130px] opacity-25 transition-all duration-1000 ${
          isDark ? "bg-[#229ED9]" : "bg-sky-400/40"
        }`}
      />
      <div
        className={`absolute top-1/3 -right-36 w-[650px] h-[650px] rounded-full blur-[150px] opacity-20 transition-all duration-1000 ${
          isDark ? "bg-purple-600" : "bg-purple-400/30"
        }`}
      />
      <div
        className={`absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full blur-[160px] opacity-20 transition-all duration-1000 ${
          isDark ? "bg-emerald-600" : "bg-teal-400/30"
        }`}
      />

      {/* Canvas de estrellas y partículas flotantes */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
