"use strict";
// ---------- Fenster
function openWin(k){closeWin(true);S.openWin=k;$('dim').style.display='block';$('w-'+k).style.display='block';$('hoverTag').style.display='none';
 if(k==='laptop'){lapTab(curLap||'chart');S.flags.laptop=1}
 if(k==='trunk')drawGear();if(k==='car')syncCar();if(k==='mount'||k==='compass'){syncMount();drawSetup()}
 if(k==='scope'){syncScope();}if(k==='camera')syncShotUI()}
function closeWin(silent){if(!S.openWin)return;$('w-'+S.openWin).style.display='none';$('dim').style.display='none';S.openWin=null;$('tip').style.display='none'}
document.querySelectorAll('.win .x').forEach(x=>x.onclick=()=>closeWin());$('dim').onclick=()=>closeWin();
let curLap='chart';
function lapTab(t){curLap=t;document.querySelectorAll('#lapTabs button').forEach(b=>b.classList.toggle('on',b.dataset.lt===t));document.querySelectorAll('.lapPage').forEach(p=>p.classList.toggle('on',p.id==='lp-'+t));
 if(t==='chart'){curTab='sky';requestAnimationFrame(resizeSky)}else curTab='';if(t==='photos'){drawGallery();S.flags.viewedPhotos=1}if(t==='lex')drawLex();if(t==='targets'){drawTargets();S.flags.targets=1}if(t==='proc'){drawProc();S.flags.processed=1}}
$('lapTabs').onclick=e=>{const b=e.target.closest('button');if(b)lapTab(b.dataset.lt)};
// Suche in der Sternkarte
$('searchQ').oninput=()=>{const q=$('searchQ').value.trim().toLowerCase(),res=$('searchRes');if(q.length<2){res.style.display='none';return}const out=[];
 for(const k in MES){const n=(k+' '+(DE_NAMES[k]||'')+' '+(MES[k].alt||'')).toLowerCase();if(n.includes(q))out.push([{kind:'dso',id:k},k+(DE_NAMES[k]?' – '+DE_NAMES[k]:'')])}
 for(const k in STARNAMES){const n=STARNAMES[k];if((n[0]+' '+n[1]).toLowerCase().includes(q))out.push([{kind:'star',idx:+k},n[0]||n[1]])}
 for(const[id,n]of[['moon','Mond'],['jupiter','Jupiter'],['saturn','Saturn'],['mars','Mars']])if(n.toLowerCase().includes(q))out.push([{kind:id==='moon'?'moon':'planet',id},n]);
 res.innerHTML=out.slice(0,14).map((o,i)=>`<div data-si="${i}">${o[1]}</div>`).join('')||'<div class="muted">nichts gefunden</div>';res.style.display='block';res._o=out};
$('searchRes').onclick=e=>{const d=e.target.closest('[data-si]');if(!d)return;const o=$('searchRes')._o[+d.dataset.si][0];S.sel=o;showObject(o);const h=objHor(o,S.ctx);if(h){S.view.az=h.az;S.view.alt=Math.max(0.05,Math.min(h.alt,1.2));S.view.fov=Math.min(S.view.fov,60)}drawSky();$('searchRes').style.display='none'};
// Info: Ziel merken statt Fotoziel
const _so=showObject;showObject=function(o){S.seen[tKey(o)]=1;_so(o);const b=$('setTgt');if(b){b.textContent='Koordinaten für die Teilkreise merken';b.onclick=()=>{S.goal=o;const h=objHor(o,S.ctx);const ra=((h.ra*R2D/15)%24+24)%24;$('cRAh').value=Math.floor(ra);$('cRAm').value=Math.round((ra%1)*60)%60;$('cDec').value=fmt(h.dec*R2D,1).replace(',','.');toast('Notiert: '+objName(o)+' – RA '+fmtRA(h.ra).slice(0,7)+', Dec '+fmtDeg(h.dec))}}};
// Auto / Fahrziel
function syncCar(){const d=DAY0(),p=n=>String(n).padStart(2,'0');$('nightDate').value=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;syncLoc()}
function syncLoc(){$('lat').value=S.loc.lat;$('lon').value=S.loc.lon;$('bortleSel').value=S.loc.b;$('locSel').value=S.locIdx}
LOCS.forEach((l,i)=>$('locSel').add(new Option(l.n,i)));BORTLE.forEach(b=>$('bortleSel').add(new Option(b[1],b[0])));
$('locSel').onchange=e=>{S.locIdx=+e.target.value;S.loc={...LOCS[S.locIdx]};syncLoc()};
$('lat').onchange=e=>{S.loc.lat=clamp(+e.target.value,-89,89);S.locIdx=5};$('lon').onchange=e=>{S.loc.lon=clamp(+e.target.value,-180,180);S.locIdx=5};$('bortleSel').onchange=e=>S.loc.b=+e.target.value;
$('driveBtn').onclick=()=>{const v=$('nightDate').value;const d=v?new Date(v+'T17:00'):DAY0();d.setHours(17,0,0,0);S.date=d;S.flags.loc=1;S.adapt=0.4;newSetup();setupAfterGear();closeWin();toast('Angekommen: '+S.loc.n+', '+d.toLocaleDateString('de-DE'));skyDirty=true};
// Kofferraum
const _dg=drawGear;drawGear=function(){_dg();$('gearLine').textContent=' '+$('gearLine').textContent};
$('packBtn').onclick=()=>{S.flags.gear=1;setupAfterGear();closeWin();toast('Ausrüstung aufgebaut')};
function setupAfterGear(){const h=S.ctx?telHor(S.ctx):[0.7,PI];rebuildRig();if(telMode()==='eq'){S.tel.raM=S.ctx.lst;S.tel.decM=89.5*D2R;S.tel.track=false}else{S.tel.track=false;telSetHor(0.5,PI)}newFocus()}

// Montierung
function syncMount(){const m=telMode(),g=G();$('mountName').textContent=' '+g.mount.n;document.querySelectorAll('#w-mount .eqOnly').forEach(e=>e.style.display=m==='eq'?'':'none');
 $('circSet').style.display=m==='fixed'?'none':'';$('trackCb').parentElement.style.display=m==='fixed'?'none':'';$('trackCb').checked=S.tel.track;
 $('circTitle').firstChild.textContent=m==='eq'?'Teilkreise & Motor':m==='altaz'?'Goto & Motor':'Ausrichtung';$('c1lab').textContent='RA (h, min)';$('c2lab').textContent='Dec (°)';updCirc()}
function updCirc(){const m=telMode(),c=S.ctx;let t;if(m==='eq')t=`RA-Kreis  ${fmtRA(S.tel.raM).slice(0,7)}<br>Dec-Kreis ${fmtDeg(S.tel.decM)}`;else{const h=telHor(c);t=`Höhe ${fmt(h[0]*R2D,1)}° · Azimut ${fmt(h[1]*R2D,1)}°`}$('circRead').innerHTML=t}
$('circGo').onclick=()=>{const ra=((+$('cRAh').value||0)+(+$('cRAm').value||0)/60)*15*D2R,dec=clamp(+$('cDec').value||0,-90,90)*D2R,m=telMode();
 if(m==='eq'){S.tel.raM=ra;S.tel.decM=dec}else if(m==='altaz'){S.tel.track=true;S.tel.lvErr=paState().level*0.4*D2R;S.tel.ra=ra+(Math.random()-.5)*paState().level*D2R;S.tel.dec=dec;$('trackCb').checked=true}
 toast(m==='eq'?'Klemmen gelöst, auf die Teilkreise gedreht, Klemmen fest.':'Montierung fährt an …');updCirc()};
$('trackCb').onchange=e=>{setTrack(e.target.checked);toast(e.target.checked?'Nachführung läuft (siderische Geschwindigkeit)':'Motor aus – der Himmel wandert aus dem Bild')};
const _ds=drawSetup;drawSetup=function(){_ds();updateRigPose();refreshKnobs()};
document.querySelectorAll('#w-mount input[type=range],#w-compass input[type=range],[data-nudge]').forEach(el=>{const f=()=>{if(telMode()!=='eq'||!S.tel.track)return};el.addEventListener('input',f)});
