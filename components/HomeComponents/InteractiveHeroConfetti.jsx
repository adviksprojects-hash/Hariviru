"use client";

import { useEffect, useRef, useState } from "react";

export default function InteractiveHeroConfetti({ children }) {
  const canvasRef = useRef(null);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    const particles = [];
    const ribbons = [];

    const colors = [
      "#f43f5e", // Rose
      "#fbbf24", // Amber
      "#38bdf8", // Sky Blue
      "#a855f7", // Purple
      "#10b981", // Emerald
      "#ec4899", // Pink
    ];

    // Particle constructor for Confetti Squares
    function createSquareParticle(x, y, burst = false) {
      const angle = burst ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 1.5 - Math.PI / 2;
      const speed = burst ? Math.random() * 8 + 3 : Math.random() * 4 + 1.5;
      
      return {
        x: x || Math.random() * width,
        y: y || Math.random() * height,
        size: Math.random() * 8 + 6, // Square side length
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: burst ? Math.sin(angle) * speed : -Math.random() * 3 - 1,
        gravity: 0.12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        decay: Math.random() * 0.015 + 0.008,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
      };
    }

    // Ribbon constructor for Coiling Streamers
    function createRibbonStreamer(x, y) {
      return {
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        length: Math.random() * 40 + 30,
        phase: Math.random() * Math.PI * 2,
        frequency: Math.random() * 0.08 + 0.04,
        amplitude: Math.random() * 15 + 10,
        vy: -Math.random() * 2 - 1,
        vx: (Math.random() - 0.5) * 2,
        opacity: 1,
        decay: 0.01,
        width: Math.random() * 3 + 2,
      };
    }

    // Ambient floating squares
    for (let i = 0; i < 25; i++) {
      particles.push(createSquareParticle());
    }

    // Mouse & Touch interaction
    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Spawn confetti squares at cursor
      for (let i = 0; i < 3; i++) {
        particles.push(createSquareParticle(x, y));
      }

      // Spawn wavy ribbon
      if (Math.random() > 0.4) {
        ribbons.push(createRibbonStreamer(x, y));
      }
    };

    const handlePointerClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setClickCount((c) => c + 1);

      // Party popper burst of 35 squares & ribbons
      for (let i = 0; i < 35; i++) {
        particles.push(createSquareParticle(x, y, true));
      }
      for (let i = 0; i < 8; i++) {
        ribbons.push(createRibbonStreamer(x, y));
      }
    };

    const parent = canvas.parentElement;
    parent.addEventListener("mousemove", handlePointerMove);
    parent.addEventListener("touchmove", handlePointerMove);
    parent.addEventListener("click", handlePointerClick);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update Confetti Squares
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx + Math.sin(p.wobble) * 0.8;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.wobble += p.wobbleSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > height + 20) {
          particles.splice(i, 1);
          // Maintain ambient count
          if (particles.length < 20) {
            particles.push(createSquareParticle(Math.random() * width, height + 10));
          }
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        // Draw crisp confetti square
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      // Render & update Coiling Wavy Ribbons / Streamers
      for (let i = ribbons.length - 1; i >= 0; i--) {
        const r = ribbons[i];
        r.y += r.vy;
        r.x += r.vx;
        r.phase += 0.1;
        r.opacity -= r.decay;

        if (r.opacity <= 0 || r.y < -50) {
          ribbons.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, r.opacity);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.width;
        ctx.lineCap = "round";

        ctx.beginPath();
        for (let j = 0; j < r.length; j += 4) {
          const waveX = r.x + Math.sin(r.phase + j * r.frequency) * r.amplitude;
          const waveY = r.y + j;
          if (j === 0) ctx.moveTo(waveX, waveY);
          else ctx.lineTo(waveX, waveY);
        }
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (parent) {
        parent.removeEventListener("mousemove", handlePointerMove);
        parent.removeEventListener("touchmove", handlePointerMove);
        parent.removeEventListener("click", handlePointerClick);
      }
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* Interactive Party Popper Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none w-full h-full"
      />

      {/* Interactive Helper Floating Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 shadow-md">
        <span>🎉 Tap screen or move cursor to shoot confetti!</span>
        {clickCount > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black">{clickCount} Pops!</span>}
      </div>

      {/* Children content rendered on top of canvas */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
