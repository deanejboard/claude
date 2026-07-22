/* ============================================================
   CTA — video-background band; the video only plays on screen.
   ============================================================ */

import { revealOnScroll, gateVideoAutoplay } from './utils.js';

export default function initCta(root, ctx) {
  revealOnScroll(root, ctx);
  gateVideoAutoplay(root.querySelector('.cta-video'), ctx);
}
