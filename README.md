# Austria through Fourier

**Interaktive Animation der österreichischen Staatsgrenze durch zwei voneinander unabhängige Fourier-Epizykelketten.**

[GitHub Pages – nach Aktivierung](https://j0hnhaas.github.io/austria-through-fourier/)

## Konzept

Wie in der Animation „Italy through Fourier“ von Everything Math wird die geschlossene Landesgrenze durch eine Paarung von Koordinatenfunktionen beschrieben:

```text
x(t) = a0_x + Σₖ [a_k,x · cos(k t) + b_k,x · sin(k t)]
y(t) = a0_y + Σₖ [a_k,y · cos(k t) + b_k,y · sin(k t)]
```

Die **obere gelbe Kette** liefert die horizontale Position, die **linke mintfarbene Kette** die vertikale Position. Ein weißer Stift am Schnittpunkt ihrer Führungsprojektionen zeichnet die Grenze. Jede Harmonische wird als ein rotierender Vektor mit dem Radius `√(a²+b²)` dargestellt.

Das Modell ist **keine physikalische Pendelsimulation**, sondern die geometrische Visualisierung einer diskreten Fourier-Reihe. Bei `N = 1` entstehen wegen der beiden reinen Grundschwingungen Ellipsen; mit höheren Harmonischen werden weitere Grenzdetails erkennbar.

## Bedienung

- **Harmonische N (1–100):** Pro Achse N rotierende Vektoren, also insgesamt `2N`.
- **Voreinstellungen:** 1 / 8 / 25 / 50 / 100.
- **Geschwindigkeit:** 0,25 bis 3×; ein vollständiger Umlauf benötigt bei 1× ca. 22 Sekunden.
- **Pause, Neustart und Scrubbing** entlang der geschlossenen Kurve.
- **Originalkontur**, **Kreise und Arme**, **Hilfslinien** einzeln ein-/ausblendbar.
- **Vollbild** für Präsentationen.

### Fehlerdefinition

Für die 1.024 gleichmäßig entlang des Grenzumrisses abgetasteten Punkte ist der angezeigte Wert

```text
Fehler [%] = 100 × √[Σᵢ ((xᵢ−x̂ᵢ)²+(yᵢ−ŷᵢ)²) / M] / d
```

mit `M = 1024` und `d` als Diagonale des Bounding-Box-Rechtecks der Originalkontur.

Der Fehler entspricht *nicht notwendigerweise* der Definition im Referenzvideo. Die Fourier-Koeffizienten werden für x(t) und y(t) separat per diskreter Fourier-Zerlegung bestimmt.

## Datengrundlage

Die Grenze wird aus 1:10m-Landes- und Bundesländer-Geometrien von [Natural Earth](https://www.naturalearthdata.com/) gewonnen, über [BenPortner/geojson-atlas](https://github.com/BenPortner/geojson-atlas/blob/main/geojson/natural_earth/countries/10m/AT.geojson).

Die neun Bundesländer-Polygone wurden entlang identischer gemeinsamer Kanten vereinigt, sodass nur die äußere Kontur verbleibt: **1.103 Grenzpunkte**, gespeichert in `outline.js`. Durch eine längentreue Abtastung mit 1.024 Punkten werden Unebenheiten der ursprünglichen Vertexverteilung für die Fourier-Analyse vermieden. Für die Visualisierung wird eine einfache equirektanguläre Projektion mit Breitenkorrektur `cos(47,7°)` verwendet.

**Datenlizenz:** Natural Earth und GeoJSON Atlas sind gemeinfrei bzw. CC0. Quellenangabe dennoch erwünscht. Die Grenzlinie ist schematisch/generalisiert, nicht für rechtliche oder vermessungstechnische Zwecke gedacht.

## Projektstruktur

```text
index.html                 Interface und Steuerung
style.css                  Dark-Mode-Design, responsives Layout
app.js                     Fourier-Analyse, Canvas-Animation und UI
outline.js                 Österreich-Grenzkontur (CC0-Daten)
.github/workflows/pages.yml  Veröffentlichungsworkflow
```

Es gibt keine npm-Pakete, kein Bundling, keine Cookies, keine Analysedienste und keine externen Runtime-Anfragen.

## GitHub Pages einrichten

Der Veröffentlichungsworkflow ist unter `.github/workflows/pages.yml` vorbereitet und wird bei jedem Push auf `main` ausgeführt. Für das **erste Deployment** muss in den Repository-Einstellungen ggf. einmalig Folgendes gewählt werden:

1. **Settings → Pages**
2. **Build and deployment → Source → GitHub Actions**
3. Im Tab **Actions** den Lauf **Publish Austria through Fourier** abwarten oder unter **Run workflow** neu starten.

Danach ist die Seite normalerweise unter <https://j0hnhaas.github.io/austria-through-fourier/> abrufbar.

## Lokal ansehen

Da die Website ausschließlich lokale JavaScript- und CSS-Dateien verwendet, reicht grundsätzlich das Öffnen der `index.html` im Browser. Alternativ kann im Repository-Verzeichnis ein lokaler HTTP-Server gestartet werden:

```bash
python3 -m http.server 8000
```

Anschließend <http://localhost:8000> öffnen.

## Lizenz

Die Programmdateien unterliegen der im Repository vorhandenen `LICENSE` (MIT); die Geodaten in `outline.js` sind aus gemeinfreien/CC0-Quellen abgeleitet.

---

Dieses Projekt ist eine eigenständige Umsetzung des didaktischen Visualisierungsprinzips. Es verwendet weder Code noch Videomaterial des ursprünglichen Shorts.
