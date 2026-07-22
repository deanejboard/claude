#!/usr/bin/env python3
"""
Build the Board Creative Lab docs viewer in two forms from one template:

  * docs/lab-docs/index.html   -> DEPLOYED, password-gated. The three docs are
                                  AES-GCM encrypted into the page (decrypted in
                                  the browser via Web Crypto). No raw .md ships.
  * lab-docs-src/preview.html  -> LOCAL, no password. Fetches the sibling .md
                                  files. Serve lab-docs-src over http to read.

Password: default "b04rd" (override: `python3 build.py <password>` or
env LABDOCS_PASSWORD). Re-run whenever the .md sources change.

Crypto: PBKDF2-HMAC-SHA256 (200k iters) -> AES-256-GCM. Matches the browser's
SubtleCrypto decrypt in viewer.tmpl.html.
"""
import base64, json, os, shutil, sys
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DEPLOY_DIR = os.path.join(REPO, "docs", "lab-docs")
ITER = 200_000

DOC_FILES = {
    "agents": "AGENTS.md",
    "design": "DESIGN.md",
    "illustration": "ILLUSTRATION-SYSTEM.md",
}

def read(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def b64(b):
    return base64.b64encode(b).decode("ascii")

def encrypt_payload(password: str) -> dict:
    docs = {k: read(os.path.join(HERE, v)) for k, v in DOC_FILES.items()}
    plaintext = json.dumps(docs, ensure_ascii=False).encode("utf-8")
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = PBKDF2HMAC(algorithm=SHA256(), length=32, salt=salt, iterations=ITER).derive(
        password.encode("utf-8")
    )
    ct = AESGCM(key).encrypt(iv, plaintext, None)  # ciphertext || 16-byte GCM tag
    return {"salt": b64(salt), "iv": b64(iv), "ct": b64(ct), "iter": ITER}

def main():
    password = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("LABDOCS_PASSWORD", "b04rd")
    template = read(os.path.join(HERE, "viewer.tmpl.html"))

    # 1) local, un-gated
    preview = template.replace("__PAYLOAD_JSON__", "null")
    with open(os.path.join(HERE, "preview.html"), "w", encoding="utf-8") as f:
        f.write(preview)

    # 2) deployed, gated
    payload = encrypt_payload(password)
    gated = template.replace("__PAYLOAD_JSON__", json.dumps(payload))
    os.makedirs(DEPLOY_DIR, exist_ok=True)
    with open(os.path.join(DEPLOY_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(gated)
    shutil.copyfile(os.path.join(HERE, "marked.min.js"), os.path.join(DEPLOY_DIR, "marked.min.js"))

    print("Built:")
    print("  local (no gate):", os.path.join("lab-docs-src", "preview.html"))
    print("  deploy (gated) :", os.path.join("docs", "lab-docs", "index.html"))
    print("  + marked.min.js copied to docs/lab-docs/")
    print("  password       :", password)
    print("  ciphertext     :", len(payload["ct"]), "b64 chars,", ITER, "PBKDF2 iters")

if __name__ == "__main__":
    main()
