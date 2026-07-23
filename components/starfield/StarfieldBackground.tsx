"use client";

/**
 * StarfieldBackground
 * ---------------------------------------------------------------------------
 * Canvas-based animated starfield rendered as a fixed full-viewport layer
 * beneath all content.  Features:
 *  - Procedurally generated stars with a realistic exponential size dist.
 *  - Per-star twinkle using a sine-wave offset so they never pulse in sync.
 *  - Occasional randomly-coloured stars (gold, teal, purple) among the
 *    dominant white to subtly echo the cosmic brand palette.
 *  - Rare shooting-star events with a gradient trail and head glow.
 *  - Smooth RAF animation loop; canvas is re-sized on window resize.
 *  - Opacity kept intentionally low so it never competes with content.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useRef, useCallback } from "react";

/* ─── Types ──────────────────────────────────────────────────── */

interface Star {
  x: number;
  y: number;
  /** Visual radius in px — exponentially distributed so most stars are tiny */
  size: number;
  /** Resting opacity */
  baseOpacity: number;
  /** How quickly it cycles (radians per ms) */
  twinkleSpeed: number;
  /** Phase offset so stars don't pulse in unison */
  twinklePhase: number;
  /** Index into STAR_COLORS */
  colorIndex: number;
}

interface ShootingStar {
  x: number;
  y: number;
  /** Trail length in px */
  length: number;
  /** px per frame */
  speed: number;
  /** Direction angle in radians (roughly NW→SE) */
  angle: number;
  /** Current opacity (fades in then out) */
  opacity: number;
  active: boolean;
}

/* ─── Constants ──────────────────────────────────────────────── */

/** RGB tuples for star colour variation */
const STAR_COLORS: [number, number, number][] = [
  [248, 250, 252], // star-white  (85 % of stars)
  [212, 175, 119], // cosmic-gold
  [103, 232, 249], // cosmic-teal
  [192, 132, 252], // cosmic-purple
  [167, 139, 250], // soft violet
];

/** One star per this many square-pixels (lower = denser) */
const STAR_DENSITY = 9_000;

/** How long (ms) to wait between shooting-star attempts */
const SHOOTING_STAR_COOLDOWN = 7_000;

/** Max concurrent shooting stars */
const MAX_SHOOTING = 2;

/** Random chance per frame of spawning once cooldown is met */
const SHOOTING_SPAWN_CHANCE = 0.004;

/* ─── Component ──────────────────────────────────────────────── */

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastShootingRef = useRef<number>(0);

  /* ── Star generation ─────────────────────────────────────── */
  const generateStars = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / STAR_DENSITY);

    starsRef.current = Array.from({ length: count }, () => {
      // Exponential size distribution → mostly sub-pixel, a few larger
      const size = Math.random() ** 2.2 * 1.6 + 0.18;

      // 85 % white; rest use brand accent colours
      const colorIndex =
        Math.random() < 0.85
          ? 0
          : 1 + Math.floor(Math.random() * (STAR_COLORS.length - 1));

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size,
        baseOpacity: Math.random() * 0.42 + 0.08,
        twinkleSpeed: Math.random() * 0.0009 + 0.0003,
        twinklePhase: Math.random() * Math.PI * 2,
        colorIndex,
      };
    });
  }, []);

  /* ── Shooting-star spawner ───────────────────────────────── */
  const spawnShootingStar = useCallback((w: number, h: number) => {
    const activeCount = shootingRef.current.filter((s) => s.active).length;
    if (activeCount >= MAX_SHOOTING) return;

    // 15°–40° angle — always travelling rightward and downward
    const angle = (Math.random() * 25 + 15) * (Math.PI / 180);

    shootingRef.current.push({
      x: Math.random() * w * 0.6 + w * 0.05,
      y: Math.random() * h * 0.35,
      length: Math.random() * 90 + 45,
      speed: Math.random() * 7 + 4,
      angle,
      opacity: 0,
      active: true,
    });
  }, []);

  /* ── Main effect ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Set canvas dimensions and (re)generate stars */
    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateStars(canvas.width, canvas.height);
    };

    /* ── Draw loop ─────────────────────────────────────────── */
    const draw = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Static stars */
      for (const star of starsRef.current) {
        const twinkle = Math.sin(
          elapsed * star.twinkleSpeed + star.twinklePhase
        );
        const opacity = Math.max(0.03, star.baseOpacity + twinkle * 0.13);
        const [r, g, b] = STAR_COLORS[star.colorIndex];

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
        ctx.fill();
      }

      /* Possibly spawn a shooting star */
      if (
        elapsed - lastShootingRef.current > SHOOTING_STAR_COOLDOWN &&
        Math.random() < SHOOTING_SPAWN_CHANCE
      ) {
        spawnShootingStar(canvas.width, canvas.height);
        lastShootingRef.current = elapsed;
      }

      /* Draw & advance shooting stars */
      shootingRef.current = shootingRef.current.filter((ss) => {
        if (!ss.active) return false;

        // Advance position
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        // Fade in at start
        if (ss.opacity < 1) ss.opacity = Math.min(1, ss.opacity + 0.07);

        // Deactivate once off-screen
        if (ss.x > canvas.width + 60 || ss.y > canvas.height + 60) {
          ss.active = false;
          return false;
        }

        // Tail gradient: transparent → gold tint → white head
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;
        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(192,132,252,0)`);
        grad.addColorStop(0.65, `rgba(212,175,119,${(ss.opacity * 0.45).toFixed(3)})`);
        grad.addColorStop(1, `rgba(255,255,255,${(ss.opacity * 0.9).toFixed(3)})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Head glow
        const headGlow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 5);
        headGlow.addColorStop(0, `rgba(255,255,255,${ss.opacity.toFixed(3)})`);
        headGlow.addColorStop(1, `rgba(192,132,252,0)`);
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.fill();

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    setup();
    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [generateStars, spawnShootingStar]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.9 }}
      aria-hidden="true"
      role="presentation"
    />
  );
}
