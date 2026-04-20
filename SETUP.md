# EPS Converter — Setup op Render.com (gratis)

Deze microservice converteert EPS-bestanden naar 300 DPI PNG met Ghostscript. De Gang Sheet Builder stuurt EPS-bestanden naar dit endpoint wanneer ze niet direct in de browser geopend kunnen worden.

## Stap 1: Nieuwe GitHub repository

1. Ga naar **github.com** → **+** → **New repository**
2. Naam: `eps-converter`
3. **Public** aanvinken
4. **Create repository**
5. Upload deze 3 bestanden via "uploading an existing file":
   - `server.js`
   - `package.json`
   - `Dockerfile`
6. Commit

## Stap 2: Render.com account + service

1. Ga naar **render.com** en maak een gratis account (kan met je GitHub account)
2. Klik **New** → **Web Service**
3. Koppel je GitHub account als dat nog niet is gedaan
4. Selecteer de `eps-converter` repository
5. Vul in:
   - **Name:** `eps-converter-transferpersshop`
   - **Region:** Frankfurt (EU) — dichtste bij NL
   - **Runtime:** Docker
   - **Instance Type:** Free
6. Klik **Create Web Service**

Render bouwt nu de Docker container (~2 minuten). Als het klaar is krijg je een URL, bijvoorbeeld:
`https://eps-converter-transferpersshop.onrender.com`

## Stap 3: URL invullen in de Gang Sheet Builder

Open `app.js` in je gangsheet-builder repo en zoek naar:

```javascript
const EPS_CONVERTER_URL = 'https://eps-converter-transferpersshop.onrender.com/convert';
```

Vervang de URL door jouw Render.com URL + `/convert` erachter. Commit de wijziging.

## Testen

Stuur een test-request:

```bash
curl -X POST -F "file=@mijn-logo.eps" https://eps-converter-transferpersshop.onrender.com/convert -o output.png
```

Of upload gewoon een EPS-bestand in de Gang Sheet Builder — als het werkt verschijnt het logo op het vel.

## Render.com gratis tier

- **750 uur/maand** — meer dan genoeg (een maand = 720 uur)
- De service gaat in slaap na 15 minuten inactiviteit
- Eerste request na slaapstand duurt ~30-60 seconden (cold start)
- Daarna is elke conversie ~2-5 seconden

**Tip:** als de cold start te lang duurt voor je klanten, kan je later upgraden naar de Starter tier ($7/maand) die altijd aan staat.
