#!/usr/bin/env python3
"""Loopback test server for our exact and trailing-star Pages header rules.
Not a Cloudflare emulator or a production server. Reject unexpected syntax.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

if len(sys.argv) != 3:
    raise SystemExit("usage: serve-preview.py PORT DIST")
port = int(sys.argv[1])
if not 1024 <= port <= 65535:
    raise SystemExit("invalid port")
dist = Path(sys.argv[2]).resolve(strict=True)
rules = []
current = None
for raw in (dist / "_headers").read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    if not raw[0].isspace():
        if not line.startswith("/") or ("*" in line and not (line.endswith("*") and line.count("*") == 1)):
            raise ValueError("unsupported Pages pattern")
        current = (line, [])
        rules.append(current)
    else:
        if current is None or ":" not in line:
            raise ValueError("invalid header rule")
        name, value = line.split(":", 1)
        current[1].append((name, value.strip()))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(dist), **kwargs)

    def send_head(self):
        if Path(self.translate_path(self.path)).resolve() == dist / "_headers":
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        path = unquote(urlsplit(self.path).path)
        matched = {}
        for pattern, pairs in rules:
            if path == pattern or (pattern.endswith("*") and path.startswith(pattern[:-1])):
                for name, value in pairs:
                    key = name.lower()
                    if key in matched:
                        raise ValueError("ambiguous overlapping header " + name)
                    matched[key] = (name, value)
        for name, value in matched.values():
            self.send_header(name, value)
        super().end_headers()

ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
