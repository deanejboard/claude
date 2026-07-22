/* ============================================================
   Solutions — cube navigator v2. Pieces are the cube's own
   visual assemblies (exact face geometry, no overlap), so hover
   and click land where the eye expects. Hovering a piece or a
   pill previews that area in the panel; clicking pins it.
   Content and URLs come from board.com's live cube navigator.
   Hues stay in the blue/teal family — no purple outside the nav.
   ============================================================ */

import { revealOnScroll, gateAmbient } from './utils.js';

const AREAS = {
  fpa: {
    title: 'FP&A',
    hue: '#0c9995',
    url: 'https://www.board.com/finance/financial-planning-analysis',
    solutions: [
      ['Planning, Budgeting & Forecasting', 'https://www.board.com/finance/planning-budgeting-forecasting'],
      ['Strategic Long-term Planning', 'https://www.board.com/finance/strategic-planning'],
      ['Management Reporting & Analysis', null],
      ['Cash Flow Analysis & Forecasting', null],
      ['Capital Planning', 'https://www.board.com/finance/capital-planning'],
    ],
  },
  fccr: {
    title: 'Financial Close, Consolidation & Reporting',
    hue: '#253e7d',
    url: 'https://www.board.com/finance/financial-consolidation',
    solutions: [
      ['Financial Consolidation and Reporting', 'https://www.board.com/finance/financial-consolidation'],
      ['Lease Accounting', null],
      ['Tax Reporting', null],
      ['ESG/CSRD Reporting', null],
      ['Disclosure Management', null],
    ],
  },
  merch: {
    title: 'Merchandising Planning',
    hue: '#2487aa', /* BoardLightBlue-700 */
    url: 'https://www.board.com/retail',
    solutions: [
      ['Allocation & Replenishment', 'https://www.board.com/retail/allocation-replenishment'],
      ['Demand Planning', 'https://www.board.com/retail/retail-demand-planning'],
      ['Price & Promotion', null],
      ['Range & Assortment Planning', 'https://www.board.com/retail/assortment-planning'],
      ['Merchandise Financial Planning', 'https://www.board.com/retail/merchandise-financial-planning'],
      ['OTB (WSSI)', 'https://www.board.com/retail/open-to-buy-wssi'],
    ],
  },
  commercial: {
    title: 'Commercial Planning',
    hue: '#516597', /* BoardBlue-400 */
    url: null,
    solutions: [
      ['Commercial Planning & Budgeting', null],
      ['Product & Portfolio', null],
      ['Product Plans & Route to Market', null],
      ['Market Analysis', null],
      ['Price & Promotion', null],
      ['R&D', null],
    ],
  },
  supply: {
    title: 'Supply Chain Planning',
    hue: '#32bef0',
    url: 'https://www.board.com/supply-chain',
    solutions: [
      ['S&OP', 'https://www.board.com/supply-chain/sales-operations-planning'],
      ['Demand Planning', 'https://www.board.com/supply-chain/demand-planning'],
      ['Supply Planning', 'https://www.board.com/supply-chain/supply-planning'],
    ],
  },
  hr: {
    title: 'HR Workforce Planning',
    hue: '#76d3f5', /* BoardLightBlue-300 */
    url: 'https://www.board.com/human-resources',
    solutions: [
      ['Workforce Planning and Analytics', 'https://www.board.com/human-resources/workforce-analytics'],
      ['Salary and Incentive Planning', 'https://www.board.com/human-resources/performance-management'],
    ],
  },
};

const OVERVIEW_TITLE = 'Integrated Business Planning';

export default function initCube(root, ctx) {
  revealOnScroll(root, ctx);

  const stage = root.querySelector('.cube-stage');
  const titleEl = root.querySelector('.area-title');
  const listEl = root.querySelector('.area-solutions');
  const hintEl = root.querySelector('.area-hint');
  const linkEl = root.querySelector('.area-link');
  const linkNameEl = root.querySelector('.area-link-name');
  const pills = [...root.querySelectorAll('.area-pill')];

  let pinned = null;   // clicked selection
  let shown = null;    // what the panel currently shows (preview or pin)
  let pieces = {};

  /* ---------- Panel ---------- */
  const renderPanel = (key) => {
    if (key === shown) return;
    shown = key;
    const area = key ? AREAS[key] : null;

    titleEl.textContent = area ? area.title : OVERVIEW_TITLE;
    hintEl.hidden = Boolean(area);
    listEl.innerHTML = '';
    (area ? area.solutions : []).forEach(([label, url]) => {
      const li = document.createElement('li');
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = label;
        li.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.textContent = label;
        li.appendChild(span);
      }
      listEl.appendChild(li);
    });

    if (area && area.url) {
      linkEl.hidden = false;
      linkEl.href = area.url;
      linkNameEl.textContent = area.title;
    } else {
      linkEl.hidden = true;
    }

    if (!ctx.reduced && ctx.gsap) {
      ctx.gsap.fromTo(
        [titleEl, listEl],
        { opacity: 0.3, y: 5 },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', stagger: 0.04 }
      );
    }
  };

  /* ---------- Highlight sync (piece <-> pill) ---------- */
  const setHover = (key, on) => {
    pieces[key]?.classList.toggle('is-hover', on);
    pills.forEach((p) => {
      if (p.dataset.area === key) p.classList.toggle('is-hover', on);
    });
    renderPanel(on ? key : pinned);
  };

  const setPinned = (key) => {
    pinned = pinned === key ? null : key;
    Object.entries(pieces).forEach(([k, g]) => g.classList.toggle('is-active', k === pinned));
    pills.forEach((p) => p.classList.toggle('is-active', p.dataset.area === pinned));
    shown = undefined; // force re-render
    renderPanel(pinned);
    // click feedback: quick tint pulse on the piece
    if (pinned && !ctx.reduced && ctx.gsap) {
      const paths = pieces[pinned]?.querySelectorAll('path');
      if (paths) {
        ctx.gsap.fromTo(paths, { opacity: 0.62 }, { opacity: 0.5, duration: 0.35, ease: 'power2.out' });
      }
    }
  };

  /* ---------- Load the interactive cube ---------- */
  fetch('assets/cube-interactive.svg?v=2') /* version-busted: asset regenerated */
    .then((r) => r.text())
    .then((markup) => {
      stage.innerHTML = markup;
      const svg = stage.querySelector('svg');
      svg.setAttribute('role', 'group');
      svg.setAttribute('aria-label', 'Board platform cube — planning solution areas');

      svg.querySelectorAll('.cube-piece').forEach((g) => {
        const key = g.dataset.area;
        const area = AREAS[key];
        if (!area) return;
        pieces[key] = g;
        g.style.setProperty('--piece-hue', area.hue);
        g.setAttribute('aria-label', `${area.title} — view solutions`);

        g.addEventListener('pointerenter', () => setHover(key, true));
        g.addEventListener('pointerleave', () => setHover(key, false));
        g.addEventListener('focus', () => setHover(key, true));
        g.addEventListener('blur', () => setHover(key, false));
        g.addEventListener('click', () => setPinned(key));
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setPinned(key);
          }
        });
      });

      // Ambient: barely-perceptible idle float of the whole cube.
      if (!ctx.reduced && ctx.gsap) {
        const floating = ctx.gsap.to(svg, {
          y: -6,
          duration: 4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          paused: true,
        });
        gateAmbient(root, (visible) => (visible ? floating.play() : floating.pause()));
      }
    })
    .catch((err) => {
      console.error('[board] cube: failed to load interactive svg', err);
      stage.innerHTML = '<img src="assets/cube.svg" alt="" width="350" height="375" />';
    });

  /* ---------- Pills ---------- */
  pills.forEach((pill) => {
    const key = pill.dataset.area;
    pill.addEventListener('pointerenter', () => setHover(key, true));
    pill.addEventListener('pointerleave', () => setHover(key, false));
    pill.addEventListener('focus', () => setHover(key, true));
    pill.addEventListener('blur', () => setHover(key, false));
    pill.addEventListener('click', () => setPinned(key));
  });

  renderPanel(null);
}
