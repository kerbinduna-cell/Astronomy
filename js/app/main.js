"use strict";
// ---------- Hauptschleife
let skyDirty=true,lastSkyT=0,lastDome=0,lastSlow=0,lastFrame=performance.now(),lastSimDate=0;
function resize(){renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();hud.width=innerWidth*devicePixelRatio;hud.height=innerHeight*devicePixelRatio;starMat.uniforms.k.value=Math.min(devicePixelRatio||1,2)}
addEventListener('resize',resize);
function frame(now){const dt=Math.min(0.1,(now-lastFrame)/1000);lastFrame=now;
 if(S.speed>0&&!$('welcome')){const ds=dt*S.speed;S.date=new Date(S.date.getTime()+ds*1000);if(telMode()==='eq'&&!S.tel.track)S.tel.raM=(S.tel.raM+OMEGA*ds)%TAU;
  if(S.lamp!=='white')S.adapt=Math.min(1,S.adapt+ds/1500)}
 const simT=S.date.getTime();if(Math.abs(simT-lastSimDate)>1500||skyDirty){S.ctx=simCtx();lastSimDate=simT;updateStars(S.ctx);
  if(now-lastDome>400||skyDirty){updateDome(S.ctx);updateMoon(S.ctx);lastDome=now}skyDirty=false;
  const hrs=(simT-DAY0().getTime())/3600e3;S.temp=Math.max(-4,7-hrs*1.1)}
 const c=S.ctx,s=c.sun.alt*R2D,day=clamp((s+14)/14,0,1);hemi.intensity=0.03+day*0.55+(c.moon.alt>0?0.05*c.moon.illum:0);
 lamp.position.copy(cam.position).add(new THREE.Vector3(0,0.1,0));lamp.color.setHex(S.lamp==='white'?0xfff2dd:0xff2a14);lamp.intensity=S.lamp==='off'?0:S.lamp==='red'?0.55:1.3;
 if(S.lampGroup)S.lampGroup.userData.led.material.color.setHex(S.lamp==='off'?0x220000:S.lamp==='red'?0xff2a14:0xffffff);
 if(S.laptopGroup)S.laptopGroup.userData.disp.material.color.setHex(S.lamp==='white'?0x3a4a70:0x2a3a5a);
 if(S.compassGroup){S.compassGroup.userData.needle.rotation.y=-(DECL*D2R)+tR.rotation.y+Math.sin(now/700)*0.03}
 updateRigPose();renderer.render(scene,cam);drawHud(c);
 const t=S.date;$('clockT').textContent=t.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' '+fmtTime(t);$('clockTemp').textContent=Math.round(S.temp)+' °C';
 if(S.openWin==='scope')drawEyeView();
 if(now-lastSlow>400){lastSlow=now;updateTasks();if(S.openWin==='mount'){updCirc();drawSetup()}if(S.openWin==='compass')drawSetup();if(S.openWin==='laptop'&&curLap==='chart'&&S.speed>0)drawSky()}
 requestAnimationFrame(frame)}

// ---------- Start
function start(guided){$('welcome').remove();S.guided=guided;if(guided){S.hud.tasks=true;S.hud.hints=true;S.hud.dir=true;$('polHelp').checked=true}hudApply();if(!guided){S.flags.loc=1}
 toast(guided?'Aufgaben oben links. Klick auf eine Aufgabe zeigt, wie es geht.':'Freie Nacht. Hilfen rechts zuschalten.',4000)}
$('startGuided').onclick=()=>start(true);$('startFree').onclick=()=>start(false);
initSetup();initKnobs();drawLex();$('lexQ').oninput=drawLex;intro();
S.ctx=simCtx();newSetup();S.setup.altS=45;rebuildRig();setupAfterGear();initHud();resize();applyLook();updateTasks();
$('welTxt').textContent=`Du parkst: ${S.loc.n}. Es ist ${fmtTime(S.date)} Uhr am ${S.date.toLocaleDateString('de-DE')}, die Sonne ist gerade untergegangen.`;
requestAnimationFrame(frame);

// Offline-Fähigkeit (PWA): nur auf echtem Webserver, nicht in eingebetteten Vorschauen
try{if('serviceWorker' in navigator&&location.protocol==='https:'&&!location.hostname.endsWith('claude.ai')&&!location.hostname.includes('claudeusercontent'))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
