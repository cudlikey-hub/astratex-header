#!/usr/bin/env python3
"""Static server for the Astratex header page."""
import functools
import http.server, os, socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 5173

os.chdir(ROOT)


class Handler(http.server.SimpleHTTPRequestHandler):
    # Serve ROOT explicitly. Left to itself the handler calls os.getcwd() on
    # every request, which a long-running process can lose the right to do.

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=ROOT)) as httpd:
    print(f"Serving {ROOT} at http://localhost:{PORT}/")
    httpd.serve_forever()
