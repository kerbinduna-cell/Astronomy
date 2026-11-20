"use strict";
// ================= Himmelsansicht =================
const sky=$('sky');let sctx=sky.getContext('2d'),SW=0,SH=0,DPR=1,picks=[];
function resizeSky(){const r=sky.getBoundingClientRect();DPR=Math.min(window.devicePixelRatio||1,2);SW=Math.max(300,r.width);SH=Math.max(300,r.height);sky.width=SW*DPR;sky.height=SH*DPR;drawSky()}
window.addEventListener('resize',()=>{if(curTab==='sky')resizeSky()});
function camBasis(){const v=S.view,f=h2v(v.alt,v.az);let r=[f[1],-f[0],0];// f × obenlet n=Math.hypot(r[0],r[1]);if(n<1e-6){r=[Math.cos(v.az),-Math.sin(v.az),0];n=1}r=[r[0]/n,r[1]/n,0];
 const u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]];const k=SW/(4*Math.tan(v.fov*D2R/4));return{f,r,u,k}}
function proj(v,B){const df=v[0]*B.f[0]+v[1]*B.f[1]+v[2]*B.f[2];if(df<-0.2)return null;const s=2*B.k/(1+df);
 return[SW/2+s*(v[0]*B.r[0]+v[1]*B.r[1]+v[2]*B.r[2]),SH/2-s*(v[0]*B.u[0]+v[1]*B.u[1]+v[2]*B.u[2])]}
function unproj(x,y,B){const a=(x-SW/2)/(2*B.k),b=(SH/2-y)/(2*B.k),rho=Math.hypot(a,b);if(rho<1e-9)return B.f.slice();const th=2*Math.atan(rho),s=Math.sin(th)/rho,c=Math.cos(th);
 return[B.f[0]*c+(B.r[0]*a+B.u[0]*b)*s,B.f[1]*c+(B.r[1]*a+B.u[1]*b)*s,B.f[2]*c+(B.r[2]*a+B.u[2]*b)*s]}
function bvColor(bv){const t=clamp((bv+0.3)/2.0,0,1);const r=t<0.35?0.68+t*0.9:1,g=t<0.35?0.78+t*0.55:1-(t-0.35)*0.5,b=t<0.35?1:1-(t-0.35)*1.15;return[r,g,clamp(b,0.25,1)]}
function limMag(c){let lim=7.2-0.5*(S.loc.b-1);const s=c.sun.alt*R2D;if(s>-18)lim=Math.min(lim,7.2-(s+18)*0.62);if(c.moon.alt>0)lim-=c.moon.illum*1.2*Math.sin(c.moon.alt)**0.5;return lim}
function skyRGB(alt,c,mw){const s=c.sun.alt*R2D,lp=(S.loc.b-1)/8,a=Math.max(alt,0),glow=Math.exp(-a*R2D/14);
 let r=4+lp*(38+70*glow),g=6+lp*(28+50*glow),b=14+lp*(22+32*glow);
 if(c.moon.alt>0){const m=c.moon.illum*Math.sin(c.moon.alt)**0.5*(1-lp*0.5);r+=m*14;g+=m*22;b+=m*40}
 if(s>-18){const t=clamp((s+18)/18,0,1)**2.2;r+=t*(70+60*glow);g+=t*(110+30*glow);b+=t*(190-40*glow);if(s>-8&&s<2){const hz=Math.exp(-a*R2D/8)*clamp(1-Math.abs(s+3)/6,0,1);r+=hz*120;g+=hz*50}}
 if(mw>0){const vis=clamp(1-(S.loc.b-1)/5,0,1)*clamp(-(s+12)/6,0,1)*(c.moon.alt>0?1-c.moon.illum*0.7:1);r+=mw*30*vis;g+=mw*30*vis;b+=mw*34*vis}
 return[r,g,b]}
const bgCv=document.createElement('canvas'),bgCtx=bgCv.getContext('2d');
function drawSky(){if(!SW)return;const c=simCtx();S.ctx=c;const ctx=sctx;ctx.setTransform(DPR,0,0,DPR,0,0);picks=[];
 if(S.view.mode==='out'){drawDome(c);updSkyStatus(c);return}
 const B=camBasis(),bw=Math.ceil(SW/4),bh=Math.ceil(SH/4);bgCv.width=bw;bgCv.height=bh;const im=bgCtx.createImageData(bw,bh),d=im.data;
 for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const v=unproj(x*4+2,y*4+2,B),alt=Math.asin(clamp(v[2],-1,1));let col;
  if(alt<0){const t=clamp(-alt*R2D/30,0,1),day=clamp((c.sun.alt*R2D+12)/12,0,1);col=[14+day*60-t*6,16+day*70-t*6,14+day*40-t*6]}
  else{let mw=0;if(S.layers.mw){const az=Math.atan2(v[0],v[1]);const e=hor2eq(alt,az,c);mw=mwBright(e[0],e[1])}col=skyRGB(alt,c,mw)}
  const i=(y*bw+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255}
 bgCtx.putImageData(im,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(bgCv,0,0,SW,SH);
 const lim=limMag(c),zoom=Math.sqrt(clamp(90/S.view.fov,0.6,6));
 const line=(pts,col,w,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();let pen=false,prev=null;
  for(const p of pts){const q=p?proj(p,B):null;if(q&&prev&&Math.hypot(q[0]-prev[0],q[1]-prev[1])>SW*0.6)pen=false;if(q){pen?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);pen=true}else pen=false;prev=q}ctx.stroke();ctx.setLineDash([])};
 ctx.font='11px IBM Plex Sans, sans-serif';
 // Horizont-Netz
 if(S.layers.altaz){for(let a=0;a<90;a+=(S.view.fov<40?10:30)){const pts=[];for(let z=0;z<=360;z+=2)pts.push(h2v(a*D2R,z*D2R));line(pts,a===0?'rgba(240,166,74,.55)':'rgba(240,166,74,.18)',a===0?1.2:0.8)}
  for(let z=0;z<360;z+=30){const pts=[];for(let a=0;a<=90;a+=2)pts.push(h2v(a*D2R,z*D2R));line(pts,z%180===0?'rgba(240,166,74,.35)':'rgba(240,166,74,.14)',z%180===0?1:0.8,z%180===0?[5,4]:null)}
  ctx.fillStyle='rgba(240,166,74,.7)';for(let a=10;a<90;a+=(S.view.fov<40?10:30)){const q=proj(h2v(a*D2R,S.view.az+(S.view.fov*0.12)*D2R),B);if(q)ctx.fillText(a+'°',q[0]+3,q[1]-2)}
  const zen=proj([0,0,1],B);if(zen){ctx.fillText('Zenit',zen[0]+4,zen[1]-4)}}
 // Himmels-Netz
 if(S.layers.eq){for(let dc=-60;dc<=75;dc+=15){const pts=[];for(let h=0;h<=360;h+=2){const hz=eq2hor(h*D2R,dc*D2R,c);pts.push(h2v(hz[0],hz[1]))}line(pts,dc===0?'rgba(127,178,255,.6)':'rgba(127,178,255,.2)',dc===0?1.3:0.8)}
  for(let h=0;h<24;h+=2){const pts=[];for(let dc=-80;dc<=90;dc+=3){const hz=eq2hor(h*15*D2R,dc*D2R,c);pts.push(h2v(hz[0],hz[1]))}line(pts,'rgba(127,178,255,.18)',0.8);
   const hz=eq2hor(h*15*D2R,0,c),q=proj(h2v(hz[0],hz[1]),B);if(q&&hz[0]>0){ctx.fillStyle='rgba(127,178,255,.8)';ctx.fillText(h+'h',q[0]+3,q[1]-3)}}
  const p=eq2hor(0,PI/2,c),q=proj(h2v(p[0],p[1]),B);if(q){ctx.strokeStyle='rgba(127,178,255,.9)';ctx.beginPath();ctx.arc(q[0],q[1],6,0,TAU);ctx.stroke();ctx.fillStyle='rgba(127,178,255,.9)';ctx.fillText('Himmelsnordpol',q[0]+8,q[1]+12)}
  const eqq=eq2hor(c.lst+PI/2,0,c),qe=proj(h2v(eqq[0],eqq[1]),B);if(qe){ctx.fillStyle='rgba(127,178,255,.9)';ctx.fillText('Himmelsäquator',qe[0]+4,qe[1]-6)}}
 // Sternbilder
 if(S.layers.cons){for(const cn of consP){for(const seg of cn.segs){const pts=seg.map(p=>{const hz=eq2hor(p[0],p[1],c);return hz[0]>-0.05?h2v(hz[0],hz[1]):null});line(pts,'rgba(150,170,210,.28)',0.9)}
  if(S.layers.names&&S.view.fov<130){const hz=eq2hor(cn.c[0],cn.c[1],c);if(hz[0]>0.05){const q=proj(h2v(hz[0],hz[1]),B);if(q){ctx.fillStyle='rgba(150,170,210,.55)';ctx.fillText(CONS[cn.id]?CONS[cn.id][0]:cn.id,q[0],q[1])}}}}}
 // Milchstraße-Hinweis, Deep-Sky
 if(S.layers.messier){for(const k in MES){const m=MES[k],hz=eq2hor(m.ra,m.dec,c);if(hz[0]<0)continue;const q=proj(h2v(hz[0],hz[1]),B);if(!q)continue;
  if(m.mag>7.5&&S.view.fov>60)continue;const r=Math.max(3,m.a/120*D2R*B.k);ctx.strokeStyle='rgba(160,230,190,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(q[0],q[1],Math.min(r,40),0,TAU);ctx.stroke();
  picks.push({x:q[0],y:q[1],o:{kind:'dso',id:k},p:1});if(S.layers.names&&(S.view.fov<70||DE_NAMES[k])){ctx.fillStyle='rgba(160,230,190,.75)';ctx.fillText(k+(DE_NAMES[k]&&S.view.fov<120?' '+DE_NAMES[k]:''),q[0]+Math.min(r,40)+3,q[1]+3)}}}
 // Sterne
 for(let i=0;i<NS;i++){let m=sMag[i];if(m>lim+0.3)continue;const hz=eq2hor(sRA[i],sDE[i],c);if(hz[0]<-0.01)continue;
  const am=1/Math.max(Math.sin(hz[0]+0.02),0.03);m+=0.22*(am-1);if(m>lim)continue;const q=proj(h2v(hz[0],hz[1]),B);if(!q||q[0]<-5||q[1]<-5||q[0]>SW+5||q[1]>SH+5)continue;
  const br=lim-m,rad=Math.max(0.7,(0.6+br*0.5)*zoom*0.8),col=bvColor(sBV[i]),al=clamp(0.4+br*0.3,0.35,1);
  if(m<1.2){const gr=ctx.createRadialGradient(q[0],q[1],0,q[0],q[1],rad*4);gr.addColorStop(0,`rgba(${col.map(x=>x*255|0)},${al*0.45})`);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(q[0],q[1],rad*4,0,TAU);ctx.fill()}
  ctx.fillStyle=`rgba(${col.map(x=>x*255|0)},${al})`;ctx.beginPath();ctx.arc(q[0],q[1],rad,0,TAU);ctx.fill();
  const nm=STARNAMES[i];if(m<4.5||nm)picks.push({x:q[0],y:q[1],o:{kind:'star',idx:i},p:m<2?2:0});
  if(S.layers.names&&nm&&nm[0]&&(sMag[i]<(S.view.fov<50?3.5:1.9))){ctx.fillStyle='rgba(220,225,235,.75)';ctx.fillText(nm[0],q[0]+rad+3,q[1]-rad)}}
 // Planeten & Mond
 for(const p of c.planets){if(p.alt<-0.01)continue;const q=proj(h2v(p.alt,p.az),B);if(!q)continue;ctx.fillStyle=p.id==='mars'?'#ffb08a':'#fff3d6';ctx.beginPath();ctx.arc(q[0],q[1],Math.max(1.6,(2.6-p.mag*0.5)*zoom*0.7),0,TAU);ctx.fill();
  ctx.fillStyle='#ffd99a';ctx.fillText(p.name,q[0]+6,q[1]-5);picks.push({x:q[0],y:q[1],o:{kind:'planet',id:p.id},p:3})}
 {const mo=c.moon;if(mo.alt>-0.01){const q=proj(h2v(mo.alt,mo.az),B);if(q){const r=Math.max(5,0.26*D2R*B.k);drawMoonIcon(ctx,q[0],q[1],r,mo,c);ctx.fillStyle='#e8e4d8';ctx.fillText('Mond',q[0]+r+4,q[1]-r);picks.push({x:q[0],y:q[1],o:{kind:'moon',id:'moon'},p:3})}}}
 {const su=c.sun;if(su.alt>-0.02){const q=proj(h2v(su.alt,su.az),B);if(q){ctx.fillStyle='#fff6c8';ctx.beginPath();ctx.arc(q[0],q[1],Math.max(6,0.27*D2R*B.k),0,TAU);ctx.fill();ctx.fillStyle='#fff6c8';ctx.fillText('Sonne – nie durchs Teleskop ansehen!',q[0]+12,q[1]+4)}}}
 // Bildfeld des Setups
 if(S.layers.fov){const t=targetRD(c);if(t){const o=optics(),hz=eq2hor(t.ra,t.dec,c);if(hz[0]>-0.05){const w=o.fovW*AS/2,h=o.fovH*AS/2,pts=[];
   const corner=(xi,eta)=>{const rd=tan2rd(t.ra,t.dec,xi,eta),hh=eq2hor(rd[0],rd[1],c);return h2v(hh[0],hh[1])};
   if(o.circle){for(let a=0;a<=360;a+=6)pts.push(corner(Math.cos(a*D2R)*o.circle*AS,Math.sin(a*D2R)*o.circle*AS))}
   if(!o.circle){const cs=[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]];for(let k=0;k<4;k++)for(let s=0;s<=10;s++){const tt=s/10,xa=cs[k][0]+(cs[k+1][0]-cs[k][0])*tt,ya=cs[k][1]+(cs[k+1][1]-cs[k][1])*tt;pts.push(corner(xa*w,ya*h))}}
   line(pts,'rgba(255,90,90,.9)',1.4);const q=proj(h2v(hz[0],hz[1]),B);if(q){ctx.fillStyle='rgba(255,120,120,.95)';ctx.fillText('Teleskop',q[0]+4,q[1]+14)}}}}
 // Himmelsrichtungen am Horizont
 ctx.font='600 13px IBM Plex Sans, sans-serif';for(const[n,a]of[['N',0],['NO',45],['O',90],['SO',135],['S',180],['SW',225],['W',270],['NW',315]]){const q=proj(h2v(0.01,a*D2R),B);if(q&&q[1]<SH-8){ctx.fillStyle='#f0a64a';ctx.fillText(n,q[0]-5,q[1]+16)}}
 // Auswahl markieren
 if(S.sel){const p=objHor(S.sel,c);if(p&&p.alt>-0.05){const q=proj(h2v(p.alt,p.az),B);if(q){ctx.strokeStyle='#f0a64a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q[0],q[1],11,0,TAU);ctx.stroke()}}}
 updSkyStatus(c)}
function drawMoonIcon(ctx,x,y,r,mo){ctx.save();ctx.fillStyle='#1a1d24';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
 const k=mo.illum,ang=-mo.chi-PI/2;ctx.translate(x,y);ctx.rotate(ang+PI);ctx.fillStyle='#e8e4d8';ctx.beginPath();ctx.arc(0,0,r,-PI/2,PI/2,false);const ex=r*(1-2*k);ctx.ellipse(0,0,Math.abs(ex),r,0,PI/2,-PI/2,ex>0);ctx.fill();ctx.restore()}
function updSkyStatus(c){const v=S.view;const parts=[`Blick: ${dirName(v.az)} ${fmt(((v.az*R2D)%360+360)%360,0)}° · Höhe ${fmt(v.alt*R2D,0)}° · Sichtfeld ${fmt(v.fov,0)}°`,
 `Sonne ${fmt(c.sun.alt*R2D,0)}° → ${skyState(c.sun.alt)}`,`Mond ${Math.round(c.moon.illum*100)} % beleuchtet, ${c.moon.alt>0?'über':'unter'} dem Horizont`,`Sternzeit ${fmtRA(c.lst).slice(0,7)}`];
 $('skyStatus').innerHTML=parts.map(p=>`<span>${p}</span>`).join('')}

// Kuppel von außen
function drawDome(c){const ctx=sctx,W=SW,H=SH,R=Math.min(W*0.36,H*0.42),cx=W/2,cy=H*0.6,Y=S.view.yaw,P=S.view.pitch;
 const sky0=skyRGB(1,c,0);ctx.fillStyle=`rgb(${sky0.map(x=>Math.min(255,x*0.6)|0)})`;ctx.fillRect(0,0,W,H);
 const T=v=>{const x1=v[0]*Math.cos(Y)-v[1]*Math.sin(Y),y1=v[0]*Math.sin(Y)+v[1]*Math.cos(Y);return[cx+R*x1,cy-R*(v[2]*Math.cos(P)-y1*Math.sin(P)),y1*Math.cos(P)+v[2]*Math.sin(P)]};
 const path=(pts,col,w,dash,backCol)=>{for(let pass=0;pass<2;pass++){ctx.strokeStyle=pass?col:(backCol||col.replace(/[\d.]+\)$/,'0.15)'));ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();let pen=false;
  for(const p of pts){if(!p){pen=false;continue}const q=T(p),front=q[2]<=0.02;if(front!==!!pass){pen=false;continue}pen?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);pen=true}ctx.stroke()}ctx.setLineDash([])};
 // Boden
 ctx.fillStyle='rgba(40,52,40,.9)';ctx.beginPath();for(let a=0;a<=360;a+=4){const q=T(h2v(0,a*D2R));a?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.fill();
 // Kuppel-Füllung leicht
 ctx.fillStyle='rgba(30,45,80,.25)';ctx.beginPath();ctx.arc(cx,cy,R,PI,0);ctx.fill();
 for(let a=0;a<90;a+=30){const pts=[];for(let z=0;z<=360;z+=3)pts.push(h2v(a*D2R,z*D2R));path(pts,a===0?'rgba(240,166,74,.9)':'rgba(240,166,74,.35)',a===0?1.6:1)}
 for(let z=0;z<180;z+=30){const pts=[];for(let a=0;a<=180;a+=3)pts.push(h2v(Math.min(a,180-a)*D2R,(a<=90?z:z+180)*D2R));path(pts,'rgba(240,166,74,.3)',1)}
 // Meridian hervorgehoben
 {const pts=[];for(let a=0;a<=180;a+=2)pts.push(h2v((a<=90?a:180-a)*D2R,(a<=90?0:180)*D2R));path(pts,'rgba(240,166,74,.75)',1.3,[6,4])}
 // Himmelsäquator & Pol
 {const pts=[];for(let h=0;h<=360;h+=3){const hz=eq2hor(h*D2R,0,c);pts.push(hz[0]>=0?h2v(hz[0],hz[1]):null)}path(pts,'rgba(127,178,255,.9)',1.5)}
 const pole=h2v(c.lat,0),pq=T(pole),o=T([0,0,0]);ctx.strokeStyle='rgba(127,178,255,.9)';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(o[0],o[1]);ctx.lineTo(o[0]+(pq[0]-o[0])*1.25,o[1]+(pq[1]-o[1])*1.25);ctx.stroke();ctx.setLineDash([]);
 ctx.font='12px IBM Plex Sans, sans-serif';ctx.fillStyle='rgba(127,178,255,1)';ctx.fillText('Himmelspol (Höhe = Breitengrad '+fmt(S.loc.lat,1)+'°)',pq[0]+8,pq[1]-6);
 // Himmelsrichtungen
 ctx.font='600 14px IBM Plex Sans, sans-serif';for(const[n,a]of[['N',0],['O',90],['S',180],['W',270]]){const q=T(h2v(0,a*D2R)),q2=[cx+(q[0]-cx)*1.1,cy+(q[1]-cy)*1.1];ctx.fillStyle='#f0a64a';ctx.fillText(n,q2[0]-5,q2[1]+5)}
 // Sterne
 const lim=Math.min(4,limMag(c));for(let i=0;i<NS;i++){const m=sMag[i];if(m>lim)continue;const hz=eq2hor(sRA[i],sDE[i],c);if(hz[0]<0)continue;const q=T(h2v(hz[0],hz[1])),col=bvColor(sBV[i]);
  const front=q[2]<=0;ctx.fillStyle=`rgba(${col.map(x=>x*255|0)},${front?0.95:0.35})`;ctx.beginPath();ctx.arc(q[0],q[1],Math.max(0.6,(4.2-m)*0.7),0,TAU);ctx.fill();picks.push({x:q[0],y:q[1],o:{kind:'star',idx:i},p:m<2?2:0});
  if(S.layers.names&&STARNAMES[i]&&STARNAMES[i][0]&&m<1.6){ctx.font='11px IBM Plex Sans, sans-serif';ctx.fillStyle='rgba(220,225,235,.7)';ctx.fillText(STARNAMES[i][0],q[0]+4,q[1]-3)}}
 for(const p of c.planets.concat([c.moon])){if(p.alt<0)continue;const q=T(h2v(p.alt,p.az));ctx.fillStyle=p.kind==='moon'?'#e8e4d8':'#ffd99a';ctx.beginPath();ctx.arc(q[0],q[1],p.kind==='moon'?6:3.5,0,TAU);ctx.fill();ctx.font='11px IBM Plex Sans, sans-serif';ctx.fillText(p.name,q[0]+6,q[1]-4);picks.push({x:q[0],y:q[1],o:{kind:p.kind,id:p.id},p:3})}
 // Beobachter
 ctx.fillStyle='#d9dee8';ctx.beginPath();ctx.arc(o[0],o[1]-14,4,0,TAU);ctx.fill();ctx.fillRect(o[0]-2,o[1]-10,4,10);
 // Auswahl: Azimut- und Höhenbogen
 const sel=S.sel&&objHor(S.sel,c);if(sel&&sel.alt>0){const az=sel.az,alt=sel.alt,sv=T(h2v(alt,az));
  ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(o[0],o[1]);ctx.lineTo(sv[0],sv[1]);ctx.stroke();
  ctx.strokeStyle='#6fcf97';ctx.lineWidth=2.5;ctx.beginPath();for(let a=0;a<=alt*R2D;a+=1){const q=T(h2v(a*D2R,az));a?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])}ctx.stroke();
  ctx.strokeStyle='#f2c94c';ctx.beginPath();for(let z=0;z<=az*R2D;z+=1){const q=T(h2v(0,z*D2R));const qq=[o[0]+(q[0]-o[0])*0.45,o[1]+(q[1]-o[1])*0.45];z?ctx.lineTo(qq[0],qq[1]):ctx.moveTo(qq[0],qq[1])}ctx.stroke();
  const mid=T(h2v(alt/2,az));ctx.font='600 12px IBM Plex Sans, sans-serif';ctx.fillStyle='#6fcf97';ctx.fillText('Höhe '+fmt(alt*R2D,0)+'°',mid[0]+6,mid[1]);
  const mz=T(h2v(0,az/2));ctx.fillStyle='#f2c94c';ctx.fillText('Azimut '+fmt(az*R2D,0)+'°',o[0]+(mz[0]-o[0])*0.45+4,o[1]+(mz[1]-o[1])*0.45+14);
  ctx.strokeStyle='#f0a64a';ctx.beginPath();ctx.arc(sv[0],sv[1],8,0,TAU);ctx.stroke()}
 ctx.font='12px IBM Plex Sans, sans-serif';ctx.fillStyle='rgba(217,222,232,.8)';ctx.fillText(sel?'Grün = Höhe über dem Horizont, Gelb = Azimut (von Nord über Ost gemessen)':'Klick auf einen Stern: zeigt Azimut und Höhe als Bögen auf der Kuppel',14,H-48)}

// Interaktion Himmel
(function(){let drag=null,moved=0;
 sky.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};moved=0;sky.setPointerCapture(e.pointerId);sky.style.cursor='grabbing'});
 sky.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);drag={x:e.clientX,y:e.clientY};
  if(S.view.mode==='in'){const s=S.view.fov*D2R/SW*1.1;S.view.az=(S.view.az-dx*s+TAU)%TAU;S.view.alt=clamp(S.view.alt+dy*s,-10*D2R,90*D2R)}else{S.view.yaw+=dx*0.008;S.view.pitch=clamp(S.view.pitch+dy*0.006,0.05,1.45)}drawSky()});
 sky.addEventListener('pointerup',e=>{sky.style.cursor='grab';if(drag&&moved<5){const r=sky.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,bd=14;
  for(const p of picks){const d=Math.hypot(p.x-x,p.y-y)-p.p*1.5;if(d<bd){bd=d;best=p}}if(best){S.sel=best.o;showObject(best.o);drawSky()}}drag=null});
 sky.addEventListener('wheel',e=>{e.preventDefault();if(S.view.mode==='in'){S.view.fov=clamp(S.view.fov*Math.exp(e.deltaY*0.0012),2,150);drawSky()}},{passive:false});
 $('viewMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.view.mode=b.dataset.v;[...$('viewMode').children].forEach(x=>x.classList.toggle('on',x===b));drawSky();if(S.view.mode==='out')showTerm('kuppel')};
 document.querySelectorAll('[data-l]').forEach(cb=>cb.onchange=()=>{S.layers[cb.dataset.l]=cb.checked;drawSky()});
 document.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>{const v=b.dataset.look;S.view.mode='in';[...$('viewMode').children].forEach(x=>x.classList.toggle('on',x.dataset.v==='in'));
  if(v==='zen'){S.view.alt=89.9*D2R;S.view.fov=130}else if(v==='tgt'){const c=simCtx(),t=targetRD(c);if(t){const h=eq2hor(t.ra,t.dec,c);S.view.az=h[1];S.view.alt=Math.max(h[0],0.05);S.view.fov=Math.max(4,optics().fovW/3600*5)}}else{S.view.az=+v*D2R;S.view.alt=25*D2R;S.view.fov=100}drawSky()})})();

// ================= Objekte, Infos =================
function objRD(o,c){if(o.kind==='star')return{ra:sRA[o.idx],dec:sDE[o.idx]};if(o.kind==='dso'){const m=MES[o.id];return{ra:m.ra,dec:m.dec}};if(o.kind==='moon')return c.moon;if(o.kind==='planet')return c.planets.find(p=>p.id===o.id);if(o.kind==='field')return{ra:o.ra,dec:o.dec};return null}
function objHor(o,c){const r=objRD(o,c);if(!r)return null;const h=eq2hor(r.ra,r.dec,c);return{alt:h[0],az:h[1],ra:r.ra,dec:r.dec}}
function objName(o){if(o.kind==='star'){const n=STARNAMES[o.idx];return n?(n[0]||n[1]):'Stern'}if(o.kind==='dso')return o.id+(DE_NAMES[o.id]?' – '+DE_NAMES[o.id]:'');if(o.kind==='moon')return'Mond';if(o.kind==='planet')return{mars:'Mars',jupiter:'Jupiter',saturn:'Saturn'}[o.id];return o.name||'Feld'}
const TYPE_DE={gc:'Kugelsternhaufen',oc:'Offener Sternhaufen',pn:'Planetarischer Nebel',sfr:'Sternentstehungsgebiet (Emissionsnebel)',en:'Emissionsnebel',bn:'Heller Nebel',rn:'Reflexionsnebel',snr:'Supernova-Überrest',s:'Spiralgalaxie',sb:'Balkenspiralgalaxie',e:'Elliptische Galaxie',i:'Irreguläre Galaxie',s0:'Linsenförmige Galaxie','c+n':'Haufen mit Nebel',ds:'Doppelstern',ast:'Asterismus',pos:'Sternwolke'};
function transitInfo(ra,dec,c){const dH=wrapPI(ra-c.lst);const hrs=dH/TAU*23.9345;const t=new Date(S.date.getTime()+hrs*3600e3);const maxAlt=90-Math.abs(S.loc.lat-dec*R2D);const circ=dec*R2D>90-S.loc.lat,never=dec*R2D<-(90-S.loc.lat);return{t,maxAlt,circ,never}}
function showObject(o){const c=S.ctx||simCtx(),h=objHor(o,c);if(!h)return;const name=objName(o);let rows=[],txt='';
 if(o.kind==='star'){const n=STARNAMES[o.idx];rows.push(['Bezeichnung',n?n[1]:'–'],['Helligkeit',fmt(sMag[o.idx],2)+' mag <i class="i" data-t="magnitude">i</i>'],['Farbe (B−V)',fmt(sBV[o.idx],2)+(sBV[o.idx]>1.2?' · rötlich, kühl':sBV[o.idx]<0.1?' · bläulich, heiß':'')]);
  if(n&&n[1].includes('UMi')&&n[1].startsWith('α'))txt='Der Polarstern steht fast genau am Himmelsnordpol. Um ihn dreht sich scheinbar der ganze Himmel, deshalb richtet man parallaktische Montierungen auf ihn aus.'}
 if(o.kind==='dso'){const m=MES[o.id];rows.push(['Typ',TYPE_DE[m.type]||m.type],['Helligkeit',fmt(m.mag,1)+' mag (gesamt)'],['Größe',m.a+'′ × '+m.b+'′'+` <span class="muted">(Mond ≈ 31′)</span>`]);if(m.alt)rows.push(['Engl. Name',m.alt])}
 if(o.kind==='planet'){const p=c.planets.find(x=>x.id===o.id);rows.push(['Helligkeit',fmt(p.mag,1)+' mag'],['Scheinbare Größe',fmt(p.diam,1)+'″'],['Entfernung',fmt(p.dist,2)+' AE']);txt='Planeten sind winzig: Selbst Jupiter ist nur ca. 1/40 so groß wie der Mond. Dafür braucht man lange Brennweite und ruhige Luft (Seeing).'}
 if(o.kind==='moon'){rows.push(['Beleuchtet',Math.round(c.moon.illum*100)+' %'],['Größe','ca. 31′']);txt='Der Mond ist so hell, dass Belichtungen von 1/100 s reichen. Am Terminator (Licht-Schatten-Grenze) sieht man die Krater am plastischsten.'}
 const ti=transitInfo(h.ra,h.dec,c);
 rows.push(['Rektaszension <i class="i" data-t="rektaszension">i</i>',fmtRA(h.ra)],['Deklination <i class="i" data-t="deklination">i</i>',fmtDeg(h.dec)],['Azimut <i class="i" data-t="azimut">i</i>',fmt(h.az*R2D,1)+'° ('+dirName(h.az)+')'],['Höhe <i class="i" data-t="hoehe">i</i>',fmt(h.alt*R2D,1)+'°'],
  ['Kulmination <i class="i" data-t="meridian">i</i>',ti.never?'geht hier nie auf':fmtTime(ti.t)+' Uhr, '+fmt(ti.maxAlt,0)+'° hoch'+(ti.circ?' · zirkumpolar':'')]);
 const where=h.alt>0?`<p>Jetzt: Schau nach <b>${dirName(h.az)}</b> und dann <b>${fmt(h.alt*R2D,0)}°</b> nach oben. Eine Faust am ausgestreckten Arm ≈ 10°.</p>`:'<p class="muted">Steht gerade unter dem Horizont.</p>';
 info(`<h2>${name}</h2>${where}<table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>${txt?`<p class="muted">${txt}</p>`:''}<p style="margin-top:10px"><button class="small primary" id="setTgt">Als Fotoziel wählen</button></p>`);
 $('setTgt').onclick=()=>{setTarget(o);showTab('shot')}}
function info(html){$('info').innerHTML=html;$('info').scrollTop=0}
function intro(){info(`<h2>So funktioniert der Entwurf</h2><p>Die App simuliert eine Nacht mit Teleskop und Kamera, mit echtem Sternhimmel (Hipparcos-Katalog), echten Planeten- und Mondpositionen für Ort und Zeit.</p>
 <h3>Ablauf</h3><p><b>1 Himmel:</b> umsehen, Koordinaten verstehen, Ziel finden.<br><b>2 Ausrüstung:</b> frei zusammenstellen, Kennzahlen und Engpässe sehen.<br><b>3 Aufbau:</b> waagerecht stellen, einnorden, Polhöhe, Polsucher.<br><b>4 Aufnahme:</b> fokussieren, belichten. Das Bild wird aus deinen Einstellungen berechnet, Fehler sieht man im Bild.<br><b>5 Galerie:</b> Bilder vergleichen.</p>
 <h3>Erklärungen</h3><p>Blaue <a class="term" data-t="azimut">Begriffe</a> und <i class="i" data-t="magnitude">i</i>-Symbole öffnen hier rechts die Erklärung. Alles steht auch im Lexikon.</p>
 <div class="note">Entwurf zum Review: Planeten- und Mondbahnen sind vereinfacht (Genauigkeit etwa 1°), Bildsimulation ist physikalisch angelehnt, aber nicht exakt. Lichtschwache Hintergrundsterne in Fotos werden statistisch erzeugt.</div>`)}
