"use strict";
// ================= Ziele heute Nacht (Laptop) =================
function showObjOf(id){return MES[id]?{kind:'dso',id}:id==='moon'?{kind:'moon',id:'moon'}:{kind:'planet',id}}
function drawTargets(){const c=S.ctx||simCtx(),o=optics(),fw=o.fovW/60,fh=o.fovH/60,rows=[];
 for(const[id,,name,fr,tip]of SHOW){const ob=showObjOf(id),h=objHor(ob,c);if(!h)continue;const ti=transitInfo(h.ra,h.dec,c);
  let size;if(ob.kind==='dso')size=MES[id].a;else if(ob.kind==='moon')size=31;else size=c.planets.find(p=>p.id===id).diam/60;
  const fit=size>Math.max(fw,fh)*1.05?['zu groß fürs Bildfeld','warn']:size<fw*0.04?['sehr klein im Bild','warn']:['passt ins Bildfeld','good'];
  rows.push({id,ob,name,h,ti,size,fit,fr,tip})}
 rows.sort((a,b)=>(b.h.alt>0.26)-(a.h.alt>0.26)||b.h.alt-a.h.alt);
 const fE=o.fEff?Math.round(o.fEff):null;
 $('tgtTable').innerHTML=`<div class="muted" style="font-size:12px;margin-bottom:8px">Dein Bildfeld: ${fmt(fw,0)}′ × ${fmt(fh,0)}′${fE?' bei '+fE+' mm':''}. Zeit: ${fmtTime(S.date)} Uhr.</div>
 <table class="tt"><tr><th>Ziel</th><th>Höhe jetzt</th><th>Höchster Stand</th><th>Größe</th><th>Empf. Brennweite</th><th></th></tr>${rows.map(r=>{const a=r.h.alt*R2D,cl=a>30?'good':a>15?'warn':'bad';const fOk=fE&&fE>=r.fr[0]*0.7&&fE<=r.fr[1]*1.3;
  return`<tr data-tg="${r.id}"><td><b>${r.name}</b></td><td><span class="chip ${cl}">${a>0?fmt(a,0)+'°':'unter Horizont'}</span></td><td class="muted">${r.ti.never?'–':fmtTime(r.ti.t)+' · '+fmt(r.ti.maxAlt,0)+'°'}</td>
  <td><span class="chip ${r.fit[1]}" title="${r.fit[0]}">${r.size>=10?fmt(r.size,0)+'′':r.size>=1?fmt(r.size,1)+'′':fmt(r.size*60,0)+'″'}</span></td><td class="mono" style="${fOk?'color:var(--good)':''}">${r.fr[0]}–${r.fr[1]} mm</td><td><span class="i" data-tip="${r.tip.replace(/"/g,'&quot;')}">i</span></td></tr>`}).join('')}</table>`}
document.addEventListener('click',e=>{const tr=e.target.closest('[data-tg]');if(!tr||e.target.closest('[data-tip]'))return;const ob=showObjOf(tr.dataset.tg);lapTab('chart');S.sel=ob;showObject(ob);const h=objHor(ob,S.ctx);S.view.mode='in';S.view.az=h.az;S.view.alt=Math.max(0.05,Math.min(h.alt,1.2));S.view.fov=40;requestAnimationFrame(drawSky)});
document.addEventListener('mouseover',e=>{const t=e.target.closest('[data-tip]');if(t)popCard(t.dataset.tip)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-tip]');if(t)popCard(t.dataset.tip)});
