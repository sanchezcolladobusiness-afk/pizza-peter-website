#!/usr/bin/env python3
"""Zeigt die Pizza-Peter-Website im WLAN an: python3 vorschau.py → http://<Mac-Adresse>:8110 (+ QR-Code fürs Handy)."""
import http.server, os, socket, socketserver, subprocess, sys, threading, webbrowser

PORT = 8110
ROOT = os.path.dirname(os.path.abspath(__file__))

def lan_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1)); return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()

def host_name() -> str:
    try:
        n = subprocess.run(["scutil", "--get", "LocalHostName"], capture_output=True, text=True).stdout.strip()
        return f"{n}.local" if n else ""
    except Exception:
        return ""

def show_qr(url: str) -> None:
    try:
        import qrcode
        qr = qrcode.QRCode(border=1); qr.add_data(url); qr.make(); qr.print_ascii(invert=True)
    except ImportError:
        print("(QR-Code: 'pip3 install qrcode' – oder einfach die Adresse abtippen)")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")   # Änderungen sofort sichtbar
        super().end_headers()
    def log_message(self, fmt, *args):
        if "200" not in fmt % args and "304" not in fmt % args: super().log_message(fmt, *args)

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    ip, name = lan_ip(), host_name()
    url = f"http://{ip}:{PORT}"
    print("\n  PIZZA PETER – Website-Vorschau")
    print("  ==============================")
    print(f"  Auf diesem Mac:   http://localhost:{PORT}")
    print(f"  Im WLAN (Handy):  {url}" + (f"   oder   http://{name}:{PORT}" if name else ""))
    print("  Handy und Mac müssen im selben WLAN sein. Beenden mit Ctrl+C oder Fenster schließen.\n")
    show_qr(url)
    threading.Timer(0.8, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    try:
        with Server(("0.0.0.0", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nBeendet.")
    except OSError as e:
        print(f"\nPort {PORT} ist belegt ({e}). Läuft die Vorschau schon in einem anderen Fenster?")
        input("Enter zum Schließen ")
