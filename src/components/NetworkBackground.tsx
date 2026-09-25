import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

interface Packet {
  sourceIndex: number;
  targetIndex: number;
  progress: number;
  speed: number;
  color: string;
}

export const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates
    const mouse = { x: -1000, y: -1000, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Create network nodes (scaled conservatively to maintain 60 FPS on any hardware)
    const nodeCount = Math.min(Math.floor((width * height) / 28000), 50);
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1.2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Network packets travelling between nodes
    const packets: Packet[] = [];
    const maxPackets = 12;
    const packetColors = ['#10b981', '#06b6d4', '#38bdf8', '#34d399'];

    const spawnPacket = (fromIdx: number, toIdx: number) => {
      if (packets.length >= maxPackets) return;
      packets.push({
        sourceIndex: fromIdx,
        targetIndex: toIdx,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: packetColors[Math.floor(Math.random() * packetColors.length)],
      });
    };

    let lastTime = performance.now();
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        loop(lastTime);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const maxDistance = 145;
    const maxDistanceSq = maxDistance * maxDistance;

    const loop = (currentTime: number) => {
      if (!isVisible) return;
      animationFrameId = requestAnimationFrame(loop);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;
        node.pulsePhase += dt * 1.5;

        // Bounce on borders with padding
        if (node.x < 10) {
          node.x = 10;
          node.vx *= -1;
        } else if (node.x > width - 10) {
          node.x = width - 10;
          node.vx *= -1;
        }
        if (node.y < 10) {
          node.y = 10;
          node.vy *= -1;
        } else if (node.y > height - 10) {
          node.y = height - 10;
          node.vy *= -1;
        }

        // Slight mouse repulsion/interaction (using squared distance before Math.sqrt)
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 14400 && distSq > 0) { // 120^2 = 14400
            const dist = Math.sqrt(distSq);
            const force = (120 - dist) / 120;
            node.x += (dx / dist) * force * 0.8;
            node.y += (dy / dist) * force * 0.8;
          }
        }
      }

      // Draw connection edges (batched by alpha bucket to avoid per-edge stroke() calls and string allocations)
      const alphaBuckets: { n1: Node; n2: Node }[][] = [[], [], [], [], []];
      const bucketAlphas = [0.04, 0.08, 0.12, 0.16, 0.20];

      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistanceSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxDistance) * 0.2;
            const bucketIndex = Math.min(4, Math.floor((alpha / 0.2) * 5));
            alphaBuckets[bucketIndex].push({ n1, n2 });

            // Randomly trigger a packet across active edge
            if (Math.random() < 0.0006 && packets.length < maxPackets) {
              spawnPacket(i, j);
            }
          }
        }
      }

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 0.8;

      for (let b = 0; b < 5; b++) {
        const bucket = alphaBuckets[b];
        if (bucket.length === 0) continue;

        ctx.globalAlpha = bucketAlphas[b];
        ctx.beginPath();
        for (let idx = 0; idx < bucket.length; idx++) {
          const edge = bucket[idx];
          ctx.moveTo(edge.n1.x, edge.n1.y);
          ctx.lineTo(edge.n2.x, edge.n2.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Draw packets
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        const s = nodes[p.sourceIndex];
        const t = nodes[p.targetIndex];

        if (!s || !t) {
          packets.splice(k, 1);
          continue;
        }

        p.progress += p.speed;

        if (p.progress >= 1) {
          packets.splice(k, 1);
          continue;
        }

        const px = s.x + (t.x - s.x) * p.progress;
        const py = s.y + (t.y - s.y) * p.progress;

        // Outer aura circle (fast replacement for shadowBlur)
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.25;
        ctx.fill();

        // Core packet dot
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      // Draw nodes on top
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulse = Math.sin(node.pulsePhase) * 0.35 + 0.65;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${0.45 * pulse})`;
        ctx.fill();

        // Subtle node glow aura
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${0.08 * pulse})`;
        ctx.fill();
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-60 transition-opacity duration-1000"
      style={{ width: '100%', height: '100%', contain: 'strict' }}
    />
  );
};
