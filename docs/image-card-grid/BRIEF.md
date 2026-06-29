# Image Card Grid — design brief

## What this is
A reusable WordPress block: a configurable grid or carousel of image cards, each with an optional heading and paragraph. It is general purpose (products, logos, team, resources, partners, awards, and more). The partner award badges that prompted it are just one preset of the block.

## The job
Design the block and its configurations so it can be built as a single Gutenberg block. Every option below must be possible within the one block; the editor picks per instance.

## Live reference
- Interactive demo (all options, playable in the browser): https://deanejboard.github.io/claude/image-card-grid/
- Visual design file: https://www.figma.com/design/M07htNU18uMwaOLys0h3z1/Partner-Awards-Block---BOARD?node-id=16-1435

## Card anatomy
Each card is an image (required) plus an optional heading and paragraph. The heading and paragraph are standard inner blocks, present by default and deletable per card. So a single grid can mix full-text cards, heading-only cards, and image-only cards.

## Options to accommodate
- **Display:** grid or carousel. Carousel adds arrows, dots, items visible, edge fade, autoplay.
- **Columns (desktop):** 2 to 6, with a sensible step-down on tablet and mobile.
- **Gap** between cards.
- **Image:** size (small / medium / large), fit (contain or cover).
- **Card:** padding, corner radius, border thickness, border colour, background colour, optional shadow and hover, and an optional link on the whole card.
- **Block width:** contained or full width.

## States to design
- Grid, bordered cards, with text.
- Grid, bare images, no text. This is the badge use case (border thickness 0, transparent background).
- Carousel.
- A mix of cards (full text, heading only, image only).
- Responsive: desktop, tablet, mobile.

## Constraints
- General purpose, not award-specific in styling or labels.
- Match the board.com look and feel.
- Handle 1 to roughly 24 cards gracefully.
- A page-level heading or intro is a separate standard block placed above the grid, not part of this block.

## Deliverable
Design ready for development as a Gutenberg block, including the editor controls implied by the options above.
