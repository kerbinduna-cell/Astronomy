"use strict";
// ================= Nebel-Engine =================
// Gasnebel werden aus Bausteinen zusammengesetzt. Jeder Baustein liefert Licht in getrennten Emissionslinien:
// h = H-alpha (656 nm, rot), o = OIII (501 nm, blaugrün), s = SII (672 nm, tiefrot), r = Reflexion (blau, breitbandig).
// d = Staub (Dunkelwolke, verschluckt Licht dahinter). Koordinaten in Bogenminuten: x nach Westen (im Bild rechts), y nach Norden (oben).
// Bausteine: g = Gaußfleck, ring = Ring, fil = Filament entlang eines Linienzugs.
// n = [Strukturgröße in ′, Stärke 0..1, gratartig?] moduliert den Baustein mit fraktalem Rauschen.

const PERM=(()=>{const r=rng32(1234),a=[...Array(256).keys()];for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}const p=new Uint8Array(512);for(let i=0;i<512;i++)p[i]=a[i&255];return p})();
const GRX=new Float32Array(16),GRY=new Float32Array(16);for(let k=0;k<16;k++){GRX[k]=Math.cos(k/16*TAU+0.1);GRY[k]=Math.sin(k/16*TAU+0.1)}
function pnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,X=xi&255,Y=yi&255;
 const g=(i,j,dx,dy)=>{const h=PERM[PERM[i]+j]&15;return GRX[h]*dx+GRY[h]*dy};const u=xf*xf*xf*(xf*(xf*6-15)+10),v=yf*yf*yf*(yf*(yf*6-15)+10);
 const a=g(X,Y,xf,yf),b=g(X+1,Y,xf-1,yf),c=g(X,Y+1,xf,yf-1),d=g(X+1,Y+1,xf-1,yf-1);return(a+(b-a)*u)+((c+(d-c)*u)-(a+(b-a)*u))*v}
const ROT=[...Array(8)].map((_,i)=>[Math.cos(i*0.61),Math.sin(i*0.61)]);
// fbm: 0..1 (Mittel 0,5), ridge: 0..1 mit scharfen Graten (für Filamente)
function fbm(x,y,oc){let a=0.5,s=0,n=0,f=1;for(let i=0;i<oc;i++){const[c,sn]=ROT[i];s+=a*pnoise((x*c-y*sn)*f+i*5.3,(x*sn+y*c)*f-i*3.1);n+=a;f*=2.02;a*=0.5}return clamp(0.5+0.75*s/n,0,1)}
function ridge(x,y,oc){let a=0.5,s=0,n=0,f=1;for(let i=0;i<oc;i++){const[c,sn]=ROT[i];const q=1-Math.min(1,Math.abs(pnoise((x*c-y*sn)*f+i*7.7,(x*sn+y*c)*f+i*2.9))*1.8);s+=a*q*q;n+=a;f*=2.1;a*=0.5}return s/n}
// Verwirbeltes Rauschen (Domain Warping): wirkt wie Gas statt wie Muster
function nebNoise(x,y,oc,rg){const qx=fbm(x+1.7,y+9.2,3)-0.5,qy=fbm(x+8.3,y+2.8,3)-0.5,wx=x+2.6*qx,wy=y+2.6*qy;
 let v=fbm(wx,wy,oc);if(rg)v=0.55*v+0.45*Math.min(1,ridge(wx*0.8+3.1,wy*0.8-1.7,oc)*1.25);return v}
// Hilfen für Formen
function arcPts(cx,cy,r,a0,a1,n,wob,seed){const p=[],rr=rng32(seed||1);let w=0;for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*D2R;w=w*0.6+(rr()-0.5)*(wob||0);p.push([cx+Math.cos(a)*(r+w),cy+Math.sin(a)*(r+w)])}return p}
function heartPts(sc,n){const p=[];for(let i=0;i<=n;i++){const t=i/n*TAU;p.push([16*Math.sin(t)**3*sc,(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*sc])}return p}
function wavyLine(pts,amp,seed,n){// verfeinert einen Linienzug und lässt ihn leicht schlängeln
 const rr=rng32(seed||3),out=[];for(let k=0;k<pts.length-1;k++){const[a,b]=[pts[k],pts[k+1]];for(let i=0;i<n;i++){const t=i/n,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;const off=(rr()-0.5)*amp;out.push([a[0]+dx*t-dy/L*off,a[1]+dy*t+dx/L*off])}}out.push(pts[pts.length-1]);return out}

const NEB={
 M42:{sb:16.6,c:[
  {t:'g',x:0.5,y:-0.5,a:3.2,b:2.6,pa:25,w:{h:1.2,o:1.4,s:0.08},n:[1.2,0.3]},
  {t:'g',x:1,y:-2,a:7,b:5.5,pa:30,w:{h:0.55,o:0.35,s:0.08},n:[2.2,0.55]},
  {t:'g',x:9,y:-7,a:15,b:7,pa:-38,w:{h:0.32,o:0.06,s:0.08},n:[2.5,0.75,1]},
  {t:'g',x:-10,y:-6,a:14,b:6.5,pa:42,w:{h:0.28,o:0.05,s:0.08},n:[2.5,0.75,1]},
  {t:'g',x:2,y:-16,a:16,b:10,pa:5,w:{h:0.12,o:0.02,s:0.05},n:[4,0.8,1]},
  {t:'g',x:0,y:-5,a:28,b:22,pa:0,w:{h:0.05,o:0.006,s:0.02},n:[7,0.8]},
  {t:'g',x:-1.2,y:7.5,a:2.4,b:2.0,pa:0,w:{h:0.6,o:0.08,s:0.05},n:[1,0.4]},
  {t:'g',x:1.5,y:4.2,a:5,b:2.2,pa:70,d:1.3,n:[1.6,0.6]},{t:'g',x:-3.5,y:5,a:6,b:2,pa:-15,d:0.9,n:[1.6,0.6]},{t:'g',x:-6,y:-1,a:3,b:6,pa:10,d:0.6,n:[2,0.6]},
  {t:'g',x:0,y:31,a:11,b:7,pa:0,w:{r:0.35,h:0.05},n:[3,0.6,1]},{t:'g',x:3,y:30,a:3,b:6,pa:20,d:1.0}],
  stars:[[0.05,0.3,5.1,-0.2],[-0.12,0.08,6.7,-0.1],[0.18,0.05,6.7,0],[0.08,-0.22,7.9,0],[-1.3,7.6,6.9,0.1]]},
 B33:{sb:21.0,c:[
  {t:'g',x:4,y:0,a:5,b:40,pa:4,w:{h:1,s:0.25,o:0.02},n:[2.2,0.6,1]},
  {t:'g',x:12,y:-3,a:14,b:38,pa:0,w:{h:0.45,s:0.12},n:[4,0.7,1]},
  {t:'g',x:24,y:0,a:16,b:40,pa:0,w:{h:0.15},n:[6,0.7]},
  {t:'g',x:-16,y:-4,a:14,b:45,pa:3,d:2.6,n:[5,0.45]},{t:'g',x:-6,y:-14,a:6,b:10,pa:0,d:1.8,n:[3,0.5]},{t:'g',x:-7,y:12,a:5,b:8,pa:10,d:1.6,n:[3,0.5]},
  {t:'g',x:-2.6,y:-2.6,a:1.5,b:3.2,pa:-12,d:2.4,n:[0.8,0.25]},{t:'g',x:-1.0,y:1.0,a:2.0,b:1.4,pa:28,d:2.8,n:[0.7,0.25]},{t:'g',x:0.7,y:0.1,a:1.3,b:0.75,pa:-38,d:2.6,n:[0.6,0.25]},
  {t:'g',x:-1.7,y:2.7,a:0.75,b:1.0,pa:15,d:2.2,n:[0.5,0.25]},{t:'g',x:-3.3,y:0.2,a:1.1,b:2.4,pa:0,d:2.2,n:[0.8,0.3]},
  {t:'g',x:-10,y:37,a:5.5,b:4.5,pa:20,w:{h:2.8,o:0.08,s:0.6},n:[1.3,0.6,1]},{t:'g',x:-10,y:37,a:11,b:8,pa:20,w:{h:0.5,s:0.15},n:[3,0.7]},
  {t:'fil',pts:wavyLine([[-10.5,31],[-10,35],[-10.6,40],[-9.5,44]],0.6,41,4),w:1.3,d:1.6},{t:'fil',pts:wavyLine([[-10,36],[-13.5,37.5],[-16,36]],0.5,42,4),w:1.0,d:1.3},
  {t:'g',x:-6.6,y:12.6,a:2.6,b:2.3,pa:0,w:{r:1.3},n:[1,0.4]}],
  stars:[]},
 NGC2237:{sb:21.2,c:[
  {t:'shell',x:0,y:0,r:19,wd:7,q:0.92,fs:2.2,ls:5,fa:0.7,w:{h:1,o:0.55,s:0.35}},
  {t:'shell',x:2,y:-1,r:30,wd:7,q:0.88,fs:3,ls:7,fa:0.75,w:{h:0.35,s:0.15,o:0.05}},
  {t:'g',x:0,y:0,a:9,b:8,pa:0,w:{o:0.18,h:0.05},n:[2,0.6]},
  {t:'fil',pts:wavyLine([[-20,-13],[-12,-7],[-5,-9]],1.2,51,4),w:1.8,d:1.3},{t:'fil',pts:wavyLine([[15,11],[9,6],[6,8]],1,52,4),w:1.6,d:1.2},{t:'g',x:4,y:-18,a:2,b:4,pa:20,d:1.2}],
  stars:[[0,0,5.9,0.0],[3,2,7.2,0.1],[-2,-3,7.4,0.0],[1,-4,7.8,0.1],[-4,1,8.1,0.2],[5,-2,8.4,0.0],[-1,4,8.8,0.1]]},
 IC1805:{sb:22.0,c:[
  {t:'shell',x:0,y:2,r:30,wd:9,q:0.82,fs:3.5,ls:8,fa:0.7,w:{h:1,s:0.5,o:0.22}},
  {t:'g',x:-12,y:-24,a:12,b:8,pa:20,w:{h:0.6,s:0.25,o:0.1},n:[4,0.8,1]},{t:'g',x:0,y:30,a:9,b:6,d:1.6},
  {t:'g',x:0,y:4,a:30,b:26,pa:0,w:{h:0.25,o:0.12,s:0.08},n:[6,0.8,1]},
  {t:'g',x:30,y:34,a:6,b:5,pa:20,w:{h:1.8,s:0.6,o:0.2},n:[1.5,0.6,1]},
  {t:'g',x:-6,y:-4,a:4,b:9,pa:15,d:0.9},{t:'g',x:9,y:-10,a:3,b:7,pa:-20,d:0.8}],
  stars:[[0,2,7.8,0.4],[2,0,8.6,0.3],[-3,4,8.8,0.4],[1,6,9.1,0.2]]},
 IC1848:{sb:22.3,c:[
  {t:'shell',x:-24,y:0,r:22,wd:8,q:0.8,fs:3,ls:7,fa:0.75,w:{h:1,s:0.45,o:0.25}},
  {t:'shell',x:24,y:-2,r:24,wd:8,q:0.75,fs:3,ls:7,fa:0.75,w:{h:1,s:0.45,o:0.25}},
  {t:'g',x:0,y:0,a:50,b:24,pa:0,w:{h:0.15,o:0.08},n:[6,0.8,1]},
  {t:'g',x:-4,y:-8,a:3,b:7,pa:10,d:1.0},{t:'g',x:38,y:-14,a:3,b:6,pa:-30,d:1.0}]},
 NGC7000:{sb:22.0,c:[
  {t:'g',x:-12,y:14,a:38,b:24,pa:-10,w:{h:0.75,s:0.3,o:0.12},n:[5,0.75,1]},
  {t:'g',x:-4,y:-14,a:18,b:16,pa:0,w:{h:0.8,s:0.3,o:0.1},n:[4,0.7,1]},
  {t:'g',x:-22,y:-26,a:5,b:11,pa:10,w:{h:0.6,s:0.2},n:[2,0.6]},
  {t:'fil',pts:wavyLine([[-2,-38],[3,-22],[7,-10],[8,-2]],1.5,4,6),w:2.2,w2:{h:2.4,o:0.45,s:0.8},n:[1.2,0.6,1]},
  {t:'g',x:7,y:-30,a:13,b:15,pa:0,d:2.2,n:[4,0.5]},{t:'g',x:28,y:-5,a:10,b:40,pa:5,d:2.0,n:[5,0.5]}]},
 IC5070:{sb:21.8,c:[
  {t:'fil',pts:wavyLine([[-14,10],[-8,-2],[2,-8],[12,-10]],1.2,9,6),w:2.2,w2:{h:2.0,o:0.9,s:0.6},n:[1,0.6,1]},
  {t:'g',x:6,y:4,a:16,b:12,pa:20,w:{h:0.6,o:0.2,s:0.2},n:[3,0.75,1]},
  {t:'g',x:-14,y:-6,a:10,b:14,pa:0,d:2,n:[3,0.5]},{t:'g',x:-4,y:-10,a:2,b:4,pa:30,d:1.4}]},
 NGC6992:{sb:22.2,c:[
  {t:'shell',x:69,y:-63,r:93,wd:1.2,a0:116,a1:162,fs:0.25,ls:8,fa:0.97,rg:1,w:{h:1.6,o:0.35,s:0.55}},
  {t:'shell',x:69,y:-63,r:91.3,wd:1.0,a0:118,a1:160,fs:0.22,ls:8,fa:0.97,rg:1,w:{o:2.2,h:0.2}},
  {t:'shell',x:69,y:-63,r:95.5,wd:1.6,a0:122,a1:152,fs:0.35,ls:10,fa:0.95,rg:1,w:{h:0.7,o:0.6,s:0.2}},
  {t:'shell',x:69,y:-63,r:88,wd:3,a0:126,a1:150,fs:0.5,ls:6,fa:0.9,rg:1,w:{o:0.18,h:0.15}}]},
 NGC6960:{sb:22.2,c:[
  {t:'shell',x:-68.6,y:-3,r:68,wd:1.0,a0:-30,a1:32,fs:0.22,ls:8,fa:0.97,rg:1,w:{h:1.5,o:0.3,s:0.5}},
  {t:'shell',x:-68.6,y:-3,r:66.6,wd:0.9,a0:-26,a1:28,fs:0.2,ls:8,fa:0.97,rg:1,w:{o:2.1,h:0.2}},
  {t:'shell',x:-68.6,y:-3,r:70.5,wd:1.6,a0:-12,a1:20,fs:0.35,ls:10,fa:0.95,rg:1,w:{h:0.5,o:0.6}}]},
 NGC1499:{sb:22.4,c:[
  {t:'fil',pts:wavyLine([[-70,22],[-35,10],[0,0],[35,-10],[68,-22]],6,31,4),w:10,w2:{h:1,s:0.3},n:[3.5,0.75,1]},
  {t:'fil',pts:wavyLine([[-60,26],[-20,16],[20,4],[60,-14]],3,32,4),w:2.5,w2:{h:1.3,s:0.4},n:[1.5,0.7,1]},
  {t:'g',x:0,y:-12,a:60,b:14,pa:-17,d:0.5,n:[5,0.6]}]},
 NGC7635:{sb:20.2,c:[
  {t:'shell',x:0,y:0,r:2.0,wd:0.3,q:0.95,fs:0.12,ls:0.6,fa:0.6,w:{o:1.6,h:0.9,s:0.2}},
  {t:'g',x:-2,y:1,a:9,b:6,pa:20,w:{h:0.4,s:0.2,o:0.05},n:[1.8,0.75,1]},
  {t:'g',x:5,y:-4,a:4,b:3,pa:0,w:{h:0.6,s:0.2},n:[1,0.6]}],
  stars:[[-0.7,0.4,8.7,0.1]]},
 NGC6888:{sb:21.5,c:[
  {t:'shell',x:0,y:0,r:6.5,wd:0.9,q:0.72,fs:0.25,ls:1.5,fa:0.85,w:{h:1.2,s:0.35}},
  {t:'shell',x:0.3,y:0,r:8.4,wd:0.7,q:0.75,fs:0.3,ls:2,fa:0.8,w:{o:0.7}},
  {t:'g',x:0,y:0,a:5,b:3.5,pa:0,w:{h:0.2,o:0.05},n:[1,0.8]}],
  stars:[[0,0,7.5,0]]},
 IC1396:{sb:22.4,c:[
  {t:'shell',x:0,y:0,r:58,wd:22,q:0.95,fs:5,ls:12,fa:0.7,w:{h:1,s:0.4,o:0.15}},
  {t:'g',x:0,y:0,a:40,b:40,w:{h:0.25,o:0.1},n:[8,0.8]},
  {t:'fil',pts:wavyLine([[-50,4],[-40,2],[-31,3],[-25,1]],0.8,71,4),w:2.6,d:2.0},{t:'fil',pts:wavyLine([[-50,7],[-40,5],[-31,6],[-24.5,3.5]],0.6,72,4),w:0.9,w2:{h:2,s:0.6},n:[0.8,0.5]},
  {t:'g',x:30,y:-20,a:6,b:3,pa:30,d:1.4}],
  stars:[[0,0,5.7,0]]},
 M8:{sb:20.0,c:[
  {t:'g',x:4,y:1,a:2.2,b:1.6,pa:0,w:{h:2.5,o:0.6,s:0.3},n:[0.6,0.3]},
  {t:'g',x:0,y:0,a:22,b:11,pa:0,w:{h:0.6,s:0.25,o:0.12},n:[3,0.75,1]},{t:'g',x:-6,y:-2,a:38,b:18,w:{h:0.15,s:0.05},n:[6,0.8]},
  {t:'fil',pts:wavyLine([[-14,-8],[-6,-2],[-2,3],[-1,10]],1,81,4),w:2.2,d:1.4}],
  stars:[[-14,0,6.9,0.1],[-12,2,7.5,0],[-16,-2,7.9,0.1],[-13,-3,8.2,0],[4,1,7.5,0]]},
 M20:{sb:20.8,c:[
  {t:'g',x:0,y:0,a:6.5,b:6.5,w:{h:1,s:0.35,o:0.15},n:[1.2,0.6,1]},
  {t:'g',x:0,y:10,a:7,b:6,w:{r:0.9},n:[1.5,0.5]},
  {t:'fil',pts:[[0,0],[-6,4]],w:0.8,d:1.6},{t:'fil',pts:[[0,0],[6,3]],w:0.8,d:1.6},{t:'fil',pts:[[0,0],[1,-7]],w:0.8,d:1.6}],
  stars:[[0,0,7.6,0]]},
 M16:{sb:20.8,c:[
  {t:'g',x:0,y:0,a:12,b:10,w:{h:1,o:0.45,s:0.45},n:[2,0.75,1]},{t:'g',x:0,y:0,a:22,b:18,w:{h:0.25,s:0.1},n:[4,0.8]},
  {t:'fil',pts:[[1,-4],[1.3,0]],w:0.55,d:2.4,n:[0.3,0.3]},{t:'fil',pts:[[2.3,-3.5],[2.4,-1.5]],w:0.4,d:2.4,n:[0.3,0.3]},{t:'fil',pts:[[3.4,-4],[3.6,-2.5]],w:0.35,d:2.4,n:[0.3,0.3]},
  {t:'fil',pts:[[1,-4],[1.3,0.05]],w:0.15,w2:{h:2.5,s:1.2,o:0.4}}],
  stars:[[-4,3,8.2,0.1],[-5,1,8.9,0],[-3,5,9.1,0.1]]},
 M17:{sb:20.2,c:[
  {t:'fil',pts:[[-8,0],[0,0.5],[6,-1]],w:1.8,w2:{h:2.2,o:0.7,s:0.4},n:[0.8,0.5]},{t:'fil',pts:[[6,-1],[9,2],[8,6]],w:1.3,w2:{h:1.4,o:0.4},n:[0.8,0.5]},
  {t:'g',x:0,y:0,a:12,b:8,w:{h:0.35,s:0.15,o:0.1},n:[2,0.75,1]}]},
 M1:{sb:20.0,c:[
  {t:'g',x:0,y:0,a:2.6,b:1.8,pa:30,w:{h:1.1,s:0.5,o:0.3},n:[0.35,0.85,1]},
  {t:'g',x:0,y:0,a:1.8,b:1.2,pa:30,w:{r:1.0},n:[0.5,0.5]}],
  stars:[[0.1,0,16,0]]},
 M27:{sb:19.6,c:[
  {t:'g',x:0,y:1.3,a:1.5,b:1.8,pa:0,w:{o:1.3,h:0.9},n:[0.4,0.5]},{t:'g',x:0,y:-1.3,a:1.5,b:1.8,pa:0,w:{o:1.3,h:0.9},n:[0.4,0.5]},
  {t:'g',x:0,y:0,a:3.6,b:3.0,w:{h:0.35,o:0.25},n:[0.6,0.6]},{t:'g',x:0,y:0,a:5,b:4.5,w:{h:0.08}}],
  stars:[[0,0,13.5,-0.3]]},
 M57:{sb:17.6,c:[
  {t:'shell',x:0,y:0,r:0.38,wd:0.1,q:0.8,fs:0.05,ls:0.2,fa:0.3,w:{o:1.3,h:0.5}},{t:'ring',x:0,y:0,r:0.48,wd:0.07,q:0.8,w:{h:1.0,s:0.3}},
  {t:'g',x:0,y:0,a:0.3,b:0.25,w:{o:0.35}}],stars:[[0,0,15,-0.3]]},
 M45:{sb:21.3,c:[
  {t:'g',x:3,y:-5,a:16,b:12,pa:-20,w:{r:1},n:[2,0.8,1]},{t:'g',x:-10,y:6,a:12,b:9,w:{r:0.6},n:[2.5,0.8,1]},
  {t:'g',x:4,y:-9,a:4,b:1.4,pa:-35,w:{r:1.2},n:[0.6,0.6,1]},{t:'g',x:0,y:0,a:40,b:35,w:{r:0.2},n:[6,0.8,1]}]},
 M78:{sb:20.6,c:[{t:'g',x:0,y:0,a:3,b:2.2,pa:30,w:{r:1},n:[0.6,0.5]},{t:'g',x:-0.5,y:-2,a:2,b:1,pa:30,d:1.2}]}
};

// Fallback für alle anderen Nebel: aus Typ und Größe zufällig, aber pro Objekt immer gleich
function genericNebula(m){const sr=rng32(hashStr(m.id+'neb')),a=m.a/2,b=m.b/2,c=[],ty=m.type;
 if(ty==='pn'){c.push({t:'ring',x:0,y:0,r:a*0.55,wd:a*0.2,q:b/a,w:{o:1.2,h:0.6},n:[a*0.3,0.4]},{t:'g',x:0,y:0,a:a*0.9,b:b*0.9,w:{h:0.25}});return{sb:20,ext:a*1.4,c}}
 const refl=ty==='rn';for(let k=0;k<9;k++){const th=sr()*TAU,r=sr()*0.5;c.push({t:'g',x:Math.cos(th)*r*a,y:Math.sin(th)*r*b,a:a*(0.2+sr()*0.35),b:b*(0.2+sr()*0.35),pa:sr()*180,
  w:refl?{r:0.8}:{h:0.9,s:0.3,o:sr()<0.3?0.4:0.08},n:[Math.max(a*0.15,0.3),0.7,1]})}
 const sb=m.mag+2.5*Math.log10(Math.max(PI*a*b*3600,1))+0.6;return{sb:clamp(sb,18,23),ext:Math.max(a,b)*1.3,c}}

// Vorbereiten: Linienzüge in Segmente, Hüllrechtecke, Zufallsversatz für das Rauschen
function prepNeb(rc){if(rc._ok)return rc;rc._ok=1;let ext=1;rc.c.forEach((c,i)=>{c.sx=(i*37.1)%97;c.sy=(i*53.3)%89;
 if(c.d&&!c.n)c.n=[Math.max(c.a||c.wd||c.w||1,0.5)*0.7,0.55];
 if(c.t==='g')ext=Math.max(ext,Math.hypot(c.x,c.y)+3.6*Math.max(c.a,c.b));if(c.t==='ring'||c.t==='shell')ext=Math.max(ext,Math.hypot(c.x,c.y)+(c.r+3.6*c.wd)*Math.max(1,c.q||1));
 if(c.t==='fil'){c.wd=c.w;c.w=c.w2||{};let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of c.pts){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])}const m=c.wd*3.6;c.bb=[x0-m,y0-m,x1+m,y1+m];ext=Math.max(ext,Math.abs(x0)+m,Math.abs(x1)+m,Math.abs(y0)+m,Math.abs(y1)+m)}
 if(c.t==='g'){c.ca=Math.cos((c.pa||0)*D2R);c.sa=Math.sin((c.pa||0)*D2R);c.R=4*Math.max(c.a,c.b)}});rc.ext=ext;return rc}
function segDist(px,py,pts){let best=1e18;for(let k=0;k<pts.length-1;k++){const ax=pts[k][0],ay=pts[k][1],bx=pts[k+1][0]-ax,by=pts[k+1][1]-ay,L=bx*bx+by*by||1;let t=((px-ax)*bx+(py-ay)*by)/L;t=t<0?0:t>1?1:t;const dx=px-ax-bx*t,dy=py-ay-by*t,d=dx*dx+dy*dy;if(d<best)best=d}return Math.sqrt(best)}
function nebEval(rc,u,v,pix,out){let h=0,o=0,s=0,r=0,d=0;
 for(const c of rc.c){let sh=0;
  if(c.t==='g'){const du=u-c.x,dv=v-c.y;if(du>c.R||du<-c.R||dv>c.R||dv<-c.R)continue;const p=du*c.ca+dv*c.sa,q=-du*c.sa+dv*c.ca;sh=Math.exp(-0.5*((p/c.a)**2+(q/c.b)**2))}
  else if(c.t==='ring'){const du=u-c.x,dv=(v-c.y)/(c.q||1),rr=Math.hypot(du,dv);sh=Math.exp(-0.5*((rr-c.r)/c.wd)**2)}
  else if(c.t==='shell'){const du=u-c.x,dv=(v-c.y)/(c.q||1),rr=Math.hypot(du,dv);const rad=Math.exp(-0.5*((rr-c.r)/c.wd)**2);if(rad<2e-3)continue;let an=Math.atan2(dv,du)*R2D;
   if(c.a0!=null){const mid=(c.a0+c.a1)/2,half=(c.a1-c.a0)/2;let da=Math.abs(((an-mid)%360+540)%360-180);sh=rad*clamp((half-da)/6+0.5,0,1)}else sh=rad;if(sh<2e-3)continue;
   if(c.fs){const oc=clamp(Math.floor(Math.log2(c.fs/Math.max(pix*1.2,1e-4)))+1,1,5),sx=rr/c.fs+c.sx,sy=an*D2R*c.r/c.ls+c.sy,w=fbm(sx*0.15,sy*0.6,2)-0.5;
    if(c.rg){const fil=ridge(sx+3*w,sy+0.8*w,oc),big=fbm(sy*0.35+7,rr/(c.wd*4)+c.sy,3);sh*=Math.max(0,1-c.fa+c.fa*2.4*fil*(0.35+1.3*big))}
    else sh*=Math.pow(Math.max(0,1-c.fa+c.fa*2*nebNoise(u/(c.fs*2)+c.sx,v/(c.fs*2)+c.sy,oc,1)),1.35)}}
  else if(c.t==='fil'){if(u<c.bb[0]||u>c.bb[2]||v<c.bb[1]||v>c.bb[3])continue;sh=Math.exp(-0.5*(segDist(u,v,c.pts)/c.wd)**2)}
  if(sh<2e-3)continue;
  if(c.n){const ns=c.n[0],oc=clamp(Math.floor(Math.log2(ns/Math.max(pix*1.2,1e-4)))+1,1,6);const nv=nebNoise(u/ns+c.sx,v/ns+c.sy,oc,c.n[2]);sh*=Math.pow(Math.max(0,1-c.n[1]+c.n[1]*2*nv),1.35)}
  if(c.d){d+=c.d*sh;continue}const w=c.w||{};if(w.h)h+=w.h*sh;if(w.o)o+=w.o*sh;if(w.s)s+=w.s*sh;if(w.r)r+=w.r*sh}
 const ab=Math.exp(-d);out[0]=h*ab;out[1]=o*ab;out[2]=s*ab;out[3]=r*ab;out[4]=d}
// Zeichnet einen Nebel in die Linienpuffer (HA, O3, S2) und Reflexion/Staub in die Breitbandpuffer (R, G, B)
function renderNebula(m,p,scale,T,addStar,elec){const rc=prepNeb(NEB[m.id]||(m._gen=m._gen||genericNebula(m)));const{W,H}=T;const apx=scale/60;// ′ pro Pixel
 const ext=rc.ext/apx;const x0=Math.max(0,Math.floor(p[0]-ext)),x1=Math.min(W-1,Math.ceil(p[0]+ext)),y0=Math.max(0,Math.floor(p[1]-ext)),y1=Math.min(H-1,Math.ceil(p[1]+ext));
 if(x0>x1||y0>y1)return;const E=T.lineE(rc.sb);
 const st=(x1-x0)*(y1-y0)>90000?2:1,gw=Math.floor((x1-x0)/st)+2,gh=Math.floor((y1-y0)/st)+2,grid=[0,1,2,3,4].map(()=>new Float32Array(gw*gh)),o=[0,0,0,0,0];
 for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const px=x0+gx*st,py=y0+gy*st;nebEval(rc,(px-p[0])*apx,-(py-p[1])*apx,apx*st,o);const k=gy*gw+gx;for(let q=0;q<5;q++)grid[q][k]=o[q]}
 const RF=[0.2,0.33,0.47];
 for(let y=y0;y<=y1;y++){const fy=(y-y0)/st,iy=Math.min(gh-2,fy|0),ty=fy-iy;for(let x=x0;x<=x1;x++){const fx=(x-x0)/st,ix=Math.min(gw-2,fx|0),tx=fx-ix,k=iy*gw+ix;
  const v=q=>{const g=grid[q];return(g[k]*(1-tx)+g[k+1]*tx)*(1-ty)+(g[k+gw]*(1-tx)+g[k+gw+1]*tx)*ty};const i=y*W+x;
  const d=v(4);if(d>0.01){const ab=Math.exp(-d);T.R[i]*=ab;T.G[i]*=ab;T.B[i]*=ab;T.HA[i]*=ab;T.O3[i]*=ab;T.S2[i]*=ab}
  T.HA[i]+=v(0)*E;T.O3[i]+=v(1)*E;T.S2[i]+=v(2)*E;const r=v(3)*E;if(r>0){T.R[i]+=r*RF[0];T.G[i]+=r*RF[1];T.B[i]+=r*RF[2]}}}
 if(rc.stars)for(const s of rc.stars)addStar(p[0]+s[0]/apx,p[1]-s[1]/apx,elec(s[2]),normCol(bvColor(s[3])),s[2]<8)}

// ---------- Galileische Monde (vereinfacht nach Meeus, Kap. 44), Titan grob
function jupiterMoons(jd){const d=jd-2451545.0,V=(172.74+0.00111588*d)*D2R,M=(357.529+0.9856003*d)*D2R,N=(20.020+0.0830853*d+0.329*Math.sin(V))*D2R,J=(66.115+0.9025179*d-0.329*Math.sin(V))*D2R;
 const A=(1.915*Math.sin(M)+0.020*Math.sin(2*M))*D2R,B=(5.555*Math.sin(N)+0.168*Math.sin(2*N))*D2R,K=J+A-B,R=1.00014-0.01671*Math.cos(M)-0.00014*Math.cos(2*M),r=5.20872-0.25208*Math.cos(N)-0.00611*Math.cos(2*N);
 const D=Math.sqrt(r*r+R*R-2*r*R*Math.cos(K)),psi=Math.asin(R/D*Math.sin(K)),t=d-D/173;
 const u=[163.8069+203.4058646*t,358.4140+101.2916335*t,5.7176+50.2345180*t,224.8092+21.4879800*t].map(x=>x*D2R+psi-B),rad=[5.9057,9.3966,14.9883,26.3627];
 return['Io','Europa','Ganymed','Kallisto'].map((n,i)=>({name:n,x:rad[i]*Math.sin(u[i]),y:-rad[i]*Math.cos(u[i])*0.03,behind:Math.cos(u[i])<0,mag:[5.0,5.3,4.6,5.6][i]}))}
function titanPos(jd){const u=TAU*(jd-2451545-4.2)/15.945421;return{name:'Titan',x:20.25*Math.sin(u),y:-20.25*Math.cos(u)*0.08,behind:Math.cos(u)<0,mag:8.4}}
