/* ============================================================
   Shared utilities — motion context, entrances, ambient gating.
   Utility code only: modules import functions, never each
   other's DOM.
   ============================================================ */

/**
 * Motion context passed to every module.
 * `?reduced=1` forces reduced-motion for QA without OS settings.
 */
export function motionContext() {
  const query = new URLSearchParams(window.location.search);
  const reduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    query.get('reduced') === '1';
  return {
    reduced,
    gsap: window.gsap,
    ScrollTrigger: window.ScrollTrigger,
  };
}

/**
 * Standard entrance: fade + 28px rise, once, staggered.
 * Targets are elements with [data-reveal] inside `root`.
 * Reduced motion: elements are simply shown.
 */
export function revealOnScroll(root, ctx, opts = {}) {
  const targets = root.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  if (ctx.reduced || !ctx.gsap) {
    targets.forEach((el) => el.classList.add('revealed'));
    return;
  }

  ctx.gsap.set(targets, { opacity: 0, y: 28 });
  ctx.ScrollTrigger.create({
    trigger: opts.trigger || root,
    start: opts.start || 'top 78%',
    once: true, // never re-triggers on scroll-up
    onEnter: () => {
      ctx.gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        clearProps: 'transform',
        onComplete: () => targets.forEach((el) => el.classList.add('revealed')),
      });
    },
  });
}

/**
 * Gate an ambient loop with IntersectionObserver:
 * runs `onVisible(true)` when on screen, `onVisible(false)` when off.
 */
export function gateAmbient(el, onVisible) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => onVisible(e.isIntersecting)),
    { threshold: 0.05 }
  );
  io.observe(el);
  return io;
}

/** Clamp helper. */
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Autoplay a muted looping video only while it is on screen.
 * Reduced motion: never autoplay — the poster stands in.
 */
export function gateVideoAutoplay(video, ctx) {
  if (!video || ctx.reduced) return;
  gateAmbient(video, (visible) => {
    if (visible) video.play().catch(() => {});
    else video.pause();
  });
}
