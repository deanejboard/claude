/* ============================================================
   5.6 Trust band — the illustration icons.
   Faint dotted guides fade in; the gradient structural lines
   (and two-tone nodes) draw themselves in; the two-tone focal
   icon pops last. Once, on scroll into view.
   ============================================================ */

import { revealOnScroll } from './utils.js';

export default function initTrust(root, ctx) {
  revealOnScroll(root, ctx);

  const illos = [...root.querySelectorAll('.trust-illo')];
  if (!illos.length || ctx.reduced || !ctx.gsap) return; // reduced motion: icons simply appear

  // Prime: hide guides, dash the drawable strokes, shrink the focal.
  // The focal pop scales the two-tone icon in. On these nested SVG <g>
  // groups GSAP's percentage transformOrigin ("50% 50%") mis-resolves and
  // leaves a residual translate that shoves the focal off its anchor, so we
  // pin the scale origin with svgOrigin (absolute user-space coords) computed
  // from each focal's own bbox centre. svgOrigin is set here ONCE — re-passing
  // it on the tween makes GSAP recompute against the already-transformed state
  // and reintroduces the offset, so the tween below only animates scale.
  illos.forEach((illo) => {
    illo.querySelectorAll('.il-faint').forEach((el) => (el.style.opacity = '0'));
    illo.querySelectorAll('.draw').forEach((el) => {
      const len = el.getTotalLength ? el.getTotalLength() : 300;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    });
    illo.querySelectorAll('.il-focal').forEach((el) => {
      const bb = el.getBBox();
      const origin = `${bb.x + bb.width / 2} ${bb.y + bb.height / 2}`;
      ctx.gsap.set(el, { opacity: 0, scale: 0.5, svgOrigin: origin });
    });
  });

  illos.forEach((illo) => {
    ctx.ScrollTrigger.create({
      trigger: illo,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        ctx.gsap.to(illo.querySelectorAll('.il-faint'), {
          opacity: 0.55,
          duration: 0.6,
          ease: 'power1.out',
        });
        ctx.gsap.to(illo.querySelectorAll('.draw'), {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: 'power2.inOut',
          stagger: 0.06,
        });
        // Do NOT re-pass svgOrigin here — it was pinned in the prime set.
        ctx.gsap.to(illo.querySelectorAll('.il-focal'), {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.6)',
          delay: 0.9,
        });
      },
    });
  });
}
