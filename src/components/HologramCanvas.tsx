import React, { useEffect, useRef, useState } from 'react';
import { VisualizerConfig } from '../types/music';
import { synthEngine } from '../audio/synthEngine';
import { Maximize2, Minimize2, Sparkles, Eye, RotateCw, Waves } from 'lucide-react';

interface HologramCanvasProps {
  config: VisualizerConfig;
  onUpdateConfig: (newConfig: Partial<VisualizerConfig>) => void;
  isPlaying: boolean;
  trackTitle: string;
}

interface Shard3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  size: number;
  shape: 'octahedron' | 'tetrahedron' | 'diamond' | 'prism';
  hueOffset: number;
  phase: number;
}

interface ParticlePoint {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export const HologramCanvas: React.FC<HologramCanvasProps> = ({
  config,
  onUpdateConfig,
  isPlaying,
  trackTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // 3D shards collection
  const shardsRef = useRef<Shard3D[]>([]);
  const particlesRef = useRef<ParticlePoint[]>([]);

  // Initialize shards once
  useEffect(() => {
    const shards: Shard3D[] = [];
    const shardCount = 28;
    const shapes: ('octahedron' | 'tetrahedron' | 'diamond' | 'prism')[] = [
      'octahedron',
      'tetrahedron',
      'diamond',
      'prism',
    ];

    for (let i = 0; i < shardCount; i++) {
      shards.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 400,
        z: Math.random() * 500 - 150,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.2,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        vRotX: (Math.random() - 0.5) * 0.02,
        vRotY: (Math.random() - 0.5) * 0.025,
        vRotZ: (Math.random() - 0.5) * 0.015,
        size: 16 + Math.random() * 28,
        shape: shapes[i % shapes.length],
        hueOffset: (i * 12) % 40 - 20, // variations around cyan/azure (185-225)
        phase: Math.random() * Math.PI * 2,
      });
    }
    shardsRef.current = shards;

    // Particles
    const particles: ParticlePoint[] = [];
    for (let i = 0; i < 140; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 900,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 400 - 100,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.3, // slow upward float
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
        baseAlpha: 0.2 + Math.random() * 0.6,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Track mouse coordinates for holographic tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos(prev => ({
      ...prev,
      targetX: nx,
      targetY: ny,
    }));
  };

  const handleMouseLeave = () => {
    setMousePos(prev => ({
      ...prev,
      targetX: 0,
      targetY: 0,
    }));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Smooth resize handler
    const updateSize = () => {
      if (!canvas || !containerRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // 3D Point Projection Helper
    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      fov: number
    ): { px: number; py: number; scale: number; visible: boolean } => {
      const distance = fov + z;
      if (distance <= 10) return { px: 0, py: 0, scale: 0, visible: false };
      const scale = fov / distance;
      return {
        px: cx + x * scale,
        py: cy + y * scale,
        scale,
        visible: true,
      };
    };

    // 3D Rotation Matrix
    const rotate3D = (
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
      rz: number
    ) => {
      // Rotate around X
      let y1 = y * Math.cos(rx) - z * Math.sin(rx);
      let z1 = y * Math.sin(rx) + z * Math.cos(rx);
      let x1 = x;

      // Rotate around Y
      let x2 = x1 * Math.cos(ry) + z1 * Math.sin(ry);
      let z2 = -x1 * Math.sin(ry) + z1 * Math.cos(ry);
      let y2 = y1;

      // Rotate around Z
      let x3 = x2 * Math.cos(rz) - y2 * Math.sin(rz);
      let y3 = x2 * Math.sin(rz) + y2 * Math.cos(rz);
      let z3 = z2;

      return { x: x3, y: y3, z: z3 };
    };

    const render = () => {
      animId = requestAnimationFrame(render);
      time += 0.016 * config.floatSpeed;

      // Interpolate mouse tilt for smooth holographic parallax
      mousePos.x += (mousePos.targetX - mousePos.x) * 0.08;
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.08;

      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || 800;
      const height = rect?.height || 500;
      const cx = width / 2;
      const cy = height / 2;
      const fov = 420;

      // Audio analysis data
      const analysis = synthEngine.getAnalysisData();
      const bass = analysis.bassLevel * config.sensitivity;
      const mid = analysis.midLevel * config.sensitivity;
      const treble = analysis.trebleLevel * config.sensitivity;
      const freqData = analysis.frequencyData;
      const timeData = analysis.timeDomainData;

      // Clear with soft gradient dark blue canvas
      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric background glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.7);
      const innerAlpha = 0.15 + bass * 0.25;
      bgGrad.addColorStop(0, `rgba(6, 182, 212, ${innerAlpha})`);
      bgGrad.addColorStop(0.35, `rgba(14, 30, 70, 0.25)`);
      bgGrad.addColorStop(0.8, `rgba(4, 9, 24, 0.4)`);
      bgGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Global Parallax Rotation
      const globalRotX = mousePos.y * 0.65;
      const globalRotY = mousePos.x * 0.75;

      // Draw Mode Specific Hologram
      if (config.mode === 'shards') {
        renderShards(ctx, cx, cy, fov, time, bass, mid, treble, globalRotX, globalRotY);
      } else if (config.mode === 'orbital') {
        renderOrbital(ctx, cx, cy, fov, time, bass, mid, freqData, globalRotX, globalRotY);
      } else if (config.mode === 'cybermesh') {
        renderCyberMesh(ctx, cx, cy, fov, time, bass, mid, timeData, globalRotX, globalRotY);
      } else {
        renderParticles(ctx, cx, cy, fov, time, bass, treble, globalRotX, globalRotY);
      }

      // Floating holographic stardust motes (always ambient)
      renderAmbientMotes(ctx, cx, cy, fov, time, treble, width, height);

      // Holographic Center Core / Horizon
      renderHolographicCore(ctx, cx, cy, bass, mid, time);

      // Hologram HUD Projector Ring at base
      renderProjectorBase(ctx, cx, cy, height, time, bass);
    };

    // 1. Shards Mode (Floating 3D Polyhedrons with holographic neon edges)
    const renderShards = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      fov: number,
      time: number,
      bass: number,
      mid: number,
      treble: number,
      gRotX: number,
      gRotY: number
    ) => {
      const shards = shardsRef.current;

      // Sort shards by projected Z for correct depth ordering
      const transformedShards = shards.map((shard, index) => {
        // Individual zero-gravity floating oscillation
        const floatY = Math.sin(time * 1.8 + shard.phase) * 18;
        const floatX = Math.cos(time * 1.2 + shard.phase * 0.7) * 12;

        let px = shard.x + floatX;
        let py = shard.y + floatY;
        let pz = shard.z + Math.sin(time * 0.8 + index) * 15;

        // Apply global parallax
        const r1 = rotate3D(px, py, pz, gRotX, gRotY, 0);

        // Individual rotation
        shard.rotX += shard.vRotX * (1 + mid * 1.5);
        shard.rotY += shard.vRotY * (1 + treble * 1.5);
        shard.rotZ += shard.vRotZ;

        return {
          shard,
          pos: r1,
          index,
        };
      });

      transformedShards.sort((a, b) => b.pos.z - a.pos.z);

      transformedShards.forEach(({ shard, pos }) => {
        const proj = project(pos.x, pos.y, pos.z, cx, cy, fov);
        if (!proj.visible) return;

        const effectiveSize = shard.size * proj.scale * (1 + bass * 0.4);
        const alpha = Math.min(1, Math.max(0.15, (proj.scale * 1.4)));
        const hue = 195 + shard.hueOffset; // Cyan to Deep Azure

        ctx.save();
        ctx.translate(proj.px, proj.py);

        // Draw 3D Polyhedron wireframe based on shape
        if (shard.shape === 'octahedron') {
          drawOctahedron(ctx, effectiveSize, shard.rotX, shard.rotY, shard.rotZ, hue, alpha, config.glowIntensity);
        } else if (shard.shape === 'diamond') {
          drawDiamond(ctx, effectiveSize, shard.rotX, shard.rotY, shard.rotZ, hue, alpha, config.glowIntensity);
        } else {
          drawTetrahedron(ctx, effectiveSize, shard.rotX, shard.rotY, shard.rotZ, hue, alpha, config.glowIntensity);
        }

        ctx.restore();
      });
    };

    // Polyhedron Renderers
    const drawOctahedron = (
      ctx: CanvasRenderingContext2D,
      size: number,
      rx: number,
      ry: number,
      rz: number,
      hue: number,
      alpha: number,
      glow: number
    ) => {
      const vertices = [
        { x: 0, y: -size * 1.2, z: 0 },
        { x: size, y: 0, z: 0 },
        { x: 0, y: 0, z: size },
        { x: -size, y: 0, z: 0 },
        { x: 0, y: 0, z: -size },
        { x: 0, y: size * 1.2, z: 0 },
      ];

      const rotated = vertices.map(v => rotate3D(v.x, v.y, v.z, rx, ry, rz));
      const edges = [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [5, 1], [5, 2], [5, 3], [5, 4],
        [1, 2], [2, 3], [3, 4], [4, 1],
      ];

      // Holographic glow
      ctx.shadowBlur = 12 * glow;
      ctx.shadowColor = `hsla(${hue}, 100%, 65%, ${alpha * 0.9})`;

      // Facet translucent fills
      ctx.beginPath();
      ctx.moveTo(rotated[0].x, rotated[0].y);
      ctx.lineTo(rotated[1].x, rotated[1].y);
      ctx.lineTo(rotated[2].x, rotated[2].y);
      ctx.closePath();
      ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${alpha * 0.12})`;
      ctx.fill();

      // Glowing Wireframe
      ctx.strokeStyle = `hsla(${hue}, 100%, 75%, ${alpha * 0.95})`;
      ctx.lineWidth = 1.4;

      edges.forEach(([i1, i2]) => {
        ctx.beginPath();
        ctx.moveTo(rotated[i1].x, rotated[i1].y);
        ctx.lineTo(rotated[i2].x, rotated[i2].y);
        ctx.stroke();
      });

      // Vertices sparks
      rotated.forEach(v => {
        ctx.fillStyle = `hsla(${hue + 20}, 100%, 90%, ${alpha})`;
        ctx.fillRect(v.x - 1.2, v.y - 1.2, 2.4, 2.4);
      });
    };

    const drawDiamond = (
      ctx: CanvasRenderingContext2D,
      size: number,
      rx: number,
      ry: number,
      rz: number,
      hue: number,
      alpha: number,
      glow: number
    ) => {
      const topH = size * 0.6;
      const botH = size * 1.3;
      const w = size * 0.85;

      const vertices = [
        { x: 0, y: -topH, z: 0 },
        { x: w, y: 0, z: 0 },
        { x: 0, y: 0, z: w },
        { x: -w, y: 0, z: 0 },
        { x: 0, y: 0, z: -w },
        { x: 0, y: botH, z: 0 },
      ];

      const rotated = vertices.map(v => rotate3D(v.x, v.y, v.z, rx, ry, rz));
      const edges = [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [5, 1], [5, 2], [5, 3], [5, 4],
        [1, 2], [2, 3], [3, 4], [4, 1],
      ];

      ctx.shadowBlur = 10 * glow;
      ctx.shadowColor = `hsla(${hue}, 100%, 65%, ${alpha * 0.8})`;

      ctx.strokeStyle = `hsla(${hue}, 95%, 70%, ${alpha * 0.9})`;
      ctx.lineWidth = 1.2;

      edges.forEach(([i1, i2]) => {
        ctx.beginPath();
        ctx.moveTo(rotated[i1].x, rotated[i1].y);
        ctx.lineTo(rotated[i2].x, rotated[i2].y);
        ctx.stroke();
      });
    };

    const drawTetrahedron = (
      ctx: CanvasRenderingContext2D,
      size: number,
      rx: number,
      ry: number,
      rz: number,
      hue: number,
      alpha: number,
      glow: number
    ) => {
      const s = size * 1.1;
      const vertices = [
        { x: s, y: s, z: s },
        { x: -s, y: -s, z: s },
        { x: -s, y: s, z: -s },
        { x: s, y: -s, z: -s },
      ];

      const rotated = vertices.map(v => rotate3D(v.x, v.y, v.z, rx, ry, rz));
      const edges = [
        [0, 1], [0, 2], [0, 3],
        [1, 2], [1, 3], [2, 3],
      ];

      ctx.shadowBlur = 8 * glow;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha * 0.8})`;
      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.85})`;
      ctx.lineWidth = 1.2;

      edges.forEach(([i1, i2]) => {
        ctx.beginPath();
        ctx.moveTo(rotated[i1].x, rotated[i1].y);
        ctx.lineTo(rotated[i2].x, rotated[i2].y);
        ctx.stroke();
      });
    };

    // 2. Orbital Mode (Circular Hologram Concentric Rings)
    const renderOrbital = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      fov: number,
      time: number,
      bass: number,
      mid: number,
      freqData: Uint8Array,
      gRotX: number,
      gRotY: number
    ) => {
      const rings = [
        { radius: 110, count: 64, rotSpeed: 0.8, tilt: 0.2 },
        { radius: 170, count: 96, rotSpeed: -0.6, tilt: -0.3 },
        { radius: 240, count: 128, rotSpeed: 0.4, tilt: 0.15 },
      ];

      rings.forEach((ring, rIdx) => {
        const ringPoints: { x: number; y: number; z: number }[] = [];
        const ringTime = time * ring.rotSpeed;

        for (let i = 0; i < ring.count; i++) {
          const angle = (i / ring.count) * Math.PI * 2 + ringTime;
          const freqVal = freqData[(i * 2 + rIdx * 10) % freqData.length] / 255;
          const r = ring.radius * (1 + bass * 0.25) + freqVal * 32 * config.sensitivity;

          const rawX = Math.cos(angle) * r;
          const rawY = Math.sin(angle) * r * (0.65 + ring.tilt);
          const rawZ = Math.sin(angle + time) * 35;

          const rot = rotate3D(rawX, rawY, rawZ, gRotX, gRotY, 0);
          ringPoints.push(rot);
        }

        // Draw ring path
        ctx.beginPath();
        for (let i = 0; i <= ring.count; i++) {
          const pt = ringPoints[i % ring.count];
          const proj = project(pt.x, pt.y, pt.z, cx, cy, fov);
          if (i === 0) ctx.moveTo(proj.px, proj.py);
          else ctx.lineTo(proj.px, proj.py);
        }
        ctx.closePath();

        ctx.shadowBlur = 12 * config.glowIntensity;
        ctx.shadowColor = rIdx === 0 ? 'rgba(34, 211, 238, 0.8)' : 'rgba(59, 130, 246, 0.7)';
        ctx.strokeStyle = rIdx === 0 ? 'rgba(103, 232, 249, 0.9)' : 'rgba(96, 165, 250, 0.75)';
        ctx.lineWidth = rIdx === 0 ? 1.8 : 1.2;
        ctx.stroke();

        // Pulsing nodes along the ring
        if (rIdx === 0) {
          ringPoints.forEach((pt, i) => {
            if (i % 8 === 0) {
              const proj = project(pt.x, pt.y, pt.z, cx, cy, fov);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(proj.px - 2, proj.py - 2, 4, 4);
            }
          });
        }
      });
    };

    // 3. Cybermesh Mode (3D Undulating Grid Surface)
    const renderCyberMesh = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      fov: number,
      time: number,
      bass: number,
      mid: number,
      timeData: Uint8Array,
      gRotX: number,
      gRotY: number
    ) => {
      const cols = 22;
      const rows = 14;
      const gridW = 750;
      const gridH = 480;

      const gridPoints: { px: number; py: number; alpha: number }[][] = [];

      for (let r = 0; r < rows; r++) {
        const rowPts: { px: number; py: number; alpha: number }[] = [];
        for (let c = 0; c < cols; c++) {
          const gx = (c / (cols - 1) - 0.5) * gridW;
          const gz = (r / (rows - 1) - 0.5) * gridH;

          // Undulating wave height
          const wave1 = Math.sin(c * 0.45 + time * 2.5) * 22;
          const wave2 = Math.cos(r * 0.55 + time * 1.8) * 18;
          const timeOffset = (timeData[(c + r * 3) % timeData.length] - 128) * 0.45;
          const gy = wave1 + wave2 + timeOffset + bass * 24;

          const rot = rotate3D(gx, gy + 80, gz, gRotX + 0.35, gRotY, 0);
          const proj = project(rot.x, rot.y, rot.z, cx, cy, fov);

          rowPts.push({
            px: proj.px,
            py: proj.py,
            alpha: proj.scale * (0.3 + (r / rows) * 0.7),
          });
        }
        gridPoints.push(rowPts);
      }

      ctx.shadowBlur = 8 * config.glowIntensity;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.7)';

      // Draw horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const pt = gridPoints[r][c];
          if (c === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        const rowAlpha = (r / rows) * 0.85;
        ctx.strokeStyle = `rgba(34, 211, 238, ${rowAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const pt = gridPoints[r][c];
          if (r === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.strokeStyle = `rgba(59, 130, 246, 0.4)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    };

    // 4. Particles Mode (Floating Cyber Nebula Cloud)
    const renderParticles = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      fov: number,
      time: number,
      bass: number,
      treble: number,
      gRotX: number,
      gRotY: number
    ) => {
      const particles = particlesRef.current;

      particles.forEach((p, idx) => {
        p.y += p.vy * (1 + bass * 1.5);
        if (p.y < -300) p.y = 300;

        const rx = p.x + Math.sin(time + idx) * 15;
        const ry = p.y;
        const rz = p.z;

        const rot = rotate3D(rx, ry, rz, gRotX, gRotY, 0);
        const proj = project(rot.x, rot.y, rot.z, cx, cy, fov);
        if (!proj.visible) return;

        const pSize = p.size * proj.scale * (1 + treble * 0.8);
        const pAlpha = p.alpha * proj.scale;

        ctx.shadowBlur = 10 * config.glowIntensity;
        ctx.shadowColor = idx % 2 === 0 ? 'rgba(34, 211, 238, 0.9)' : 'rgba(147, 197, 253, 0.8)';
        ctx.fillStyle = idx % 2 === 0 ? `rgba(103, 232, 249, ${pAlpha})` : `rgba(191, 219, 254, ${pAlpha})`;

        ctx.beginPath();
        ctx.arc(proj.px, proj.py, Math.max(1, pSize), 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with subtle laser lines
        for (let j = idx + 1; j < Math.min(idx + 6, particles.length); j++) {
          const p2 = particles[j];
          const distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2 + (p.z - p2.z) ** 2;
          if (distSq < 11000) {
            const rot2 = rotate3D(p2.x, p2.y, p2.z, gRotX, gRotY, 0);
            const proj2 = project(rot2.x, rot2.y, rot2.z, cx, cy, fov);
            if (proj2.visible) {
              ctx.strokeStyle = `rgba(6, 182, 212, ${(1 - distSq / 11000) * 0.25 * proj.scale})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(proj.px, proj.py);
              ctx.lineTo(proj2.px, proj2.py);
              ctx.stroke();
            }
          }
        }
      });
    };

    // Ambient Star Motes
    const renderAmbientMotes = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      fov: number,
      time: number,
      treble: number,
      w: number,
      h: number
    ) => {
      ctx.shadowBlur = 0;
      for (let i = 0; i < 35; i++) {
        const mx = (Math.sin(i * 99 + time * 0.3) * 0.45 + 0.5) * w;
        const my = (Math.cos(i * 33 + time * 0.25) * 0.45 + 0.5) * h;
        const size = (Math.sin(time * 3 + i) * 0.5 + 0.5) * 2 + 0.8;
        const alpha = (0.2 + (Math.sin(time * 2 + i) * 0.25 + 0.25)) * (1 + treble * 0.5);

        ctx.fillStyle = `rgba(165, 243, 252, ${alpha})`;
        ctx.fillRect(mx, my, size, size);
      }
    };

    // Holographic Core Emitter (Center Pulse)
    const renderHolographicCore = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      bass: number,
      mid: number,
      time: number
    ) => {
      const coreR = 24 + bass * 38;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR * 2.5);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.2, 'rgba(34, 211, 238, 0.8)');
      grad.addColorStop(0.6, 'rgba(14, 116, 144, 0.35)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Rotating inner holographic reticle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.4);

      ctx.strokeStyle = 'rgba(103, 232, 249, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-18, -18, 36, 36);

      ctx.rotate(-time * 0.8);
      ctx.strokeRect(-26, -26, 52, 52);

      ctx.restore();
    };

    // Hologram Projector Platform at the bottom
    const renderProjectorBase = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      height: number,
      time: number,
      bass: number
    ) => {
      const baseY = height - 28;
      const rx = 190 * (1 + bass * 0.15);
      const ry = 22;

      ctx.save();
      // Base emitter ellipse
      ctx.beginPath();
      ctx.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Inner concentrated ring
      ctx.beginPath();
      ctx.ellipse(cx, baseY, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Light beam cone connecting base to center
      const coneGrad = ctx.createLinearGradient(cx, baseY, cx, cy + 30);
      coneGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
      coneGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = coneGrad;

      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.7, baseY);
      ctx.lineTo(cx, cy + 20);
      ctx.lineTo(cx + rx * 0.7, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateSize);
    };
  }, [config, isPlaying, mousePos.targetX, mousePos.targetY]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-cyan-500/20 backdrop-blur-md transition-all select-none shadow-[0_0_50px_rgba(6,182,212,0.12)] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'h-[440px] md:h-[540px]'
      }`}
    >
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Hologram scanlines overlay */}
      {config.showScanlines && (
        <div className="absolute inset-0 pointer-events-none hologram-scanlines opacity-45 mix-blend-screen" />
      )}

      {/* Subtle edge vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(3,7,18,0.75)_100%)]" />

      {/* Top Left: Holographic State & Title */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-cyan-500/20 text-xs">
        <span className="font-mono text-cyan-400 font-semibold tracking-wider">HOLOGRAM // 3D</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 font-medium truncate max-w-[200px]">{trackTitle}</span>
        <span className="text-slate-600">/</span>
        <span className="text-cyan-300/80 font-mono text-[11px]">
          {isPlaying ? 'PROJECTION ACTIVE' : 'STANDBY'}
        </span>
      </div>

      {/* Top Right: Visualizer Mode Selector & Fullscreen */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/70 backdrop-blur-md p-1 rounded-lg border border-cyan-500/20">
          <button
            onClick={() => onUpdateConfig({ mode: 'shards' })}
            title="Crystalline Shards (ネオン結晶)"
            className={`px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
              config.mode === 'shards'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">結晶</span>
          </button>

          <button
            onClick={() => onUpdateConfig({ mode: 'orbital' })}
            title="Orbital Hologram Rings (円環軌道)"
            className={`px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
              config.mode === 'orbital'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">円環</span>
          </button>

          <button
            onClick={() => onUpdateConfig({ mode: 'cybermesh' })}
            title="Cyber Wave Grid (波動グリッド)"
            className={`px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
              config.mode === 'cybermesh'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">波形</span>
          </button>

          <button
            onClick={() => onUpdateConfig({ mode: 'particles' })}
            title="Particle Constellation (星雲粒子)"
            className={`px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1.5 ${
              config.mode === 'particles'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">粒子</span>
          </button>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg border border-cyan-500/20 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 z-10 hidden sm:flex items-center gap-2 text-[11px] text-slate-400/80 font-mono">
        <span>[MOUSE INTERACTION] カーソル移動で3D視点を回転</span>
      </div>

      {/* Scanline Toggle Quick Pill */}
      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => onUpdateConfig({ showScanlines: !config.showScanlines })}
          className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
            config.showScanlines
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-700/50 hover:text-slate-300'
          }`}
        >
          SCANLINES {config.showScanlines ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};
