# lab-docs-src — build tooling for the gated BoardFlow Labs docs

Generates the password-gated documentation viewer served at `docs/lab-docs/`
(https://deanejboard.github.io/claude/lab-docs/).

## Files (committed)
- `viewer.tmpl.html` — the viewer UI (one template, two modes).
- `build.py` — encrypts the docs into the deployed page; also emits a local preview.
- `marked.min.js` — vendored markdown renderer (v12).

## Files (gitignored — this repo is PUBLIC)
- `AGENTS.md`, `DESIGN.md`, `ILLUSTRATION-SYSTEM.md` — the doc sources. Not
  committed so the plaintext isn't publicly readable. Copy them here from
  `prototype-home/` before building.
- `preview.html` — the local, un-gated viewer (generated).

## Build
```bash
# 1) copy the three .md here from prototype-home
cp ../../prototype-home/{AGENTS,DESIGN,ILLUSTRATION-SYSTEM}.md .   # adjust path as needed
# 2) build (password defaults to b04rd)
python3 build.py
#    or override: python3 build.py <password>
```
Outputs:
- `../docs/lab-docs/index.html` — gated + encrypted (deployed to GitHub Pages).
- `./preview.html` — local, no gate (open via a local http server, e.g.
  `python3 -m http.server -d . 4191` → http://localhost:4191/preview.html).

## How the gate works
The three docs are bundled to JSON, encrypted with AES-256-GCM (key derived via
PBKDF2-HMAC-SHA256, 200k iterations) and embedded in `index.html`. The browser
decrypts with Web Crypto after the correct password is entered; no raw `.md` is
deployed. This is StatiCrypt-style **casual** gating — it deters public/drive-by
access, it is not strong security (a short password can be brute-forced offline).
