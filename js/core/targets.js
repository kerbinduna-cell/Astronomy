"use strict";
// ================= Showcase-Ziele =================
// Zusätzliche Nebel außerhalb des Messier-Katalogs (J2000, Grad) und Empfehlungen für die Ziel-Liste am Laptop.
const EXTRA_DSO=[
 // id, RA°, Dec°, Typ, Gesamthelligkeit, Größe a×b (′), englischer/alternativer Name
 ['B33',85.245,-2.458,'en',7.3,'60x45','Horsehead, IC 434, Flammennebel NGC 2024'],
 ['NGC2237',97.98,5.05,'en',9.0,'80x60','Rosette Nebula, NGC 2244'],
 ['IC1805',38.18,61.45,'en',6.5,'150x150','Heart Nebula'],
 ['IC1848',42.75,60.43,'en',6.5,'150x75','Soul Nebula'],
 ['NGC7000',314.82,44.52,'en',4.0,'120x100','North America Nebula'],
 ['IC5070',312.75,44.37,'en',8.0,'60x50','Pelican Nebula'],
 ['NGC6992',314.1,31.72,'snr',7.0,'60x8','Eastern Veil Nebula'],
 ['NGC6960',311.42,30.72,'snr',7.0,'70x6',"Western Veil, Witch's Broom"],
 ['NGC1499',60.83,36.42,'en',6.0,'145x40','California Nebula'],
 ['NGC7635',350.2,61.2,'en',10.0,'15x8','Bubble Nebula'],
 ['NGC6888',303.03,38.35,'en',7.4,'18x13','Crescent Nebula'],
 ['IC1396',324.78,57.5,'en',3.5,'170x140',"Elephant's Trunk"]];
for(const[id,ra,dec,type,mag,dim,alt]of EXTRA_DSO){const d=dim.split('x').map(Number);MES[id]={id,ra0:ra*D2R,dec0:dec*D2R,type,mag,a:d[0],b:d[1],alt}}
Object.assign(DE_NAMES,{B33:'Pferdekopfnebel',NGC2237:'Rosettennebel',IC1805:'Herznebel',IC1848:'Seelennebel',NGC7000:'Nordamerikanebel',IC5070:'Pelikannebel',
 NGC6992:'Östlicher Schleiernebel',NGC6960:'Westlicher Schleiernebel (Hexenbesen)',NGC1499:'Kaliforniennebel',NGC7635:'Blasennebel',NGC6888:'Mondsichelnebel',IC1396:'Elefantenrüssel-Nebel',
 M78:'Reflexionsnebel M78',M63:'Sonnenblumen-Galaxie',M64:'Black-Eye-Galaxie',M97:'Eulennebel',M3:'Kugelsternhaufen M3',M92:'Kugelsternhaufen M92'});

// Empfehlungen: Ziel, Brennweite von–bis (mm), Tipp
const SHOW=[
 ['moon',null,'Mond',[300,3000],'Am schönsten am Terminator, der Licht-Schatten-Grenze. Sehr kurz belichten (1/250–1/2000 s).'],
 ['jupiter',null,'Jupiter',[1500,6000],'Lange Brennweite (Barlowlinse), Planetenkamera, viele Videobilder. Die vier Galileischen Monde wandern von Stunde zu Stunde, der Große Rote Fleck dreht sich in 10 h einmal herum.'],
 ['saturn',null,'Saturn',[1500,6000],'Wie Jupiter. Die Ringe stehen 2026 noch fast auf der Kante. Titan ist als heller Punkt daneben zu sehen.'],
 ['mars',null,'Mars',[2000,6000],'Klein und wechselhaft. Polkappe und dunkle Gebiete brauchen ruhige Luft.'],
 ['M42',null,'Orionnebel',[200,1000],'Hell genug für jede Ausrüstung. Der Kern brennt schnell aus: kurze und lange Belichtungen kombinieren.'],
 ['B33',null,'Pferdekopfnebel & Flamme',[300,1000],'Lichtschwach und fast nur rot (H-alpha). Mit normaler Kamera mühsam, mit Hα-Filter oder modifizierter Kamera ein Klassiker.'],
 ['M31',null,'Andromedagalaxie',[135,600],'Über 3° groß. Mit einem Teleobjektiv oder kurzem Refraktor passt sie ins Bild.'],
 ['M45',null,'Plejaden',[135,600],'Blauer Reflexionsnebel um die Sterne. Braucht dunklen Himmel und lange Belichtung.'],
 ['NGC2237',null,'Rosettennebel',[300,800],'Großer Ring aus Gas. Mit Dualband- oder Schmalbandfiltern auch aus der Stadt möglich.'],
 ['IC1805',null,'Herznebel',[135,400],'Sehr groß. Kurze Brennweite, Hα-Filter. Daneben liegt der Seelennebel.'],
 ['IC1848',null,'Seelennebel',[135,400],'Zusammen mit dem Herznebel ein bekanntes Mosaik-Motiv.'],
 ['NGC7000',null,'Nordamerikanebel',[135,500],'Die „Cygnus Wall“ ist das Detailmotiv. Im SHO-Hubble-Look besonders schön.'],
 ['IC5070',null,'Pelikannebel',[300,1000],'Kopf und Hals des Pelikans leuchten in OIII und Hα.'],
 ['NGC6992',null,'Schleiernebel (Ost)',[300,1000],'Feine Filamente einer Supernova. OIII-Filter bringt die blaugrünen Fäden.'],
 ['NGC6960',null,'Schleiernebel (Hexenbesen)',[300,1000],'Läuft durch den hellen Stern 52 Cygni.'],
 ['NGC1499',null,'Kaliforniennebel',[135,500],'Langer roter Streifen. Fast nur H-alpha.'],
 ['IC1396',null,'Elefantenrüssel',[200,800],'Riesige Hα-Wolke mit dunklem „Rüssel“. Im Detail mit 600–1000 mm.'],
 ['NGC7635',null,'Blasennebel',[800,2000],'Klein: braucht lange Brennweite. Die Blase leuchtet in OIII.'],
 ['NGC6888',null,'Mondsichelnebel',[600,1500],'Hα-Sichel mit zarter OIII-Hülle außen herum.'],
 ['M51',null,'Whirlpool-Galaxie',[800,2000],'Spiralarme mit rosa Sternentstehungsgebieten.'],
 ['M81',null,'Bodes Galaxie & Zigarre',[500,1000],'M81 und M82 passen zusammen ins Bild.'],
 ['M33',null,'Dreiecksgalaxie',[300,800],'Groß und flächig: dunkler Himmel hilft mehr als Brennweite.'],
 ['M13',null,'Herkules-Kugelsternhaufen',[600,1500],'Hunderttausende Sterne. Kurze Einzelbelichtungen, damit der Kern nicht ausbrennt.'],
 ['M57',null,'Ringnebel',[1500,3000],'Winzig, aber hell. OIII innen, H-alpha außen.'],
 ['M27',null,'Hantelnebel',[800,2000],'Der hellste planetarische Nebel. HOO-Palette lohnt sich.'],
 ['M8',null,'Lagunennebel',[300,1000],'Sommerziel, tief im Süden.'],
 ['M16',null,'Adlernebel',[600,1500],'Die „Säulen der Schöpfung“ im Zentrum. Klassisches Hubble-Motiv in SHO.'],
 ['M20',null,'Trifidnebel',[600,1500],'Rot und blau nebeneinander: Emission und Reflexion.'],
 ['M1',null,'Krebsnebel',[1000,2500],'Supernova-Überrest von 1054. Rote Filamente um einen bläulichen Kern.']];
