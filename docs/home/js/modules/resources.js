/* ============================================================
   What's new — entrances + one autoplaying video thumbnail.
   The generative-thumb hover drift is pure CSS.
   ============================================================ */

import { revealOnScroll, gateVideoAutoplay } from './utils.js';

export default function initResources(root, ctx) {
  revealOnScroll(root, ctx);
  gateVideoAutoplay(root.querySelector('.res-thumb-video video'), ctx);
}
