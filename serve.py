#!/usr/bin/env python3
"""Static server for the Astratex header page."""
import functools
import http.server, os, socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 5173

os.chdir(ROOT)


class _Slice:
    """Čte ze souboru jen vyžádaný úsek — kopírovací smyčka serveru jinak
    pokračuje až do konce souboru."""

    def __init__(self, f, remaining):
        self._f = f
        self._remaining = remaining

    def read(self, n=-1):
        if self._remaining <= 0:
            return b""
        if n is None or n < 0:
            n = self._remaining
        chunk = self._f.read(min(n, self._remaining))
        self._remaining -= len(chunk)
        return chunk

    def close(self):
        self._f.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    # Serve ROOT explicitly. Left to itself the handler calls os.getcwd() on
    # every request, which a long-running process can lose the right to do.

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        # Video se v prohlížeči dotahuje po částech (Range). Základní
        # handler to neumí a pošle vždy celý soubor, takže se nedá
        # přetáčet a start je zbytečně pomalý.
        rng = self.headers.get("Range")
        if not rng or not rng.startswith("bytes="):
            return super().send_head()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()

        size = os.path.getsize(path)
        first, _, last = rng[len("bytes="):].partition("-")
        try:
            start = int(first) if first else 0
            end = int(last) if last else size - 1
        except ValueError:
            return super().send_head()
        end = min(end, size - 1)
        if start > end:
            self.send_error(416, "Requested range not satisfiable")
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return _Slice(f, end - start + 1)

    def log_message(self, fmt, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT)) as httpd:
    print(f"Serving {ROOT} at http://localhost:{PORT}/")
    httpd.serve_forever()
