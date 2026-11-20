"use strict";
// ================= Aufbau =================
function paState(){const c=S.ctx||simCtx(),st=S.setup,lat=S.loc.lat;
 const headTrue=st.head+DECL;// tatsächliche Richtung der Montierung (geografisch)
 const azErr=headTrue+st.fAz+st.legE*Math.tan(lat*D2R)*0.5,altErr=(st.altS-lat)+st.fAlt+st.legN*0.5;
 const tot=Math.hypot(azErr*Math.cos(lat*D2R),altErr);return{azErr,altErr,tot,level:Math.hypot(st.legN,st.legE)}}
function initSetup(){for(const k of['legN','legE','head','altS','fAz','fAlt']){$(k).oninput=e=>{S.setup[k]=+e.target.value;drawSetup()}}
 document.querySelectorAll('[data-nudge]').forEach(b=>b.onclick=()=>{const[k,d]=b.dataset.nudge.split(',');S.setup[k]=clamp(S.setup[k]+ +d,-3,3);drawSetup()});
 $('showTrueN').onchange=drawSetup;$('polHelp').onchange=drawSetup;$('reSetup').onclick=()=>{newSetup();drawSetup()}}
function chip(v,good,warn,txt){const c=v<=good?'good':v<=warn?'warn':'bad';return`<span class="chip ${c}">${txt}</span>`}
function drawSetup(){const st=S.setup,g=G(),c=S.ctx=simCtx(),pa=paState();
 for(const k of['legN','legE','head','altS','fAz','fAlt'])$(k).value=st[k];
 $('legNv').textContent=fmt(st.legN,2)+'°';$('legEv').textContent=fmt(st.legE,2)+'°';$('headv').textContent=(st.head>=0?'+':'')+fmt(st.head,1)+'°';$('altSv').textContent=fmt(st.altS,1)+'°';$('fAzv').textContent=fmt(st.fAz,2)+'°';$('fAltv').textContent=fmt(st.fAlt,2)+'°';
 const tr=g.mount.track;$('setupBanner').innerHTML=tr==='none'?'<ul class="warnings"><li>Mit dem <b>Fotostativ</b> gibt es nichts einzunorden. Die Montierung folgt dem Himmel nicht, die Sterne wandern durchs Bild. Schritte 2–4 sind trotzdem zum Üben da.</li></ul>':tr==='altaz'?'<ul class="warnings"><li>Die <b>azimutale Montierung</b> wird nicht eingenordet, nur waagerecht gestellt (Schritt 1). Sie fährt Ziele nach einem Stern-Alignment an (im Entwurf noch nicht enthalten).</li></ul>':'';
 // Libelle
 {const cv=$('levelCv'),x=cv.getContext('2d');x.clearRect(0,0,200,200);x.strokeStyle='#3a465c';x.lineWidth=2;x.beginPath();x.arc(100,100,80,0,TAU);x.stroke();x.beginPath();x.arc(100,100,16,0,TAU);x.stroke();x.strokeStyle='#232b3a';x.beginPath();x.moveTo(20,100);x.lineTo(180,100);x.moveTo(100,20);x.lineTo(100,180);x.stroke();
  const bx=100-st.legE*17,by=100+st.legN*17;const gr=x.createRadialGradient(bx-3,by-3,1,bx,by,13);gr.addColorStop(0,'#eaffd0');gr.addColorStop(1,'#8fcf5a');x.fillStyle=gr;x.beginPath();x.arc(clamp(bx,26,174),clamp(by,26,174),12,0,TAU);x.fill();
  x.fillStyle='#8792a5';x.font='11px IBM Plex Sans, sans-serif';x.fillText('N',96,14);x.fillText('O',186,104)}
 $('levelStat').innerHTML='Neigung: '+chip(pa.level,0.3,1,fmt(pa.level,2)+'°')+(pa.level<=0.3?' waagerecht':'');
 // Kompass
 {const cv=$('compCv'),x=cv.getContext('2d');x.clearRect(0,0,200,200);x.save();x.translate(100,100);x.strokeStyle='#3a465c';x.lineWidth=2;x.beginPath();x.arc(0,0,82,0,TAU);x.stroke();
  for(let a=0;a<360;a+=10){const r1=a%90?74:66;x.strokeStyle=a%90?'#2c3546':'#56627a';x.beginPath();x.moveTo(Math.sin(a*D2R)*r1,-Math.cos(a*D2R)*r1);x.lineTo(Math.sin(a*D2R)*82,-Math.cos(a*D2R)*82);x.stroke()}
  x.fillStyle='#8792a5';x.font='600 12px IBM Plex Sans, sans-serif';x.fillText('N',-4,-52);x.fillText('O',52,4);x.fillText('S',-4,60);x.fillText('W',-60,4);
  const mag=DECL*D2R;x.save();x.rotate(mag);x.fillStyle='#eb6a5a';x.beginPath();x.moveTo(0,-62);x.lineTo(6,0);x.lineTo(-6,0);x.fill();x.fillStyle='#d9dee8';x.beginPath();x.moveTo(0,62);x.lineTo(6,0);x.lineTo(-6,0);x.fill();x.restore();
  if($('showTrueN').checked){x.strokeStyle='#6fcf97';x.setLineDash([4,3]);x.beginPath();x.moveTo(0,0);x.lineTo(0,-82);x.stroke();x.setLineDash([]);x.fillStyle='#6fcf97';x.font='10px IBM Plex Sans, sans-serif';x.fillText('geogr. N',4,-70)}
  const hd=(st.head+DECL)*D2R;x.rotate(hd);x.strokeStyle='#f0a64a';x.lineWidth=4;x.beginPath();x.moveTo(0,20);x.lineTo(0,-78);x.stroke();x.fillStyle='#f0a64a';x.beginPath();x.moveTo(0,-86);x.lineTo(7,-72);x.lineTo(-7,-72);x.fill();x.restore();
  x.fillStyle='#8792a5';x.font='10px IBM Plex Sans, sans-serif';x.fillText('Rot = Kompassnadel · Orange = Polachse',8,196)}
 const hErr=st.head+DECL;$('headStat').innerHTML='Abweichung von geografisch Nord: '+chip(Math.abs(hErr),0.5,2,(hErr>=0?'+':'')+fmt(hErr,1)+'°')+(Math.abs(st.head)<0.3?' <span class="muted">– du hast auf die Kompassnadel ausgerichtet, aber die zeigt nicht nach geografisch Nord!</span>':'');
 // Polhöhe
 {const cv=$('altCv'),x=cv.getContext('2d');x.clearRect(0,0,200,200);x.fillStyle='#1a2230';x.fillRect(0,150,200,50);x.strokeStyle='#56627a';x.beginPath();x.moveTo(0,150);x.lineTo(200,150);x.stroke();
  const a=(st.altS+st.fAlt)*D2R,cx=60,cy=150;x.strokeStyle='#f0a64a';x.lineWidth=5;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a)*120,cy-Math.sin(a)*120);x.stroke();
  const t=S.loc.lat*D2R;x.strokeStyle='#7fb2ff';x.lineWidth=1.5;x.setLineDash([4,3]);x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(t)*140,cy-Math.sin(t)*140);x.stroke();x.setLineDash([]);
  x.strokeStyle='#8792a5';x.lineWidth=1;x.beginPath();x.arc(cx,cy,40,-a,0);x.stroke();x.fillStyle='#7fb2ff';x.font='11px IBM Plex Sans, sans-serif';x.fillText('zum Himmelspol',cx+Math.cos(t)*100-10,cy-Math.sin(t)*140+2);x.fillStyle='#8792a5';x.fillText('Norden →',140,168);x.fillText(fmt(st.altS+st.fAlt,1)+'°',cx+44,cy-8)}
 $('altStat').innerHTML=`Dein Breitengrad: <b class="mono">${fmt(S.loc.lat,2)}°</b> · Abweichung: `+chip(Math.abs(st.altS+st.fAlt-S.loc.lat),0.3,1.5,fmt(st.altS+st.fAlt-S.loc.lat,2)+'°');
 // Polsucher
 const hasPol=S.acc.has('pol');$('polText').innerHTML=hasPol?'Blick durch den Polsucher (Feld ca. 8°). Bring den Polarstern mit den Feinschrauben auf die markierte Stelle des Kreises. Die Lage wechselt mit der Uhrzeit, weil der Polarstern in 24 h einmal um den Pol läuft.':'<b>Kein Polsucher in der Ausrüstung.</b> Ohne ihn bleibt es bei der Grobausrichtung. (In Schritt 2 „Ausrüstung“ hinzufügen.)';
 {const cv=$('polCv'),x=cv.getContext('2d');x.fillStyle='#05070b';x.fillRect(0,0,200,200);x.save();x.beginPath();x.arc(100,100,95,0,TAU);x.clip();
  const sc=95/4;// px pro Grad
  if(hasPol){const mAz=(pa.azErr)*D2R,mAlt=(S.loc.lat+pa.altErr)*D2R;// Montierungsachse
   const toXY=(alt,az)=>[100+wrapPI(az-mAz)*R2D*Math.cos(mAlt)*sc,100-(alt-mAlt)*R2D*sc];
   for(let i=0;i<NS;i++){if(sDE[i]<78*D2R||sMag[i]>6.5)continue;const h=eq2hor(sRA[i],sDE[i],c),p=toXY(h[0],h[1]);x.fillStyle='rgba(230,235,245,.95)';x.beginPath();x.arc(p[0],p[1],Math.max(0.7,(6.5-sMag[i])*0.75),0,TAU);x.fill()}
   const pr=(90-sDE[HIP[11767]]*R2D)*sc;x.strokeStyle='rgba(235,106,90,.8)';x.lineWidth=1;x.beginPath();x.moveTo(100,8);x.lineTo(100,192);x.moveTo(8,100);x.lineTo(192,100);x.stroke();x.beginPath();x.arc(100,100,pr,0,TAU);x.stroke();
   for(let k=0;k<12;k++){const a=k/12*TAU;x.beginPath();x.moveTo(100+Math.sin(a)*(pr-4),100-Math.cos(a)*(pr-4));x.lineTo(100+Math.sin(a)*(pr+4),100-Math.cos(a)*(pr+4));x.stroke()}
   if($('polHelp').checked){const pi=HIP[11767],hp=eq2hor(sRA[pi],sDE[pi],c),pole=eq2hor(0,PI/2,c);// Polarstern relativ zum wahren Pol
    const dx=wrapPI(hp[1]-pole[1])*R2D*Math.cos(pole[0])*sc,dy=-(hp[0]-pole[0])*R2D*sc;x.strokeStyle='#6fcf97';x.lineWidth=1.5;x.beginPath();x.arc(100+dx,100+dy,5,0,TAU);x.stroke();
    const clock=((Math.atan2(dx,-dy)/TAU*12)+12)%12;S._clock=clock}}
  else{x.fillStyle='#3a465c';x.font='12px IBM Plex Sans, sans-serif';x.fillText('kein Polsucher',58,104)}x.restore();x.strokeStyle='#232b3a';x.lineWidth=2;x.beginPath();x.arc(100,100,95,0,TAU);x.stroke()}
 // Ergebnis
 const m=pa.tot*60,o=optics();$('paResult').innerHTML='Polausrichtung: '+chip(m,5,30,fmt(m,1)+'′ daneben')+(tr==='eq'?'':' <span class="muted">(für deine Montierung nicht relevant)</span>');
 const driftAS=pa.tot*D2R*OMEGA*206265;// ″ pro s (maximal)
 const tol=(o.scale||5)*1.5;$('paDetail').innerHTML=`Azimut ${fmt(pa.azErr,2)}° · Höhe ${fmt(pa.altErr,2)}° · Drift bis zu ${fmt(driftAS*60,1)}″ pro Minute.`+(o.scale?` Bei deinem Abbildungsmaßstab (${fmt(o.scale,2)}″/px) bleiben Sterne ca. <b>${driftAS>0?Math.round(tol/driftAS):'∞'} s</b> rund (ohne Guiding).`:'')+(S._clock!=null&&hasPol?` · Polarstern gehört jetzt auf ca. <b>${Math.round(S._clock)||12} Uhr</b> am Kreis.`:'')}
