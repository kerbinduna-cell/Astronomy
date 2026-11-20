"use strict";
// ---------- HUD
function initHud(){document.querySelectorAll('[data-hud]').forEach(b=>b.onclick=()=>{const k=b.dataset.hud;S.hud[k]=!S.hud[k];b.classList.toggle('on',S.hud[k]);b.classList.remove('ping');hudApply()});
 document.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{S.speed=+b.dataset.sp;document.querySelectorAll('[data-sp]').forEach(x=>x.classList.toggle('on',x===b))});
 document.querySelector('[data-sp="10"]').classList.add('on')}
function hudApply(){$('tape').style.display=S.hud.dir?'block':'none';$('altTag').style.display=S.hud.alt?'block':'none';$('tasks').style.display=S.hud.tasks?'block':'none';
 document.querySelectorAll('[data-hud]').forEach(b=>b.classList.toggle('on',!!S.hud[b.dataset.hud]))}
const hud=$('hud2d'),hx=hud.getContext('2d');
function proj3(v){const p=v.clone().project(cam);const dir=v.clone().sub(cam.position);const fw=new THREE.Vector3();cam.getWorldDirection(fw);if(dir.dot(fw)<=0)return null;return[(p.x+1)/2*innerWidth,(1-p.y)/2*innerHeight]}
function drawHud(c){hx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);hx.clearRect(0,0,innerWidth,innerHeight);
 const skyP=(alt,az)=>proj3(hv(alt,az,900).add(EYE));
 if(S.hud.cons&&consP){hx.strokeStyle='rgba(150,175,220,.3)';hx.lineWidth=1;hx.beginPath();for(const cn of consP)for(const seg of cn.segs){let prev=null;for(const p of seg){const h=eq2hor(p[0],p[1],c);const q=h[0]>-0.02?skyP(h[0],h[1]):null;if(q&&prev&&Math.hypot(q[0]-prev[0],q[1]-prev[1])<innerWidth*0.5){hx.moveTo(prev[0],prev[1]);hx.lineTo(q[0],q[1])}prev=q}}hx.stroke();
  hx.font='11px IBM Plex Sans, sans-serif';hx.fillStyle='rgba(150,175,220,.55)';for(const cn of consP){const h=eq2hor(cn.c[0],cn.c[1],c);if(h[0]<0.05)continue;const q=skyP(h[0],h[1]);if(q)hx.fillText(CONS[cn.id]?CONS[cn.id][0]:cn.id,q[0],q[1])}}
 if(S.hud.names){hx.font='11px IBM Plex Sans, sans-serif';hx.fillStyle='rgba(225,230,240,.8)';for(const k in STARNAMES){const i=+k,n=STARNAMES[k];if(!n[0]||sMag[i]>2.2||sAlt[i]<0.02||starSize[i]===0)continue;const q=skyP(sAlt[i],sAz[i]);if(q)hx.fillText(n[0],q[0]+6,q[1]-4)}
  hx.fillStyle='#ffd99a';for(const p of c.planets.concat([c.moon])){if(p.alt<0)continue;const q=skyP(p.alt,p.az);if(q)hx.fillText(p.name,q[0]+8,q[1]-6)}}
 // Tape & Höhe
 const az=((-S.look.yaw)%TAU+TAU)%TAU;if(S.hud.dir){const t=$('tape'),tx=t.getContext('2d'),W=t.width;tx.clearRect(0,0,W,34);tx.fillStyle='rgba(8,10,15,.6)';tx.fillRect(0,0,W,34);tx.font='600 12px IBM Plex Sans, sans-serif';tx.textAlign='center';
  const pxPerDeg=W/120;for(let d=-60;d<=60;d++){const a=Math.round(az*R2D)+d;if(a%5)continue;const xx=W/2+(a-az*R2D)*pxPerDeg;const n=((a%360)+360)%360;tx.fillStyle='rgba(240,166,74,.7)';tx.fillRect(xx,n%15?26:22,1,n%15?6:10);
   const lbl={0:'N',45:'NO',90:'O',135:'SO',180:'S',225:'SW',270:'W',315:'NW'}[n];if(lbl){tx.fillStyle='#f0a64a';tx.fillText(lbl,xx,16)}}tx.fillStyle='#fff';tx.fillRect(W/2-1,0,2,34);tx.font='11px IBM Plex Mono';tx.fillText(Math.round(az*R2D)+'°',W/2+22,12)}
 if(S.hud.alt)$('altTag').textContent=`Höhe ${Math.round(S.look.pitch*R2D)}°`;
 // Hinweis-Pfeil
 if(S.hud.hints&&curTask&&curTask.obj){const tgt=hintTarget(curTask.obj);if(tgt){let q=proj3(tgt);const pulse=0.5+0.5*Math.sin(performance.now()/250);
   if(q&&q[0]>40&&q[1]>40&&q[0]<innerWidth-40&&q[1]<innerHeight-40){hx.strokeStyle=`rgba(240,166,74,${0.5+0.5*pulse})`;hx.lineWidth=2;hx.beginPath();hx.arc(q[0],q[1],18+pulse*6,0,TAU);hx.stroke()}
   else{const fw=new THREE.Vector3();cam.getWorldDirection(fw);const d=tgt.clone().sub(cam.position);const local=d.applyQuaternion(cam.quaternion.clone().invert());let ang=Math.atan2(-local.y,local.x);
    const cx=innerWidth/2,cy=innerHeight/2,rr=Math.min(cx,cy)-50,px=cx+Math.cos(ang)*rr,py=cy+Math.sin(ang)*rr;hx.save();hx.translate(px,py);hx.rotate(ang);hx.fillStyle=`rgba(240,166,74,${0.6+0.4*pulse})`;hx.beginPath();hx.moveTo(14,0);hx.lineTo(-8,-9);hx.lineTo(-8,9);hx.fill();hx.restore()}}}}
function hintTarget(k){const w=n=>n.getWorldPosition(new THREE.Vector3());const map={laptop:S.laptopGroup,lamp:S.lampGroup,compass:S.compassGroup,mask:S.maskGroup};
 if(map[k])return w(map[k]).add(new THREE.Vector3(0,0.8,0));if(k==='mount'&&rig)return w(rig.head);if(k==='scope'&&rig)return w(rig.scope);if(k==='camera'&&rig&&rig.camBody)return w(rig.camBody);
 if(k==='trunk'||k==='car')return new THREE.Vector3(2.1,1.1,-1.6);if(k==='clock')return null;if(k==='sky-pole'){return hv(S.loc.lat*D2R,0,900).add(EYE)}return null}
