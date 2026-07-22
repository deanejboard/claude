/* ============================================================
   5.5 Capability grid — one interactive tile (scrubbable,
   always-updating sparkline) + one ambient tile (particle
   field). Everything else stays still by design.
   ============================================================ */

import { revealOnScroll, gateAmbient, clamp, gateVideoAutoplay } from './utils.js';

export default function initGrid(root, ctx) {
  revealOnScroll(root, ctx);
  initSparkline(root, ctx);
  initField(root, ctx);
  gateVideoAutoplay(root.querySelector('.tile-video-media'), ctx);
}

/* ---------- Interactive: rolling-forecast sparkline ---------- */

function initSparkline(root, ctx) {
  const wrap = root.querySelector('.spark-wrap');
  const svg = root.querySelector('.sparkline');
  const valueEl = root.querySelector('.spark-value');
  if (!wrap || !svg) return;

  const W = 460;
  const H = 110;
  const N = 40;
  const data = [];
  let v = 46;
  for (let i = 0; i < N; i++) {
    v = clamp(v + (Math.random() - 0.44) * 4, 30, 72);
    data.push(v);
  }

  const ns = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns, 'path');
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'var(--teal-500)');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-linecap', 'round');
  const area = document.createElementNS(ns, 'path');
  area.setAttribute('fill', 'rgba(12, 153, 149, 0.12)');
  const playhead = document.createElementNS(ns, 'line');
  playhead.setAttribute('stroke', 'var(--violet-500)');
  playhead.setAttribute('stroke-width', '1.5');
  playhead.setAttribute('stroke-dasharray', '3 4');
  playhead.setAttribute('y1', '8');
  playhead.setAttribute('y2', H - 8);
  playhead.setAttribute('opacity', '0');
  const dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('r', '4');
  dot.setAttribute('fill', 'var(--white)');
  dot.setAttribute('stroke', 'var(--violet-500)');
  dot.setAttribute('stroke-width', '2');
  dot.setAttribute('opacity', '0');
  svg.append(area, line, playhead, dot);

  const px = (i) => (i / (N - 1)) * W;
  const py = (val) => H - 12 - ((val - 25) / 55) * (H - 24);

  const render = () => {
    const d = data.map((val, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(val).toFixed(1)}`).join(' ');
    line.setAttribute('d', d);
    area.setAttribute('d', `${d} L${W},${H} L0,${H} Z`);
  };
  render();

  let scrubIdx = null;

  const readout = (i) => {
    valueEl.textContent = `€${(38 + data[i] * 0.42).toFixed(1)}M`;
    const x = px(i);
    playhead.setAttribute('x1', x);
    playhead.setAttribute('x2', x);
    playhead.setAttribute('opacity', '1');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', py(data[i]));
    dot.setAttribute('opacity', '1');
  };
  readout(N - 1);
  playhead.setAttribute('opacity', '0');
  dot.setAttribute('opacity', '0');

  // Scrub with pointer…
  wrap.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    scrubIdx = clamp(Math.round(((e.clientX - r.left) / r.width) * (N - 1)), 0, N - 1);
    readout(scrubIdx);
  });
  wrap.addEventListener('pointerleave', () => {
    scrubIdx = null;
    playhead.setAttribute('opacity', '0');
    dot.setAttribute('opacity', '0');
    readout(N - 1);
    playhead.setAttribute('opacity', '0');
    dot.setAttribute('opacity', '0');
  });

  // …or with arrow keys (the wrap is focusable).
  wrap.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    scrubIdx = clamp((scrubIdx ?? N - 1) + (e.key === 'ArrowRight' ? 1 : -1), 0, N - 1);
    readout(scrubIdx);
  });

  // "Always updating": a new point lands every few seconds while
  // on screen (skipped under reduced motion — it's ambient-adjacent).
  if (!ctx.reduced) {
    let timer = null;
    gateAmbient(wrap, (visible) => {
      if (visible && !timer) {
        timer = setInterval(() => {
          data.push(clamp(data[N - 1] + (Math.random() - 0.44) * 4, 30, 72));
          data.shift();
          render();
          if (scrubIdx === null) readout(N - 1);
          if (scrubIdx === null) {
            playhead.setAttribute('opacity', '0');
            dot.setAttribute('opacity', '0');
          }
        }, 2400);
      } else if (!visible && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
  }
}

/* ---------- Ambient: soft particle field in one tile ---------- */

function initField(root, ctx) {
  const tile = root.querySelector('.tile-ambient');
  const canvas = root.querySelector('.tile-field');
  if (!tile || !canvas || ctx.reduced) return;

  const c = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let raf = null;
  let visible = false;
  let t = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = tile.offsetWidth;
    h = tile.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const dots = Array.from({ length: 26 }, (_, i) => ({
    seedX: Math.random(),
    seedY: Math.random(),
    r: 1.2 + Math.random() * 2,
    speed: 0.2 + Math.random() * 0.5,
    phase: i * 1.7,
  }));

  const tick = () => {
    if (!visible || document.hidden) {
      raf = null;
      return;
    }
    t += 0.004;
    c.clearRect(0, 0, w, h);
    for (const d of dots) {
      const x = (d.seedX + Math.sin(t * d.speed + d.phase) * 0.04) * w;
      const y = (d.seedY + Math.cos(t * d.speed * 0.8 + d.phase) * 0.05) * h;
      c.beginPath();
      c.arc(x, y, d.r, 0, Math.PI * 2);
      c.fillStyle = 'rgba(50, 190, 240, 0.16)';
      c.fill();
    }
    raf = requestAnimationFrame(tick);
  };

  gateAmbient(tile, (isVisible) => {
    visible = isVisible;
    if (visible && !raf) {
      resize();
      raf = requestAnimationFrame(tick);
    }
  });
  window.addEventListener('resize', resize);
}
