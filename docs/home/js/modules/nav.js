/* ============================================================
   5.1 Navigation — translucent after 40px scroll, mobile overlay.
   ============================================================ */

export default function initNav(root, ctx) {
  const toggle = root.querySelector('.nav-toggle');
  const links = root.querySelector('.nav-links');

  // Smooth anchor scrolling handled here (not via CSS scroll-behavior,
  // which conflicts with ScrollTrigger's refresh/restore).
  root.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: ctx?.reduced ? 'auto' : 'smooth', block: 'start' });
  });

  // Translucent-on-scroll: rAF-throttled scroll listener.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      root.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile overlay menu.
  if (toggle && links) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      root.classList.toggle('menu-open', open);
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close on link tap or Escape.
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }
}
