#!/usr/bin/env python3
"""
server.py — local dev server for the large-dog-breeds app.

Serves static files from the project directory AND provides a small REST API
for adding new breeds without leaving the browser.

Replaces:  python -m http.server 8000
Usage:     python server.py              # port 8000
           python server.py --port 8080
           python server.py --port 8000 --host 0.0.0.0  # LAN access

API endpoints:
    POST /api/add-breed
        Body:    {"name": "Samoyed"}
        Returns: {"ok": true,  "breed": {...}, "placeholders": [...]}
                 {"ok": false, "error": "..."}

    GET  /api/breeds
        Returns the current large_dog_breeds.json content as JSON.
"""

import argparse
import json
import mimetypes
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).parent


class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # Quieter logging: only print non-static-file requests
        if not any(self.path.startswith(p) for p in ("/images/", "/favicon")):
            print(f"  {self.address_string()} {self.command} {self.path}")

    # ── GET ──────────────────────────────────────────────────────────────────

    def do_GET(self):
        path = unquote(self.path.split("?")[0])

        if path == "/api/breeds":
            self._json_response(json.loads((ROOT / "large_dog_breeds.json").read_text()))
            return

        # Static file serving
        if path == "/" or path == "":
            path = "/index.html"

        file_path = ROOT / path.lstrip("/")
        if not file_path.exists() or not file_path.is_file():
            self._send(404, "text/plain", b"Not Found")
            return

        mime = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        self._send(200, mime, file_path.read_bytes())

    # ── POST ─────────────────────────────────────────────────────────────────

    def do_POST(self):
        path = unquote(self.path.split("?")[0])

        if path == "/api/add-breed":
            length = int(self.headers.get("Content-Length", 0))
            body   = self.rfile.read(length)
            try:
                data = json.loads(body)
                name = data.get("name", "").strip()
                if not name:
                    self._json_response({"ok": False, "error": "Missing breed name"}, 400)
                    return
            except (json.JSONDecodeError, AttributeError):
                self._json_response({"ok": False, "error": "Invalid JSON body"}, 400)
                return

            try:
                from add_breed import add_breed_entry
                result = add_breed_entry(name)
            except Exception as exc:
                self._json_response({"ok": False, "error": str(exc)}, 500)
                return

            status = 200 if result["ok"] else 422
            self._json_response(result, status)
            return

        self._send(404, "text/plain", b"Not Found")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _send(self, status: int, content_type: str, body: bytes):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _json_response(self, data, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self._send(status, "application/json; charset=utf-8", body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def main():
    ap = argparse.ArgumentParser(description="Dev server for large-dog-breeds app")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()

    os.chdir(ROOT)
    server = HTTPServer((args.host, args.port), Handler)
    print(f"Serving at http://{args.host}:{args.port}/")
    print("Press Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
