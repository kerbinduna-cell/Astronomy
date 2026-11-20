"use strict";
// ================= Grundlagen =================
const PI=Math.PI,TAU=2*PI,D2R=PI/180,R2D=180/PI,AS=D2R/3600,OMEGA=7.2921159e-5;
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const wrapPI=x=>{x=(x+PI)%TAU;if(x<0)x+=TAU;return x-PI};
const $=id=>document.getElementById(id);
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function gauss(r){let u=r()||1e-9;return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*r())}
const fmt=(x,d=1)=>Number(x).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
function fmtRA(ra){let h=((ra*R2D/15)%24+24)%24;const H=Math.floor(h),M=Math.floor((h-H)*60),S=Math.round(((h-H)*60-M)*60);return `${H}h ${String(M).padStart(2,'0')}m ${String(S%60).padStart(2,'0')}s`}
function fmtDeg(d){const s=d<0?'−':'+';d=Math.abs(d*R2D);const D=Math.floor(d),M=Math.round((d-D)*60);return `${s}${D}° ${String(M%60).padStart(2,'0')}′`}
function dirName(az){const n=['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];return n[Math.round(((az*R2D)%360+360)%360/22.5)%16]}
const fmtTime=d=>d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
function fmtExp(t){if(t>=1)return t+' s';return '1/'+Math.round(1/t)+' s'}

// ================= Astronomie =================
const JD=d=>d.getTime()/86400000+2440587.5;
const EPS=23.4392911*D2R;
function lstOf(jd,lon){const d=jd-2451545;return(((280.46061837+360.98564736629*d+lon)%360)+360)%360*D2R}
function precessor(jd){const T=(jd-2451545)/36525;const zeta=(2306.2181*T+0.30188*T*T)*AS,z=(2306.2181*T+1.09468*T*T)*AS,th=(2004.3109*T-0.42665*T*T)*AS;const ct=Math.cos(th),st=Math.sin(th);
 return(ra,dec)=>{const cd=Math.cos(dec),sd=Math.sin(dec),a=ra+zeta,ca=Math.cos(a);const A=cd*Math.sin(a),B=ct*cd*ca-st*sd,C=st*cd*ca+ct*sd;return[(Math.atan2(A,B)+z+TAU)%TAU,Math.asin(clamp(C,-1,1))]}}
const ELEM={earth:[1.00000261,0.00000562,0.01671123,-0.00004392,-0.00001531,-0.01294668,100.46457166,35999.37244981,102.93768193,0.32327364,0,0],
 mars:[1.52371034,0.00001847,0.09339410,0.00007882,1.84969142,-0.00813131,-4.55343205,19140.30268499,-23.94362959,0.44441088,49.55953891,-0.29257343],
 jupiter:[5.20288700,-0.00011607,0.04838624,-0.00013253,1.30439695,-0.00183714,34.39644051,3034.74612775,14.72847983,0.21252668,100.47390909,0.20469106],
 saturn:[9.53667594,-0.00125060,0.05386179,-0.00050991,2.48599187,0.00193609,49.95424423,1222.49362201,92.59887831,-0.41897216,113.66242448,-0.28867794]};
function helio(k,T){const q=ELEM[k];const a=q[0]+q[1]*T,e=q[2]+q[3]*T,I=(q[4]+q[5]*T)*D2R,L=q[6]+q[7]*T,w=q[8]+q[9]*T,O=(q[10]+q[11]*T)*D2R;
 let M=(((L-w)%360)+540)%360-180;M*=D2R;let E=M+e*Math.sin(M);for(let i=0;i<8;i++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
 const xp=a*(Math.cos(E)-e),yp=a*Math.sqrt(1-e*e)*Math.sin(E),om=w*D2R-O;const co=Math.cos(om),so=Math.sin(om),cO=Math.cos(O),sO=Math.sin(O),cI=Math.cos(I),sI=Math.sin(I);
 return[(co*cO-so*sO*cI)*xp+(-so*cO-co*sO*cI)*yp,(co*sO+so*cO*cI)*xp+(-so*sO+co*cO*cI)*yp,so*sI*xp+co*sI*yp]}
const ecl2eq=(x,y,z)=>[x,y*Math.cos(EPS)-z*Math.sin(EPS),y*Math.sin(EPS)+z*Math.cos(EPS)];
function v2rd(v){const r=Math.hypot(v[0],v[1],v[2]);return[(Math.atan2(v[1],v[0])+TAU)%TAU,Math.asin(v[2]/r),r]}
const rd2v=(ra,dec)=>[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];
function eq2hor(ra,dec,c){const H=c.lst-ra,sd=Math.sin(dec),cd=Math.cos(dec),ch=Math.cos(H),sh=Math.sin(H);
 const alt=Math.asin(clamp(sd*c.slat+cd*c.clat*ch,-1,1));const az=Math.atan2(-cd*sh,sd*c.clat-cd*c.slat*ch);return[alt,(az+TAU)%TAU]}
function hor2eq(alt,az,c){const sa=Math.sin(alt),ca=Math.cos(alt),cz=Math.cos(az);const dec=Math.asin(clamp(sa*c.slat+ca*c.clat*cz,-1,1));
 const H=Math.atan2(-Math.sin(az)*ca,sa*c.clat-ca*c.slat*cz);return[((c.lst-H)%TAU+TAU)%TAU,dec]}
const h2v=(alt,az)=>{const ca=Math.cos(alt);return[ca*Math.sin(az),ca*Math.cos(az),Math.sin(alt)]};
const GAL=[[-0.0548755604,-0.8734370902,-0.4838350155],[0.4941094279,-0.4448296300,0.7469822445],[-0.8676661490,-0.1980763734,0.4559837762]];
function eq2gal(ra,dec){const v=rd2v(ra,dec);const g=GAL.map(r=>r[0]*v[0]+r[1]*v[1]+r[2]*v[2]);return[Math.atan2(g[1],g[0]),Math.asin(clamp(g[2],-1,1))]}
// Rauschfunktion für Milchstraßen-Struktur
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const h=(a,b)=>{let n=Math.imul(a,374761393)+Math.imul(b,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296};
 const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return(h(xi,yi)*(1-u)+h(xi+1,yi)*u)*(1-v)+(h(xi,yi+1)*(1-u)+h(xi+1,yi+1)*u)*v}
function mwBright(ra,dec){const[l,b]=eq2gal(ra,dec);const bd=b*R2D,ld=wrapPI(l)*R2D;
 let band=Math.exp(-((bd/9)**2))+0.25*Math.exp(-((bd/22)**2));
 let lonF=0.35+0.65*Math.exp(-((ld/55)**2))+0.35*Math.exp(-(((ld-75)/22)**2))+0.15*Math.exp(-(((ld+100)/40)**2));
 const rift=0.6*Math.exp(-(((bd-1.5)/2.6)**2))*Math.exp(-(((ld-50)/32)**2));
 const n=0.55+0.3*vnoise(ld*0.15+50,bd*0.3+20)+0.2*vnoise(ld*0.5,bd*0.7)+0.15*vnoise(ld*1.6+9,bd*1.6)-0.1;
 return Math.max(0,band*lonF*(1-rift)*n)}

// Sternkatalog vorbereiten
const NS=STARS.length/4,sRA0=new Float64Array(NS),sDE0=new Float64Array(NS),sMag=new Float32Array(NS),sBV=new Float32Array(NS),sRA=new Float64Array(NS),sDE=new Float64Array(NS);
for(let i=0;i<NS;i++){sRA0[i]=STARS[4*i]*D2R;sDE0[i]=STARS[4*i+1]*D2R;sMag[i]=STARS[4*i+2];sBV[i]=STARS[4*i+3]}
const HIP={};for(const k in STARNAMES)HIP[STARNAMES[k][2]]=+k;
let precJD=-1e9,precF=null,consP=null,mesP={};
const MES={};for(const m of MESSIER){const d=(m[5]||'').toString().split('x').map(Number);MES[m[0]]={id:m[0],ra0:m[1]*D2R,dec0:m[2]*D2R,type:m[3],mag:m[4],a:d[0]||5,b:d[1]||d[0]||5,alt:m[6]}}
const DE_NAMES={M1:'Krebsnebel',M8:'Lagunennebel',M13:'Herkules-Kugelsternhaufen',M27:'Hantelnebel',M31:'Andromedagalaxie',M33:'Dreiecksgalaxie',M42:'Orionnebel',M44:'Krippe (Praesepe)',M45:'Plejaden (Siebengestirn)',M51:'Whirlpool-Galaxie',M57:'Ringnebel',M81:'Bodes Galaxie',M82:'Zigarrengalaxie',M101:'Feuerrad-Galaxie',M104:'Sombrerogalaxie',M16:'Adlernebel',M17:'Omeganebel',M20:'Trifidnebel',M11:'Wildentenhaufen'};
const PA={M31:35,M33:23,M81:157,M82:65,M51:0,M101:0,M104:90,M63:104,M64:115,M65:3,M66:173};
function ensurePrecession(jd){if(Math.abs(jd-precJD)<180)return;precJD=jd;precF=precessor(jd);
 for(let i=0;i<NS;i++){const r=precF(sRA0[i],sDE0[i]);sRA[i]=r[0];sDE[i]=r[1]}
 consP=CLINES.map(([id,segs])=>{const ps=segs.map(seg=>seg.map(p=>precF(p[0]*D2R,p[1]*D2R)));let sx=0,sy=0,sz=0,n=0;for(const s of ps)for(const p of s){const v=rd2v(p[0],p[1]);sx+=v[0];sy+=v[1];sz+=v[2];n++}return{id,segs:ps,c:v2rd([sx/n,sy/n,sz/n])}});
 for(const k in MES){const r=precF(MES[k].ra0,MES[k].dec0);MES[k].ra=r[0];MES[k].dec=r[1]}}

// Zustand der Simulation zum aktuellen Zeitpunkt
function simCtx(){const jd=JD(S.date);ensurePrecession(jd);const lat=S.loc.lat*D2R;
 const c={jd,lat,lon:S.loc.lon,lst:lstOf(jd,S.loc.lon),slat:Math.sin(lat),clat:Math.cos(lat)};
 const T=(jd-2451545)/36525,E=helio('earth',T);
 const sunRD=precF(...v2rd(ecl2eq(-E[0],-E[1],-E[2])).slice(0,2));c.sun={ra:sunRD[0],dec:sunRD[1]};[c.sun.alt,c.sun.az]=eq2hor(c.sun.ra,c.sun.dec,c);
 c.planets=[];
 for(const[k,name,d0,m0]of[['mars','Mars',9.36,-1.52],['jupiter','Jupiter',196.9,-9.40],['saturn','Saturn',165.6,-8.88]]){
  const P=helio(k,T),g=[P[0]-E[0],P[1]-E[1],P[2]-E[2]];const rd=v2rd(ecl2eq(...g));const r=Math.hypot(...P),dist=rd[2];const p=precF(rd[0],rd[1]);
  const o={id:k,name,kind:'planet',ra:p[0],dec:p[1],dist,mag:m0+5*Math.log10(r*dist),diam:d0/dist,hlon:Math.atan2(P[1],P[0])};[o.alt,o.az]=eq2hor(o.ra,o.dec,c);c.planets.push(o)}
 const m=moonEq(jd);const mo={id:'moon',name:'Mond',kind:'moon',ra:m[0],dec:m[1]};[mo.alt,mo.az]=eq2hor(mo.ra,mo.dec,c);
 const vs=rd2v(c.sun.ra,c.sun.dec),vm=rd2v(mo.ra,mo.dec);const psi=Math.acos(clamp(vs[0]*vm[0]+vs[1]*vm[1]+vs[2]*vm[2],-1,1));
 mo.psi=psi;mo.illum=(1-Math.cos(psi))/2;const ph=180-psi*R2D;mo.mag=-12.73+0.026*Math.abs(ph)+4e-9*ph**4;mo.diam=1865;
 mo.chi=Math.atan2(Math.cos(c.sun.dec)*Math.sin(c.sun.ra-mo.ra),Math.sin(c.sun.dec)*Math.cos(mo.dec)-Math.cos(c.sun.dec)*Math.sin(mo.dec)*Math.cos(c.sun.ra-mo.ra));
 c.moon=mo;return c}
function moonEq(jd){const d=jd-2451545;const L=(218.316+13.176396*d)*D2R,M=(134.963+13.064993*d)*D2R,F=(93.272+13.229350*d)*D2R;
 const lon=L+6.289*D2R*Math.sin(M)-1.274*D2R*Math.sin(M-2*((297.85+12.190749*d)*D2R))+0.658*D2R*Math.sin(2*(297.85+12.190749*d)*D2R),lat=5.128*D2R*Math.sin(F);
 return v2rd(ecl2eq(Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)))}
function skyState(sunAlt){const s=sunAlt*R2D;if(s>0)return'Tag';if(s>-6)return'bürgerliche Dämmerung';if(s>-12)return'nautische Dämmerung';if(s>-18)return'astronomische Dämmerung';return'astronomische Nacht'}
