"use strict";
// ---------- Umsehen, Hover, Klick
function applyLook(){cam.rotation.set(S.look.pitch,S.look.yaw,0);cam.fov=S.look.fov;cam.updateProjectionMatrix()}
const ray=new THREE.Raycaster();let hovered=null;
function pick(x,y){const r=gl.getBoundingClientRect();ray.setFromCamera({x:(x-r.left)/r.width*2-1,y:-(y-r.top)/r.height*2+1},cam);const hit=ray.intersectObjects(clickables,true)[0];if(!hit)return null;let o=hit.object;while(o&&!o.userData.click)o=o.parent;return o}
function setEmissive(obj,hex){obj.traverse(m=>{if(m.material&&m.material.emissive)m.material.emissive.setHex(hex)})}
(function(){let drag=null,moved=0;const pts=new Map();let pinch=null;
 gl.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);gl.setPointerCapture(e.pointerId);
  if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),f:S.look.fov};drag=null;moved=99;return}
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};moved=0;gl.style.cursor='grabbing'});
 gl.addEventListener('pointermove',e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch&&pts.size===2){const[a,b]=[...pts.values()];S.look.fov=clamp(pinch.f*pinch.d/Math.max(20,Math.hypot(a[0]-b[0],a[1]-b[1])),12,90);applyLook();return}
  if(drag&&e.pointerId!==drag.id)return;
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);drag={x:e.clientX,y:e.clientY};const s=S.look.fov*D2R/gl.clientHeight;
   S.look.yaw+=dx*s;S.look.pitch=clamp(S.look.pitch+dy*s,-1.2,1.55);applyLook();$('hoverTag').style.display='none';return}
  const o=pick(e.clientX,e.clientY);if(o!==hovered){if(hovered)setEmissive(hovered,0);hovered=o;if(o)setEmissive(o,0x2a1a08)}
  const tag=$('hoverTag');if(o){tag.textContent=o.userData.click==='lamp'?'Stirnlampe ('+({off:'aus',red:'Rotlicht',white:'weiß'})[S.lamp]+')':o.userData.name;tag.style.display='block';tag.style.left=e.clientX+14+'px';tag.style.top=e.clientY+12+'px';gl.style.cursor='pointer'}else{tag.style.display='none';gl.style.cursor='grab'}});
 const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;gl.style.cursor='grab';if(drag&&e.pointerId===drag.id&&moved<6&&e.type==='pointerup'){const o=pick(e.clientX,e.clientY);if(o){if(e.pointerType!=='mouse'){setEmissive(o,0x2a1a08);setTimeout(()=>setEmissive(o,0),400)}useObject(o.userData.click)}}if(!drag||e.pointerId===drag.id)drag=null};
 gl.addEventListener('pointerup',up);gl.addEventListener('pointercancel',up);
 gl.addEventListener('wheel',e=>{e.preventDefault();S.look.fov=clamp(S.look.fov*Math.exp(e.deltaY*0.001),12,90);applyLook()},{passive:false});
 addEventListener('keydown',e=>{if(e.key==='Escape')closeWin()})})();
function useObject(k){switch(k){
 case'laptop':openWin('laptop');break;case'trunk':openWin('trunk');break;case'car':openWin('car');break;
 case'compass':if(telMode()!=='eq'){popCard('<b>Kompass</b><p>Deine Montierung muss nicht eingenordet werden. Mit einer parallaktischen Montierung oder einem Star Tracker brauchst du ihn.</p>');break}openWin('compass');break;
 case'mount':openWin('mount');break;case'scope':openWin('scope');break;case'case':S.scopeMode='eye';openWin('scope');break;
 case'camera':openWin('camera');break;
 case'lamp':S.lamp=({off:'red',red:'white',white:'off'})[S.lamp];if(S.lamp==='white'){S.adapt=0;toast('Weißes Licht: Deine Augen verlieren die Dunkelanpassung. <span class="term" data-t="dunkeladaption">Warum?</span>',3500)}else toast('Stirnlampe: '+({off:'aus',red:'Rotlicht'})[S.lamp]);break;
 case'mask':if(G().focus.id!=='bahtinov'){popCard('<b>Bahtinov-Maske</b><p>Nicht eingepackt. Im Kofferraum unter „Fokussierung“ auswählen.</p>');break}S.shot.baht=!S.shot.baht;toast(S.shot.baht?'Maske vorne aufs Teleskop gesetzt':'Maske abgenommen');updateRigPose();break;
 case'thermos':popCard('<b>Thermoskanne</b><p>Tee. Auf 800 m Höhe wird es nachts schnell kalt. Kälte ändert übrigens auch den Fokus, weil sich das Teleskop zusammenzieht.</p>');break;
 case'power':popCard('<b>Powerstation</b><p>Strom für Montierung, Kamera und Laptop.</p>');break}}
