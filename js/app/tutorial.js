"use strict";
// ---------- Tutorial
const TASKS=[
 {ch:'1 · Ankommen',items:[
  {t:'Fahrziel wählen',obj:'car',ok:()=>S.flags.loc,how:'Klick aufs Auto. Gute Plätze: dunkel, freie Sicht nach Süden und auf den Polarstern im Norden, ebener Boden.'},
  {t:'Ausrüstung aus dem Kofferraum holen',obj:'trunk',ok:()=>S.flags.gear,how:'Klick auf die Koffer im Kofferraum. Für den Anfang: Schnellwahl „Deep-Sky Einsteiger“.'},
  {t:'Stirnlampe auf Rotlicht',obj:'lamp',ok:()=>S.lamp==='red',how:'Klick auf die Stirnlampe auf dem linken Tisch. Rotes Licht zerstört die Dunkelanpassung der Augen nicht, weißes schon.'}]},
 {ch:'2 · Aufbauen',items:[
  {t:'Stativ waagerecht stellen',obj:'mount',ok:()=>paState().level<0.3,how:'Montierung anklicken → Libelle. Die Beine verstellen, bis die Blase mittig sitzt.'},
  {t:'Montierung grob nach Norden drehen',obj:'compass',need:'eq',ok:()=>Math.abs(S.setup.head+DECL)<1,how:'Kompass anklicken und die Montierung so drehen, dass die Polachse nach geografisch Nord zeigt. Achtung: Die Nadel zeigt rund 3° zu weit nach Osten (Missweisung).'},
  {t:'Polhöhe auf deinen Breitengrad',obj:'mount',need:'eq',ok:()=>Math.abs(S.setup.altS+S.setup.fAlt-S.loc.lat)<0.6,how:'An der Montierung die Polhöhenskala auf den Breitengrad stellen (steht im Fahrziel, z. B. 50,2°).'}]},
 {ch:'3 · Dunkelheit abwarten',items:[{t:'Warten, bis der Polarstern sichtbar ist',obj:'sky-pole',ok:()=>S.ctx.sun.alt<-9*D2R,how:'Zeit oben links schneller laufen lassen. Ab ca. 9° Sonnentiefe sieht man den Polarstern. Er steht im Norden, so hoch wie dein Breitengrad.'}]},
 {ch:'4 · Polausrichtung',items:[{t:'Mit dem Polsucher genau einnorden (unter 10′)',obj:'mount',need:'eq',ok:()=>paState().tot*60<10,how:'Montierung → Polsucher. Mit den Azimut- und Polhöhenschrauben den Polarstern auf die richtige Stelle des Kreises bringen. Die Zielmarke zeigt, wo er hingehört.'}]},
 {ch:'5 · Ziel finden: Andromedagalaxie',items:[
  {t:'M31 am Laptop nachschlagen',obj:'laptop',ok:()=>S.seen['dso:M31'],how:'Laptop → SkyChart → oben rechts „M31“ suchen. Dort stehen die Koordinaten. Mit „Koordinaten merken“ landen sie in den Teilkreis-Feldern.'},
  {t:'Teleskop auf die Koordinaten drehen',obj:'mount',ok:()=>angTo('M31')<4*D2R,how:'Montierung → Teilkreise: RA und Dec eintragen und „Drehen“. Ohne parallaktische Montierung: im Teleskop-Fenster per Ziehen hinschwenken.'},
  {t:'M31 im Sucher ins Fadenkreuz',obj:'scope',ok:()=>angTo('M31')<0.5*D2R,how:'Teleskop → Sucher. M31 ist ein schwacher, länglicher Nebelfleck. Ziehen oder Pfeiltasten, bis er im Fadenkreuz sitzt.'},
  {t:'Nachführung einschalten',obj:'mount',need:'track',ok:()=>S.tel.track,how:'Montierung → „Nachführmotor an“. Sonst wandert das Ziel durch die Erdrotation aus dem Bild.'}]},
 {ch:'6 · Fokussieren',items:[
  {t:'Bahtinov-Maske aufsetzen',obj:'mask',need:'baht',ok:()=>S.shot.baht||S.flags.focused,how:'Klick auf die schwarze Scheibe auf dem rechten Tisch.'},
  {t:'Scharf stellen',obj:'scope',ok:()=>{const ok=Math.abs(defocusAS().d)<15;if(ok&&S.shot.baht)S.flags.focused=1;return ok},how:'Teleskop → Okular, einen hellen Stern anschauen und am Fokussierrad drehen, bis der mittlere Strahl genau durch die Mitte des X läuft.'},
  {t:'Maske wieder abnehmen',obj:'mask',need:'baht',ok:()=>!S.shot.baht&&S.flags.focused,how:'Sonst sind auf jedem Foto die Beugungsstrahlen.'}]},
 {ch:'7 · Erstes Foto',items:[
  {t:'Testbild aufnehmen',obj:'camera',need:'cam',ok:()=>S.flags.shot,how:'Kamera anklicken (hinten am Teleskop). Für den Start: 60–120 s, ISO 800–1600.'},
  {t:'Rohdaten am Laptop bearbeiten',obj:'laptop',ok:()=>S.flags.processed,how:'Laptop → Bearbeitung. Jede Aufnahme landet dort automatisch. Strecken und Sättigung einstellen, dann „Ins Fotoalbum übernehmen“. Unter „Was ist passiert?“ an der Kamera steht, was bei der Aufnahme gut und was schief lief.'}]},
 {ch:'8 · Weiter: coole Motive',items:[{t:'Am Laptop unter „Ziele“ ein neues Motiv aussuchen',obj:'laptop',ok:()=>S.flags.targets,how:'Die Liste zeigt, was gerade hoch steht und ob es zu deiner Brennweite passt. Mit Filtern (Dualband, Hα/OIII/SII) und der Mono-Kamera werden Nebel spektakulär.'}]}];
let curTask=null;const openTasks=new Set();
function taskNeeds(it){const g=G();if(it.need==='eq')return telMode()==='eq';if(it.need==='track')return telMode()!=='fixed';if(it.need==='baht')return g.focus.id==='bahtinov';if(it.need==='cam')return g.camera.mode!=='eye';return true}
function updateTasks(){curTask=null;let h='',n=0;TASKS.forEach((ch,ci)=>{h+=`<h4>${ch.ch}</h4>`;ch.items.forEach((it,ii)=>{const id=ci+'.'+ii,na=!taskNeeds(it);let done=false;try{done=!na&&!!it.ok()}catch(e){}
  const cur=!done&&!na&&!curTask;if(cur)curTask=it;h+=`<div class="task ${done?'done':''} ${cur?'cur':''} ${na?'na':''} ${openTasks.has(id)?'open':''}" data-task="${id}"><div class="b"></div><span>${it.t}${na?' <span class="muted">(entfällt)</span>':''}</span><div class="how">${it.how}</div></div>`})});
 $('tasks').innerHTML=h}
$('tasks').onclick=e=>{const t=e.target.closest('[data-task]');if(!t)return;const id=t.dataset.task;openTasks.has(id)?openTasks.delete(id):openTasks.add(id);updateTasks()};
