# Pizza Fratelli – Website (OnePager)

Statische Website ohne Build-Tools: `index.html`, `style.css`, `bg.css`, `main.js`, `assets/`.
Marke nach dem Brand-Kit (Tomatenrot `#D42B1F`, Basilikum `#B9CBB0`, Creme `#F2EFE6`; Londrina Solid + Oswald, lokal in `assets/fonts`). Logo-Dateien als Vektor in `assets/brand` (Creme, Negativ auf Rot, Wortmarke); Generator `_work/fratelli/build_logo.py`.

## Ansehen
- **Auf dem Mac:** `index.html` doppelklicken.
- **Auf dem Handy:** `Vorschau.command` doppelklicken. Das Fenster zeigt die Adresse (z. B. `http://192.168.178.74:8110`) und einen QR-Code – mit der Handy-Kamera scannen. Handy und Mac müssen im selben WLAN sein, das Fenster bleibt offen, solange du schaust. Falls macOS beim ersten Mal fragt, ob Python eingehende Verbindungen annehmen darf: Erlauben.
- Läuft ohne Internet, alle Schriften und Bilder liegen im Ordner.

## Was noch ausgefüllt werden muss (Platzhalter)
Alle Platzhalter stehen ganz oben in `main.js` im Block `CONFIG`:

| Schlüssel | Bedeutung |
|---|---|
| `phoneDisplay` / `phoneLink` | Telefonnummer (Anzeige / Anruf-Link) |
| `email` | E-Mail-Adresse (Ziel des Anfrageformulars) |
| `instagram` | Instagram-Name ohne @ |
| `whatsapp` | Nummer für den WhatsApp-Knopf (Ländervorwahl, ohne + und ohne führende 0) |
| `teamNames` | Namen zu den vier Team-Fotos (leer = nur die Rolle wird angezeigt) |

Außerdem im Text prüfen (Angaben, die vom Betrieb zu bestätigen sind): Platzbedarf „3 × 3 Meter“, Aufbauzeit „rund zwei Stunden“, Strombedarf „eine Steckdose“, Gästezahl „ab 30“, Einzugsgebiet „ca. 60 km“, Zutaten (San Marzano, Fior di Latte, Büffelmozzarella) – alles in `index.html` per Suche zu finden.
**Impressum** und **Datenschutz** liegen als Platzhalter-Seiten bei (`impressum.html`, `datenschutz.html`) – Anschrift, Inhaber/in und Hosting-Anbieter eintragen, Datenschutztext gegenprüfen.
In `index.html` außerdem `og:image` (Vorschaubild für WhatsApp/Facebook) auf die echte Domain umstellen – aktuell steht dort `https://DEINE-DOMAIN.de/…`.

## Texte ändern
Direkt in `index.html` (Suchen & Ersetzen). Die Datei wurde einmalig aus `_work/copy-final.json` generiert (`_work/build_html.py`); wer lieber die JSON pflegt, baut danach neu:

```bash
cd _work && COPY=copy-final.json PIZZA=pizza-final.svg python3 build_html.py
```

## Aufbau der Seite
- **Pizza-Navigation:** Die Pizza (Inline-SVG, 8 Gruppen `g.slice`) steht links fest (auf dem Handy oben). Beim Scrollen wird der passende Bereich aktiv, die Pizza dreht das Stück zur Textspalte und zieht es mit Käsefäden heraus. Hover zieht halb heraus, Klick/Tap springt zum Bereich. Logik in `main.js` (`createPizza`, `createScrollDirector`).
- **Hintergrund:** `bg.css` + der Block `<div class="bg-pattern">` in `index.html` – 54 driftende Tomaten, Basilikumblätter, Oliven, Mehlpunkte (nur `transform` animiert, aus bei „Bewegung reduzieren“).
- **Bereiche (8 Achtel):** Konzept · Leistungen · Pizzen · Ablauf · Team · Q&A · Buchung · Kontakt.
- **Anfrageformular:** baut eine E-Mail (`mailto:`) bzw. eine WhatsApp-Nachricht aus den Feldern – kein Server nötig.

## Prüfstand
Die Seite wurde in Headless-Chrome auf 390×844 (iPhone), 844×390 (quer), 768×1024, 1024×768, 1280×800 und 1600×900 geprüft, außerdem Tastaturbedienung, „Bewegung reduzieren“ und ein sechsköpfiges Review-Panel (Marke, Bewegung, Mobil, Text, Barrierefreiheit, Robustheit) mit anschließender Verifikation. Bestätigte Punkte sind eingearbeitet.

## Veröffentlichen
Der ganze Ordner (ohne `_work`) kann 1:1 auf jeden statischen Hoster: Cloudflare Pages, GitHub Pages, Netlify oder ein normales Webhosting per FTP.

## Ordner `_work`
Werkzeuge und Zwischenstände: Copy-Varianten und Jury-Ergebnisse, Pizza-Generator (`gen_pizza_final.py`), Hintergrund-Varianten, `shot.py` (Screenshots per Headless-Chrome), `sync_preview.sh`. Für die Website selbst nicht nötig.
