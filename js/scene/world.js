"use strict";
// =====================================================================
// 3D-Szene
// =====================================================================
const gl=$('gl'),renderer=new THREE.WebGLRenderer({canvas:gl,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(62,1,0.05,3000);cam.position.set(0,1.62,0);cam.rotation.order='YXZ';
const EYE=cam.position.clone();
// Horizont-Vektor (alt,az) -> Weltkoordinaten (x=Ost, y=oben, z=Süd)
const hv=(alt,az,r=1)=>new THREE.Vector3(Math.cos(alt)*Math.sin(az)*r,Math.sin(alt)*r,-Math.cos(alt)*Math.cos(az)*r);
const v2h=v=>{const n=v.clone().normalize();return[Math.asin(clamp(n.y,-1,1)),(Math.atan2(n.x,-n.z)+TAU)%TAU]};
const hemi=new THREE.HemisphereLight(0x8899bb,0x223322,0.1);scene.add(hemi);
const moonLight=new THREE.DirectionalLight(0xb8c4e0,0);scene.add(moonLight);
const lamp=new THREE.PointLight(0xff2a1a,0,7,1.6);scene.add(lamp);
// Himmelskuppel mit Farbverlauf
const domeGeo=new THREE.SphereGeometry(1000,72,36);domeGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(domeGeo.attributes.position.count*3),3));
const dome=new THREE.Mesh(domeGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false}));dome.renderOrder=-2;scene.add(dome);
const domeHA=[];{const p=domeGeo.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i));domeHA.push(v2h(v))}}
function updateDome(c){const col=domeGeo.attributes.color,lp=(S.loc.b-1)/8;for(let i=0;i<domeHA.length;i++){const[alt,az]=domeHA[i];let rgb;
  if(alt<-0.02){rgb=[3,4,5]}else{let mw=0;if(alt>0.02){const e=hor2eq(alt,az,c);mw=mwBright(e[0],e[1])*(1-(1-S.adapt)*0.6)}rgb=skyRGB(alt,c,mw);
   const dz=Math.abs(wrapPI(az-0.75)),town=lp*Math.exp(-dz*dz/0.25)*Math.exp(-Math.max(alt,0)*R2D/7)*45;rgb=[rgb[0]+town,rgb[1]+town*0.75,rgb[2]+town*0.45]}
  col.setXYZ(i,Math.min(1,rgb[0]/255),Math.min(1,rgb[1]/255),Math.min(1,rgb[2]/255))}col.needsUpdate=true}
// Sterne als Punkte
const NP=NS+3,starPos=new Float32Array(NP*3),starCol=new Float32Array(NP*3),starSize=new Float32Array(NP),sAlt=new Float32Array(NS),sAz=new Float32Array(NS);
const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));starGeo.setAttribute('acol',new THREE.BufferAttribute(starCol,3));starGeo.setAttribute('size',new THREE.BufferAttribute(starSize,1));
const starMat=new THREE.ShaderMaterial({uniforms:{k:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'attribute float size;attribute vec3 acol;varying vec3 vC;uniform float k;void main(){vC=acol;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*k;gl_Position=projectionMatrix*mv;}',
 fragmentShader:'varying vec3 vC;void main(){vec2 d=gl_PointCoord-0.5;float r=dot(d,d)*4.0;float a=exp(-r*2.6)*0.85+exp(-r*12.0)*0.6;if(a<0.02)discard;gl_FragColor=vec4(vC*a,1.0);}'});
const stars=new THREE.Points(starGeo,starMat);stars.frustumCulled=false;stars.renderOrder=-1;scene.add(stars);
function curLim(c){return limMag(c)-(1-S.adapt)*1.8}
function updateStars(c){const lim=curLim(c),R=950;
 for(let i=0;i<NS;i++){const h=eq2hor(sRA[i],sDE[i],c);sAlt[i]=h[0];sAz[i]=h[1];const v=hv(h[0],h[1],R);starPos[3*i]=v.x;starPos[3*i+1]=v.y+EYE.y;starPos[3*i+2]=v.z;
  let m=sMag[i];if(h[0]>0)m+=0.25*(1/Math.max(Math.sin(h[0]+0.03),0.06)-1);const br=lim-m;
  if(h[0]<-0.01||br<0){starSize[i]=0;continue}const cl=bvColor(sBV[i]),a=clamp(0.35+br*0.28,0.3,1.5);starCol[3*i]=cl[0]*a;starCol[3*i+1]=cl[1]*a;starCol[3*i+2]=cl[2]*a;starSize[i]=clamp(2.8+br*1.7,2.8,15)}
 c.planets.forEach((p,j)=>{const i=NS+j,v=hv(p.alt,p.az,R);starPos[3*i]=v.x;starPos[3*i+1]=v.y+EYE.y;starPos[3*i+2]=v.z;const br=lim-p.mag;
  if(p.alt<-0.01||br<0){starSize[i]=0;return}const cl=p.id==='mars'?[1,0.62,0.45]:[1,0.93,0.78];starCol.set(cl.map(x=>x*1.2),3*i);starSize[i]=clamp(3+br*1.3,3,13)});
 starGeo.attributes.position.needsUpdate=true;starGeo.attributes.acol.needsUpdate=true;starGeo.attributes.size.needsUpdate=true}
// Mond & Sonne
const moonCv=document.createElement('canvas');moonCv.width=moonCv.height=128;const moonTex=new THREE.CanvasTexture(moonCv);
const moonSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:moonTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));moonSpr.renderOrder=-1;scene.add(moonSpr);
const glowCv=document.createElement('canvas');glowCv.width=glowCv.height=128;{const x=glowCv.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(0.2,'rgba(200,215,255,.12)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
const moonGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCv),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));moonGlow.renderOrder=-1;scene.add(moonGlow);
function updateMoon(c){const mo=c.moon,x=moonCv.getContext('2d');x.clearRect(0,0,128,128);drawMoonIcon(x,64,64,60,mo);
 x.globalCompositeOperation='destination-out';x.fillStyle='#000';x.beginPath();x.rect(0,0,128,128);x.arc(64,64,60,0,TAU,true);x.fill();x.globalCompositeOperation='source-over';
 // dunkle Seite unsichtbar machen
 const im=x.getImageData(0,0,128,128),d=im.data;for(let i=0;i<d.length;i+=4){if(d[i]<60){d[i+3]=0}}x.putImageData(im,0,0);moonTex.needsUpdate=true;
 const v=hv(mo.alt,mo.az,900);moonSpr.position.copy(v).add(EYE);moonSpr.scale.setScalar(900*0.0091*1.6);moonSpr.visible=mo.alt>-0.02;
 moonGlow.position.copy(moonSpr.position);moonGlow.scale.setScalar(140*mo.illum+20);moonGlow.visible=moonSpr.visible;moonGlow.material.opacity=0.3+0.7*mo.illum;
 moonLight.position.copy(hv(mo.alt,mo.az,10));moonLight.intensity=mo.alt>0?0.35*mo.illum*Math.sin(mo.alt)**0.5:0}
// Boden, Berge, Parkplatz
{const g=new THREE.Mesh(new THREE.CircleGeometry(2500,48),new THREE.MeshLambertMaterial({color:0x1b211a}));g.rotation.x=-PI/2;scene.add(g);
 const p=new THREE.Mesh(new THREE.CircleGeometry(9,40),new THREE.MeshLambertMaterial({color:0x34332f}));p.rotation.x=-PI/2;p.position.y=0.005;scene.add(p);
 const sr=rng32(7),N=180,pos=[],idx=[];for(let i=0;i<=N;i++){const az=i/N*TAU;const southDip=Math.exp(-((wrapPI(az-PI)/0.9)**2));
  const h=(1.2+2.6*vnoise(i*0.07,1.3)+1.4*vnoise(i*0.31,4.2)+0.6*sr())*(1-0.65*southDip)*D2R;const r=600;const v1=hv(0,az,r),top=hv(h,az,r);
  pos.push(v1.x,-30,v1.z,top.x,top.y+1.6,top.z);if(i<N){const a=2*i;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
 const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));mg.setIndex(idx);
 const mtn=new THREE.Mesh(mg,new THREE.MeshBasicMaterial({color:0x07090c,side:THREE.DoubleSide}));scene.add(mtn);
 // Lichter der Stadt im Nordosten
 const tp=[];for(let k=0;k<160;k++){const az=0.75+(sr()-0.5)*0.5,v=hv(0.004+sr()*0.006,az,590);tp.push(v.x,v.y+1.2,v.z)}const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));
 scene.add(new THREE.Points(tg,new THREE.PointsMaterial({color:0xffc070,size:1.6,sizeAttenuation:false})))}

// ---------- Objekte & Ausrüstung (Low-Poly)
const clickables=[];
const M=(c,o={})=>new THREE.MeshLambertMaterial({color:c,...o});
function box(w,h,d,mat){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat)}
function cyl(r1,r2,h,mat,seg=16){return new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat)}
function clickable(obj,key,name){obj.userData.click=key;obj.userData.name=name;clickables.push(obj);return obj}
function table(x,z,rot){const t=new THREE.Group();const top=box(1.0,0.035,0.62,M(0x3a3d44));top.position.y=0.72;t.add(top);
 for(const[dx,dz]of[[-.45,-.27],[.45,-.27],[-.45,.27],[.45,.27]]){const l=cyl(0.012,0.012,0.72,M(0x8a8f99),6);l.position.set(dx,0.36,dz);t.add(l)}t.position.set(x,0,z);t.rotation.y=rot;scene.add(t);return t}
const tL=table(1.55,0.75,0.65),tR=table(-1.55,0.75,-0.65),tB=table(-1.3,-1.25,0.4);
// Laptop
{const g=new THREE.Group();const base=box(0.34,0.02,0.24,M(0x2a2c31));base.position.y=0.75;g.add(base);
 const scr=box(0.34,0.23,0.012,M(0x2a2c31));scr.position.set(0,0.865,-0.115);scr.rotation.x=-0.2;g.add(scr);
 const disp=new THREE.Mesh(new THREE.PlaneGeometry(0.31,0.2),new THREE.MeshBasicMaterial({color:0x1b2a48}));disp.position.set(0,0.865,-0.107);disp.rotation.x=-0.2;g.add(disp);g.userData.disp=disp;
 g.position.set(-0.1,0,0);tL.add(g);clickable(g,'laptop','Laptop');S.laptopGroup=g}
// Stirnlampe
{const g=new THREE.Group();const band=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.012,6,16),M(0x222222));band.rotation.x=PI/2;band.position.y=0.75;g.add(band);
 const l=box(0.05,0.035,0.03,M(0x444444));l.position.set(0,0.76,0.07);g.add(l);const led=new THREE.Mesh(new THREE.CircleGeometry(0.012,10),new THREE.MeshBasicMaterial({color:0x220000}));led.position.set(0,0.76,0.086);g.add(led);g.userData.led=led;
 g.position.set(0.32,0,0.12);tL.add(g);clickable(g,'lamp','Stirnlampe');S.lampGroup=g}
// Zubehör-Tisch: Okularkoffer, Kompass, Bahtinov-Maske
{const g=new THREE.Group();const c=box(0.36,0.09,0.24,M(0x9aa0a8));c.position.y=0.785;g.add(c);const foam=box(0.33,0.01,0.21,M(0x1a1a1a));foam.position.y=0.83;g.add(foam);
 [-0.1,0,0.1].forEach((x,i)=>{const e=cyl(0.022,0.022,0.06+i*0.01,M(0x15171a),12);e.position.set(x,0.86,0);g.add(e)});g.position.set(-0.2,0,0);tR.add(g);clickable(g,'case','Okular-Koffer')}
{const g=new THREE.Group();const c=cyl(0.05,0.05,0.016,M(0x8a6a3a),20);c.position.y=0.747;g.add(c);const f=new THREE.Mesh(new THREE.CircleGeometry(0.044,20),M(0xe8e2d0));f.rotation.x=-PI/2;f.position.y=0.756;g.add(f);
 const n=box(0.006,0.004,0.07,M(0xcc2222));n.position.y=0.759;g.add(n);g.userData.needle=n;g.position.set(0.25,0,-0.08);tR.add(g);clickable(g,'compass','Kompass');S.compassGroup=g}
{const g=new THREE.Group();const d=cyl(0.09,0.09,0.006,M(0x111111),24);d.position.y=0.742;g.add(d);g.position.set(0.25,0,0.17);tR.add(g);clickable(g,'mask','Bahtinov-Maske');S.maskGroup=g}
// hinterer Tisch: Thermoskanne, Powerstation
{const t=cyl(0.04,0.04,0.28,M(0x5a2a2a),12);t.position.set(0.25,0.88,0);tB.add(t);clickable(t,'thermos','Thermoskanne');const p=box(0.28,0.18,0.18,M(0x2a3a4a));p.position.set(-0.15,0.83,0);tB.add(p);clickable(p,'power','Powerstation')}
// Auto mit offenem Kofferraum
{const car=new THREE.Group(),body=M(0x2c3e56),dark=M(0x0c0f14);const b=box(1.8,0.7,4.2,body);b.position.y=0.6;car.add(b);const cab=box(1.6,0.6,2.2,body);cab.position.set(0,1.22,0.25);car.add(cab);
 const win=box(1.62,0.45,2.0,dark);win.position.set(0,1.25,0.25);car.add(win);
 for(const[x,z]of[[-.85,1.3],[.85,1.3],[-.85,-1.3],[.85,-1.3]]){const w=cyl(0.33,0.33,0.22,M(0x111111),14);w.rotation.z=PI/2;w.position.set(x,0.33,z);car.add(w)}
 const lid=box(1.6,0.05,1.0,body);lid.position.set(0,1.75,-1.75);lid.rotation.x=0.9;car.add(lid);
 for(const x of[-.75,.75]){const tl=box(0.25,0.12,0.03,new THREE.MeshBasicMaterial({color:0x3a0606}));tl.position.set(x,0.8,-2.11);car.add(tl)}
 const trunk=new THREE.Group();[[-.4,0x8a8f99,.55],[.3,0x5a5e66,.45],[0,0x2a2d33,.35]].forEach(([x,c,h],i)=>{const k=box(0.5,h*0.6,0.6,M(c));k.position.set(x,0.95+h*0.3,-1.55+i*0.05);trunk.add(k)});car.add(trunk);
 car.position.set(2.6,0,-3.4);car.rotation.y=0.35;scene.add(car);clickable(trunk,'trunk','Kofferraum – Ausrüstung');clickable(b,'car','Auto – Fahrziel');clickable(cab,'car','Auto – Fahrziel')}
