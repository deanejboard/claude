#!/usr/bin/env python3
"""
Password-gate whole deployed pages (the landing index + the mockups), StatiCrypt
style: the ENTIRE page HTML is AES-GCM encrypted into a small gate wrapper; the
browser decrypts it (Web Crypto) after the password is entered and restores the
page with document.write. A shared localStorage key means entering the password
once unlocks every gated page (and the lab-docs viewer) in that browser.

Un-gated sources are snapshotted to ../site-src/ (gitignored — the repo is PUBLIC)
so re-runs rebuild from the original, not from an already-gated file.

Usage:  python3 gate_site.py [password]     (default: b04rd, or env LABDOCS_PASSWORD)
Re-run whenever a source page changes.
"""
import base64, json, os, sys
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DOCS = os.path.join(REPO, "docs")
SRC = os.path.join(REPO, "site-src")
ITER = 200_000
MARKER = "<!-- board-gated v1 -->"

# Pages to gate (relative to docs/). boardai-microsite already has its own gate.
PAGES = [
    "index.html",
    "home/index.html",
    "board-illustration-system/index.html",
    "image-card-grid/index.html",
    "partner-award-badges/index.html",
    "partner-award-badges-final/index.html",
]

def read(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)

def encrypt_text(text, password):
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = PBKDF2HMAC(algorithm=SHA256(), length=32, salt=salt, iterations=ITER).derive(password.encode("utf-8"))
    ct = AESGCM(key).encrypt(iv, text.encode("utf-8"), None)
    return {
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(iv).decode(),
        "ct": base64.b64encode(ct).decode(),
        "iter": ITER,
    }

WRAPPER = """<!DOCTYPE html>
<!-- board-gated v1 -->
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>BoardFlow Labs — protected</title>
<link rel="preconnect" href="https://api.fontshare.com" />
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,700,900&display=swap" rel="stylesheet" />
<style>
  :root { --flow: linear-gradient(100deg,#253e7d 0%,#8739e4 55%,#32bef0 100%); --violet:#8739e4; }
  * { box-sizing: border-box; }
  html,body { margin:0; height:100%; }
  body { font-family:"Satoshi",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    background: radial-gradient(120% 120% at 50% 0%, #10214a 0%, #0a1330 60%, #070d20 100%);
    color:#eaf0ff; }
  .gate { position:fixed; inset:0; display:none; place-items:center; padding:20px; }
  .gate.show { display:grid; }
  .card { width:min(400px,92vw); background:rgba(255,255,255,0.04);
    border:1px solid rgba(166,178,234,0.24); border-radius:16px; padding:2.6rem 2.4rem;
    text-align:center; backdrop-filter:blur(8px); }
  .dot { width:16px; height:16px; border-radius:50%; margin:0 auto 1.1rem; background:var(--flow);
    box-shadow:0 0 24px rgba(135,57,228,.5); }
  .h { font-weight:900; font-size:1.15rem; letter-spacing:-.2px; }
  .t { color:#a6b2ea; font-size:.9rem; margin:.35rem 0 1.7rem; }
  input { width:100%; box-sizing:border-box; padding:.8rem 1rem; font-size:1rem;
    border:1px solid rgba(166,178,234,0.3); border-radius:10px; background:rgba(255,255,255,0.06); color:#fff; }
  input:focus { outline:2px solid var(--violet); }
  button { width:100%; margin-top:1rem; padding:.85rem; font-size:1rem; font-weight:800; border:0;
    border-radius:999px; background:var(--flow); color:#fff; cursor:pointer; letter-spacing:.2px; }
  button:hover { filter:brightness(1.06); }
  .err { color:#ff9db0; font-size:.85rem; min-height:1.2em; margin-top:.8rem; }
  .shake { animation:shk .4s; }
  @keyframes shk { 0%,100%{transform:none} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
  noscript { display:block; text-align:center; padding-top:30vh; color:#a6b2ea; }
</style>
</head><body>
  <noscript>This page requires JavaScript to unlock.</noscript>
  <div class="gate" id="gate">
    <form class="card" id="card">
      <div class="dot"></div>
      <div class="h">BoardFlow Labs</div>
      <div class="t">Enter the password to continue.</div>
      <input id="pw" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" />
      <button type="submit">Unlock</button>
      <div class="err" id="err"></div>
    </form>
  </div>
<script>
  var PAYLOAD = __PAYLOAD__;
  var KEY = "board-lab-pw";
  function b(s){ return Uint8Array.from(atob(s), function(c){ return c.charCodeAt(0); }); }
  async function decrypt(pw){
    var salt=b(PAYLOAD.salt), iv=b(PAYLOAD.iv), ct=b(PAYLOAD.ct);
    var km=await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    var key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:PAYLOAD.iter,hash:"SHA-256"},
      km, {name:"AES-GCM",length:256}, false, ["decrypt"]);
    var pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:iv}, key, ct);
    return new TextDecoder().decode(pt);
  }
  function reveal(html){ document.open(); document.write(html); document.close(); }
  async function unlock(pw, remember){
    var html = await decrypt(pw);
    if (remember) { try { localStorage.setItem(KEY, pw); } catch(e){} }
    reveal(html);
  }
  (async function(){
    var saved=null; try { saved=localStorage.getItem(KEY); } catch(e){}
    if (saved) { try { await unlock(saved, false); return; } catch(e) { try{localStorage.removeItem(KEY);}catch(_){} } }
    var gate=document.getElementById("gate"); gate.classList.add("show");
    var pw=document.getElementById("pw"), err=document.getElementById("err"), card=document.getElementById("card");
    setTimeout(function(){ pw.focus(); }, 50);
    card.addEventListener("submit", function(e){
      e.preventDefault(); err.textContent="";
      unlock(pw.value, true).catch(function(){
        err.textContent="Incorrect password.";
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); pw.select();
      });
    });
  })();
</script>
</body></html>
"""

def main():
    password = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("LABDOCS_PASSWORD", "b04rd")
    for rel in PAGES:
        docs_path = os.path.join(DOCS, rel)
        src_path = os.path.join(SRC, rel)
        if os.path.exists(src_path):
            original = read(src_path)            # rebuild from preserved source
        else:
            if not os.path.exists(docs_path):
                print("  SKIP (missing):", rel); continue
            original = read(docs_path)
            if MARKER in original:
                print("  ERROR: already gated and no source snapshot for", rel); continue
            write(src_path, original)             # snapshot un-gated source once
        gated = WRAPPER.replace("__PAYLOAD__", json.dumps(encrypt_text(original, password)))
        write(docs_path, gated)
        print("  gated:", rel, "(", len(original), "->", len(gated), "bytes )")
    print("Done. Password:", password)
    print("Un-gated sources snapshotted in site-src/ (gitignored).")

if __name__ == "__main__":
    main()
