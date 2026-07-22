/* ============================================================
   5.3 Logo bar — duplicate the track for a seamless marquee,
   gate the loop off-screen. Reduced motion: stays static
   (CSS handles it; we skip duplication so nothing repeats).
   ============================================================ */

import { gateAmbient } from './utils.js';

export default function initLogos(root, ctx) {
  const track = root.querySelector('.logo-track');
  if (!track || ctx.reduced) return;

  // Seamless loop = two copies, translate -50%.
  track.innerHTML += track.innerHTML;
  track.querySelectorAll('li').forEach((li, i) => {
    if (i >= track.children.length / 2) li.setAttribute('aria-hidden', 'true');
  });

  gateAmbient(root, (visible) => {
    root.classList.toggle('ambient-paused', !visible);
  });
}
