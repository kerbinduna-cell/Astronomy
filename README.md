# Nacht am Berg – Astrofoto-Simulator

Ein Lern-Simulator für Astrofotografie im Browser. Du stehst nachts auf einem Berg, packst die Ausrüstung aus dem Kofferraum, stellst die Montierung auf, nordest ein, suchst Ziele am Laptop, fokussierst, fotografierst – und bearbeitest die Rohdaten danach am Laptop zu fertigen Bildern.

Läuft auf PC und iPad, als installierbare Web-App auch offline.

## Starten

- **Online:** über GitHub Pages (Einstellungen → Pages → Branch `main`, Ordner `/`). Danach unter `https://<nutzer>.github.io/<repo>/`.
- **Lokal:** im Projektordner `python3 -m http.server 8000` und `http://localhost:8000` öffnen. (Direkt per Doppelklick geht nicht, weil der Browser dann keine Skripte nachlädt.)
- **iPad:** Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“. Startet dann im Vollbild und funktioniert auch ohne Netz.

## Was drin ist

- **Echter Himmel:** Hipparcos-Sterne bis 6 mag, Messier-Objekte und 12 bekannte Nebel (Pferdekopf, Rosette, Herz, Seele, Nordamerika, Pelikan, Schleier, Kalifornien, Blase, Mondsichel, Elefantenrüssel), Planeten, Mond, Milchstraße – für jeden Ort und jedes Datum.
- **3D-Szene:** Auto, drei Tische, Stativ mit Montierung und Teleskop, das tatsächlich dorthin zeigt, wohin es ausgerichtet ist.
- **Aufbau:** Libelle, Kompass mit Missweisung, Polhöhe, Polsucher mit Polarstern-Uhr, Teilkreise, Nachführmotor – alles mit Drehreglern.
- **Optik & Kamera:** vom Galileo-Fernrohr bis zum Apochromaten, vom Handy am Okular bis zur gekühlten Mono-Astrokamera; Barlowlinse, Dualband-Filter, Filterrad mit LRGB und Hα/OIII/SII.
- **Bildsimulation:** physikalisch angelehnt – Photonenrauschen, Ausleserauschen, Himmelshelligkeit (Bortle), Mond, Nachführfehler, Bildfelddrehung, Fokus, Seeing, Lucky Imaging bei Planeten, Jupitermonde und Großer Roter Fleck.
- **Nebel-Engine:** Gasnebel aus getrennten Emissionslinien (Hα, OIII, SII), Reflexionsnebeln und Staub mit verwirbeltem Rauschen.
- **Bearbeitung am Laptop:** Rohdaten je Ziel und Filter stapeln, Hintergrund glätten, strecken, Farbkombination (RGB, LRGB, HOO, SHO/Hubble), Grünstich entfernen, ins Fotoalbum übernehmen.
- **Tutorial:** 8 Kapitel nach dem echten Ablauf einer Beobachtungsnacht, zuschaltbare Hilfen im HUD.

## Aufbau des Codes

Reines HTML/CSS/JavaScript ohne Build-Schritt. Die Skripte werden in `index.html` der Reihe nach geladen und teilen sich einen globalen Namensraum.

```
index.html            Oberfläche (Fenster, HUD), lädt alle Skripte
css/app.css           Gestaltung, Touch-Anpassungen
js/catalog.js         Sternkatalog, Sternbilder, Messier (aus d3-celestial)
js/core/astro.js      Koordinaten, Zeit, Präzession, Planeten, Mond
js/core/gear.js       Orte, Ausrüstung, Optik-Kennzahlen, Zustand
js/core/targets.js    zusätzliche Nebel, Empfehlungen für die Ziel-Liste
js/core/nebula.js     Nebel-Engine, Rezepte der Showcase-Objekte, Jupitermonde
js/core/imaging.js    Bildsimulation, Filter, Mond, Planeten, Diagnose, Rohdaten
js/ui/*.js            Sternkarte, Lexikon, Ausrüstung, Aufbau, Galerie, Teleskop, Kamera, Bearbeitung, Ziel-Liste, Drehregler
js/scene/*.js         3D-Welt (three.js) und Teleskop-Modell
js/app/*.js           Zustand, Eingabe, Fenster, HUD, Tutorial, Hauptschleife
sw.js, manifest.webmanifest, icons/   Offline-Web-App
tools/build_single.py Einzeldatei-Version bauen (für Vorschauen)
```

Nach Änderungen an Dateien die Versionsnummer `VERSION` in `sw.js` erhöhen, damit installierte Apps die neue Fassung laden.

## Grenzen

Planeten- und Mondpositionen sind vereinfacht (Genauigkeit etwa 1°). Schwache Hintergrundsterne in Fotos und im Okular sind statistisch verteilt. Nebel sind nachgebildet, keine Fotos. Preise der Ausrüstung sind grobe Richtwerte.

## Geplant

- Goto-Alignment mit Sternen, Sucher justieren, Ausbalancieren
- Plate Solving und Autoguiding mit Guiding-Kurve, Meridian-Flip
- Garten-Säule mit mehreren Setups gleichzeitig und Sequenzer
- Sternwarte (Kuppel, Steuerraum) und Remote-Sternwarte am Südhimmel

## Quellen und Lizenzen

- Sternkatalog, Sternbilder, Messier-Daten: [d3-celestial](https://github.com/ofrohn/d3-celestial) von Olaf Frohn (BSD-3-Clause, siehe `vendor/LICENSE-d3-celestial.txt`)
- 3D: [three.js](https://threejs.org) r128 (MIT, siehe `vendor/LICENSE-three.txt`)
- Planetenbahnen: Näherungselemente nach E. M. Standish (JPL); Jupitermonde nach J. Meeus, *Astronomical Algorithms*, Kap. 44
