"use strict";
// ---------- Zustand erweitern
Object.assign(S,{tel:{raM:0,decM:PI/2,ra:0,dec:0,alt:0.7,az:PI,track:false},flags:{},seen:{},lamp:'off',speed:10,adapt:0.4,
 hud:{dir:false,alt:false,cons:false,names:false,tasks:false,hints:false},look:{yaw:PI,pitch:0.12,fov:62},curTarget:null,temp:7,guided:false,openWin:null,scopeMode:'finder'});
S.layers.fov=true;
S.gear={optic:'apo72',camera:'dslr',mount:'eq',focus:'bahtinov'};S.acc=new Set(['pol']);S.shot.filter='none';S.ep=25;
S.shot.exp=16;S.shot.iso=3;
{const d=new Date();d.setHours(17,0,0,0);S.date=d}
const DAY0=()=>{const d=new Date(S.date);d.setHours(17,0,0,0);if(S.date.getHours()<12)d.setDate(d.getDate()-1);return d};

// ---------- Ersetzte Funktionen aus Entwurf 1
function intro(){info(`<h2>SkyChart</h2><p class="muted">Klick auf ein Objekt zeigt Koordinaten und wo es gerade steht. Oben rechts suchen.</p>`)}
function showTerm(k){const e=LEX[k];if(!e)return;popCard(`<b>${e[0]}</b><p>${e[1]}</p>`)}
function showTab(t){if(t==='lex'){openWin('laptop');lapTab('lex')}}
function targetRD(c){return telRD(c||S.ctx)}
function targetObj(c){if(!c)return S.curTarget||{kind:'field',name:'Himmelsfeld',ra:0,dec:0};return nearestObj(telRD(c),c)}
function trueFocusNow(){return S.shot.trueFoc+(S.gear.focus==='motor'?0:(7-S.temp)*9)}
function changed(){}
let curTab='';

// ---------- Hilfen: Toast, Karte
let mouseX=0,mouseY=0;document.addEventListener('pointermove',e=>{mouseX=e.clientX;mouseY=e.clientY},true);
function toast(t,ms){const el=$('toast');el.innerHTML=t;el.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>el.style.display='none',ms||2600)}
function popCard(html){const t=$('tip');t.innerHTML=html;t.style.display='block';const r=t.getBoundingClientRect();let x=mouseX+14,y=mouseY+14;if(x+r.width>innerWidth-8)x=mouseX-r.width-14;if(y+r.height>innerHeight-8)y=innerHeight-r.height-8;t.style.left=x+'px';t.style.top=Math.max(8,y)+'px'}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#tip')&&!e.target.closest('[data-t]'))$('tip').style.display='none'},true);
// Hover über Begriffe zeigt die Erklärung
document.addEventListener('mouseover',e=>{const t=e.target.closest('[data-t]');if(t&&LEX[t.dataset.t])showTerm(t.dataset.t)});
document.addEventListener('mouseout',e=>{const t=e.target.closest('[data-t]');if(t&&!e.relatedTarget?.closest?.('#tip'))$('tip').style.display='none'});

// ---------- Teleskop-Zeigemodell
function telMode(){const g=G();if(g.mount.track==='eq')return'eq';if(g.mount.track==='altaz')return'altaz';return'fixed'}
function mountCtx(c){const pa=paState(),lat2=c.lat+pa.altErr*D2R;return{lst:c.lst,slat:Math.sin(lat2),clat:Math.cos(lat2),azOff:pa.azErr*D2R}}
function telHor(c){const m=telMode();if(m==='eq'){const mc=mountCtx(c),h=eq2hor(S.tel.raM,S.tel.decM,mc);return[h[0],(h[1]+mc.azOff+TAU)%TAU]}
 if(m==='altaz'&&S.tel.track){const h=eq2hor(S.tel.ra,S.tel.dec,c);return[h[0]+S.tel.lvErr,(h[1])]}return[S.tel.alt,S.tel.az]}
function telSetHor(alt,az){const c=S.ctx,m=telMode();alt=clamp(alt,-0.3,PI/2-1e-4);az=(az+TAU)%TAU;
 if(m==='eq'){const mc=mountCtx(c),r=hor2eq(alt,az-mc.azOff,mc);S.tel.raM=r[0];S.tel.decM=r[1]}
 else if(m==='altaz'&&S.tel.track){const r=hor2eq(alt-S.tel.lvErr,az,c);S.tel.ra=r[0];S.tel.dec=r[1]}else{S.tel.alt=alt;S.tel.az=az}}
function telRD(c){const h=telHor(c),r=hor2eq(h[0],h[1],c);return{ra:r[0],dec:r[1],alt:h[0],az:h[1]}}
function setTrack(on){const h=telHor(S.ctx);S.tel.track=!!on&&telMode()!=='fixed';S.tel.lvErr=paState().level*0.4*D2R;telSetHor(h[0],h[1])}
function angSep(ra1,d1,ra2,d2){return Math.acos(clamp(Math.sin(d1)*Math.sin(d2)+Math.cos(d1)*Math.cos(d2)*Math.cos(ra1-ra2),-1,1))}
function angTo(id){const c=S.ctx,t=telRD(c),m=MES[id];return angSep(t.ra,t.dec,m.ra,m.dec)}
function nearestObj(p,c){let best=null,bd=1e9;const o=optics(),lim=Math.max(o.fovW,o.fovH)/3600*D2R*0.7;
 for(const pl of c.planets){const d=angSep(p.ra,p.dec,pl.ra,pl.dec);if(d<lim&&d<bd){bd=d;best={kind:'planet',id:pl.id}}}
 {const d=angSep(p.ra,p.dec,c.moon.ra,c.moon.dec);if(d<Math.max(lim,0.3*D2R)&&d<bd){bd=d;best={kind:'moon',id:'moon'}}}
 if(!best)for(const k in MES){const m=MES[k],d=angSep(p.ra,p.dec,m.ra,m.dec);if(d<lim&&d<bd){bd=d;best={kind:'dso',id:k}}}
 return best||{kind:'field',name:'Himmelsfeld',ra:p.ra,dec:p.dec}}

// ---------- Patches für Simulation: Bewegung hängt am Motor
const _mm=motionModel;motionModel=function(c,g,...a){const g2={...g,mount:{...g.mount,track:(g.mount.track!=='none'&&S.tel.track)?g.mount.track:'none'}};return _mm(c,g2,...a)};
