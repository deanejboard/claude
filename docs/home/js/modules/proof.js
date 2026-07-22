/* ============================================================
   5.7 Customer proof — lazy, gated video behavior.
   The <video> has no source yet (ASSET DEBT); the module is
   production-shaped: it only plays when on screen, pauses
   off-screen, and the play button stands in for a modal open.
   ============================================================ */

import { revealOnScroll, gateAmbient } from './utils.js';

export default function initProof(root, ctx) {
  revealOnScroll(root, ctx);

  const video = root.querySelector('.proof-video');
  const playBtn = root.querySelector('.video-play');
  if (!video) return;

  const hasSource = video.querySelector('source') !== null || video.src;

  if (hasSource && !ctx.reduced) {
    // Autoplay only while visible; muted+playsinline set in markup.
    gateAmbient(root, (visible) => {
      if (visible) video.play().catch(() => {});
      else video.pause();
    });
  }

  playBtn?.addEventListener('click', () => {
    // Prototype stub: a real build opens the full video in a modal.
    playBtn.classList.add('pressed');
    console.info('[board] proof: full customer video would open here');
  });
}
