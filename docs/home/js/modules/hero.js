/* ============================================================
   5.2 Hero — ambient aurora + particles (Ambient class),
   typing FP&A agent chat + drawing forecast chart (built
   product artifacts), pointer-proximity tilt (Response class).
   ============================================================ */

import { revealOnScroll, gateAmbient, clamp } from './utils.js';

/* One compact, cohesive exchange per agent — written to fit the
   fixed-height thread so the card never changes size. */
const AGENTS = [
  {
    key: 'fpa',
    name: 'FP&A Agent',
    icon: 'assets/icon-fpa.svg',
    hue: '#0c9995',
    status: 'Reviewing Q3 forecast',
    script: [
      { role: 'user', text: 'Why is Q3 revenue tracking 4% under forecast?' },
      {
        role: 'agent',
        text: 'Three drivers: EMEA pipeline slip (−2.1%), FX (−1.2%), and delayed SKU launches (−0.7%). I’ve drafted a revised outlook for your review.',
        metric: { label: 'Q3 outlook', value: '€48.2M', delta: '▼ 4.0%', dir: 'down' },
      },
    ],
    chart: {
      type: 'line',
      title: 'Revenue outlook',
      badge: 'FY26 · monthly',
      unit: '%',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [3.2, 4.1, 3.8, 5.0, 5.6, 6.4, 6.1, 7.3, 8.6, 9.8, 12.4, 13.1],
      focus: 10,
    },
  },
  {
    key: 'controller',
    name: 'Controller Agent',
    icon: 'assets/icon-controller.svg',
    hue: '#253e7d',
    status: 'Preparing month-end close',
    script: [
      { role: 'user', text: 'Are we on track for the month-end close?' },
      {
        role: 'agent',
        text: 'Yes — 39 of 42 entities are submitted, FX rates are loaded, and intercompany is matched to 98.7%. Three entities need journals by Thursday.',
        metric: { label: 'Close readiness', value: '93%', delta: '▲ on track', dir: 'up' },
      },
    ],
    chart: {
      type: 'bars',
      title: 'Entities submitted',
      badge: 'Close · day 3',
      unit: '',
      labels: ['D-4', 'D-3', 'D-2', 'D-1', 'Today'],
      data: [9, 17, 26, 34, 39],
      focus: 4,
    },
  },
  {
    key: 'merch',
    name: 'Merchandiser Agent',
    icon: 'assets/icon-merch.svg',
    hue: '#2487aa',
    status: 'Balancing spring open-to-buy',
    script: [
      { role: 'user', text: 'Which categories are over-bought for spring?' },
      {
        role: 'agent',
        text: 'Outerwear is 18% over plan; knits are 6% under. Rebalancing the buy frees €2.1M of open-to-buy without hurting availability.',
        metric: { label: 'Open-to-buy freed', value: '€2.1M', delta: '▲ available', dir: 'up' },
      },
    ],
    chart: {
      type: 'bars',
      title: 'Buy vs plan by category',
      badge: 'Spring 26',
      unit: '%',
      labels: ['Outerwear', 'Denim', 'Knits', 'Footwear', 'Accessories'],
      data: [18, 6, -6, 3, -2],
      focus: 0,
    },
  },
  {
    key: 'supply',
    name: 'Supply Chain Agent',
    icon: 'assets/icon-supply.svg',
    hue: '#32bef0',
    status: 'Watching EMEA fill rates',
    script: [
      { role: 'user', text: 'Where are we at risk of stockouts next month?' },
      {
        role: 'agent',
        text: '12 SKUs in EMEA fall below safety stock in week 3. Expediting three purchase orders covers 9 of them — I’ve queued the changes for approval.',
        metric: { label: 'Projected fill rate', value: '96.4%', delta: '▲ 0.8pt', dir: 'up' },
      },
    ],
    chart: {
      type: 'line',
      title: 'EMEA fill rate',
      badge: 'Next 12 weeks',
      unit: '%',
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
      data: [97.1, 96.8, 94.2, 95.1, 95.8, 96.2, 96.4, 96.5, 96.4, 96.6, 96.7, 96.8],
      focus: 2,
    },
  },
];

const AGENT_DWELL_MS = 5200; // pause on a finished conversation before rotating

export default function initHero(root, ctx) {
  revealOnScroll(root, ctx, { start: 'top 90%' });

  initShape(root, ctx);
  const chart = initChart(root, ctx);
  const chat = initChat(root, ctx, chart);
  initTilt(root, ctx);

  // The console starts when the cluster scrolls into view, once;
  // it drives both cards (conversation + agent artifact chart).
  const artifact = root.querySelector('.hero-artifact');
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        chat.play();
        io.disconnect();
      }
    },
    { threshold: 0.35 }
  );
  io.observe(artifact);
}

/* ---------- Ambient: the living gradient shape ----------
   The exact Figma "Home Shape" SVG is fetched and inlined so its
   four brand gradients can be animated — a Stripe-hero-like effect
   applied to Board's own shape: gradient endpoints drift slowly,
   so color flows through the form. IO-gated; reduced-motion gets
   the static shape. */

async function initShape(root, ctx) {
  const holder = root.querySelector('.hero-shape');
  if (!holder) return;

  try {
    const res = await fetch('assets/hero-shape.svg?v=2');
    holder.innerHTML = await res.text();
  } catch {
    // fetch failed (e.g. file://) — fall back to a static <img>
    holder.innerHTML = '<img src="assets/hero-shape.svg" alt="" />';
    return;
  }

  const svg = holder.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('preserveAspectRatio', 'none'); // full-bleed stretch
  svg.setAttribute('aria-hidden', 'true');

  if (ctx.reduced || !ctx.gsap) return; // static shape under reduced motion

  // "The flow": color travels through the shape by sweeping each
  // gradient's endpoints along its own axis — clearly alive, never
  // flashing. Different periods keep the field from visibly looping.
  const tweens = [];
  svg.querySelectorAll('linearGradient').forEach((grad, i) => {
    const x1 = parseFloat(grad.getAttribute('x1'));
    const y1 = parseFloat(grad.getAttribute('y1'));
    const x2 = parseFloat(grad.getAttribute('x2'));
    const y2 = parseFloat(grad.getAttribute('y2'));
    const span = Math.hypot(x2 - x1, y2 - y1);
    const drift = span * 0.42;
    tweens.push(
      ctx.gsap.to(grad, {
        attr: {
          x1: x1 + drift * (i % 2 ? 1 : -0.8),
          y1: y1 + drift * 0.55,
          x2: x2 - drift * (i % 2 ? 0.8 : -1),
          y2: y2 - drift * 0.45,
        },
        duration: 9 + i * 3.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        paused: true,
      })
    );
  });

  // The waves themselves swell against each other — a slow tide.
  const paths = svg.querySelectorAll('path');
  paths.forEach((p, i) => {
    tweens.push(
      ctx.gsap.to(p, {
        y: i % 2 ? 16 : -13,
        x: i % 2 ? -11 : 9,
        scale: i % 2 ? 1.012 : 1.008,
        transformOrigin: '50% 50%',
        duration: 8 + i * 2.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        paused: true,
      })
    );
  });

  gateAmbient(root, (visible) => {
    tweens.forEach((t) => (visible && !document.hidden ? t.play() : t.pause()));
  });
}

/* ---------- Product artifact 1: multi-agent console ----------
   One conversation per agent; rotates automatically once a
   conversation finishes (progress fills along the active tab),
   with user agency: clicking a tab switches immediately and
   stops the auto-rotation; hovering the card pauses it. */

function initChat(root, ctx, chart) {
  const cluster = root.querySelector('.hero-artifact');
  const card = root.querySelector('.chat-card');
  const thread = root.querySelector('.chat-thread');
  const replayBtn = root.querySelector('.chat-replay');
  const iconEl = root.querySelector('.agent-icon');
  const titleEl = root.querySelector('.chat-title');
  const statusEl = root.querySelector('.status-text');
  const tabs = [...root.querySelectorAll('.agent-seg')];

  let run = 0;          // cancellation token for in-flight playthroughs
  let current = 0;
  let auto = !ctx.reduced; // reduced motion: manual switching only
  let hovered = false;
  let dwellTween = null;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const buildMetric = (m) => {
    const chip = document.createElement('span');
    chip.className = 'metric-chip';
    chip.innerHTML =
      `<span>${m.label}</span><span class="metric-value">${m.value}</span>` +
      `<span class="metric-delta-${m.dir}">${m.delta}</span>`;
    return chip;
  };

  const addBubble = (msg) => {
    const el = document.createElement('p');
    el.className = `msg msg-${msg.role}`;
    thread.appendChild(el);
    // Force a style flush so the transition runs (rAF can be throttled
    // in background tabs, which would leave bubbles invisible).
    void el.offsetWidth;
    el.classList.add('visible');
    return el;
  };

  const setHeader = (agent) => {
    iconEl.src = agent.icon;
    titleEl.textContent = agent.name;
    statusEl.textContent = agent.status;
  };

  const setActiveTab = (idx) => {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === idx);
      tab.setAttribute('aria-selected', String(i === idx));
      const bar = tab.querySelector('.seg-progress');
      if (bar) {
        dwellTween?.kill();
        bar.style.transform = 'scaleX(0)';
      }
    });
  };

  const startDwell = () => {
    if (!auto || ctx.reduced || !ctx.gsap) return;
    const bar = tabs[current]?.querySelector('.seg-progress');
    if (!bar) return;
    dwellTween?.kill();
    dwellTween = ctx.gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: AGENT_DWELL_MS / 1000,
        ease: 'none',
        paused: hovered,
        onComplete: () => play((current + 1) % AGENTS.length),
      }
    );
  };

  async function play(idx) {
    const my = ++run;
    current = idx;
    const agent = AGENTS[idx];
    dwellTween?.kill();
    setActiveTab(idx);
    setHeader(agent);
    cluster.style.setProperty('--agent-hue', agent.hue); // hue flows through both cards
    chart?.setAgent(agent, ctx);
    thread.innerHTML = '';

    if (ctx.reduced) {
      agent.script.forEach((msg) => {
        const el = addBubble(msg);
        el.textContent = msg.text;
        if (msg.metric) el.appendChild(buildMetric(msg.metric));
      });
      return;
    }

    for (const msg of agent.script) {
      if (my !== run) return;
      await wait(msg.role === 'user' ? 500 : 750);
      if (my !== run) return;
      const el = addBubble(msg);

      if (msg.role === 'user') {
        el.textContent = msg.text;
      } else {
        // Agent types itself, char by char, with a caret.
        const caret = document.createElement('span');
        caret.className = 'caret';
        const textNode = document.createTextNode('');
        el.append(textNode, caret);
        for (let i = 0; i < msg.text.length; i++) {
          if (my !== run) return;
          textNode.data = msg.text.slice(0, i + 1);
          await wait(13);
        }
        caret.remove();
        if (msg.metric) {
          await wait(220);
          if (my !== run) return;
          el.appendChild(buildMetric(msg.metric));
        }
      }
    }

    if (my === run) startDwell();
  }

  // User agency: a tab click takes over and stops the rotation.
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => {
      auto = false;
      play(idx);
    });
  });

  // Hovering the card holds the rotation; leaving resumes it.
  card.addEventListener('pointerenter', () => {
    hovered = true;
    dwellTween?.pause();
  });
  card.addEventListener('pointerleave', () => {
    hovered = false;
    dwellTween?.play();
  });

  replayBtn.addEventListener('click', () => play(current));

  return { play: () => play(current) };
}

/* ---------- Product artifact 2: per-agent chart ----------
   The chart card is the agent's artifact: title, data, chart
   type, and color all follow the active agent (line for trends,
   bars for progress/variance). Hover inspects data points. */

function initChart(root, ctx) {
  const svg = root.querySelector('.forecast-chart');
  const tip = root.querySelector('.chart-tip');
  const titleEl = root.querySelector('.chart-title');
  const badgeEl = root.querySelector('.chart-badge');
  const W = 320;
  const H = 170;
  const PAD = { l: 12, r: 14, t: 18, b: 26 };
  let cfg = null;
  let points = [];

  const fmtVal = (v) => `${v > 0 && cfg.unit === '%' && cfg.type === 'bars' ? '+' : ''}${v}${cfg.unit}`;

  const showTip = (i) => {
    if (!points[i]) return;
    const [x, y] = points[i];
    tip.hidden = false;
    tip.textContent = `${cfg.labels[i]} · ${fmtVal(cfg.data[i])}`;
    const rect = svg.getBoundingClientRect();
    tip.style.left = `${(x / W) * rect.width}px`;
    tip.style.top = `${(y / H) * rect.height}px`;
    const dot = svg.querySelector('.chart-dot');
    if (dot) {
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dot.setAttribute('opacity', '1');
    }
  };

  const render = (agent) => {
    cfg = agent.chart;
    const hue = agent.hue;
    titleEl.textContent = cfg.title;
    badgeEl.textContent = cfg.badge;
    tip.hidden = true;

    const lo = Math.min(0, ...cfg.data);
    const hi = Math.max(...cfg.data);
    const span = hi - lo || 1;
    const py = (v) => H - PAD.b - ((v - lo) / span) * (H - PAD.t - PAD.b);

    if (cfg.type === 'line') {
      const px = (i) => PAD.l + (i / (cfg.data.length - 1)) * (W - PAD.l - PAD.r);
      points = cfg.data.map((v, i) => [px(i), py(v)]);
      const d = points.reduce((acc, [x, y], i, arr) => {
        if (i === 0) return `M${x},${y}`;
        const cx = (arr[i - 1][0] + x) / 2;
        return `${acc} C${cx},${arr[i - 1][1]} ${cx},${y} ${x},${y}`;
      }, '');
      const labelIdx = [0, Math.floor(cfg.data.length / 2), cfg.data.length - 1];
      svg.innerHTML = `
        <defs>
          <linearGradient id="agent-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${hue}" stop-opacity=".24"/>
            <stop offset="1" stop-color="${hue}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path class="chart-area" d="${d} L${points.at(-1)[0]},${H - PAD.b} L${points[0][0]},${H - PAD.b} Z" fill="url(#agent-area-grad)" opacity="0"/>
        <path class="chart-line" d="${d}" fill="none" stroke="${hue}" stroke-width="2.5" stroke-linecap="round"/>
        <g fill="var(--neutral-500)" font-size="10">
          ${labelIdx.map((i) => `<text x="${px(i)}" y="${H - 8}" text-anchor="middle">${cfg.labels[i]}</text>`).join('')}
        </g>
        <circle class="chart-dot" r="4" fill="var(--white)" stroke="${hue}" stroke-width="2.5" opacity="0"/>
      `;
      const line = svg.querySelector('.chart-line');
      const area = svg.querySelector('.chart-area');
      const len = line.getTotalLength();
      if (ctx.reduced || !ctx.gsap) {
        area.setAttribute('opacity', '1');
        showTip(cfg.focus);
      } else {
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        ctx.gsap.timeline()
          .to(line, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' })
          .to(area, { opacity: 1, duration: 0.5 }, '-=0.4')
          .add(() => showTip(cfg.focus));
      }
    } else {
      // bars (supports negative values for variance charts)
      const n = cfg.data.length;
      const slot = (W - PAD.l - PAD.r) / n;
      const bw = Math.min(34, slot * 0.55);
      const zero = py(0);
      points = cfg.data.map((v, i) => [PAD.l + slot * i + slot / 2, py(v)]);
      svg.innerHTML = `
        <line x1="${PAD.l}" x2="${W - PAD.r}" y1="${zero}" y2="${zero}" stroke="var(--neutral-100)" stroke-width="1"/>
        <g class="chart-bars">
          ${cfg.data.map((v, i) => {
            const x = PAD.l + slot * i + (slot - bw) / 2;
            const y = Math.min(py(v), zero);
            const h = Math.max(Math.abs(py(v) - zero), 2);
            const fade = i === cfg.focus ? 1 : 0.45;
            return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${hue}" fill-opacity="${fade}" data-i="${i}"/>`;
          }).join('')}
        </g>
        <g fill="var(--neutral-500)" font-size="9">
          ${cfg.labels.map((l, i) => `<text x="${PAD.l + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${l.length > 9 ? l.slice(0, 8) + '…' : l}</text>`).join('')}
        </g>
      `;
      const bars = svg.querySelectorAll('.chart-bars rect');
      if (!ctx.reduced && ctx.gsap) {
        ctx.gsap.from(bars, {
          scaleY: 0,
          transformOrigin: `center ${zero}px`,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.07,
        });
      }
      showTip(cfg.focus);
    }
  };

  const setAgent = (agent) => {
    if (ctx.reduced || !ctx.gsap) {
      render(agent);
      return;
    }
    ctx.gsap.to(svg, {
      opacity: 0,
      y: 6,
      duration: 0.18,
      ease: 'power1.in',
      onComplete: () => {
        render(agent);
        ctx.gsap.to(svg, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      },
    });
  };

  // Quiet interactivity: hover inspects the nearest data point.
  svg.addEventListener('pointermove', (e) => {
    if (!cfg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let best = Infinity;
    points.forEach(([pxv], i) => {
      const dist = Math.abs(pxv - x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    showTip(nearest);
  });

  return { setAgent };
}

/* ---------- Response: pointer-proximity tilt (2–4°, damped) ---------- */

function initTilt(root, ctx) {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (ctx.reduced || !finePointer) return;

  const cards = [...root.querySelectorAll('[data-tilt]')];
  if (!cards.length) return;

  const state = cards.map(() => ({ rx: 0, ry: 0, tx: 0, ty: 0 }));
  let raf = null;
  let pointerInside = false;

  const loop = () => {
    let settled = true;
    cards.forEach((card, i) => {
      const s = state[i];
      // Damped lerp toward target.
      s.rx += (s.tx - s.rx) * 0.08;
      s.ry += (s.ty - s.ry) * 0.08;
      if (Math.abs(s.tx - s.rx) > 0.01 || Math.abs(s.ty - s.ry) > 0.01) settled = false;
      card.style.transform = `perspective(900px) rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
    });
    raf = settled && !pointerInside ? null : requestAnimationFrame(loop);
  };

  const cluster = root.querySelector('.hero-artifact');
  cluster.addEventListener('pointermove', (e) => {
    pointerInside = true;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      state[i].ty = clamp(dx, -1.4, 1.4) * 3;
      state[i].tx = clamp(-dy, -1.4, 1.4) * 3;
    });
    if (!raf) raf = requestAnimationFrame(loop);
  });

  cluster.addEventListener('pointerleave', () => {
    pointerInside = false;
    state.forEach((s) => {
      s.tx = 0;
      s.ty = 0;
    });
    if (!raf) raf = requestAnimationFrame(loop);
  });
}
