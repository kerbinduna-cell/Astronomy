"use strict";
// ---------- Kamera-Fenster
function syncShotUI(){const g=G(),none=g.camera.mode==='eye';$('camNone').style.display=none?'':'none';$('camBody').style.display=none?'none':'';$('camName').textContent=' '+g.camera.n;if(none)return;
 const list=exposureList();if(S.shot.exp>=list.length)S.shot.exp=list.length-1;$('exp').max=list.length-1;$('exp').value=S.shot.exp;$('expv').textContent=fmtExp(list[S.shot.exp]);
 const gm=g.camera.gainMode;$('isoLab').textContent=gm?'Gain':'ISO';const il=gm?GAIN_LIST:ISO_LIST.filter(x=>!g.camera.isoMax||x<=g.camera.isoMax);if(S.shot.iso>=il.length)S.shot.iso=il.length-1;$('iso').max=il.length-1;$('iso').value=S.shot.iso;$('isov').textContent=il[S.shot.iso];
 fillFilters();$('nfr').value=S.shot.nfr;$('nv').textContent=NFR[S.shot.nfr]+' × → '+fmtDur(NFR[S.shot.nfr]*list[S.shot.exp]);$('cDark').checked=S.shot.dark;$('cFlat').checked=S.shot.flat;$('cStretch').checked=S.shot.stretch;$('shootBtn').textContent='● Auslösen'}
$('exp').oninput=e=>{S.shot.exp=+e.target.value;syncShotUI()};$('iso').oninput=e=>{S.shot.iso=+e.target.value;syncShotUI()};$('nfr').oninput=e=>{S.shot.nfr=+e.target.value;syncShotUI()};
$('cDark').onchange=e=>S.shot.dark=e.target.checked;$('cFlat').onchange=e=>S.shot.flat=e.target.checked;$('cStretch').onchange=e=>{S.shot.stretch=e.target.checked;if(S.last)finishImage(S.last)};
$('shootBtn').onclick=()=>{S.flags.shot=1;shoot()};$('saveBtn').onclick=()=>{saveShot();toast('Auf dem Laptop gespeichert (Fotos)')};

const FILT_LABEL={none:'ohne Filter',lp:'Lichtverschmutzungsfilter',dual:'Dualband Hα + OIII',L:'L (Luminanz)',R:'R (Rot)',G:'G (Grün)',B:'B (Blau)',Ha:'H-alpha (7 nm)',O3:'OIII (7 nm)',S2:'SII (7 nm)'};
function filterOptions(){const c=G().camera;if(c.mono)return S.acc.has('fw')?['L','R','G','B','Ha','O3','S2']:['L'];const o=['none'];if(S.acc.has('lp'))o.push('lp');if(S.acc.has('dual'))o.push('dual');return o}
function fillFilters(){const o=filterOptions(),sel=$('filtSel');if(!o.includes(S.shot.filter))S.shot.filter=o[0];sel.innerHTML=o.map(f=>`<option value="${f}" ${f===S.shot.filter?'selected':''}>${FILT_LABEL[f]}</option>`).join('');$('filtRow').style.display=o.length>1||G().camera.mono?'':'none';
 const lucky=G().camera.id==='planet';$('nfrLab').innerHTML=lucky?'Video-Bilder (beste 10 %) <i class="i" data-t="lucky">i</i>':'Serie <i class="i" data-t="stacking">i</i>'}
$('filtSel').onchange=e=>{S.shot.filter=e.target.value};
const _fin=finishImage;finishImage=function(r){_fin(r);if(!r.eye){const ex=[];if(r.filter&&r.filter!=='none')ex.push(FILT_LABEL[r.filter]);if(r.lucky)ex.push('Lucky Imaging');if(ex.length)$('shotMeta').textContent+=' · '+ex.join(' · ');
 if(r.lucky)$('diag').insertAdjacentHTML('beforeend','<li><span class="dot info"></span><span>Lucky Imaging: Aus dem Video werden die schärfsten Bilder gestapelt. Mehr Bilder heißt schärfer und weniger Rauschen.</span></li>')}};
