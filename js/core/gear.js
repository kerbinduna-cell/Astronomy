"use strict";
// ================= Daten: Orte, Ausrüstung =================
const LOCS=[{n:'Frankfurt (Innenstadt)',lat:50.11,lon:8.68,b:8,see:2.8},{n:'Taunus, Großer Feldberg',lat:50.23,lon:8.46,b:5,see:2.4},{n:'Eifel, Sternenpark',lat:50.55,lon:6.43,b:3,see:2.5},
 {n:'Zürich (Stadt)',lat:47.37,lon:8.54,b:8,see:2.6},{n:'Alpen, Gornergrat (3100 m)',lat:45.98,lon:7.78,b:2,see:1.5},{n:'Eigener Standort',lat:50.0,lon:8.0,b:6,see:2.5}];
const BORTLE=[[1,'1 – perfekt dunkel',22.0],[2,'2 – sehr dunkel',21.9],[3,'3 – ländlich',21.6],[4,'4 – Land/Vorort',21.1],[5,'5 – Vorort',20.6],[6,'6 – heller Vorort',20.0],[7,'7 – Stadtrand',19.4],[8,'8 – Stadt',18.8],[9,'9 – Innenstadt',18.0]];
const GEAR={
 optic:{label:'Optik',term:'oeffnung',items:[
  {id:'galileo',n:'Galileo-Fernrohr 30/400',D:30,f:400,ca:2.2,obst:0,w:0.6,p:'30–80 €',spec:'Linsenfernrohr mit einfacher Linse',d:'So in etwa hat Galileo 1610 die Jupitermonde entdeckt: eine einfache Sammellinse, kleine Öffnung. Starke Farbsäume (chromatische Aberration), wenig Licht. Gut, um zu verstehen, warum Öffnung zählt.'},
  {id:'lens24',n:'Kameraobjektiv 24 mm f/2.8',D:8.6,f:24,ca:0.3,obst:0,w:0.4,lens:true,p:'150–500 €',spec:'Weitwinkel',d:'Für Milchstraße und Sternbilder. Riesiges Gesichtsfeld, deshalb verzeiht es kleine Nachführfehler. Nur mit Kamera direkt (nicht am Okular).'},
  {id:'lens200',n:'Teleobjektiv 200 mm f/4',D:50,f:200,ca:0.5,obst:0,w:0.8,lens:true,p:'300–900 €',spec:'Tele',d:'Klassischer Einstieg in Deep-Sky auf dem Star Tracker: Orionnebel, Andromeda, Plejaden passen gut ins Bild.'},
  {id:'achro80',n:'Refraktor 80/480 (Achromat)',D:80,f:480,ca:1.0,obst:0,w:2.5,p:'200–400 €',spec:'Linsenteleskop, 2 Linsen',d:'Günstiger Linsenrefraktor. Scharf und robust, aber helle Sterne bekommen einen blauvioletten Saum, weil nicht alle Farben im selben Punkt landen.'},
  {id:'newt130',n:'Newton 130/650',D:130,f:650,ca:0,obst:0.35,spikes:true,w:4.5,p:'200–400 €',spec:'Spiegelteleskop',d:'Viel Öffnung fürs Geld, keine Farbfehler. Die Halterung des Fangspiegels erzeugt die typischen Beugungskreuze an hellen Sternen. Schwerer und windanfälliger.'},
  {id:'apo72',n:'Apo-Refraktor 72/420 ED',D:72,f:420,ca:0.12,obst:0,w:2.0,p:'400–800 €',spec:'Linsenteleskop mit Spezialglas',d:'Der Klassiker für Deep-Sky-Fotografie: ED-Glas korrigiert die Farbfehler fast vollständig, leicht, kurze Brennweite. Verzeiht Nachführfehler eher als lange Brennweiten.'},
  {id:'sct203',n:'Schmidt-Cassegrain 203/2032',D:203,f:2032,ca:0,obst:0.34,w:5.7,p:'1300–2200 €',spec:'Spiegel-Linsen-System, lang',d:'Lange Brennweite in kurzem Tubus. Ideal für Planeten und Mond. Für Deep-Sky schwierig: winziges Gesichtsfeld, jeder Nachführfehler wird 10-fach sichtbar.'}]},
 camera:{label:'Kamera / Auge',term:'afokal',items:[
  {id:'eye',n:'Auge (visuell)',mode:'eye',w:0,p:'0 €',spec:'Blick durchs Okular',d:'Kein Foto, sondern Beobachten. Das Auge sammelt nur Bruchteile einer Sekunde Licht. Deshalb sieht man Nebel visuell viel schwächer und farblos.'},
  {id:'phone',n:'Smartphone am Okular',mode:'afocal',sw:6.4,sh:4.8,px:1.0,qe:0.55,rn:2.2,fw:5000,bits:10,g0:0.08,lf:4.5,ha:0.3,isoMax:3200,tMax:30,dark:0.05,w:0.25,p:'Adapter 20–50 €',spec:'afokal, 1/2,5″-Sensor',d:'Handy-Kamera direkt hinters Okular halten bzw. mit Adapter klemmen. Super für Mond und Planeten, für Deep-Sky fehlt die lange Belichtung.'},
  {id:'dslrAf',n:'Spiegelreflex am Okular (afokal)',mode:'afocal',sw:22.3,sh:14.9,px:4.3,qe:0.45,rn:3,fw:25000,bits:14,g0:0.0625,lf:50,ha:0.25,isoMax:6400,tMax:600,dark:0.15,w:1.2,p:'Kamera vorhanden',spec:'afokal, 50-mm-Objektiv',d:'Kamera mit eigenem Objektiv hinters Okular. Funktioniert, aber das Okular schneidet einen Kreis aus und die Bildqualität leidet am Rand.'},
  {id:'dslr',n:'Spiegelreflex (APS-C) im Primärfokus',mode:'prime',sw:22.3,sh:14.9,px:4.3,qe:0.45,rn:3,fw:25000,bits:14,g0:0.0625,ha:0.25,isoMax:6400,tMax:600,dark:0.15,w:0.7,p:'gebraucht 200–500 € + T2-Adapter',spec:'APS-C, 24 MP',d:'Objektiv ab, Kamera per T2-Ring direkt ans Teleskop: Das Teleskop wird zum Teleobjektiv. Der Infrarot-Sperrfilter der Kamera schluckt aber viel vom roten H-alpha-Licht der Nebel.'},
  {id:'ff',n:'Spiegellose Vollformat, astromodifiziert',mode:'prime',sw:36,sh:24,px:5.9,qe:0.6,rn:1.6,fw:50000,bits:14,g0:0.0625,ha:0.95,isoMax:6400,tMax:600,dark:0.08,w:0.7,p:'1000–2500 €',spec:'Vollformat, 24 MP, Filter getauscht',d:'Großer Sensor, wenig Rauschen. „Astromodifiziert“ heißt: Der IR-Sperrfilter wurde gegen einen durchlässigeren getauscht, rote Nebel werden deutlich heller.'},
  {id:'astro',n:'Gekühlte Astrokamera (Farbe)',mode:'prime',sw:23.5,sh:15.7,px:3.76,qe:0.8,rn:1.0,fw:50000,bits:16,g0:0.25,gainMode:true,ha:1.0,tMax:900,dark:0.002,w:0.8,p:'1500–2200 €',spec:'APS-C, auf −10 °C gekühlt',d:'Sensor wird gekühlt, dadurch fast kein Wärmerauschen. Hohe Empfindlichkeit, kein IR-Filter im Weg. Braucht Laptop oder Steuerrechner.'},
  {id:'mono',n:'Gekühlte Astrokamera (Mono)',mode:'prime',mono:true,sw:23.5,sh:15.7,px:3.76,qe:0.9,rn:1.0,fw:50000,bits:16,g0:0.25,gainMode:true,ha:1.0,tMax:900,dark:0.002,w:0.8,p:'1800–2600 €',spec:'Schwarzweiß, für Filter',d:'Ohne Farbmaske: Jedes Pixel bekommt alles Licht. Farbe entsteht erst durch Filter (Rot, Grün, Blau oder Schmalband H-alpha, OIII, SII), die man nacheinander aufnimmt und am Laptop kombiniert. So entstehen die Bilder im Hubble-Look.'},
  {id:'planet',n:'Planetenkamera',mode:'prime',sw:5.6,sh:3.2,px:2.9,qe:0.8,rn:0.8,fw:12000,bits:12,g0:0.25,gainMode:true,ha:0.9,tMax:30,dark:0.01,w:0.1,p:'150–350 €',spec:'kleiner, schneller Sensor',d:'Kleiner Sensor mit kleinen Pixeln, gemacht für Videos mit hunderten Bildern pro Sekunde (Lucky Imaging). Für Planeten an langer Brennweite.'}]},
 mount:{label:'Montierung',term:'montierung',items:[
  {id:'tripod',n:'Fotostativ',track:'none',load:3,pe:0,p:'50–150 €',spec:'keine Nachführung',d:'Hält still, mehr nicht. Die Erde dreht sich, die Sterne wandern durchs Bild. Lange Belichtungen ergeben Strichspuren. Faustregel: 500er-Regel.'},
  {id:'altaz',n:'Azimutale Goto-Montierung',track:'altaz',load:7,pe:8,p:'300–600 €',spec:'fährt Ziele an, dreht hoch/seitlich',d:'Bewegt sich in Höhe und Azimut und fährt Ziele automatisch an. Folgt den Sternen, aber das Bildfeld dreht sich dabei (Bildfelddrehung). Für Planeten und kurze Belichtungen okay.'},
  {id:'tracker',n:'Star Tracker',track:'eq',load:3,pe:22,p:'300–600 €',spec:'kleine parallaktische Nachführung',d:'Kleine Nachführung für Kamera plus Objektiv. Muss eingenordet werden. Gut bis etwa 200–300 mm Brennweite.'},
  {id:'eq',n:'Parallaktische Montierung (EQ) mit Goto',track:'eq',load:14,pe:12,p:'1000–2000 €',spec:'Standard für Deep-Sky',d:'Eine Achse steht parallel zur Erdachse, dadurch reicht eine Drehung, um den Sternen zu folgen, ohne Bildfelddrehung. Braucht gute Polausrichtung und Gegengewicht.'}]},
 focus:{label:'Fokussierung',term:'fokus',items:[
  {id:'hand',n:'Von Hand nach Gefühl',p:'0 €',spec:'Stern möglichst klein drehen',d:'Am Fokussierrad drehen, bis der Stern am kleinsten aussieht. Funktioniert, ist aber ungenau.'},
  {id:'bahtinov',n:'Bahtinov-Maske',p:'15–30 €',spec:'Maske vor der Öffnung',d:'Eine Maske mit Schlitzen vor dem Teleskop erzeugt drei Lichtstrahlen. Steht der mittlere genau zwischen den beiden anderen, ist der Fokus perfekt.'},
  {id:'motor',n:'Motorfokus mit Autofokus',p:'150–400 €',spec:'Software stellt scharf',d:'Ein Motor dreht den Fokussierer, die Software misst die Sterngröße und stellt automatisch scharf, auch nachts, wenn es kälter wird und sich der Tubus zusammenzieht.'}]},
};
const ACC=[{id:'lp',n:'Lichtverschmutzungsfilter',p:'80–250 €',term:'lpfilter',d:'Blockt typische Lampenfarben und lässt die Farben der Nebel durch. Hilft in der Stadt etwas, vor allem bei Emissionsnebeln.'},
 {id:'dual',n:'Dualband-Filter (Hα + OIII)',p:'150–350 €',term:'dualband',d:'Lässt nur zwei schmale Farben durch: das Rot von Wasserstoff und das Blaugrün von Sauerstoff. Der Himmel wird fast schwarz, Nebel leuchten trotzdem. Für Farbkameras, ideal in der Stadt.'},
 {id:'fw',n:'Filterrad mit LRGB + Hα/OIII/SII',p:'800–1500 €',term:'schmalband',d:'Für die Mono-Kamera: sieben Filter zum Durchschalten. Aus Hα, OIII und SII entsteht die Hubble-Palette (SHO).'},
 {id:'barlow',n:'Barlowlinse 2,5×',p:'60–200 €',term:'barlow',d:'Verlängert die Brennweite um das 2,5-fache. Für Planeten und Mondkrater.'},
 {id:'pol',n:'Polsucher',p:'oft dabei, sonst 50–150 €',term:'polsucher',d:'Kleines Fernrohr in der Polachse. Damit siehst du den Polarstern und kannst die Montierung genau ausrichten.'},
 {id:'guide',n:'Autoguiding (Leitrohr + Kamera)',p:'200–400 €',term:'autoguiding',d:'Zweite kleine Kamera beobachtet einen Stern und korrigiert die Montierung jede Sekunde. Gleicht Getriebefehler und kleine Polfehler aus.'}];
const EYEP=[{id:25,n:'25 mm (Übersicht)',af:52},{id:10,n:'10 mm (mittel)',af:52},{id:6,n:'6 mm (stark)',af:60}];
const PRESETS=[{n:'Wie Galileo',g:{optic:'galileo',camera:'eye',mount:'tripod',focus:'hand'},acc:[],ep:25},
 {n:'Handy am Teleskop',g:{optic:'achro80',camera:'phone',mount:'altaz',focus:'hand'},acc:[],ep:10},
 {n:'Spiegelreflex vors Okular',g:{optic:'achro80',camera:'dslrAf',mount:'tripod',focus:'hand'},acc:[],ep:10},
 {n:'Weitfeld: Tracker + 200 mm',g:{optic:'lens200',camera:'dslr',mount:'tracker',focus:'hand'},acc:['pol'],ep:25},
 {n:'Deep-Sky Einsteiger',g:{optic:'apo72',camera:'dslr',mount:'eq',focus:'bahtinov'},acc:['pol'],ep:25},
 {n:'Planeten',g:{optic:'sct203',camera:'planet',mount:'altaz',focus:'hand'},acc:[],ep:10},
 {n:'Stadt-Nebel (Dualband)',g:{optic:'apo72',camera:'astro',mount:'eq',focus:'motor'},acc:['pol','guide','dual'],ep:25},
 {n:'Hubble-Look (Mono + Filterrad)',g:{optic:'apo72',camera:'mono',mount:'eq',focus:'motor'},acc:['pol','guide','fw'],ep:25},
 {n:'Planeten-Profi',g:{optic:'sct203',camera:'planet',mount:'eq',focus:'motor'},acc:['pol','barlow'],ep:10}];
const ISO_LIST=[100,200,400,800,1600,3200,6400],GAIN_LIST=[0,50,100,150,200,250,300],EXP_LIST=[1/4000,1/2000,1/1000,1/500,1/250,1/125,1/60,1/30,1/15,1/8,1/4,1/2,1,2,4,8,15,30,60,120,180,300,600],NFR=[1,2,4,8,16,32,64,128,256];
const DECL=3.2; // Missweisung (ca., Mitteleuropa 2026)

// ================= Zustand =================
const S={loc:{...LOCS[1]},locIdx:1,date:new Date(),
 view:{az:180*D2R,alt:30*D2R,fov:100,mode:'in',yaw:-35*D2R,pitch:28*D2R},
 layers:{altaz:true,eq:false,cons:true,names:true,messier:true,mw:true,fov:true},
 gear:{optic:'apo72',camera:'dslr',mount:'eq',focus:'bahtinov'},acc:new Set(['pol']),ep:25,
 setup:{},shot:{target:'dso:M42',foc:0,trueFoc:0,focT:0,exp:17,iso:3,nfr:0,dark:false,flat:false,stretch:true,baht:false},
 sel:null,play:false,last:null};
function newSetup(){const r=Math.random;S.setup={legN:(r()-.5)*5,legE:(r()-.5)*5,head:(r()-.5)*14,altS:45,fAz:(r()-.5)*1.2,fAlt:(r()-.5)*1.2};}
function newFocus(){S.shot.trueFoc=Math.round((Math.random()-.5)*500);S.shot.foc=0;S.shot.focT=JD(S.date)}
newSetup();newFocus();

const G=()=>({optic:GEAR.optic.items.find(x=>x.id===S.gear.optic),camera:GEAR.camera.items.find(x=>x.id===S.gear.camera),mount:GEAR.mount.items.find(x=>x.id===S.gear.mount),focus:GEAR.focus.items.find(x=>x.id===S.gear.focus)});
// Optische Kennzahlen des aktuellen Setups
function optics(){const g=G(),o0=g.optic,c=g.camera,ep=EYEP.find(e=>e.id===S.ep);const o={...o0,f:o0.f*(S.acc.has('barlow')&&!o0.lens?2.5:1)};const r={D:o.D,fTel:o0.f,N:o0.f/o.D,mode:c.mode};
 if(o.lens&&c.mode!=='prime'){r.mode='prime';r.lensFix=true}
 const cam=c.mode==='eye'?null:c;
 if(r.mode==='eye'){r.mag=o.f/ep.id;r.trueField=ep.af/r.mag;r.fovW=r.trueField*3600;r.fovH=r.fovW;r.circle=r.fovW/2;r.fEff=null;r.scale=null}
 else if(r.mode==='afocal'){r.mag=o.f/ep.id;r.fEff=r.mag*c.lf;r.trueField=ep.af/r.mag;r.fovW=206265*c.sw/r.fEff;r.fovH=206265*c.sh/r.fEff;r.circle=r.trueField*3600/2;r.scale=206.265*c.px/r.fEff}
 else{const cc=cam&&cam.mode!=='eye'?cam:GEAR.camera.items[3];r.fEff=o.f;r.fovW=206265*cc.sw/o.f;r.fovH=206265*cc.sh/o.f;r.scale=206.265*cc.px/o.f;r.circle=null}
 r.weight=o.w+(c.w||0)+(S.acc.has('guide')?0.6:0);return r}
function exposureList(){const c=G().camera;return EXP_LIST.filter(t=>!c.tMax||t<=c.tMax)}
