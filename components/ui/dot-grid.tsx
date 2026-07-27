/**
 * DotGrid — Interactive canvas-based dot grid background.
 *
 * Renders a grid of dots that react to mouse movement with:
 * - Proximity highlighting (dots near cursor brighten)
 * - Inertia push (mouse speed triggers dot displacement via GSAP)
 * - Click shockwave (radial push on click)
 *
 * Web-only (uses canvas, Path2D, GSAP, ResizeObserver).
 * On native platforms, renders nothing.
 *
 * Adapted from React Bits DotGrid component.
 * https://reactbits.dev/animations/DotGrid
 */
import { useRef, useEffect, useCallback, useMemo } from "react";
import { Platform, View } from "react-native";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useThemeContext } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";

import "./dot-grid.css";

gsap.registerPlugin(InertiaPlugin);

// ─── Helpers ────────────────────────────────────────────────────────────────

function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  }) as unknown as T;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _inertiaApplied: boolean;
}

interface PointerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  lastTime: number;
  lastX: number;
  lastY: number;
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  /** Base color (dark mode). In light mode, a softer version is used. */
  baseColor?: string;
  /** Active/hover color. Defaults to baseColor. */
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DotGrid({
  dotSize = 5,
  gap = 28,
  baseColor: _baseColor,
  activeColor: _activeColor,
  proximity = 120,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className,
}: DotGridProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";

  // Theme-adaptive colors (translucent ambient grid)
  const baseColor = _baseColor ?? (isDark ? "#FFFFFF" : "#0066FF");
  const activeColor = _activeColor ?? (isDark ? "#4D9FFF" : "#0066FF");

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !(window as any).Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = (window as any).devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        dots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // Drawing loop — only on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;
    const baseAlpha = isDark ? 0.08 : 0.10;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let style = `rgba(${baseRgb.r},${baseRgb.g},${baseRgb.b},${baseAlpha})`;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          const a = baseAlpha + (0.45 - baseAlpha) * t;
          style = `rgba(${r},${g},${b},${a})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = style;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath]);

  // Grid building + resize observer — only on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const win = window as any;
    buildGrid();

    if ("ResizeObserver" in win) {
      const ro = new ResizeObserver(buildGrid);
      if (wrapperRef.current) ro.observe(wrapperRef.current);
      return () => ro.disconnect();
    } else {
      win.addEventListener("resize", buildGrid);
      return () => win.removeEventListener("resize", buildGrid);
    }
  }, [buildGrid]);

  // Mouse/touch events — only on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const win = window as any;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = canvasRef.current!.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);
          const pushX = dot.cx - pr.x + vx * 0.005;
          const pushY = dot.cy - pr.y + vy * 0.005;

          gsap.to(dot, {
            inertia: {
              xOffset: pushX,
              yOffset: pushY,
              resistance,
            } as any,
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: "elastic.out(1,0.75)",
              });
              dot._inertiaApplied = false;
            },
          } as any);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * falloff;
          const pushY = (dot.cy - cy) * shockStrength * falloff;

          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance } as any,
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: "elastic.out(1,0.75)",
              });
              dot._inertiaApplied = false;
            },
          } as any);
        }
      }
    };

    const throttledMove = throttle(onMove, 50);
    win.addEventListener("mousemove", throttledMove, { passive: true });
    win.addEventListener("click", onClick);

    return () => {
      win.removeEventListener("mousemove", throttledMove);
      win.removeEventListener("click", onClick);
    };
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength]);

  // Only render on web
  if (Platform.OS !== "web") return null;

  return (
    <View
      className={cn("dot-grid", className, "absolute inset-0")}
      style={{ zIndex: 0 }}
      pointerEvents="box-none"
    >
      <div ref={wrapperRef as any} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </View>
  );
}

export default DotGrid;
