"use strict";
// ================= Bearbeitung am Laptop =================
// Rohdaten (linear) je Ziel sammeln, pro Filter stapeln, zu Farbe kombinieren, strecken, ins Album übernehmen.
const FNAME={none:'ohne Filter',lp:'LP-Filter',dual:'Dualband',L:'Luminanz',R:'Rot',G:'Grün',B:'Blau',Ha:'H-alpha',O3:'OIII',S2:'SII'};
const PALS={osc:'Farbe (Farbkamera)',rgb:'RGB',lrgb:'LRGB',hoo:'HOO (Hα rot, OIII blaugrün)',sho:'SHO – Hubble-Palette',ha:'H-alpha (Graustufen)',l:'Luminanz (Graustufen)'};
const P={key:null,sel:new Set(),pal:null,black:0.15,str:0.5,sat:1.3,scnr:true,dbe:true,wh:1,wo:1,ws:1};
// Hintergrund glätten: Gradienten und dunkle Ecken herausrechnen (vereinfachtes DBE)
function flatten(a,w,h){const gx=12,gy=8,cw=w/gx,ch=h/gy,m=new Float32Array(gx*gy);for(let j=0;j<gy;j++)for(let i=0;i<gx;i++){const v=[];for(let y=Math.floor(j*ch);y<Math.floor((j+1)*ch);y+=2)for(let x=Math.floor(i*cw);x<Math.floor((i+1)*cw);x+=2)v.push(a[y*w+x]);v.sort((p,q)=>p-q);m[j*gx+i]=v[Math.floor(v.length*0.2)]||0}
 {const t=m.slice();for(let j=0;j<gy;j++)for(let i=0;i<gx;i++){let s2=0,n2=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const jj=j+dj,ii=i+di;if(jj<0||ii<0||jj>=gy||ii>=gx)continue;s2+=t[jj*gx+ii];n2++}m[j*gx+i]=Math.min(t[j*gx+i],s2/n2)}}
 const o=new Float32Array(a.length);for(let y=0;y<h;y++){const fy=clamp(y/ch-0.5,0,gy-1.001),j=Math.floor(fy),ty=fy-j;for(let x=0;x<w;x++){const fx=clamp(x/cw-0.5,0,gx-1.001),i=Math.floor(fx),tx=fx-i;const k=j*gx+i,b=(m[k]*(1-tx)+m[k+1]*tx)*(1-ty)+(m[k+gx]*(1-tx)+m[k+gx+1]*tx)*ty;o[y*w+x]=a[y*w+x]-b}}return o}
function procGroups(){const g={};for(const r of(S.raws||[])){(g[r.key]=g[r.key]||{key:r.key,name:r.name,list:[]}).list.push(r)}return Object.values(g)}
function procStack(grp){const raws=grp.list.filter(r=>P.sel.has(r.id));if(!raws.length)return null;const w=raws[0].w,h=raws[0].h,by={};
 for(const r of raws){if(r.w!==w||r.h!==h)continue;const k=r.mono?r.filter:'OSC',wt=r.t*r.nfr;const st=by[k]=by[k]||{wt:0,n:0,tot:0,d:r.d.map(a=>new Float32Array(a.length))};
  r.d.forEach((a,ch)=>{const dst=st.d[ch],f=wt/r.t;for(let i=0;i<a.length;i++)dst[i]+=a[i]*f});st.wt+=wt;st.n++;st.tot+=wt}
 for(const k in by)by[k].d.forEach(a=>{const f=1/by[k].wt;for(let i=0;i<a.length;i++)a[i]*=f});return{by,w,h}}
function palettesFor(by){const k=Object.keys(by),has=x=>k.includes(x),out=[];if(has('OSC'))out.push('osc');if(has('R')&&has('G')&&has('B')){out.push('rgb');if(has('L'))out.push('lrgb')}
 if(has('Ha')&&has('O3')){if(has('S2'))out.push('sho');out.push('hoo')}if(has('Ha'))out.push('ha');if(has('L'))out.push('l');return out}
function stats(a){const n=a.length,s=[],N=Math.min(n,24000);for(let k=0;k<N;k++)s.push(a[Math.floor(k*n/N)]);s.sort((x,y)=>x-y);const q=f=>s[Math.min(s.length-1,Math.floor(s.length*f))];return{bg:q(0.2),med:q(0.5),lo:q(0.35),hi:q(0.9993)}}
function normCh(a,common){const st=stats(a),hi=common||st.hi,d=Math.max(hi-st.bg,1e-9),o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=(a[i]-st.bg)/d;return o}
function procRender(){const groups=procGroups(),grp=groups.find(g=>g.key===P.key);const cv=$('procCv'),x=cv.getContext('2d');
 if(!grp){cv.width=380;cv.height=250;x.fillStyle='#000';x.fillRect(0,0,380,250);return}
 const sk=procStack(grp);if(!sk){x.fillStyle='#000';x.fillRect(0,0,cv.width,cv.height);return}
 const{by,w,h}=sk,pals=palettesFor(by);if(!pals.includes(P.pal))P.pal=pals[0];cv.width=w;cv.height=h;const n=w*h;let r,g,b;
 const fl=a=>P.dbe?flatten(a,w,h):a,ch=k=>normCh(fl(by[k].d[0]));
 if(P.pal==='osc'||P.pal==='rgb'||P.pal==='lrgb'){const src=(P.pal==='osc'?by.OSC.d:[by.R.d[0],by.G.d[0],by.B.d[0]]).map(fl);const st=src.map(stats),mx=Math.max(...st.map(s=>s.hi-s.bg));
  [r,g,b]=src.map((a,i)=>normCh(a,st[i].bg+(mx*0.5+(st[i].hi-st[i].bg)*0.5)));
  if(P.pal==='lrgb'){const L=ch('L');for(let i=0;i<n;i++){const l=(r[i]+g[i]+b[i])/3,f=l>0.002?L[i]/l:1;r[i]*=f;g[i]*=f;b[i]*=f}}}
 else if(P.pal==='sho'){const S_=ch('S2'),H_=ch('Ha'),O_=ch('O3');r=S_.map(v=>v*P.ws);g=H_.map(v=>v*P.wh);b=O_.map(v=>v*P.wo)}
 else if(P.pal==='hoo'){const H_=ch('Ha'),O_=ch('O3');r=H_.map(v=>v*P.wh);g=O_.map((v,i)=>v*P.wo*0.85+H_[i]*0.1);b=O_.map(v=>v*P.wo)}
 else{const L=ch(P.pal==='ha'?'Ha':'L');r=L;g=L;b=L}
 // Strecken: Mitteltöne so, dass der Hintergrund dunkelgrau wird
 const lum=new Float32Array(n);for(let i=0;i<n;i++)lum[i]=Math.max(0,(r[i]+g[i]+b[i])/3);const sl=stats(lum);const blk=P.black*0.08;
 const x0=clamp((Math.max(sl.med,0.02)-blk)/(1-blk),1e-4,0.9),t=0.06+0.2*P.str,m=x0<t?x0*(1-t)/(x0-2*t*x0+t):0.5;
 const mtf=v=>v<=0?0:v>=1?1:(m-1)*v/((2*m-1)*v-m);const im=x.createImageData(w,h),d=im.data;
 for(let i=0;i<n;i++){let R=Math.max(0,(r[i]-blk)/(1-blk)),Gg=Math.max(0,(g[i]-blk)/(1-blk)),B=Math.max(0,(b[i]-blk)/(1-blk));const L=(R+Gg+B)/3,Ls=mtf(Math.min(1,L)),f=L>1e-6?Ls/L:0;R=Math.min(1,R*f);Gg=Math.min(1,Gg*f);B=Math.min(1,B*f);
  if(P.scnr&&(P.pal==='sho'||P.pal==='hoo'))Gg=Math.min(Gg,(R+B)/2);
  const l=(R+Gg+B)/3;R=clamp(l+(R-l)*P.sat,0,1);Gg=clamp(l+(Gg-l)*P.sat,0,1);B=clamp(l+(B-l)*P.sat,0,1);d[4*i]=R*255;d[4*i+1]=Gg*255;d[4*i+2]=B*255;d[4*i+3]=255}
 x.putImageData(im,0,0);
 const tot=Object.entries(by).map(([k,v])=>`${k==='OSC'?'Farbe':FNAME[k]} ${fmtDur(v.tot)}`).join(' · ');$('procInfo').textContent='Gesamtbelichtung: '+tot}
function drawProc(){const groups=procGroups(),side=$('procSide');
 if(!groups.length){side.innerHTML='<p class="muted">Noch keine Rohdaten. Jede Aufnahme mit der Kamera landet automatisch hier, getrennt nach Ziel und Filter.</p>';P.key=null;procRender();return}
 if(!P.key||!groups.find(g=>g.key===P.key)){P.key=groups[0].key;P.sel=new Set(groups[0].list.map(r=>r.id))}
 const grp=groups.find(g=>g.key===P.key),sk=procStack(grp),pals=sk?palettesFor(sk.by):[];if(!pals.includes(P.pal))P.pal=pals[0];const nb=['sho','hoo'].includes(P.pal);
 const sl=(id,lab,min,max,step,val,term)=>`<div class="ctl"><div class="lab"><span>${lab}${term?` <i class="i" data-t="${term}">i</i>`:''}</span><span class="mono">${fmt(val,2)}</span></div><input type="range" data-p="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
 side.innerHTML=`<div class="ctl"><div class="lab"><span>Ziel</span></div><select id="procKey" style="width:100%">${groups.map(g=>`<option value="${g.key}" ${g.key===P.key?'selected':''}>${g.name} (${g.list.length})</option>`).join('')}</select></div>
  <div class="lab muted" style="font-size:12px;margin-top:8px">Aufnahmen <i class="i" data-t="stacking">i</i></div>
  <div style="max-height:150px;overflow:auto;font-size:12px">${grp.list.map(r=>`<label style="display:block"><input type="checkbox" data-raw="${r.id}" ${P.sel.has(r.id)?'checked':''}> ${r.mono?FNAME[r.filter]:'Farbe'+(r.filter!=='none'?' · '+FNAME[r.filter]:'')} · ${fmtExp(r.t)} × ${r.nfr} · ${new Date(r.when).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</label>`).join('')}</div>
  <div class="ctl" style="margin-top:8px"><div class="lab"><span>Farbkombination <i class="i" data-t="palette">i</i></span></div><select id="procPal" style="width:100%">${pals.map(p=>`<option value="${p}" ${p===P.pal?'selected':''}>${PALS[p]}</option>`).join('')||'<option>–</option>'}</select></div>
  ${nb?sl('wh','Gewicht H-alpha',0.2,3,0.05,P.wh)+sl('wo','Gewicht OIII',0.2,4,0.05,P.wo)+(P.pal==='sho'?sl('ws','Gewicht SII',0.2,4,0.05,P.ws):''):''}
  ${sl('black','Schwarzpunkt',0,1,0.01,P.black,'histogramm')}${sl('str','Strecken',0,1,0.01,P.str,'stretching')}${sl('sat','Sättigung',0,3,0.05,P.sat)}
  <label style="font-size:12px;display:block"><input type="checkbox" id="procDbe" ${P.dbe?'checked':''}> Hintergrund glätten <i class="i" data-t="dbe">i</i></label>
  ${nb?`<label style="font-size:12px"><input type="checkbox" id="procScnr" ${P.scnr?'checked':''}> Grünstich entfernen <i class="i" data-t="scnr">i</i></label>`:''}
  <button class="primary" id="procSave" style="width:100%;margin-top:10px">Ins Fotoalbum übernehmen</button>`;
 $('procKey').onchange=e=>{P.key=e.target.value;const g=procGroups().find(x=>x.key===P.key);P.sel=new Set(g.list.map(r=>r.id));P.pal=null;drawProc()};
 side.querySelectorAll('[data-raw]').forEach(cb=>cb.onchange=()=>{const id=+cb.dataset.raw;cb.checked?P.sel.add(id):P.sel.delete(id);drawProc()});
 if($('procPal'))$('procPal').onchange=e=>{P.pal=e.target.value;drawProc()};
 side.querySelectorAll('[data-p]').forEach(r=>r.oninput=()=>{P[r.dataset.p]=+r.value;r.closest('.ctl').querySelector('.mono').textContent=fmt(+r.value,2);clearTimeout(drawProc.h);drawProc.h=setTimeout(procRender,30)});
 if($('procScnr'))$('procScnr').onchange=e=>{P.scnr=e.target.checked;procRender()};
 $('procDbe').onchange=e=>{P.dbe=e.target.checked;procRender()};
 $('procSave').onclick=()=>{const cv=$('procCv'),a=memGal||galLoad();a.unshift({id:Date.now(),img:cv.toDataURL('image/jpeg',0.9),title:grp.name+' · '+PALS[P.pal],when:S.date.toISOString(),setup:G().optic.n+' · '+G().camera.n,shot:$('procInfo').textContent+' · bearbeitet',diag:['good']});
  if(!galSave(a))memGal=a;toast('Im Fotoalbum gespeichert')};
 procRender()}
