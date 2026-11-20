"use strict";
// ================= Aufnahme: Hilfsfunktionen =================
function tKey(o){return o.kind+':'+(o.id||o.idx)}
function tan2rd(ra0,dec0,xi,eta){// Tangentialebene (rad) -> RA/Dec
 const rho=Math.hypot(xi,eta);if(rho<1e-12)return[ra0,dec0];const cc=Math.atan(rho),sc=Math.sin(cc),ccs=Math.cos(cc);
 const dec=Math.asin(ccs*Math.sin(dec0)+eta*sc*Math.cos(dec0)/rho);const ra=ra0+Math.atan2(xi*sc,rho*Math.cos(dec0)*ccs-eta*Math.sin(dec0)*sc);return[ra,dec]}
function rd2tan(ra0,dec0,ra,dec){const cd=Math.cos(dec),cosc=Math.sin(dec0)*Math.sin(dec)+Math.cos(dec0)*cd*Math.cos(ra-ra0);if(cosc<=0.05)return null;
 return[cd*Math.sin(ra-ra0)/cosc,(Math.cos(dec0)*Math.sin(dec)-Math.sin(dec0)*cd*Math.cos(ra-ra0))/cosc]}

function fmtDur(s){if(s<1)return fmtExp(s);if(s<120)return Math.round(s)+' s';if(s<7200)return Math.round(s/60)+' min';return fmt(s/3600,1)+' h'}
// Fokus-Vorschau
function defocusAS(){const o=optics(),d=S.shot.foc-trueFocusNow();return{d,blur:206265*(Math.abs(d)/1000)/(o.N*o.fTel)}}
function drawFocus(){const cv=$('focCv'),x=cv.getContext('2d'),W=cv.width,H=cv.height;x.fillStyle='#000';x.fillRect(0,0,W,H);const f=defocusAS(),o=optics(),see=S.loc.see;
 const fwhm=Math.sqrt(see**2+(116/o.D)**2+f.blur**2);const pxas=0.35;// Vorschau: 0,35″/px vergrößert
 const r=clamp(fwhm/pxas/2,1.2,60);const cx=W/2,cy=H/2;
 if(S.shot.baht){const k=f.d*0.06;x.save();x.translate(cx,cy);x.globalCompositeOperation='lighter';const sp=(ang,off,len,a)=>{x.save();x.rotate(ang);x.translate(0,off);const g=x.createLinearGradient(-len,0,len,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(0.5,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(-len,-1.2-f.blur*0.1,2*len,2.4+f.blur*0.2);x.restore()};
  sp(0.35,0,150,0.9);sp(-0.35,0,150,0.9);sp(0,k,150,0.9);const g=x.createRadialGradient(0,0,0,0,0,10);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,10,0,TAU);x.fill();x.restore();
  x.fillStyle='#8792a5';x.font='11px IBM Plex Sans, sans-serif';x.fillText(Math.abs(f.d)<8?'Mittlerer Strahl mittig → scharf':'Mittlerer Strahl seitlich → noch unscharf',8,H-8)}
 else{const g=x.createRadialGradient(cx,cy,0,cx,cy,r*1.8);const a=clamp(3/r,0.15,1);
  if(f.blur>see*1.5&&o.D>60){// Defokussierter Stern als Ring (Obstruktion)
   g.addColorStop(0,`rgba(255,255,255,${G().optic.obst?0.05:a})`);g.addColorStop(0.45,`rgba(255,255,255,${a})`);g.addColorStop(0.6,`rgba(255,255,255,${a*0.8})`);g.addColorStop(1,'rgba(255,255,255,0)')}
  else{g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.35,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)')}
  x.fillStyle=g;x.beginPath();x.arc(cx,cy,r*1.8,0,TAU);x.fill();x.fillStyle='#8792a5';x.font='11px IBM Plex Sans, sans-serif';x.fillText('Stern-Größe (FWHM): '+fmt(fwhm,1)+'″'+(G().focus.id==='hand'?' – so klein wie möglich drehen':''),8,H-8)}}


// ================= Aufnahme: Bildsimulation =================
const F0=3.0e6;// Photonen/s/cm² für 0 mag (breitbandig, grob)
function shoot(){$('shootBtn').disabled=true;$('shootBtn').textContent='Belichte …';setTimeout(()=>{try{const r=simulate();S.last=r;finishImage(r)}catch(err){console.error(err);$('diag').innerHTML=`<li><span class="dot bad"></span><span>Fehler in der Simulation: ${err.message}</span></li>`}$('shootBtn').disabled=false;syncShotUI()},30)}
function simulate(){const c=S.ctx=simCtx(),g=G(),o=optics(),eye=o.mode==='eye',cam=eye?null:g.camera,list=exposureList();
 const t=eye?0.15:list[S.shot.exp],nfr=eye?1:NFR[S.shot.nfr],gm=cam&&cam.gainMode,setting=eye?0:(gm?GAIN_LIST:ISO_LIST)[S.shot.iso];
 const W=eye?600:760,H=eye?600:Math.round(760*o.fovH/o.fovW);const scale=o.fovW/W;// ″ pro Render-Pixel
 const realScale=o.scale||scale,bin=Math.max(1,scale/realScale);const fs=filterSpec(cam,eye);
 const tg=targetObj(c),rd=telRD(c);S.curTarget=tg;const hz=eq2hor(rd.ra,rd.dec,c);const res={W,H,meta:{},diag:[],t,nfr,setting,eye,target:objName(tg)+(tg.name&&tg.kind!=='dso'?'':''),targetName:tg.name||objName(tg)};
 const R=new Float32Array(W*H),Gc=new Float32Array(W*H),B=new Float32Array(W*H),HA=new Float32Array(W*H),O3=new Float32Array(W*H),S2=new Float32Array(W*H);
 const A=PI*(o.D/20)**2,qe=eye?0.15:cam.qe,trans=(g.optic.obst?1-g.optic.obst**2:1)*0.9;
 const am=hz[0]>0?1/Math.max(Math.sin(hz[0]+0.03),0.05):40,ext=Math.pow(10,-0.4*0.25*(am-1));
 const elec=(mag)=>F0*Math.pow(10,-0.4*mag)*A*t*qe*trans*ext/(bin*bin);// mittlere e⁻ pro echtem Pixel, verteilt auf Render-Pixel
 const T={R,G:Gc,B,W,H,HA,O3,S2,lineE:sb=>F0*Math.pow(10,-0.4*sb)*realScale*realScale*A*t*qe*trans*ext};
 // Zeiger auf die Bildmitte inkl. Goto-Fehler
 let ra0=rd.ra,dec0=rd.dec;const pa=paState();
 // PSF
 const solarT=['planet','moon'].includes(tg.kind),lucky=!!(cam&&cam.id==='planet'&&solarT);let seeing=S.loc.see*Math.pow(am,0.6);if(lucky)seeing*=0.35+0.65*Math.exp(-nfr/40);res.lucky=lucky;const fo=defocusAS(),diff=116/o.D;let jitter=0;const guided=S.acc.has('guide')&&g.mount.track==='eq'&&S.tel.track;if(guided)jitter=0.7;
 const over=o.weight>g.mount.load;if(over)jitter+=4;
 const sigAS=Math.sqrt(seeing**2+diff**2+jitter**2)/2.355,sigPx=Math.max(sigAS/scale,0.55);
 const ca=g.optic.ca||0,sigC=[sigPx*(1+ca*0.12),sigPx,sigPx*(1+ca*0.45)];
 const Hfac=cam?cam.ha:0.5;
 res.meta.alt=hz[0];res.meta.seeing=seeing;res.meta.sig=sigAS*2.355;
 // ---- Sterne zeichnen
 const addStar=(px,py,e,col,big)=>{for(let ch=0;ch<3;ch++){const buf=ch===0?R:ch===1?Gc:B,s=sigC[ch],amp=e*col[ch]/(2*PI*s*s),rad=Math.ceil(s*3.5+(big?2:0));
   const x0=Math.max(0,Math.floor(px-rad)),x1=Math.min(W-1,Math.ceil(px+rad)),y0=Math.max(0,Math.floor(py-rad)),y1=Math.min(H-1,Math.ceil(py+rad));const k=-1/(2*s*s);
   for(let y=y0;y<=y1;y++){const dy=(y-py)**2;for(let x=x0;x<=x1;x++){buf[y*W+x]+=amp*Math.exp(((x-px)**2+dy)*k)}}
   if(big){// schwacher Halo
    const s2=s*5,a2=e*col[ch]*0.03/(2*PI*s2*s2),r2=Math.ceil(s2*3);const xx0=Math.max(0,Math.floor(px-r2)),xx1=Math.min(W-1,Math.ceil(px+r2)),yy0=Math.max(0,Math.floor(py-r2)),yy1=Math.min(H-1,Math.ceil(py+r2));const k2=-1/(2*s2*s2);
    for(let y=yy0;y<=yy1;y++)for(let x=xx0;x<=xx1;x++)buf[y*W+x]+=a2*Math.exp(((x-px)**2+(y-py)**2)*k2)}}};
 const spikes=(px,py,e)=>{const L=Math.min(W/3,Math.log10(e/1000+1)*30*Math.sqrt(1/Math.max(scale,0.3)));if(L<4)return;for(const[dx,dy]of[[1,0],[0,1]])for(let s=-L;s<=L;s+=0.5){const x=Math.round(px+dx*s),y=Math.round(py+dy*s);if(x<0||y<0||x>=W||y>=H)continue;const v=e*0.002*Math.exp(-Math.abs(s)/L*3)/(1+Math.abs(s)*0.2);R[y*W+x]+=v;Gc[y*W+x]+=v;B[y*W+x]+=v}};
 const toPx=(ra,dec)=>{const p=rd2tan(ra0,dec0,ra,dec);if(!p)return null;return[W/2-p[0]*206265/scale,H/2-p[1]*206265/scale]};
 const fwHalf=Math.hypot(o.fovW,o.fovH)/2*AS*1.3;let nStars=0,satStars=0;const fullE=cam?Math.min(cam.fw,(2**cam.bits-1)/gainOf(cam,setting)):1e9;
 const starPeak=(e)=>e*bin*bin/(2*PI*(sigAS/realScale)**2+0.5);
 for(let i=0;i<NS;i++){if(Math.abs(sDE[i]-dec0)>fwHalf)continue;const p=toPx(sRA[i],sDE[i]);if(!p||p[0]<-30||p[1]<-30||p[0]>W+30||p[1]>H+30)continue;
  const col=normCol(bvColor(sBV[i])),e=elec(sMag[i]);addStar(p[0],p[1],e,col,sMag[i]<4);if(g.optic.spikes&&!eye)spikes(p[0],p[1],e);nStars++;if(starPeak(e)>fullE)satStars++}
 // statistische Hintergrundsterne (Positionen erfunden, Dichte realistisch)
 const sr=rng32(hashStr(tKey(tg)+Math.round(ra0*1000))),areaDeg=o.fovW*o.fovH/3600/3600,gl=eq2gal(ra0,dec0)[1]*R2D,boost=1+3*Math.exp(-Math.abs(gl)/12);
 const bgSB=skySB(c,hz[0]);const bgE=F0*Math.pow(10,-0.4*bgSB)*realScale*realScale*A*t*qe*trans;const bgCol=bgColor(c);
 const bgArr=fs.mono?[0,0,0].fill(bgE*fs.sky*(bgCol[0]*fs.bb[0]+bgCol[1]*fs.bb[1]+bgCol[2]*fs.bb[2])):[0,1,2].map(ch=>bgE*fs.sky*bgCol[ch]*fs.bb[ch]);
 const bgChan=fs.mono?bgArr[0]:(bgArr[0]+bgArr[1]+bgArr[2])/3,starF=fs.mono?(fs.bb[0]+fs.bb[1]+fs.bb[2])/3:(fs.bb[0]+fs.bb[1]+fs.bb[2])/9;
 const rn=cam?readNoise(cam,setting):0,sigR=Math.max(sigAS/realScale,0.6),nz=Math.sqrt(bgChan+rn*rn+(cam?cam.dark*t:0))/Math.sqrt(nfr)/Math.sqrt(Math.max(1,bin));
 let mLim=6;if(eye){mLim=2.7+5*Math.log10(o.D)-Math.max(0,(S.loc.b-2)*0.35)}else for(let m=6;m<19;m+=0.1){const pk=F0*Math.pow(10,-0.4*m)*A*t*qe*trans*ext/(2*PI*sigR*sigR)*starF;if(pk<2.5*nz)break;mLim=m}
 let nFaint=Math.min(25000,Math.round(areaDeg*boost*Math.pow(10,0.45*(mLim-6)-0.92)));
 for(let k=0;k<nFaint;k++){const u=sr();const m=6+Math.log10(1+u*(Math.pow(10,0.45*(mLim-6))-1))/0.45;const px=sr()*W,py=sr()*H;const bv=0.3+sr()*1.2;addStar(px,py,elec(m),normCol(bvColor(bv)),false)}
 res.meta.mLim=mLim;if(eye)res.eyeThr=F0*Math.pow(10,-0.4*mLim)*A*t*qe*trans/(2*PI*sigPx*sigPx);
 // ---- Flächige Objekte
 const Sflux=(mag)=>elec(mag);
 if(tg.kind==='dso')renderDSO(MES[tg.id],toPx,scale,Sflux,T,Hfac,ra0,dec0,addStar,elec,sr);
 if(tg.kind==='dso'&&tg.id!=='M42'){/* Nachbarobjekte im Feld */}
 for(const k in MES){if(tg.kind==='dso'&&k===tg.id)continue;const m=MES[k];if(Math.abs(m.dec-dec0)>fwHalf)continue;const p=toPx(m.ra,m.dec);if(p&&p[0]>-200&&p[1]>-200&&p[0]<W+200&&p[1]<H+200)renderDSO(m,toPx,scale,Sflux,T,Hfac,ra0,dec0,addStar,elec,sr)}
 for(const p of c.planets){const q=toPx(p.ra,p.dec);if(q&&q[0]>-50&&q[1]>-50&&q[0]<W+50&&q[1]<H+50)renderPlanet(p,q,scale,elec,T,sigPx)}
 for(const p of c.planets){if(p.id!=='jupiter'&&p.id!=='saturn')continue;const q=toPx(p.ra,p.dec);if(!q)continue;const Rp=p.diam/2/scale;
  for(const mm of(p.id==='jupiter'?jupiterMoons(c.jd):[titanPos(c.jd)])){if(mm.behind&&Math.abs(mm.x)<1)continue;const px=q[0]+mm.x*Rp,py=q[1]-mm.y*Rp;if(px<-5||py<-5||px>W+5||py>H+5)continue;addStar(px,py,elec(mm.mag),normCol(bvColor(0.9)),false)}}
 {const q=toPx(c.moon.ra,c.moon.dec);if(q&&q[0]>-W&&q[1]>-H&&q[0]<2*W&&q[1]<2*H)renderMoon(c.moon,q,scale,elec,T,sigPx)}
 if(tg.kind==='field'&&o.fovW>3*3600||o.fovW>6*3600){// Milchstraße flächig
  const step=2;for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){const r=tan2rd(ra0,dec0,-(x-W/2)*scale*AS,-(y-H/2)*scale*AS);const mw=mwBright(r[0],r[1]);if(mw<=0.01)continue;
   const e=F0*Math.pow(10,-0.4*21.2)*mw*scale*scale/(bin*bin)*A*t*qe*trans*ext;for(let yy=y;yy<Math.min(H,y+step);yy++)for(let xx=x;xx<Math.min(W,x+step);xx++){const i=yy*W+xx;R[i]+=e*0.36;Gc[i]+=e*0.34;B[i]+=e*0.30}}}
 // ---- Filter und Kamera: Linien und Breitband zu Kanälen kombinieren
 res.filter=fs.f;res.mono=fs.mono;
 for(let i=0;i<W*H;i++){const h=HA[i],o3=O3[i],s2=S2[i];
  if(fs.mono){const L=R[i]*fs.bb[0]+Gc[i]*fs.bb[1]+B[i]*fs.bb[2]+h*fs.ha+o3*fs.o3+s2*fs.s2;R[i]=L;Gc[i]=L;B[i]=L}
  else{R[i]=R[i]*fs.bb[0]+h*fs.ha[0]+o3*fs.o3[0]+s2*fs.s2[0];Gc[i]=Gc[i]*fs.bb[1]+h*fs.ha[1]+o3*fs.o3[1]+s2*fs.s2[1];B[i]=B[i]*fs.bb[2]+h*fs.ha[2]+o3*fs.o3[2]+s2*fs.s2[2]}}
 // ---- Bewegung während der Belichtung
 const mot=motionModel(c,g,pa,rd,dec0,hz,scale,W,H,t,guided,over);res.meta.drift=mot.maxShift;res.meta.mot=mot;
 let R2=R,G2=Gc,B2=B;if(mot.maxShift>0.35){if(fs.mono){R2=smear(R,W,H,mot);G2=new Float32Array(R2);B2=new Float32Array(R2)}else[R2,G2,B2]=[R,Gc,B].map(buf=>smear(buf,W,H,mot))}
 // ---- Fokus-Unschärfe
 const blurPx=fo.blur/scale/2;res.meta.defocus=fo.blur;if(blurPx>0.6){for(const buf of[R2,G2,B2])boxBlur(buf,W,H,blurPx)}
 // ---- Hintergrund, Vignette, Wärme, Rauschen
 res.meta.bgE=bgE;res.meta.bgSB=bgSB;
 const dark=cam?cam.dark*t:0,hotR=rng32(1234+hashStr(g.camera.id));const hot=new Map();if(cam&&t>=2&&cam.dark>0.01){for(let k=0;k<180;k++)hot.set((hotR()*W|0)+(hotR()*H|0)*W,[hotR()*30*t,hotR(),hotR()])}
 const nr=rng32((Date.now()&0xffff)+7),sq=Math.sqrt(nfr),dispN=1/Math.sqrt(Math.max(1,bin))*1;
 const vig=cam&&o.mode!=='eye'?(S.shot.flat?0:(o.mode==='afocal'?0.4:0.2)):0;const circ=o.circle?o.circle/scale:null;
 const out=[R2,G2,B2],nch=fs.mono?1:3;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const rr=((x-W/2)**2+(y-H/2)**2)/((W/2)**2+(H/2)**2);let v=1-vig*rr*rr*1.4;
  let mask=1;if(circ){const d=Math.hypot(x-W/2,y-H/2);mask=clamp((circ-d)/3,0,1)}
  const hp=hot.get(i);
  for(let ch=0;ch<nch;ch++){const sig=(out[ch][i]+bgArr[ch])*v*mask;let dk=dark;if(hp&&!S.shot.dark)dk+=hp[0]*(ch===(hp[1]*3|0)?1:0.3);
   const tot=sig+dk;const sd=Math.sqrt(Math.max(tot,0)+rn*rn+(S.shot.dark?dark:0))/sq*dispN;let val=tot+gauss(nr)*sd;if(S.shot.dark)val-=dark;
   if(eye)val=sig+gauss(nr)*Math.sqrt(Math.max(sig,0))*0.3;out[ch][i]=val}if(nch===1){out[1][i]=out[0][i];out[2][i]=out[0][i]}}
 res.buf=out;res.fullE=fullE;res.gain=cam?gainOf(cam,setting):1;res.circ=circ;res.o=o;res.g=g;res.scale=scale;res.bgE=bgChan*3;if(!eye)storeRaw(res,tg);
 // Diagnose
 buildDiag(res,c,g,o,pa,fo,mot,satStars,hz,guided,over);return res}
function normCol(c){const s=c[0]+c[1]+c[2];return[c[0]/s,c[1]/s,c[2]/s]}
function gainOf(cam,setting){return cam.gainMode?cam.g0*Math.pow(10,setting/200):cam.g0*setting/100*(cam.bits===10?0.5:1)}
function readNoise(cam,setting){return cam.gainMode?(setting>=100?cam.rn:cam.rn*(1+2.5*(100-setting)/100)):cam.rn*(1+600/setting)/(1+600/1600)}
function noiseFloor(cam,t,scale,realScale,A,qe,trans,bin,eye){const bg=F0*Math.pow(10,-0.4*skySB(S.ctx,0.8))*realScale*realScale*A*t*qe*trans;const rn=cam?cam.rn:3;return Math.sqrt(bg+rn*rn)/Math.sqrt(NFR[S.shot.nfr]||1)*(eye?8:1)}
function skySB(c,alt){let sb=BORTLE[S.loc.b-1][2];const s=c.sun.alt*R2D;sb-=(1-Math.sin(Math.max(alt,0.05)))*0.6;
 let f=Math.pow(10,-0.4*sb);if(c.moon.alt>0){f+=Math.pow(10,-0.4*20.3)*c.moon.illum**1.5*Math.sin(c.moon.alt)*3}
 if(s>-18){const sbs=s>0?4:21.5-(s+18)*0.95;f+=Math.pow(10,-0.4*sbs)}return-2.5*Math.log10(f)}
function bgColor(c){const lp=(S.loc.b-1)/8,s=c.sun.alt*R2D;let col=[0.34+lp*0.12,0.36,0.30-lp*0.1];if(s>-12)col=[0.28,0.33,0.39];if(c.moon.alt>0&&c.moon.illum>0.4)col=[col[0]*0.9,col[1],col[2]*1.15];if(S.shot.filter==='lp')col=[col[0]*0.8,col[1]*1.05,col[2]*1.1];const t=col[0]+col[1]+col[2];return col.map(x=>x/t)}
function motionModel(c,g,pa,rd,dec0,hz,scale,W,H,t,guided,over){const m={type:g.mount.track,rot:0,px:W/2,py:H/2,tx:0,ty:0,maxShift:0,pe:0,T:t};
 const asPx=1/scale;
 if(g.mount.track==='none'){const ang=OMEGA*t;if(Math.abs(dec0)<0.5*D2R){m.tx=15.04*t*Math.cos(dec0)*asPx;m.maxShift=Math.abs(m.tx)}
  else{const eta=Math.abs(1/Math.tan(dec0))*206265;m.px=W/2;m.py=dec0>=0?H/2-eta*asPx:H/2+eta*asPx;m.rot=dec0>=0?-ang:ang;
   const far=Math.max(Math.hypot(m.px,m.py),Math.hypot(W-m.px,H-m.py),Math.hypot(m.px,H-m.py),Math.hypot(W-m.px,m.py));m.maxShift=ang*far}}
 else if(g.mount.track==='altaz'){const alt=Math.max(hz[0],0.05);const rate=OMEGA*Math.cos(c.lat)*Math.cos(hz[1])/Math.cos(alt);m.rot=rate*t;m.maxShift=Math.abs(m.rot)*Math.hypot(W,H)/2;
  m.pe=g.mount.pe;m.peAmp=g.mount.pe*asPx*(over?3:1);m.peP=300;m.peph=Math.random()*TAU}
 else{const H0=c.lst-rd.ra;let ddot=OMEGA*(pa.azErr*D2R*Math.cos(c.lat)*Math.cos(H0)+pa.altErr*D2R*Math.sin(H0))*206265;// ″/s
  if(guided){ddot=0;m.peAmp=0}else{m.peAmp=g.mount.pe*asPx*(over?3:1);m.peP=g.mount.id==='tracker'?240:480;m.peph=Math.random()*TAU}
  m.ty=-ddot*t*asPx;m.rot=guided?pa.tot*D2R*OMEGA*t*0.3:0;
  const peMax=m.peAmp?Math.abs(m.peAmp*(Math.sin(TAU*t/m.peP+m.peph)-Math.sin(m.peph))):0;const peSpan=m.peAmp?Math.min(2*m.peAmp,m.peAmp*TAU*t/m.peP*1.0):0;m.maxShift=Math.hypot(m.ty,Math.max(peMax,peSpan))+Math.abs(m.rot)*Math.hypot(W,H)/2;m.ddot=ddot}
 if(m.peAmp&&m.type==='altaz'){m.maxShift+=Math.min(2*m.peAmp,m.peAmp*TAU*t/m.peP)}
 return m}
function smear(src,W,H,m){const N=clamp(Math.ceil(m.maxShift*1.6),2,72);const dst=new Float32Array(W*H);
 for(let k=0;k<N;k++){const f=(k+0.5)/N,ang=m.rot*f,ca=Math.cos(ang),sa=Math.sin(ang);let tx=m.tx*f,ty=m.ty*f;if(m.peAmp){tx+=m.peAmp*(Math.sin(TAU*f*m.T/m.peP+m.peph)-Math.sin(m.peph))}
  for(let y=0;y<H;y++){for(let x=0;x<W;x++){// inverse Transformation: Quelle = R(-ang)*(p - pivot - t) + pivot
    const dx=x-m.px-tx,dy=y-m.py-ty,sx=m.px+dx*ca+dy*sa,sy=m.py-dx*sa+dy*ca;const ix=sx|0,iy=sy|0;if(ix<0||iy<0||ix>=W-1||iy>=H-1)continue;const fx=sx-ix,fy=sy-iy,i=iy*W+ix;
    dst[y*W+x]+=(src[i]*(1-fx)*(1-fy)+src[i+1]*fx*(1-fy)+src[i+W]*(1-fx)*fy+src[i+W+1]*fx*fy)}}}
 for(let i=0;i<dst.length;i++)dst[i]/=N;return dst}
function boxBlur(buf,W,H,r){const R=Math.max(1,Math.round(r*0.6));const tmp=new Float32Array(W*H);for(let pass=0;pass<2;pass++){
  for(let y=0;y<H;y++){let acc=0;const row=y*W;for(let x=-R;x<=R;x++)acc+=buf[row+clamp(x,0,W-1)];for(let x=0;x<W;x++){tmp[row+x]=acc/(2*R+1);acc+=buf[row+clamp(x+R+1,0,W-1)]-buf[row+clamp(x-R,0,W-1)]}}
  for(let x=0;x<W;x++){let acc=0;for(let y=-R;y<=R;y++)acc+=tmp[clamp(y,0,H-1)*W+x];for(let y=0;y<H;y++){buf[y*W+x]=acc/(2*R+1);acc+=tmp[clamp(y+R+1,0,H-1)*W+x]-tmp[clamp(y-R,0,H-1)*W+x]}}}}
// Flächige Objekte
function blob(T,px,py,sx,sy,ang,e,col){if(e<=0)return;const{R,G,B,W,H}=T;const ca=Math.cos(ang),sa=Math.sin(ang);const rad=Math.ceil(3*Math.max(sx,sy))+1;const amp=e/(2*PI*sx*sy);
 const x0=Math.max(0,Math.floor(px-rad)),x1=Math.min(W-1,Math.ceil(px+rad)),y0=Math.max(0,Math.floor(py-rad)),y1=Math.min(H-1,Math.ceil(py+rad));if(x0>x1||y0>y1)return;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x-px,dy=y-py,u=dx*ca+dy*sa,v=-dx*sa+dy*ca;const g=amp*Math.exp(-0.5*((u/sx)**2+(v/sy)**2));if(g<1e-6)continue;const i=y*W+x;R[i]+=g*col[0];G[i]+=g*col[1];B[i]+=g*col[2]}}
function renderDSO(m,toPx,scale,flux,T,Hfac,ra0,dec0,addStar,elec,sr0){const p=toPx(m.ra,m.dec);if(!p)return;const sr=rng32(hashStr(m.id));const a=m.a*60/scale,b=m.b*60/scale;const total=flux(m.mag);
 const ty=m.type,pa=(PA[m.id]!=null?PA[m.id]:sr()*180)*D2R,ang=-(pa)+PI/2;
 const HA=[1*Hfac+0.15,0.32*Hfac+0.06,0.42*Hfac+0.08],OIII=[0.15,0.5,0.45];
 if(NEB[m.id]||['sfr','en','bn','snr','c+n','rn','pn'].includes(ty)){renderNebula(m,p,scale,T,addStar,elec);return}
 else if(['s','sb','e','i','s0','sd','g'].includes(ty)){const colC=normCol([1,0.85,0.65]),colD=normCol([0.75,0.8,1]);const ba=m.b/m.a;
  blob(T,p[0],p[1],a*0.06,a*0.06*Math.max(ba,0.5),ang,total*0.25,colC);
  if(ty==='e'){blob(T,p[0],p[1],a*0.25,b*0.25,ang,total*0.7,colC)}else{
   const N=900;for(let k=0;k<N;k++){const r=-Math.log(1-sr()*0.98)*0.12;let th=sr()*TAU;if(['s','sb'].includes(ty)){const arm=(sr()<0.5?0:PI)+Math.log(r+0.02)*2.8;if(sr()<0.65)th=arm+gauss(sr)*0.35}
    const u=Math.cos(th)*r*a,v=Math.sin(th)*r*a*ba;const x=p[0]+u*Math.cos(ang)-v*Math.sin(ang),y=p[1]+u*Math.sin(ang)+v*Math.cos(ang);blob(T,x,y,Math.max(0.6,a*0.025),Math.max(0.6,a*0.025),0,total*0.7/N,sr()<0.15?normCol([0.6,0.7,1]):colD);if(['s','sb'].includes(ty)&&sr()<0.07)blobLine(T,T.HA,x,y,Math.max(0.6,a*0.012),total*0.5/N)}
   if(m.id==='M31'){const u0=-0.08,v0=0.12;for(let k=0;k<40;k++){const u=(k/40-0.5)*a*0.9,v=(u0+v0*0)*a*ba+u*0.02;const x=p[0]+u*Math.cos(ang)-v*Math.sin(ang),y=p[1]+u*Math.sin(ang)+v*Math.cos(ang);blob(T,x,y,a*0.03,a*0.012,ang,-total*0.004,colC)}}}}
 else if(ty==='gc'){const N=900,rc=a*0.08;blob(T,p[0],p[1],rc*1.5,rc*1.5,0,total*0.5,normCol([1,0.92,0.8]));for(let k=0;k<N;k++){const r=rc*Math.abs(gauss(sr))*1.7,th=sr()*TAU;addStar(p[0]+Math.cos(th)*r,p[1]+Math.sin(th)*r,total*0.5/N*(0.3+sr()*2),normCol(bvColor(0.6+sr()*0.8)),false)}}
 else if(ty==='oc'){const N=m.id==='M45'?60:90;for(let k=0;k<N;k++){const r=a*0.35*Math.sqrt(sr()),th=sr()*TAU;addStar(p[0]+Math.cos(th)*r,p[1]+Math.sin(th)*r,elec(m.mag+4+sr()*5),normCol(bvColor(sr()*0.8)),false)}
  if(m.id==='M45'){for(let k=0;k<22;k++){const th=sr()*TAU,r=sr()*0.3;blob(T,p[0]+Math.cos(th)*r*a,p[1]+Math.sin(th)*r*b,a*(0.05+sr()*0.1),b*(0.04+sr()*0.09),sr()*PI,total*0.01,normCol([0.35,0.5,1]))}}}}
function renderPlanet(p,q,scale,elec,T,sigPx){const r=p.diam/2/scale;const e=elec(p.mag);if(r<0.8){blob(T,q[0],q[1],sigPx,sigPx,0,e,p.id==='mars'?normCol([1,0.6,0.45]):normCol([1,0.92,0.75]));return}
 const{R,G,B,W,H}=T;const rings=p.id==='saturn';const Bt=Math.abs(26.7*Math.sin(p.hlon-349.5*D2R))*D2R,rr=r*2.25,rb=Math.max(Math.sin(Bt),0.02);
 // Fläche normieren
 let sum=0;const cells=[];const ext=Math.ceil(rings?rr+2:r+2);for(let y=-ext;y<=ext;y++)for(let x=-ext;x<=ext;x++){let v=0,col;const nx=x/r,ny=y/(r*0.92);const d=nx*nx+ny*ny;
  if(d<=1){const mu=Math.sqrt(1-d);v=0.4+0.6*mu;if(p.id==='jupiter'){const lat=ny;const band=0.75+0.25*Math.cos(lat*9.5)+(Math.abs(lat-0.22)<0.06?-0.25:0)+(Math.abs(lat+0.2)<0.07?-0.3:0);v*=band;col=[1,0.88-0.1*(1-band),0.72-0.2*(1-band)];{const L=((S.ctx.jd*24/9.925)%1)*TAU,gx=Math.sin(L)*0.8;if(Math.cos(L)>0.05&&((nx-gx)/0.16)**2+((ny-0.36)/0.085)**2<1){col=[1,0.52,0.38];v*=0.97}}}
   else if(p.id==='saturn'){v*=0.85+0.15*Math.cos(ny*7);col=[1,0.9,0.68]}else{col=[1,0.55,0.38];if(ny<-0.82)col=[1,1,1];if(Math.hypot(nx+0.2,ny-0.1)<0.3)v*=0.7}
   if(rings&&Math.abs(ny*0.92)<rb*1.0&&Math.abs(nx)<1&&ny<0&&y>0)v*=0.4}
  if(rings){const ex=x/rr,ey=y/(rr*rb);const rd=Math.hypot(ex,ey);if(rd<=1&&rd>=0.52&&!(d<=1&&y<0)){const cass=Math.abs(rd-0.85)<0.025?0.15:1;const rv=(rd<0.65?0.35:0.9)*cass;v=Math.max(v,rv*0.85);col=[1,0.92,0.75]}}
  if(v>0){cells.push([x,y,v,col]);sum+=v}}
 for(const[x,y,v,col]of cells){const X=Math.round(q[0]+x),Y=Math.round(q[1]+y);if(X<0||Y<0||X>=W||Y>=H)continue;const i=Y*W+X,val=e*v/sum,cn=normCol(col);R[i]+=val*cn[0];G[i]+=val*cn[1];B[i]+=val*cn[2]}
 // Seeing-Unschärfe lokal
 if(sigPx>0.6){const x0=Math.max(0,Math.floor(q[0]-ext-6)),x1=Math.min(W,Math.ceil(q[0]+ext+6)),y0=Math.max(0,Math.floor(q[1]-ext-6)),y1=Math.min(H,Math.ceil(q[1]+ext+6));const w=x1-x0,h=y1-y0;if(w>2&&h>2)for(const buf of[R,G,B]){const sub=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)sub[y*w+x]=buf[(y+y0)*W+x+x0];boxBlur(sub,w,h,sigPx*1.2);for(let y=0;y<h;y++)for(let x=0;x<w;x++)buf[(y+y0)*W+x+x0]=sub[y*w+x]}}}
// Mond: Albedo-Karte mit Maria, Kratern (Mulde + Wall) und Strahlensystemen, beleuchtet nach Mondphase
const MOONMAP=(()=>{const sr=rng32(4242),cr=[];
 const named=[[-0.34,-0.17,0.05,1.25,1],[-0.14,0.68,0.042,1.35,1],[-0.1,-0.78,0.05,0.55,0],[-0.13,0.85,0.1,0.95,0],[-0.04,0.15,0.07,0.95,0],[-0.58,-0.12,0.032,1.4,1],[-0.72,-0.3,0.025,1.6,0],[0.25,0.1,0.05,1.0,0],[0.42,0.45,0.06,1.0,0],[0.1,-0.5,0.04,1.0,0]];
 for(const n of named)cr.push({x:n[0],y:n[1],r:n[2],alb:n[3],ray:!!n[4]});
 for(let k=0;k<900;k++){const r=0.005+0.045*Math.pow(sr(),3.6),x=sr()*2-1,y=sr()*2-1;let mare=false;for(const m of[[-0.15,-0.35,0.33],[0.18,-0.32,0.2],[0.3,-0.05,0.24],[-0.5,0,0.42],[-0.1,0.38,0.18]])if((x-m[0])**2+(y-m[1])**2<m[2]**2)mare=true;if(mare&&sr()<0.75)continue;cr.push({x,y,r,alb:0.96+sr()*0.1})}
 const G=24,grid=Array.from({length:G*G},()=>[]);
 for(const c of cr){const e=c.r*1.55;for(let gy=Math.max(0,Math.floor((c.y-e+1)/2*G));gy<=Math.min(G-1,Math.floor((c.y+e+1)/2*G));gy++)for(let gx=Math.max(0,Math.floor((c.x-e+1)/2*G));gx<=Math.min(G-1,Math.floor((c.x+e+1)/2*G));gx++)grid[gy*G+gx].push(c)}
 const maria=[[-0.15,-0.35,0.33],[0.18,-0.32,0.2],[0.3,-0.05,0.24],[0.68,-0.28,0.13],[-0.5,0,0.42],[-0.1,0.38,0.18],[0.2,0.25,0.14],[-0.45,0.4,0.15],[0.5,0.2,0.12],[0.05,0.0,0.1]];
 const rays=cr.filter(c=>c.ray).map(c=>({...c,ang:Array.from({length:16},()=>sr()*TAU)}));
 return{G,grid,maria,rays}})();
function renderMoon(mo,q,scale,elec,T,sigPx){const{R,G,B,W,H}=T;const r=mo.diam/2/scale;const e=elec(-12.73)/(PI*r*r)*1.3;
 const ux=-Math.sin(mo.chi),uy=-Math.cos(mo.chi),sp=Math.sin(mo.psi),s=[sp*ux,sp*uy,-Math.cos(mo.psi)];
 const M=MOONMAP,Gd=M.G,oc=clamp(Math.floor(Math.log2(r/4)),2,5);
 const x0=Math.max(0,Math.floor(q[0]-r-2)),x1=Math.min(W-1,Math.ceil(q[0]+r+2)),y0=Math.max(0,Math.floor(q[1]-r-2)),y1=Math.min(H-1,Math.ceil(q[1]+r+2));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const nx=(x-q[0])/r,ny=(y-q[1])/r,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d);
  let alb=1;for(const m of M.maria){const dd=((nx-m[0])**2+(ny-m[1])**2)/(m[2]**2);if(dd<1.4)alb*=0.62+0.38*clamp((dd-0.6)/0.8,0,1)}
  alb*=0.84+0.3*fbm(nx*7+3,ny*7,oc);
  let n0=nx,n1=ny;const gx=clamp(Math.floor((nx+1)/2*Gd),0,Gd-1),gy=clamp(Math.floor((ny+1)/2*Gd),0,Gd-1);
  for(const c of M.grid[gy*Gd+gx]){const dx=nx-c.x,dy=ny-c.y,dist=Math.hypot(dx,dy),dd=dist/c.r;if(dd>=1.5||dist<1e-6)continue;
   const rim=Math.exp(-(((dd-1)/0.18)**2)),sl=(dd<1?0.22*dd:0)-0.25*rim*(dd-1)/0.18;n0-=sl*dx/dist;n1-=sl*dy/dist;alb*=1+(c.alb-1)*Math.exp(-((dd/0.8)**4))}
  for(const c of M.rays){const dx=nx-c.x,dy=ny-c.y,dist=Math.hypot(dx,dy);if(dist>0.95||dist<c.r*1.2)continue;const an=Math.atan2(dy,dx);let ray=0;for(const a of c.ang){const da=wrapPI(an-a);if(da<0.1&&da>-0.1)ray+=Math.exp(-((da/0.03)**2))}alb+=0.2*ray*Math.exp(-dist/0.4)}
  const nl=Math.hypot(n0,n1,nz);const cos=(n0*s[0]+n1*s[1]+nz*s[2])/nl;
  const lum=Math.max(0,cos)*alb+(mo.illum<0.3?0.0015*alb:0);if(lum<=0)continue;const v=e*lum;const i=y*W+x;R[i]+=v*0.345;G[i]+=v*0.335;B[i]+=v*0.32}}

// Diagnose
function buildDiag(res,c,g,o,pa,fo,mot,sat,hz,guided,over){const d=[];const add=(lv,txt)=>d.push([lv,txt]);
 if(c.sun.alt>-6*D2R)add('bad',`Es ist ${skyState(c.sun.alt)} – der Himmel ist viel zu hell. Stell die Zeit auf die Nacht (oben).`);
 else if(c.sun.alt>-15*D2R)add('warn',`${skyState(c.sun.alt)}: Der Himmel ist noch aufgehellt.`);
 if(hz[0]<0)add('bad','Das Teleskop zeigt unter den Horizont – auf den Boden oder die Berge.');
 else if(hz[0]<20*D2R)add('warn',`Ziel nur ${fmt(hz[0]*R2D,0)}° hoch: viel Luft im Weg, das Seeing ist ${fmt(res.meta.seeing,1)}″ statt ${fmt(S.loc.see,1)}″. Besser warten, bis es höher steht. <a class="term" data-t="seeing">Seeing</a>`);
 else add('good',`Ziel ${fmt(hz[0]*R2D,0)}° hoch – gut.`);
 const tol=Math.max(res.scale,o.scale||res.scale)*1.2;
 if(res.eye){}
 else if(mot.type==='none'){const lim=500/((o.fEff||50)*(g.camera.sw?43.3/Math.hypot(g.camera.sw,g.camera.sh):1));add(mot.maxShift>2?'bad':mot.maxShift>0.8?'warn':'good',mot.maxShift>0.8?`Keine Nachführung: Die Sterne sind während ${fmtExp(res.t)} um bis zu ${fmt(mot.maxShift*res.scale,0)}″ gewandert → Striche. 500er-Regel: max. ca. ${fmt(lim,1)} s. <a class="term" data-t="erdrotation">Warum?</a>`:'Ohne Nachführung, aber kurz genug belichtet – Sterne bleiben punktförmig.')}
 else if(mot.type==='altaz')add(mot.maxShift>1.5?'warn':'good',mot.maxShift>1.5?`Bildfelddrehung: Am Bildrand verschmieren Sterne um bis zu ${fmt(mot.maxShift,0)} px. Kürzer belichten oder parallaktisch montieren. <a class="term" data-t="bildfelddrehung">Bildfelddrehung</a>`:'Azimutale Nachführung, Bildfelddrehung noch unkritisch.');
 else{if(guided)add('good','Autoguiding aktiv: Getriebe- und Polfehler werden ausgeregelt.');else{const pd=Math.abs(mot.ty),pe=mot.peAmp;add(pd>1.5?'bad':pd>0.7?'warn':'good',`Polausrichtung ${fmt(pa.tot*60,1)}′ daneben → Drift ${fmt(Math.abs(mot.ddot||0)*res.t,1)}″ in dieser Belichtung (${fmt(pd,1)} px).`+(pd>0.7?' Im Tab „Aufbau“ genauer einnorden.':''));
  if(pe>0.5)add(pe*2>2?'warn':'info',`Periodischer Fehler der Montierung (±${g.mount.pe}″) macht Sterne in RA leicht oval. <a class="term" data-t="pe">Periodischer Fehler</a> – Abhilfe: Autoguiding.`)}}
 if(over)add('bad','Montierung überladen: Wackeln und Nachführfehler. <a class="term" data-t="traglast">Traglast</a>');
 add(fo.blur>res.meta.seeing*1.5?'bad':fo.blur>res.meta.seeing*0.6?'warn':'good',fo.blur>res.meta.seeing*0.6?`Unscharf: Fokus um ${Math.abs(Math.round(fo.d))} µm daneben (Sternscheibchen ${fmt(fo.blur,1)}″). Im Fokus-Feld links nachstellen.`:`Fokus sitzt (Abweichung ${Math.abs(Math.round(fo.d))} µm).`);
 if(!res.eye){const bgDN=res.bgE*res.gain/(2**g.camera.bits-1),bgFrac=Math.min(1,res.bgE/res.fullE);res.meta.bgFrac=bgFrac;
  const rn=readNoise(g.camera,res.setting),bgCh=res.bgE/3,swamp=bgCh/(rn*rn);res.meta.swamp=swamp;const tk=targetObj().kind;
  if(tk==='planet'||tk==='moon'){let mx=0;for(let ch=0;ch<3;ch++)for(let i=0;i<res.buf[ch].length;i++)if(res.buf[ch][i]>mx)mx=res.buf[ch][i];const pk=mx/res.fullE;res.meta.peak=pk;
   if(pk>0.97)add('bad',`Überbelichtet: Die hellsten Stellen sind ausgebrannt (reines Weiß, keine Details). Kürzer belichten oder ${g.camera.gainMode?'Gain':'ISO'} runter. Faustregel Mond: sehr kurz, meist 1/250–1/2000 s.`);
   else if(pk<0.2)add('warn',`Zu dunkel: Das Objekt erreicht nur ${Math.round(pk*100)} % der Sättigung. Länger belichten oder ${g.camera.gainMode?'Gain':'ISO'} hoch.`);
   else add('good',`Belichtung passt: hellste Stelle bei ${Math.round(pk*100)} %.`);
   add('info','Profis filmen Planeten als Video mit Tausenden Bildern und behalten nur die schärfsten, wenn die Luft gerade ruhig ist (Lucky Imaging). Kommt in einer späteren Version.')}
  else if(bgFrac>0.5)add('bad',`Himmelshintergrund bei ${Math.round(bgFrac*100)} % der Sättigung: überbelichtet (Lichtverschmutzung, Mond oder Dämmerung). Kürzer belichten, ISO runter oder Filter.`);
  else if(swamp<3)add('warn',`Unterbelichtet: Der Himmelshintergrund (${fmt(bgCh,0)} e⁻) liegt kaum über dem Ausleserauschen (${fmt(rn,1)} e⁻). Schwache Details gehen im Rauschen der Elektronik unter. Länger belichten. <a class="term" data-t="rauschen">Rauschen</a>`);
  else if(swamp<10)add('info',`Belichtung okay, aber noch nicht optimal: Hintergrund ${fmt(swamp,0)}× Ausleserauschen². Ab ca. 10× bringt längeres Belichten pro Bild kaum mehr – dann lieber mehr Bilder stacken.`);
  else add('good',`Gut belichtet: Der Himmelshintergrund überdeckt das Ausleserauschen (${fmt(swamp,0)}×). Jetzt bringen mehr Bilder (Stacking) mehr als längere. <a class="term" data-t="histogramm">Histogramm</a>`);
  if(sat>3)add('info',`${sat} helle Sterne sind gesättigt (ausgebrannt). Bei Deep-Sky normal, bei hohen ISO-Werten mehr.`);
  add('info',`Stacking: ${res.nfr} Bild${res.nfr>1?'er':''} à ${fmtExp(res.t)} = ${fmtDur(res.nfr*res.t)} Gesamtbelichtung. Rauschen ${res.nfr>1?'auf 1/'+fmt(Math.sqrt(res.nfr),1)+' gesenkt':'nicht reduziert'}. Schwächste Sterne ca. ${fmt(res.meta.mLim,1)} mag.`);
  if(g.camera.dark>0.05&&res.t>=2&&!S.shot.dark)add('info','Bunte Einzelpixel = Hotpixel (Wärme im Sensor). Mit Dark-Frames entfernen. <a class="term" data-t="darks">Darks</a>');
  if(!S.shot.flat&&o.mode!=='eye')add('info','Dunkle Ecken = Vignettierung. Mit Flat-Frames korrigieren. <a class="term" data-t="flats">Flats</a>');
  const tg=targetObj();if(tg.kind==='dso'&&['sfr','en','snr'].includes(MES[tg.id].type)&&g.camera.ha<0.5)add('info','Rote Emissionsnebel: Der IR-Sperrfilter deiner Kamera schluckt viel H-alpha-Licht. <a class="term" data-t="halpha">Astromodifikation</a>')}
 else add('info','Visuell sammelt das Auge nur ca. 0,15 s Licht. Nebel wirken deshalb grau und schwach. Farben sieht man nur bei hellen Objekten.');
 if(c.moon.alt>0&&c.moon.illum>0.5&&targetObj().kind==='dso')add('warn',`Mond ${Math.round(c.moon.illum*100)} % am Himmel hellt den Hintergrund auf. Deep-Sky lieber bei Neumond.`);
 res.diag=d}

// Bild fertigstellen (Strecken, Anzeige, Histogramm)
function finishImage(res){const{W,H,buf}=res,cv=$('shotCanvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),im=x.createImageData(W,H),d=im.data;const n=W*H;
 const clipE=res.eye?null:res.fullE,maxDN=res.eye?1:1;
 // linear normalisieren
 const L=[new Float32Array(n),new Float32Array(n),new Float32Array(n)];
 for(let ch=0;ch<3;ch++)for(let i=0;i<n;i++){let v=buf[ch][i];if(res.eye){L[ch][i]=v}else{L[ch][i]=clamp(v/clipE,0,1)}}
 if(res.eye){// Auge: logarithmische Wahrnehmung, schwach = farblos
  const thr=res.eyeThr,floor=0.025+0.012*S.loc.b;for(let i=0;i<n;i++){const l=Math.max(0,L[0][i]+L[1][i]+L[2][i]);const xx=i%W,yy=i/W|0;const inC=!res.circ||Math.hypot(xx-W/2,yy-H/2)<res.circ;
   const p=inC?Math.max(floor,clamp((Math.log10(l+thr*0.05)-Math.log10(thr*0.35))/3.0,0,1)):0;const sat=clamp((Math.log10(l+1)-Math.log10(thr*40))/1.5,0,1);
   for(let ch=0;ch<3;ch++){const cv0=l>0?3*L[ch][i]/l:1;d[i*4+ch]=clamp(255*p*(1-sat+sat*cv0)*(ch===2?1.04:1),0,255)}d[i*4+3]=255}}
 else{let bl=[0,0,0],m=0.25;const solar=['planet','moon'].includes(targetObj().kind);if(S.shot.stretch&&!solar){// Hintergrund schätzen (Median), MTF-Strecken
   const med=[0,0,0],mad=[0,0,0];for(let ch=0;ch<3;ch++){const s=[];for(let k=0;k<4000;k++){const i=(k*7919)%n;if(!res.circ||Math.hypot(i%W-W/2,(i/W|0)-H/2)<res.circ*0.9)s.push(L[ch][i])}s.sort((a,b)=>a-b);med[ch]=s[s.length>>1]||0;mad[ch]=(s.map(v=>Math.abs(v-med[ch])).sort((a,b)=>a-b)[s.length>>1])||1e-4}
   bl=med.map((v,ch)=>Math.max(0,v-2.5*mad[ch]*1.4826));const x0=(med[1]-bl[1])/(1-bl[1]);const t=0.16;m=x0>0&&x0<t?x0*(1-t)/(x0-2*t*x0+t):0.5;
   res.stretchInfo={bl,m}}
  const mtf=(v)=>v<=0?0:v>=1?1:(m-1)*v/((2*m-1)*v-m);
  for(let i=0;i<n;i++){for(let ch=0;ch<3;ch++){let v=L[ch][i];if(S.shot.stretch&&!solar){v=(v-bl[ch])/(1-bl[ch]);v=mtf(clamp(v,0,1))}else v=Math.pow(clamp(v,0,1),1/2.2);d[i*4+ch]=v*255}d[i*4+3]=255}}
 x.putImageData(im,0,0);
 // Histogramm (Rohdaten)
 const hc=$('histCv'),hx=hc.getContext('2d');hx.fillStyle='#05070b';hx.fillRect(0,0,400,120);const bins=[new Float32Array(200),new Float32Array(200),new Float32Array(200)];
 for(let ch=0;ch<3;ch++)for(let i=0;i<n;i+=3){const v=res.eye?d[i*4+ch]/255:L[ch][i];bins[ch][Math.min(199,v*199|0)]++}
 let mx=1;for(const b of bins)for(let k=1;k<199;k++)mx=Math.max(mx,b[k]);hx.globalCompositeOperation='lighter';
 ['rgba(235,90,90,.8)','rgba(90,200,120,.8)','rgba(90,140,240,.8)'].forEach((col,ch)=>{hx.fillStyle=col;for(let k=0;k<200;k++){const h=Math.min(1,bins[ch][k]/mx)*110;hx.fillRect(k*2,118-h,2,h)}});hx.globalCompositeOperation='source-over';
 $('histTxt').textContent=res.eye?'Wahrgenommene Helligkeit (visuell).':`Rohdaten, linear. Links = schwarz, rechts = Sättigung. Hintergrund bei ca. ${fmt((res.meta.bgFrac||0)*100,1)} %.`;
 $('diag').innerHTML=res.diag.map(([lv,t])=>`<li><span class="dot ${lv}"></span><span>${t}</span></li>`).join('');
 $('saveBtn').disabled=false;const g=res.g;$('shotMeta').textContent=`${res.targetName} · ${res.eye?'visuell':fmtExp(res.t)+' × '+res.nfr+' · '+(g.camera.gainMode?'Gain ':'ISO ')+res.setting} · ${S.date.toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'})}`}

function blobLine(T,buf,px,py,sg,e){const{W,H}=T,r=Math.ceil(sg*3),amp=e/(2*PI*sg*sg),k=-1/(2*sg*sg);for(let y=Math.max(0,Math.floor(py-r));y<=Math.min(H-1,Math.ceil(py+r));y++)for(let x=Math.max(0,Math.floor(px-r));x<=Math.min(W-1,Math.ceil(px+r));x++)buf[y*W+x]+=amp*Math.exp(((x-px)**2+(y-py)**2)*k)}
// Filter: wie viel Breitband- und Linienlicht in welchem Kanal ankommt
function filterSpec(cam,eye){let f=eye?'none':(S.shot.filter||'none');const mono=!!(cam&&cam.mono),H=eye?0.3:(cam&&cam.ha!=null?cam.ha:1);
 if(mono){const TAB={L:{bb:[1,1,1],h:1,o:1,s:1},R:{bb:[0.95,0.06,0],h:0.95,o:0.02,s:0.95},G:{bb:[0.06,0.95,0.08],h:0,o:0.85,s:0},B:{bb:[0,0.08,0.95],h:0,o:0.35,s:0},
  Ha:{bb:[0.07,0,0],h:0.92,o:0,s:0},O3:{bb:[0,0.08,0.05],h:0,o:0.92,s:0},S2:{bb:[0.07,0,0],h:0,o:0,s:0.92}};if(!TAB[f])f='L';const M=TAB[f];
  return{mono:true,f,bb:M.bb,ha:M.h,o3:M.o,s2:M.s,sky:1}}
 if(!['none','lp','dual'].includes(f))f='none';
 let bb=[1,1,1],sky=1,ha=[0.9*H,0.02*H,0],o3=[0.03,0.75,0.5],s2=[0.88*H,0.01,0];
 if(f==='lp'){bb=[0.8,0.75,0.85];sky=0.5}
 if(f==='dual'){bb=[0.07,0.08,0.05];ha=ha.map(v=>v*0.9);o3=o3.map(v=>v*0.9);s2=[0.05*H,0,0]}
 return{mono:false,f,bb,ha,o3,s2,sky}}
// Rohdaten (linear, halbe Auflösung) für die Bearbeitung am Laptop aufheben
function storeRaw(res,tg){const w=Math.floor(res.W/2),h=Math.floor(res.H/2),n=res.mono?1:3,d=[];
 for(let ch=0;ch<n;ch++){const a=new Float32Array(w*h),src=res.buf[ch],W=res.W;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=2*y*W+2*x;a[y*w+x]=(src[i]+src[i+1]+src[i+W]+src[i+W+1])/4}d.push(a)}
 S.raws=S.raws||[];const key=tg.kind==='field'?'field:'+Math.round(tg.ra*R2D)+','+Math.round(tg.dec*R2D):tKey(tg);
 S.raws.unshift({id:Date.now()+Math.random(),key,name:res.targetName,filter:res.filter,mono:res.mono,t:res.t,nfr:res.nfr,fullE:res.fullE,w,h,d,when:S.date.toISOString()});if(S.raws.length>30)S.raws.pop()}
