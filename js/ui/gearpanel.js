"use strict";
// ================= Ausrüstung =================
function drawGear(){
 $('presets').innerHTML='<span class="muted" style="align-self:center;margin-right:4px">Schnellwahl:</span>'+PRESETS.map((p,i)=>`<button class="small" data-pre="${i}">${p.n}</button>`).join('');
 let h='';for(const k of ['optic','camera','mount','focus']){const cat=GEAR[k];h+=`<div class="gearCat"><h3>${cat.label} <i class="i" data-t="${cat.term}">i</i></h3><div class="opts">`;
  for(const it of cat.items){const spec=k==='optic'?`${it.D} mm · ${it.f} mm · f/${fmt(it.f/it.D,1)} · ${fmt(it.w,1)} kg`:k==='camera'?(it.sw?`${it.sw}×${it.sh} mm · ${fmt(it.px,2)} µm`:it.spec):k==='mount'?`Traglast ~${it.load} kg${it.pe?' · PE ±'+it.pe+'″':''}`:it.spec;
   h+=`<div class="opt ${S.gear[k]===it.id?'on':''}" data-cat="${k}" data-id="${it.id}"><i class="i" data-gi="${k}:${it.id}">i</i><div class="n">${it.n}</div><div class="s">${spec}</div><div class="p">${it.p}</div></div>`}
  h+='</div></div>'}
 h+=`<div class="gearCat"><h3>Zubehör</h3><div class="opts">${ACC.map(a=>`<div class="opt ${S.acc.has(a.id)?'on':''}" data-acc="${a.id}"><i class="i" data-t="${a.term}">i</i><div class="n">${a.n}</div><div class="s">${a.d.slice(0,60)}…</div><div class="p">${a.p}</div></div>`).join('')}</div></div>`;
 h+=`<div class="gearCat"><h3>Okular (für Auge und afokale Fotos) <i class="i" data-t="okular">i</i></h3><div class="opts">${EYEP.map(e=>`<div class="opt ${S.ep===e.id?'on':''}" data-ep="${e.id}"><div class="n">${e.n}</div><div class="s">Eigenes Gesichtsfeld ${e.af}°</div><div class="p">20–80 €</div></div>`).join('')}</div></div>`;
 $('gearCats').innerHTML=h;gearSummary()}
$('gearCats').addEventListener('click',e=>{const gi=e.target.closest('[data-gi]');if(gi){e.stopPropagation();const[k,id]=gi.dataset.gi.split(':');const it=GEAR[k].items.find(x=>x.id===id);popCard(`<h2>${it.n}</h2><p>${it.d}</p><table><tr><td>Preis (grob)</td><td>${it.p}</td></tr>${it.D?`<tr><td>Öffnung / Brennweite</td><td>${it.D} / ${it.f} mm</td></tr><tr><td>Gewicht</td><td>${it.w} kg</td></tr>`:''}${it.load?`<tr><td>Traglast</td><td>${it.load} kg</td></tr>`:''}</table>`);return}
 const o=e.target.closest('.opt');if(!o)return;if(o.dataset.cat){S.gear[o.dataset.cat]=o.dataset.id;if(o.dataset.cat==='optic')newFocus()}else if(o.dataset.acc){const a=o.dataset.acc;S.acc.has(a)?S.acc.delete(a):S.acc.add(a)}else if(o.dataset.ep)S.ep=+o.dataset.ep;drawGear()});
$('presets').addEventListener('click',e=>{const b=e.target.closest('[data-pre]');if(!b)return;const p=PRESETS[+b.dataset.pre];Object.assign(S.gear,p.g);S.acc=new Set(p.acc);S.ep=p.ep;newFocus();drawGear()});
function gearWarnings(){const g=G(),o=optics(),w=[];const load=g.mount.load*(S.acc.has('guide')&&g.mount.id==='eq'?1:1);
 if(o.weight>load)w.push(['bad',`Zu schwer: ${fmt(o.weight,1)} kg auf einer Montierung für ~${load} kg. Das Bild wird verwackeln und die Nachführung ungenau. <a class="term" data-t="traglast">Traglast</a>`]);
 else if(o.weight>load*0.7)w.push(['warn',`Montierung zu ${Math.round(o.weight/load*100)} % ausgelastet. Für Fotos besser unter 70 %.`]);
 if(o.lensFix)w.push(['warn','Ein Kameraobjektiv kann nicht hinter ein Okular. Es wird direkt an der Kamera genutzt (Primärfokus).']);
 if(g.optic.lens&&g.camera.mode==='eye')w.push(['bad','Durch ein Kameraobjektiv kann man nicht visuell schauen. Wähle eine Kamera.']);
 if(S.acc.has('guide')&&g.mount.track!=='eq')w.push(['warn','Autoguiding bringt nur mit parallaktischer Nachführung (Tracker/EQ) etwas.']);
 if(g.mount.track==='none'&&o.fEff&&o.fEff>100)w.push(['warn',`Ohne Nachführung bei ${Math.round(o.fEff)} mm: Sterne werden nach ca. ${fmt(500/(o.fEff*(g.camera.sw?43.3/Math.hypot(g.camera.sw,g.camera.sh):1)),1)} s zu Strichen (<a class="term" data-t="regel500">500er-Regel</a>).`]);
 if(g.mount.track==='altaz'&&g.camera.mode==='prime'&&g.camera.id!=='planet')w.push(['warn','Azimutale Montierung + Deep-Sky: Bildfelddrehung begrenzt die Belichtung auf ca. 15–30 s.']);
 if(g.mount.id==='tracker'&&o.fEff>400)w.push(['warn','Star Tracker mit über 400 mm: Getriebefehler werden sehr sichtbar.']);
 if(o.scale&&o.scale<0.5&&g.camera.id!=='planet')w.push(['info',`Abbildungsmaßstab ${fmt(o.scale,2)}″/px ist feiner als das Seeing hergibt. Für Deep-Sky verschenkt das Licht, für Planeten okay.`]);
 if(g.camera.id==='planet'&&o.fEff<1000)w.push(['info','Planetenkamera an kurzer Brennweite: Planeten werden winzig. Planeten wollen 2000 mm und mehr.']);
 if(g.mount.track==='eq'&&!S.acc.has('pol'))w.push(['info','Ohne Polsucher nur Grobausrichtung mit Kompass und Polhöhenskala möglich.']);
 // Engpass
 if(g.camera.id==='astro'&&g.mount.id==='tracker')w.push(['info','Engpass: Die Kamera ist deutlich besser als die Nachführung. Ein Upgrade der Montierung bringt jetzt mehr.']);
 return w}
function gearSummary(){const g=G(),o=optics();const kv=[];
 kv.push(['Öffnung',o.D+' mm'],['Brennweite '+(o.mode==='afocal'?'(effektiv)':''),o.fEff?Math.round(o.fEff)+' mm':'–'],['Öffnungsverhältnis','f/'+fmt(o.N,1)]);
 if(o.mag)kv.push(['Vergrößerung',Math.round(o.mag)+'×']);
 kv.push(['Gesichtsfeld',o.circle&&!o.fEff?fmt(o.fovW/3600,2)+'° (Kreis)':fmt(o.fovW/3600,2)+'° × '+fmt(o.fovH/3600,2)+'°']);
 if(o.scale)kv.push(['Abbildungsmaßstab',fmt(o.scale,2)+'″/px']);
 kv.push(['Beugungsgrenze',fmt(116/o.D,1)+'″'],['Gewicht / Traglast',fmt(o.weight,1)+' / '+g.mount.load+' kg']);
 $('gearSummary').innerHTML=kv.map(([k,v])=>`<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
 $('gearLine').textContent=`${g.optic.n} · ${g.camera.n} · ${g.mount.n}`;
 $('gearWarn').innerHTML=gearWarnings().map(([c,t])=>`<li class="${c==='bad'?'bad':''}" style="${c==='info'?'border-color:var(--acc2);background:rgba(127,178,255,.06)':''}">${t}</li>`).join('')||'<li style="border-color:var(--good);background:rgba(111,207,151,.07)">Passt zusammen.</li>'}
