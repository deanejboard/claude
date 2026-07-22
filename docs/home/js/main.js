/* ============================================================
   Board Home — init registry
   Each section declares data-anim="<key>"; the registry boots
   the matching module scoped to that root element. This mirrors
   how per-block init would work in a Gutenberg block library:
   no page-level orchestration, no cross-section DOM access.
   ============================================================ */

import { motionContext } from './modules/utils.js';
import initNav from './modules/nav.js';
import initHero from './modules/hero.js';
import initLogos from './modules/logos.js';
import initCube from './modules/cube.js';
import initGrid from './modules/grid.js';
import initTrust from './modules/trust.js';
import initProof from './modules/proof.js';
import initResources from './modules/resources.js';
import initCta from './modules/cta.js';
import initReveal from './modules/reveal.js';

const registry = {
  nav: initNav,
  hero: initHero,
  logos: initLogos,
  cube: initCube,
  grid: initGrid,
  trust: initTrust,
  proof: initProof,
  resources: initResources,
  cta: initCta,
  reveal: initReveal,
};

// GSAP is enqueued globally (site-wide, as it would be in WP).
// Register the plugin once; modules create their own ScrollTriggers.
if (window.gsap && window.ScrollTrigger) {
  window.gsap.registerPlugin(window.ScrollTrigger);
}

const ctx = motionContext();

document.querySelectorAll('[data-anim]').forEach((el) => {
  const key = el.dataset.anim;
  try {
    registry[key]?.(el, ctx);
  } catch (err) {
    // A broken module must never take down the rest of the page.
    console.error(`[board] module "${key}" failed to init`, err);
  }
});
