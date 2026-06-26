# claude

Hosts live, shareable **web marketing mockups** served via GitHub Pages from the [`docs/`](docs/) folder.

## How it works

```
build mockup  →  commit  →  push  →  GitHub Pages serves /docs
```

Pages is configured to serve the `docs/` folder on `main`, so **only `docs/` is published** — anything else in this repo stays unpublished.

Each mockup is a self-contained HTML page (images embedded as data-URIs, only an external web-font link), so it renders anywhere with no build step. The deploy layer is independent of how the mockup is authored — Claude Code, Claude artifacts/design, or Figma Make all produce HTML that drops straight into `docs/`.

## Live URLs

- Index of mockups: `https://deanejboard.github.io/claude/`
- Partner Award Badges: `https://deanejboard.github.io/claude/partner-award-badges/`

## Structure

```
docs/
├── index.html                 # landing page linking to all mockups
└── partner-award-badges/
    └── index.html             # one mockup = one folder with an index.html
```

## Add or update a mockup

- **New:** create `docs/<kebab-name>/index.html`, add a card to `docs/index.html`, commit, push.
- **Update:** edit the file, commit, push — same URL updates in place, history kept in Git.

## Mockups

| Mockup | Request | Notes |
| --- | --- | --- |
| [Partner Award Badges](docs/partner-award-badges/) | Display partner award medallions on Partner Finder listings | Options A–E. Some badges (e.g. "DACH") are mockup assets — region text edited onto a real medallion; production art comes from design. |
