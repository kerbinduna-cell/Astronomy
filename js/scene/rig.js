"use strict";
// ---------- Montierung + Teleskop (wird bei Ausrüstungswechsel neu gebaut)
const TRI_POS=new THREE.Vector3(0,0,1.55);let rig=null;
function rebuildRig(){if(rig){scene.remove(rig.group);for(const k of['mount','scope','camera'])for(let i=clickables.length-1;i>=0;i--)if(clickables[i].userData.click===k)clickables.splice(i,1)}
 const g=G(),grp=new THREE.Group();grp.position.copy(TRI_POS);scene.add(grp);rig={group:grp,g};
 const top=new THREE.Vector3(0,1.08,0);const legs=new THREE.Group();for(let k=0;k<3;k++){const a=k/3*TAU,foot=new THREE.Vector3(Math.sin(a)*0.55,0,Math.cos(a)*0.55),mid=top.clone().add(foot).multiplyScalar(0.5),len=top.distanceTo(foot);
  const l=cyl(0.018,0.014,len,M(k===0?0x8a8f99:0x5a5f69),8);l.position.copy(mid);l.lookAt(top);l.rotateX(PI/2);legs.add(l)}
 const hub=cyl(0.09,0.09,0.05,M(0x2a2c31),16);hub.position.copy(top);legs.add(hub);grp.add(legs);rig.legs=legs;
 const head=new THREE.Group();head.position.set(0,1.11,0);grp.add(head);rig.head=head;
 const tr=g.mount.track,o=g.optic;
 // Polachse / Gehäuse
 const axis=new THREE.Group();head.add(axis);rig.axis=axis;
 if(tr==='eq'){const ra=cyl(0.055,0.06,0.26,M(0xd8dade),16);ra.rotation.x=PI/2;axis.add(ra);const base=box(0.14,0.08,0.14,M(0x2a2c31));base.position.y=-0.02;head.add(base)}
 else if(tr==='altaz'){const arm=box(0.06,0.42,0.14,M(0x22252b));arm.position.set(0.12,0.21,0);head.add(arm);rig.arm=arm;const base=cyl(0.1,0.12,0.08,M(0x22252b));head.add(base)}
 else{const ball=new THREE.Mesh(new THREE.SphereGeometry(0.035,12,10),M(0x222222));head.add(ball);if(g.mount.id==='tracker'){const tb=box(0.1,0.12,0.06,M(0x2b2f36));tb.position.y=0.06;axis.add(tb)}}
 // Gegengewicht
 if(tr==='eq'){const cw=new THREE.Group();const shaft=cyl(0.01,0.01,0.42,M(0xbbbbbb),8);shaft.position.y=-0.21;cw.add(shaft);const w=cyl(0.07,0.07,0.08,M(0x55595f),16);w.position.y=-0.34;cw.add(w);head.add(cw);rig.cw=cw}
 // Optik
 const scope=new THREE.Group();head.add(scope);rig.scope=scope;let len,rad,col=0xeeeeee;
 if(o.lens){len=o.f<100?0.08:0.2;rad=o.D/1000*0.6+0.035;col=0x111111}else if(o.id==='sct203'){len=0.45;rad=0.12;col=0x1b1d22}else if(o.id==='newt130'){len=0.66;rad=0.09}else if(o.id==='galileo'){len=0.45;rad=0.025;col=0x6a5030}else{len=clamp(o.f/1000*0.95+0.12,0.3,0.8);rad=o.D/1000*0.62+0.03}
 const tube=cyl(rad,rad,len,M(col),20);tube.rotation.x=PI/2;scope.add(tube);
 if(!o.lens){const dew=cyl(rad*1.03,rad*1.03,len*0.25,M(0x1a1a1a),20);dew.rotation.x=PI/2;dew.position.z=len*0.55;scope.add(dew);
  const fin=cyl(0.018,0.018,0.2,M(0x222222),8);fin.rotation.x=PI/2;fin.position.set(0,rad+0.04,0);scope.add(fin)}
 if(o.id==='newt130'){const f=cyl(0.02,0.02,0.07,M(0x222222),8);f.position.set(rad+0.03,0,len*0.35);f.rotation.z=PI/2;scope.add(f)}
 const mask=cyl(rad*1.06,rad*1.06,0.006,M(0x0a0a0a),20);mask.rotation.x=PI/2;mask.position.z=len*0.68;scope.add(mask);rig.mask=mask;
 rig.len=len;rig.rad=rad;rig.offset=tr==='eq'?0.06+rad:tr==='altaz'?0:0.04;
 // Kamera hinten dran
 if(g.camera.mode!=='eye'){const cb=box(0.13,0.1,0.08,M(0x111111));cb.position.z=-len/2-0.06;if(o.lens)cb.position.z=-len/2-0.04;scope.add(cb);clickable(cb,'camera','Kamera');rig.camBody=cb}
 else{const ep=cyl(0.02,0.02,0.06,M(0x111111),10);ep.position.set(0,rad+0.02,-len/2+0.02);scope.add(ep)}
 clickable(legs,'mount','Montierung & Stativ');clickable(axis,'mount','Montierung');if(rig.cw)clickable(rig.cw,'mount','Montierung');clickable(tube,'scope','Teleskop');
 updateRigPose()}
function updateRigPose(){if(!rig)return;const st=S.setup,tr=rig.g.mount.track,lat=S.loc.lat;
 rig.head.rotation.set(st.legN*D2R,0,-st.legE*D2R);
 const paz=(st.head+DECL+st.fAz)*D2R,palt=(st.altS+st.fAlt)*D2R;const p=hv(palt,paz);
 if(tr==='eq'||rig.g.mount.id==='tracker'){rig.axis.lookAt(rig.head.localToWorld(new THREE.Vector3()).add(p))}
 const h=telHor(S.ctx||simCtx()),t=hv(h[0],h[1]);const headW=rig.head.getWorldPosition(new THREE.Vector3());let center;
 if(tr==='eq'){let a=new THREE.Vector3().crossVectors(p,t);if(a.lengthSq()<1e-6)a.set(1,0,0);a.normalize();if(a.y<0)a.negate();
  center=headW.clone().add(a.clone().multiplyScalar(rig.offset));const cwDir=a.clone().negate();rig.cw.lookAt(headW.clone().add(new THREE.Vector3(0,1,0)));rig.cw.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),cwDir)}
 else if(tr==='altaz'){const side=new THREE.Vector3(Math.cos(h[1]),0,Math.sin(h[1]));rig.arm.position.set(0,0.21,0);rig.arm.rotation.y=-h[1];center=headW.clone().add(new THREE.Vector3(0,0.36,0));
  rig.arm.position.copy(new THREE.Vector3(Math.cos(h[1])*0.13,0.21,Math.sin(h[1])*0.13))}
 else center=headW.clone().add(new THREE.Vector3(0,0.1,0));
 rig.scope.position.copy(rig.head.worldToLocal(center.clone()));rig.scope.lookAt(center.clone().add(t));
 rig.mask.visible=!!S.shot.baht;if(S.maskGroup)S.maskGroup.visible=!S.shot.baht}
