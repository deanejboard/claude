/* ============================================================
   Generic entrance-only section (analysts, industry, …):
   staggered rise on scroll, nothing else.
   ============================================================ */

import { revealOnScroll } from './utils.js';

export default function initReveal(root, ctx) {
  revealOnScroll(root, ctx);
}
