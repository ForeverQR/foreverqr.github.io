
function lum(hex){const v=parseInt(hex.slice(1),16); const ch=[v>>16&255,v>>8&255,v&255].map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)}); return .2126*ch[0]+.7152*ch[1]+.0722*ch[2];}

/* ---------- Pro studio ---------- */
document.querySelectorAll(".pcard").forEach(c=>c.addEventListener("click",()=>{
  const p=c.dataset.pro; S.pro = S.pro===p?null:p;
  document.querySelectorAll(".pcard").forEach(x=>x.classList.toggle("on",x.dataset.pro===S.pro));
  ["photo","poster","bulk"].forEach(k=>$(k+"X").classList.toggle("show",S.pro===k));
  if(S.pro==="photo") setSeg("ec","H");
  update();
}));
$("transp").addEventListener("change",()=>{S.transparent=$("transp").checked; update();});
$("bulkIn").addEventListener("input",update);
function setCredits(n){credits=Math.max(0,n); store.set("fqr_credits",String(credits)); $("cred").textContent=credits;}
setCredits(credits);
// A transparent background only applies to a plain code (no frame, poster or photo).
const transparentApplies=()=>S.transparent&&S.frame==="none"&&S.pro!=="poster"&&S.pro!=="photo";
const proActive=()=>!!S.pro||transparentApplies();

/* ---------- bulk ---------- */
function bulkLines(){
  return ($("bulkIn").value||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,BULK_MAX)
    .map(s=>(!/^[a-z][a-z0-9+.-]*:/i.test(s)&&/^[^\s]+\.[a-z]{2,}(\/|$)/i.test(s))?"https://"+s:s);
}

/* ---------- compose ---------- */
function opts(){
  return {fg:$("fg").value,fg2:$("fg2").value,bg:$("bg").value,grad:$("grad").checked,body:S.body,eye:S.eye,logo:S.logo,
    photo:S.pro==="photo"?S.photo:null,dot:$("dot").value/100,pcon:$("pcon").value,transparent:transparentApplies()};
}
function compose(text,size,forPreview){
  const o=opts();
  const ec=(S.pro==="photo")?"H":S.ec;
  const q=makeQR(text,ec);
  const cv=document.createElement("canvas"), g=cv.getContext("2d");
  if(S.pro==="poster"){
    const W=size, H=Math.round(size*1.41); cv.width=W; cv.height=H;
    g.fillStyle=o.bg; g.fillRect(0,0,W,H);
    const ink=o.fg;
    g.fillStyle=ink; g.textAlign="center"; g.textBaseline="alphabetic";
    g.font=`700 ${W*0.085}px Inter, system-ui, sans-serif`; fitText(g,$("ptitle").value||" ",W*0.84,W*0.085,700); g.fillText($("ptitle").value,W/2,H*0.13);
    g.globalAlpha=.7; g.font=`500 ${W*0.04}px Inter, system-ui, sans-serif`; fitText(g,$("psub").value||" ",W*0.84,W*0.04,500); g.fillText($("psub").value,W/2,H*0.13+W*0.075); g.globalAlpha=1;
    const qs=W*0.74, qx=(W-qs)/2, qy=H*0.24;
    g.save(); g.strokeStyle=ink; g.lineWidth=W*0.006; rr(g,qx-W*0.03,qy-W*0.03,qs+W*0.06,qs+W*0.06,W*0.05); g.stroke(); g.restore();
    drawQR(g,q,qx,qy,qs,{...o,photo:null,transparent:false});
    g.fillStyle=ink; g.font=`600 ${W*0.042}px Inter, system-ui, sans-serif`; g.fillText("Scan with your phone camera",W/2,qy+qs+W*0.14);
    g.globalAlpha=.45; g.font=`500 ${W*0.024}px Inter, system-ui, sans-serif`; g.fillText("Made free with ForeverQR",W/2,H-W*0.05); g.globalAlpha=1;
  } else if(S.frame!=="none"){
    const pad=Math.round(size*0.045), lab=Math.round(size*0.17), W=size+pad*2, H=size+pad*2+lab; cv.width=W; cv.height=H;
    const top=S.frame==="top";
    let ink=o.fg; if(o.grad){const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,o.fg); gr.addColorStop(1,o.fg2); ink=gr;}
    g.fillStyle=ink; rr(g,0,0,W,H,size*0.07); g.fill();
    const qy=top?lab+pad*0.2:pad;
    g.save(); rr(g,pad,qy,size,size,size*0.045); g.clip(); drawQR(g,q,pad,qy,size,{...o,transparent:false}); g.restore();
    g.fillStyle=lum(o.fg)>0.5?"#0a0a0c":"#ffffff";
    g.textAlign="center"; g.textBaseline="middle";
    const t=($("ftext").value||"").toUpperCase(); g.font=`800 ${size*0.075}px Inter, system-ui, sans-serif`; fitText(g,t||" ",size*0.88,size*0.075,800);
    g.fillText(t,W/2,top?lab/2+pad*0.3:H-lab/2-pad*0.2);
  } else { cv.width=cv.height=size; drawQR(g,q,0,0,size,o); }
  if(forPreview && proActive() && credits<1){
    g.save(); g.translate(cv.width/2,cv.height/2); g.rotate(-Math.PI/7); g.textAlign="center"; g.textBaseline="middle";
    g.font=`800 ${cv.width*0.1}px Inter, system-ui, sans-serif`; g.fillStyle="rgba(242,200,107,.55)"; g.strokeStyle="rgba(0,0,0,.35)"; g.lineWidth=cv.width*0.004;
    g.strokeText("PRO PREVIEW",0,0); g.fillText("PRO PREVIEW",0,0); g.restore();
  }
  return {cv,q,ec};
}
function fitText(g,t,max,base,wt){let s=base; while(g.measureText(t).width>max&&s>8){s*=0.94; g.font=`${wt} ${s}px Inter, system-ui, sans-serif`;} return s;}

/* ---------- update preview ---------- */
let last=null, raf=0;
function update(){cancelAnimationFrame(raf); raf=requestAnimationFrame(doUpdate);}
function disableAll(){last=null; $("dl").disabled=$("cp").disabled=$("svg").disabled=true;}
function doUpdate(){
  const st=$("stage"), bulk=S.pro==="bulk";
  const lines=bulk?bulkLines():null;
  const text=bulk?(lines[0]||""):payload();
  if(bulk){ const raw=($("bulkIn").value||"").split(/\r?\n/).filter(s=>s.trim()).length;
    $("bulkInfo").textContent=raw?`${lines.length} code${lines.length===1?"":"s"} ready${raw>BULK_MAX?` (only the first ${BULK_MAX} are used)`:""}. The preview shows the first one.`:"Every line becomes its own QR code, with the style above. Download gives you one ZIP."; }
  $("dlTxt").textContent=bulk?(lines.length?`Download ${lines.length} QR code${lines.length===1?"":"s"} (ZIP)`:"Download ZIP"):(proActive()&&credits<1?"Unlock & download":"Download PNG");
  if(!text){st.innerHTML=`<div class="empty">${bulk?"Add links in Bulk QR, one per line":"Your QR appears here"}</div>`; disableAll(); $("mScan").textContent=""; return;}
  if(S.pro==="photo"&&!S.photo){st.innerHTML='<div class="empty">Choose a photo in Pro studio</div>'; disableAll(); return;}
  let r;
  try{ r=compose(text,720,true); }catch(e){ st.innerHTML='<div class="empty">Too much content for one QR code.<br>Shorten it or lower error correction.</div>'; disableAll(); return; }
  st.innerHTML=""; st.appendChild(r.cv); last=text;
  $("dl").disabled=false;
  $("cp").disabled=bulk;
  $("svg").disabled=!!S.pro; $("svg").title=S.pro?"SVG is for a plain or framed code (not photo, poster or bulk)":"Vector file: sharp at any print size";
  const contrast=(Math.max(lum($("fg").value),lum($("bg").value))+.05)/(Math.min(lum($("fg").value),lum($("bg").value))+.05);
  const inv=lum($("fg").value)>lum($("bg").value);
  const m=$("mScan");
  if(contrast<3){m.textContent="⚠ low contrast";m.className="warn";}
  else if(transparentApplies()){m.textContent="◌ place on a light background";m.className="warn";}
  else if(inv&&!S.pro){m.textContent="⚠ light-on-dark scans worse";m.className="warn";}
  else {m.textContent="● scannable";m.className="ok";}
  $("mInfo").textContent=`v${(r.q.getModuleCount()-17)/4} · EC ${r.ec} · never expires`;
}

/* ---------- export helpers ---------- */
function msg(t){$("msg").textContent=t;}
function save(blob,name,note){
  try{const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),6000);
    msg(note||"Downloaded. If nothing happened, right-click the preview and save it.");}
  catch(e){msg("Download blocked here. Use Copy image instead.");}
}
// Pro costs one unlock. With none left, the sponsor screen opens first.
function spend(run){
  if(credits<1){openAd(()=>{setCredits(credits-1); run(); update();}); return;}
  setCredits(credits-1); run(); update();
}
function exportPNG(){
  const {cv}=compose(last,S.size,false);
  cv.toBlob(b=>save(b,"foreverqr-"+S.type+(S.pro?"-"+S.pro:"")+(transparentApplies()?"-transparent":"")+".png"),"image/png");
}

/* ---------- bulk ZIP (stored, no compression: PNGs are already compressed) ---------- */
const CRC=(()=>{const t=new Uint32Array(256); for(let n=0;n<256;n++){let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0;} return t;})();
function crc32(u8){let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c=CRC[(c^u8[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0;}
function makeZip(files){
  const enc=new TextEncoder(), parts=[], central=[]; let off=0;
  const d=new Date(), dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF, dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
  for(const f of files){
    const name=enc.encode(f.name), data=f.data, crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint16(8,0,true); h.setUint16(10,dt,true); h.setUint16(12,dd,true);
    h.setUint32(14,crc,true); h.setUint32(18,data.length,true); h.setUint32(22,data.length,true); h.setUint16(26,name.length,true); h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0x0800,true); c.setUint16(10,0,true); c.setUint16(12,dt,true); c.setUint16(14,dd,true);
    c.setUint32(16,crc,true); c.setUint32(20,data.length,true); c.setUint32(24,data.length,true); c.setUint16(28,name.length,true); c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),name);
    off+=30+name.length+data.length;
  }
  const csize=central.reduce((s,a)=>s+a.length,0);
  const e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,csize,true); e.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(e.buffer)],{type:"application/zip"});
}
async function exportZip(){
  const lines=bulkLines(); if(!lines.length) return;
  const size=Math.min(S.size,2048), base=(($("bulkName").value||"qr").replace(/[^\w-]+/g,"-")||"qr");
  msg(`Making ${lines.length} codes…`);
  const files=[], list=[];
  for(let i=0;i<lines.length;i++){
    const nm=`${base}-${String(i+1).padStart(2,"0")}.png`;
    try{
      const {cv}=compose(lines[i],size,false);
      const b=await new Promise(r=>cv.toBlob(r,"image/png"));
      files.push({name:nm,data:new Uint8Array(await b.arrayBuffer())}); list.push(`${nm}\t${lines[i]}`);
    }catch(e){ list.push(`(skipped, too long)\t${lines[i]}`); }
  }
  files.push({name:"what-each-code-opens.txt",data:new TextEncoder().encode(list.join("\n")+"\n")});
  save(makeZip(files),`${base}-foreverqr.zip`,`Downloaded ${files.length-1} codes in one ZIP.`);
}

/* ---------- SVG (vector: sharp at any print size) ---------- */
const f2=v=>Math.round(v*100)/100;
function rrd(x,y,w,h,r){r=Math.min(r,w/2,h/2); return `M${f2(x+r)},${f2(y)}H${f2(x+w-r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x+w)},${f2(y+r)}V${f2(y+h-r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x+w-r)},${f2(y+h)}H${f2(x+r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x)},${f2(y+h-r)}V${f2(y+r)}A${f2(r)},${f2(r)} 0 0 1 ${f2(x+r)},${f2(y)}Z`;}
function circ(cx,cy,r){return `M${f2(cx-r)},${f2(cy)}a${f2(r)},${f2(r)} 0 1 0 ${f2(2*r)},0a${f2(r)},${f2(r)} 0 1 0 ${f2(-2*r)},0Z`;}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function svgBody(q,ox,oy,px,o,id){
  const n=q.getModuleCount(), quiet=4, tot=n+quiet*2, c=px/tot;
  const X=k=>ox+(k+quiet)*c, Y=r=>oy+(r+quiet)*c;
  const defs=[], out=[];
  let ink=o.fg;
  if(o.grad){defs.push(`<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${f2(X(0))}" y1="${f2(Y(0))}" x2="${f2(X(n))}" y2="${f2(Y(n))}"><stop offset="0" stop-color="${o.fg}"/><stop offset="1" stop-color="${o.fg2}"/></linearGradient>`); ink=`url(#${id}g)`;}
  if(!o.transparent) out.push(`<rect x="${f2(ox)}" y="${f2(oy)}" width="${f2(px)}" height="${f2(px)}" fill="${o.bg}"/>`);
  const finder=(r,k)=>(r<7&&k<7)||(r<7&&k>=n-7)||(r>=n-7&&k<7);
  let hole=null; if(o.logo){const ls=Math.round(n*0.22), s=Math.floor((n-ls)/2); hole={s,e:s+ls};}
  const inHole=(r,k)=>hole&&r>=hole.s&&r<hole.e&&k>=hole.s&&k<hole.e;
  const dk=(r,k)=>r>=0&&k>=0&&r<n&&k<n&&q.isDark(r,k)&&!finder(r,k)&&!inHole(r,k);
  const e=0.6*px/1024; let d="";
  for(let r=0;r<n;r++)for(let k=0;k<n;k++){
    if(!dk(r,k)) continue;
    const x=X(k), y=Y(r);
    if(o.body==="dots") d+=circ(x+c/2,y+c/2,c*0.43);
    else if(o.body==="rounded"){
      const R=c*0.5, t=dk(r-1,k), b=dk(r+1,k), l=dk(r,k-1), ri=dk(r,k+1);
      const x1=x-(l?e:0), y1=y-(t?e:0), x2=x+c+(ri?e:0), y2=y+c+(b?e:0);
      d+=`M${f2(x1+(t||l?0:R))},${f2(y1)}L${f2(x2-(t||ri?0:R))},${f2(y1)}`; if(!(t||ri)) d+=`A${f2(R)},${f2(R)} 0 0 1 ${f2(x2)},${f2(y1+R)}`;
      d+=`L${f2(x2)},${f2(y2-(b||ri?0:R))}`; if(!(b||ri)) d+=`A${f2(R)},${f2(R)} 0 0 1 ${f2(x2-R)},${f2(y2)}`;
      d+=`L${f2(x1+(b||l?0:R))},${f2(y2)}`; if(!(b||l)) d+=`A${f2(R)},${f2(R)} 0 0 1 ${f2(x1)},${f2(y2-R)}`;
      d+=`L${f2(x1)},${f2(y1+(t||l?0:R))}`; if(!(t||l)) d+=`A${f2(R)},${f2(R)} 0 0 1 ${f2(x1+R)},${f2(y1)}`;
      d+="Z";
    } else {
      const x1=x-(dk(r,k-1)?e:0), y1=y-(dk(r-1,k)?e:0), w=c+(dk(r,k-1)?e:0)+(dk(r,k+1)?e:0), h=c+(dk(r-1,k)?e:0)+(dk(r+1,k)?e:0);
      d+=`M${f2(x1)},${f2(y1)}h${f2(w)}v${f2(h)}h${f2(-w)}Z`;
    }
  }
  out.push(`<path d="${d}" fill="${ink}"/>`);
  const eye=(x,y,s,kind)=>o.eye==="circle"?circ(x+s/2,y+s/2,s/2):o.eye==="rounded"?rrd(x,y,s,s,s*(kind==="in"?0.3:0.32)):`M${f2(x)},${f2(y)}h${f2(s)}v${f2(s)}h${f2(-s)}Z`;
  [[0,0],[0,n-7],[n-7,0]].forEach(([r,k])=>{
    const x=X(k), y=Y(r);
    out.push(`<path d="${eye(x,y,7*c,"out")}${eye(x+c,y+c,5*c,"mid")}" fill="${ink}" fill-rule="evenodd"/>`);
    out.push(`<path d="${eye(x+2*c,y+2*c,3*c,"in")}" fill="${ink}"/>`);
  });
  if(hole&&S.logoUrl){
    const s=(hole.e-hole.s)*c, x=X(hole.s), y=Y(hole.s), pad=c*0.6, box=s-pad*2;
    if(!o.transparent) out.push(`<path d="${rrd(x,y,s,s,c*1.2)}" fill="${o.bg}"/>`);
    defs.push(`<clipPath id="${id}l"><path d="${rrd(x+pad,y+pad,box,box,c*0.8)}"/></clipPath>`);
    out.push(`<image href="${S.logoUrl}" x="${f2(x+pad)}" y="${f2(y+pad)}" width="${f2(box)}" height="${f2(box)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${id}l)"/>`);
  }
  return {defs:defs.join(""),body:out.join("")};
}
function buildSVG(text){
  const o=opts(), q=makeQR(text,S.ec), size=1024;
  let W=size,H=size,defs="",body="";
  if(S.frame!=="none"){
    const pad=Math.round(size*0.045), lab=Math.round(size*0.17); W=size+pad*2; H=size+pad*2+lab;
    const top=S.frame==="top", qy=top?lab+pad*0.2:pad;
    let ink=o.fg; if(o.grad){defs+=`<linearGradient id="fg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}"><stop offset="0" stop-color="${o.fg}"/><stop offset="1" stop-color="${o.fg2}"/></linearGradient>`; ink="url(#fg)";}
    body+=`<path d="${rrd(0,0,W,H,size*0.07)}" fill="${ink}"/>`;
    defs+=`<clipPath id="fc"><path d="${rrd(pad,qy,size,size,size*0.045)}"/></clipPath>`;
    const inner=svgBody(q,pad,qy,size,{...o,transparent:false},"q"); defs+=inner.defs;
    body+=`<g clip-path="url(#fc)">${inner.body}</g>`;
    const t=($("ftext").value||"").toUpperCase();
    const g=document.createElement("canvas").getContext("2d"); g.font=`800 ${size*0.075}px Inter, system-ui, sans-serif`; const fs=fitText(g,t||" ",size*0.88,size*0.075,800);
    body+=`<text x="${f2(W/2)}" y="${f2(top?lab/2+pad*0.3:H-lab/2-pad*0.2)}" text-anchor="middle" dominant-baseline="central" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="${f2(fs)}" fill="${lum(o.fg)>0.5?"#0a0a0c":"#ffffff"}">${esc(t)}</text>`;
  } else { const r=svgBody(q,0,0,size,o,"q"); defs=r.defs; body=r.body; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs?`<defs>${defs}</defs>`:""}${body}</svg>`;
}
function exportSVG(){ save(new Blob([buildSVG(last)],{type:"image/svg+xml"}),"foreverqr-"+S.type+".svg","SVG downloaded. Open it in Canva, Figma or Illustrator, or send it to your printer."); }

/* ---------- buttons ---------- */
$("dl").addEventListener("click",()=>{
  if(!last) return;
  if(S.pro==="bulk") return spend(exportZip);
  if(proActive()) return spend(exportPNG);
  exportPNG();
});
$("svg").addEventListener("click",()=>{ if(last&&!S.pro) spend(exportSVG); });
function copyNow(){
  const {cv}=compose(last,S.size,false);
  cv.toBlob(async b=>{try{await navigator.clipboard.write([new ClipboardItem({"image/png":b})]); msg("Copied. Paste it anywhere.");}catch(e){msg("Copy blocked by your browser. Use Download.");}});
}
$("cp").addEventListener("click",()=>{ if(!last) return; if(proActive()) return spend(copyNow); copyNow(); });

/* ---------- sponsor unlock: Strangersbuddies ----------
   Two ways to get one Pro QR: follow on Instagram (once per browser), or let the trip preview run.
   Following can't be checked from a web page, so it works on trust. */
let timer=null, after=null, lastFocus=null;
const followUrl=()=>FOLLOW.url||FOLLOW.fallbackUrl;
const followName=()=>FOLLOW.url?FOLLOW.name:FOLLOW.fallbackName;
function readyToClaim(){clearInterval(timer); $("claim").disabled=false; $("claim").textContent="Unlock 1 Pro QR"; $("ring").textContent="Ready"; $("barI").style.transition="none"; $("barI").style.width="100%";}
function openAd(cb){
  after=cb; lastFocus=document.activeElement;
  const f=$("follow");
  if(store.get("fqr_followed","")==="1"){ f.style.display="none"; }
  else { f.style.display=""; f.disabled=false; f.innerHTML=`<span>Follow <b id="followWho">${esc(followName())}</b> on Instagram and unlock now</span>`; }
  let t=AD_SECONDS; $("ring").textContent=t+"s"; $("claim").disabled=true; $("claim").textContent=`Unlock in ${t}s`;
  $("barI").style.transition="none"; $("barI").style.width="0"; requestAnimationFrame(()=>requestAnimationFrame(()=>{$("barI").style.transition=`width ${AD_SECONDS}s linear`; $("barI").style.width="100%";}));
  $("modal").classList.add("show");
  setTimeout(()=>{ (f.style.display==="none"?$("mclose"):f).focus(); },50);
  clearInterval(timer); timer=setInterval(()=>{t--; $("ring").textContent=Math.max(t,0)+"s";
    if(t<=0) readyToClaim(); else $("claim").textContent=`Unlock in ${t}s`;},1000);
}
function closeAd(){clearInterval(timer); $("modal").classList.remove("show"); after=null; if(lastFocus&&lastFocus.focus) lastFocus.focus();}
$("follow").addEventListener("click",()=>{
  window.open(followUrl(),"_blank","noopener");
  store.set("fqr_followed","1");
  const f=$("follow"); f.disabled=true; f.innerHTML="<span>Thanks for following</span>";
  setTimeout(readyToClaim,1500);
});
$("claim").addEventListener("click",()=>{setCredits(credits+1); $("modal").classList.remove("show"); msg("Pro unlocked for 1 QR."); const cb=after; after=null; if(cb) cb(); else update(); if(lastFocus&&lastFocus.focus) lastFocus.focus();});
$("mclose").addEventListener("click",closeAd);
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$("modal").classList.contains("show")) closeAd(); });

/* ---------- ventures ---------- */
const arrow='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>';
$("ventures").innerHTML=VENTURES.map(v=>`<a class="v${v.hl?" hl":""} reveal" href="${v.url}" target="_blank" rel="noopener">${v.badge?`<span class="badge">${v.badge}</span>`:""}<span class="tg">${v.tag}</span><h4>${v.name}</h4><p>${v.desc}</p><span class="go">Explore ${arrow}</span></a>`).join("");
$("yr").textContent=new Date().getFullYear();

/* reveal on scroll */
const io=("IntersectionObserver" in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in"); io.unobserve(e.target);}}),{threshold:.12}):null;
document.querySelectorAll(".reveal").forEach(el=>io?io.observe(el):el.classList.add("in"));

renderTabs(); renderFields(); syncColors();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(update);
update();
