import { useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────────────────────
   Interactive network field — a living constellation of nodes that drift,
   link to their neighbours, and lean toward the cursor. Pure canvas, no deps.
   Shared by the landing hero and the login branding panel.
   ──────────────────────────────────────────────────────────────────────── */
export function NetworkField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    // Fresh non-null-typed aliases so TS keeps the narrowing inside the
    // nested animation closures below.
    const canvas = canvasEl;
    const ctx = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };

    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    let nodes: Node[] = [];

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(88, Math.floor((w * h) / 15000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      const LINK = 138;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        const dxm = mouse.x - n.x, dym = mouse.y - n.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 170) {
          n.vx += (dxm / dm) * 0.012;
          n.vy += (dym / dm) * 0.012;
        }
        n.vx = Math.max(-0.9, Math.min(0.9, n.vx));
        n.vy = Math.max(-0.9, Math.min(0.9, n.vy));
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const o = (1 - d / LINK) * 0.5;
            ctx.strokeStyle = `rgba(145, 132, 217, ${o})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const near = Math.hypot(mouse.x - n.x, mouse.y - n.y) < 170;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (near ? 0.8 : 0), 0, Math.PI * 2);
        ctx.fillStyle = near ? "rgba(181, 171, 252, 0.95)" : "rgba(181, 171, 252, 0.6)";
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() { mouse.x = -9999; mouse.y = -9999; }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    if (reduce) { ctx.clearRect(0, 0, w, h); step(); cancelAnimationFrame(raf); }
    else raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={`absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
