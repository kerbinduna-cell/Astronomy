"use strict";
// ================= Galerie =================
const GKEY='astrosim.gallery.v1';let galSel=[];
function galLoad(){try{return JSON.parse(localStorage.getItem(GKEY)||'[]')}catch(e){return[]}}
function galSave(a){try{localStorage.setItem(GKEY,JSON.stringify(a));return true}catch(e){return false}}
let memGal=null;
function saveShot(){const cv=$('shotCanvas');const sm=document.createElement('canvas');sm.width=cv.width;sm.height=cv.height;sm.getContext('2d').drawImage(cv,0,0);
 const g=G();const item={id:Date.now(),img:sm.toDataURL('image/jpeg',0.82),title:S.last.targetName,when:S.date.toISOString(),setup:`${g.optic.n} · ${g.camera.n} · ${g.mount.n}`,shot:$('shotMeta').textContent,diag:S.last.diag.filter(d=>d[0]!=='info').map(d=>d[0])};
 const a=memGal||galLoad();a.unshift(item);if(!galSave(a)){memGal=a;$('saveBtn').textContent='Gespeichert (nur bis Neuladen)'}else{memGal=null;$('saveBtn').textContent='Gespeichert ✓'}
 $('saveBtn').disabled=true;setTimeout(()=>$('saveBtn').textContent='In Galerie speichern',1800)}
function drawGallery(){const a=memGal||galLoad();if(!a.length){$('galGrid').innerHTML='<p class="muted">Noch keine Bilder. Mach im Tab „Aufnahme“ ein Foto und speichere es.</p>';$('galCompare').innerHTML='';return}
 $('galGrid').innerHTML=a.map(it=>{const sc=it.diag.filter(x=>x==='good').length,bad=it.diag.filter(x=>x==='bad').length;return`<div class="it ${galSel.includes(it.id)?'sel':''}" data-gid="${it.id}"><img src="${it.img}" alt=""><div class="m"><b>${it.title}</b><br><span class="muted">${it.shot}</span><br><span class="muted">${it.setup}</span><br>${bad?`<span class="chip bad">${bad} Problem${bad>1?'e':''}</span>`:'<span class="chip good">sauber</span>'} <button class="small" data-gdel="${it.id}" style="float:right">Löschen</button></div></div>`}).join('');
 const sel=a.filter(x=>galSel.includes(x.id));$('galCompare').innerHTML=sel.length===2?`<div class="card" style="margin-bottom:12px"><b>Vergleich</b> <button class="small" id="galClr" style="float:right">schließen</button><div class="grid2" style="margin-top:8px">${sel.map(it=>`<div><img src="${it.img}" style="width:100%;border-radius:6px"><div class="muted" style="font-size:12px">${it.title} · ${it.shot}<br>${it.setup}</div></div>`).join('')}</div></div>`:'';
 if($('galClr'))$('galClr').onclick=()=>{galSel=[];drawGallery()}}
$('galGrid').addEventListener('click',e=>{const del=e.target.closest('[data-gdel]');if(del){const id=+del.dataset.gdel;const a=(memGal||galLoad()).filter(x=>x.id!==id);if(!galSave(a))memGal=a;galSel=galSel.filter(x=>x!==id);drawGallery();return}
 const it=e.target.closest('[data-gid]');if(!it)return;const id=+it.dataset.gid;galSel=galSel.includes(id)?galSel.filter(x=>x!==id):[...galSel.slice(-1),id];drawGallery()});
