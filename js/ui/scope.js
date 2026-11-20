"use strict";
// ---------- Teleskop-Fenster: Sucher- und Okularblick
function epField(){const o=G().optic,ep=EYEP.find(e=>e.id===S.ep);const mag=o.f*(S.acc.has('barlow')&&!o.lens?2.5:1)/ep.id;return{mag,field:ep.af/mag}}
function syncScope(){const g=G();$('scopeName').textContent=' '+g.optic.n;[...$('scopeMode').children].forEach(b=>b.classList.toggle('on',b.dataset.m===S.scopeMode));$('epSel').value=S.ep;
 const f=epField();$('magv').textContent=g.optic.lens?'Kameraobjektiv: kein Okular möglich':`${Math.round(f.mag)}-fach · Feld ${fmt(f.field,2)}°`;
 $('focv').textContent=(S.shot.foc>0?'+':'')+S.shot.foc+' µm';$('foc').value=S.shot.foc;$('bahtLab').style.display=g.focus.id==='bahtinov'?'':'none';$('baht').checked=S.shot.baht;$('autofoc').style.display=g.focus.id==='motor'?'':'none';drawFocus();refreshKnobs()}
EYEP.forEach(e=>$('epSel').add(new Option(e.n,e.id)));$('epSel').onchange=e=>{S.ep=+e.target.value;syncScope()};
$('scopeMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.scopeMode=b.dataset.m;syncScope()};
$('foc').oninput=e=>{S.shot.foc=+e.target.value;syncScope()};
document.querySelectorAll('[data-fstep]').forEach(b=>b.onclick=()=>{const st=S.gear.focus==='motor'?2:10;S.shot.foc=clamp(S.shot.foc+ +b.dataset.fstep*st,-400,400);syncScope()});
$('baht').onchange=e=>{S.shot.baht=e.target.checked;updateRigPose();drawFocus()};
$('autofoc').onclick=()=>{S.shot.foc=Math.round(trueFocusNow()+(Math.random()-.5)*4);syncScope()};
function viewFov(){const g=G();if(S.scopeMode==='finder'||g.optic.lens)return g.optic.lens?Math.max(optics().fovW/3600,2)*D2R:5*D2R;return epField().field*D2R}
function slewBy(dx,dy){const c=S.ctx,h=telHor(c);telSetHor(h[0]+dy,h[1]+dx/Math.max(Math.cos(h[0]),0.05))}
document.querySelectorAll('[data-slew]').forEach(b=>b.onclick=()=>{if(b.dataset.slew==='c')return;const[x,y]=b.dataset.slew.split(',').map(Number),s=viewFov()/10;slewBy(x*s,y*s)});
(function(){const cv=$('eyeCv');let d=null;cv.addEventListener('pointerdown',e=>{d={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(!d)return;const k=viewFov()/cv.clientWidth;slewBy(-(e.clientX-d.x)*k,(e.clientY-d.y)*k);d={x:e.clientX,y:e.clientY}});cv.addEventListener('pointerup',()=>d=null)})();
function drawEyeView(){const cv=$('eyeCv'),x=cv.getContext('2d'),W=cv.width,R=W/2,c=S.ctx,g=G(),finder=S.scopeMode==='finder'||g.optic.lens;
 const fov=viewFov(),D=finder?50:g.optic.D,mag=finder?8:epField().mag,h=telHor(c);
 const f=[Math.cos(h[0])*Math.sin(h[1]),Math.cos(h[0])*Math.cos(h[1]),Math.sin(h[0])];let r=[f[1],-f[0],0];const rn=Math.hypot(r[0],r[1])||1;r=[r[0]/rn,r[1]/rn,0];const u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]];
 const k=R/Math.tan(fov/2),asPx=fov*206265/W;const proj=v=>{const df=v[0]*f[0]+v[1]*f[1]+v[2]*f[2];if(df<0.5)return null;return[R+k*(v[0]*r[0]+v[1]*r[1]+v[2]*r[2])/df,R-k*(v[0]*u[0]+v[1]*u[1]+v[2]*u[2])/df]};
 x.fillStyle='#000';x.fillRect(0,0,W,W);x.save();x.beginPath();x.arc(R,R,R-2,0,TAU);x.clip();
 const exitP=clamp(D/mag/7,0.12,1),sk=h[0]>0?skyRGB(h[0],c,0):[6,8,6];x.fillStyle=`rgb(${sk.map(v=>Math.min(255,v*exitP*1.1)|0)})`;x.fillRect(0,0,W,W);
 if(h[0]<0){x.fillStyle='#0b0d0b';x.fillRect(0,0,W,W)}
 const lim=Math.min(curLim(c)+5*Math.log10(D/7)+1.0,finder?10.5:13.5),blur=finder?0:defocusAS().blur,see=finder?20:Math.max(S.loc.see,116/D);
 const starR=m=>Math.max(1,(lim-m)*0.55+0.6);const blurPx=blur/asPx;
 x.globalCompositeOperation='lighter';
 // Deep-Sky als schwaches Leuchten
 for(const kk in MES){const m=MES[kk],hz=eq2hor(m.ra,m.dec,c),p=proj(h2v(hz[0],hz[1]));if(!p||Math.hypot(p[0]-R,p[1]-R)>R*1.4)continue;const rr=Math.max(3,m.a*60/asPx/2);
  const a=clamp((lim-1.5-m.mag)/9,0.02,0.32)*Math.sqrt(exitP);const gr=x.createRadialGradient(p[0],p[1],0,p[0],p[1],rr);gr.addColorStop(0,`rgba(215,225,235,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');x.save();x.translate(p[0],p[1]);x.scale(1,m.b/m.a);x.translate(-p[0],-p[1]);x.fillStyle=gr;x.beginPath();x.arc(p[0],p[1],rr,0,TAU);x.fill();x.restore()}
 // Sterne
 for(let i=0;i<NS;i++){if(sMag[i]>lim)continue;const p=proj(h2v(sAlt[i],sAz[i]));if(!p||p[0]<-20||p[1]<-20||p[0]>W+20||p[1]>W+20)continue;const m=sMag[i],cl=bvColor(sBV[i]),a=clamp((lim-m)/3.5,0.15,1);
  const rr=starR(m)+blurPx*0.5;const gr=x.createRadialGradient(p[0],p[1],0,p[0],p[1],rr*1.6);
  if(blurPx>3){gr.addColorStop(0,`rgba(${cl.map(v=>v*255|0)},${a*0.25})`);gr.addColorStop(0.6,`rgba(${cl.map(v=>v*255|0)},${a*0.4})`);gr.addColorStop(1,'rgba(0,0,0,0)')}else{gr.addColorStop(0,`rgba(${cl.map(v=>v*255|0)},${a})`);gr.addColorStop(0.4,`rgba(${cl.map(v=>v*255|0)},${a*0.35})`);gr.addColorStop(1,'rgba(0,0,0,0)')}
  x.fillStyle=gr;x.beginPath();x.arc(p[0],p[1],rr*1.6,0,TAU);x.fill();
  if(!finder&&S.shot.baht&&m<3.5){const fo=defocusAS(),kk2=fo.d*0.08;x.save();x.translate(p[0],p[1]);x.strokeStyle=`rgba(255,255,255,${a*0.7})`;x.lineWidth=1.2;for(const[an,off]of[[0.35,0],[-0.35,0],[0,kk2]]){x.save();x.rotate(an);x.beginPath();x.moveTo(-R*0.6,off);x.lineTo(R*0.6,off);x.stroke();x.restore()}x.restore()}}
 // schwache Sterne (statistisch, pro 1°-Feld fest verteilt)
 {const rd0=telRD(c),half=fov*R2D/2+0.8;x.fillStyle='rgba(225,230,240,1)';
  for(let dd=Math.floor(rd0.dec*R2D-half);dd<=Math.ceil(rd0.dec*R2D+half);dd++){if(dd<-90||dd>=90)continue;const cosd=Math.max(Math.cos((dd+0.5)*D2R),0.02),n=Math.max(1,Math.round(360*cosd)),step=360/n,raSpan=half/cosd,ra0=rd0.ra*R2D;
   for(let kq=Math.floor((ra0-raSpan)/step);kq<=Math.ceil((ra0+raSpan)/step);kq++){const kk=((kq%n)+n)%n,rr=rng32(hashStr(dd+':'+kk)),N=Math.round(step*cosd*60);
    for(let q=0;q<N;q++){const ra=(kk*step+rr()*step)*D2R,de=(dd+rr())*D2R,u=rr(),m=6+Math.log10(1+u*(Math.pow(10,2.7)-1))/0.45;if(m>lim)continue;
     const hz=eq2hor(ra,de,c),pp=proj(h2v(hz[0],hz[1]));if(!pp||pp[0]<0||pp[1]<0||pp[0]>W||pp[1]>W)continue;const a=clamp((lim-m)/3,0.08,0.8);x.globalAlpha=blurPx>3?a*0.3:a;x.beginPath();x.arc(pp[0],pp[1],Math.max(0.7,(lim-m)*0.35)+blurPx*0.5,0,TAU);x.fill()}}}x.globalAlpha=1}
 // Planeten, Mond
 for(const pl of c.planets){const p=proj(h2v(pl.alt,pl.az));if(!p)continue;const rr=Math.max(1.5,pl.diam/2/asPx)+blurPx*0.3;x.fillStyle=pl.id==='mars'?'#ffb08a':'#fff1d0';x.beginPath();x.arc(p[0],p[1],rr,0,TAU);x.fill();
  if(pl.id==='saturn'&&rr>3){x.strokeStyle='rgba(255,240,205,.85)';x.lineWidth=Math.max(1,rr*0.25);x.beginPath();x.ellipse(p[0],p[1],rr*2.2,rr*0.35,0,0,TAU);x.stroke()}
  if(pl.id==='jupiter'&&rr>4){x.fillStyle='rgba(150,100,70,.5)';x.fillRect(p[0]-rr*0.9,p[1]-rr*0.25,rr*1.8,rr*0.15);x.fillRect(p[0]-rr*0.9,p[1]+0.15*rr,rr*1.8,rr*0.15)}}
 {const mo=c.moon,p=proj(h2v(mo.alt,mo.az));if(p){x.globalCompositeOperation='source-over';drawMoonIcon(x,p[0],p[1],Math.max(4,mo.diam/2/asPx),mo)}}
 x.globalCompositeOperation='source-over';
 if(finder){x.strokeStyle='rgba(255,60,40,.75)';x.lineWidth=1;x.beginPath();x.moveTo(R,0);x.lineTo(R,W);x.moveTo(0,R);x.lineTo(W,R);x.stroke();x.beginPath();x.arc(R,R,R*0.12,0,TAU);x.stroke()}
 x.restore();x.strokeStyle='#1a1a1a';x.lineWidth=6;x.beginPath();x.arc(R,R,R-3,0,TAU);x.stroke()}
