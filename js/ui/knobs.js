"use strict";
// ================= Drehregler =================
// Ersetzt Schieberegler durch Drehknöpfe: im Kreis ziehen (Maus oder Finger), Mausrad, Shift = schneller.
const KNOBS=[];
function makeKnob(input,turns){const wrap=document.createElement('div');wrap.className='knobWrap';const cv=document.createElement('canvas');cv.className='knob';cv.width=cv.height=128;wrap.appendChild(cv);
 input.style.display='none';input.insertAdjacentElement('afterend',wrap);const min=+input.min,max=+input.max,step=+input.step||1,span=max-min;
 const k={input,cv,acc:0,draw(){const x=cv.getContext('2d'),R=64,f=(+input.value-min)/span,ang=f*turns*TAU-PI/2;x.clearRect(0,0,128,128);
   x.lineWidth=6;x.lineCap='butt';x.strokeStyle='#263043';x.beginPath();x.arc(R,R,R-6,0.75*PI,2.25*PI);x.stroke();x.strokeStyle='#f0a64a';x.beginPath();x.arc(R,R,R-6,0.75*PI,0.75*PI+1.5*PI*clamp(f,0,1));x.stroke();
   const g=x.createRadialGradient(R*0.8,R*0.7,4,R,R,R-14);g.addColorStop(0,'#3d4557');g.addColorStop(1,'#12161e');x.fillStyle=g;x.beginPath();x.arc(R,R,R-14,0,TAU);x.fill();
   x.strokeStyle='rgba(255,255,255,.09)';x.lineWidth=2;for(let i=0;i<28;i++){const a=ang+i/28*TAU;x.beginPath();x.moveTo(R+Math.cos(a)*(R-23),R+Math.sin(a)*(R-23));x.lineTo(R+Math.cos(a)*(R-15),R+Math.sin(a)*(R-15));x.stroke()}
   x.strokeStyle='#f0a64a';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(R+Math.cos(ang)*12,R+Math.sin(ang)*12);x.lineTo(R+Math.cos(ang)*(R-25),R+Math.sin(ang)*(R-25));x.stroke()}};
 let last=null;const angAt=e=>{const r=cv.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
 const set=v=>{v=clamp(Math.round((v-min)/step)*step+min,min,max);v=+v.toFixed(4);if(v===+input.value)return;input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));k.draw()};
 cv.addEventListener('pointerdown',e=>{last=angAt(e);k.acc=0;cv.setPointerCapture(e.pointerId);e.preventDefault()});
 cv.addEventListener('pointermove',e=>{if(last==null)return;const a=angAt(e);let d=a-last;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;last=a;k.acc+=d/(turns*TAU)*span;const q=Math.trunc(k.acc/step)*step;if(q!==0){k.acc-=q;set(+input.value+q)}});
 const up=()=>{last=null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',e=>{e.preventDefault();set(+input.value+(e.deltaY<0?1:-1)*step*(e.shiftKey?10:1))},{passive:false});
 KNOBS.push(k);k.draw();return k}
function refreshKnobs(){for(const k of KNOBS)k.draw()}
function initKnobs(){[['legN',1.5],['legE',1.5],['altS',1],['fAz',2],['fAlt',2],['head',1],['foc',4]].forEach(([id,t])=>makeKnob($(id),t))}
