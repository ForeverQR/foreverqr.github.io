qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
const $ = id => document.getElementById(id);
const S = {type:"link", body:"square", eye:"square", frame:"none", ec:"M", size:1024, pro:null, logo:null, logoUrl:null, photo:null, transparent:false};
const store = {get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let credits = parseInt(store.get("fqr_credits","0"))||0;

/* ---------- types ---------- */
const TYPES = {
  link:{label:"Link", icon:'<path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
    fields:[{id:"url",label:"Website or form link",type:"url",ph:"https://forms.gle/…",full:1}],
    build:v=>{let u=v.url.trim(); if(!u) return ""; if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u="https://"+u; return u;}},
  upi:{label:"UPI", icon:'<path d="M4 7h16M4 12h16M4 17h10"/>',
    fields:[{id:"vpa",label:"UPI ID",ph:"name@okaxis"},{id:"pn",label:"Payee name",ph:"Deepansh Deep"},{id:"am",label:"Amount (optional)",type:"number",ph:"99"},{id:"tn",label:"Note (optional)",ph:"Event ticket"}],
    build:v=>{if(!v.vpa.trim()) return ""; let s="upi://pay?pa="+encodeURIComponent(v.vpa.trim()).replace(/%40/g,"@")+"&pn="+encodeURIComponent(v.pn.trim()||"Payee"); if(v.am) s+="&am="+encodeURIComponent(v.am); s+="&cu=INR"; if(v.tn.trim()) s+="&tn="+encodeURIComponent(v.tn.trim()); return s;}},
  whatsapp:{label:"WhatsApp", icon:'<path d="M21 12a9 9 0 01-13.3 7.9L3 21l1.1-4.6A9 9 0 1121 12z"/>',
    fields:[{id:"ph",label:"Phone with country code",type:"tel",ph:"91 98765 43210"},{id:"msg",label:"Pre-filled message",ph:"Hi! I saw your poster"}],
    build:v=>{const d=v.ph.replace(/\D/g,""); if(!d) return ""; return "https://wa.me/"+d+(v.msg.trim()?"?text="+encodeURIComponent(v.msg.trim()):"");}},
  wifi:{label:"WiFi", icon:'<path d="M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01M2 9a15 15 0 0120 0"/>',
    fields:[{id:"ssid",label:"Network name",ph:"Home_WiFi"},{id:"pw",label:"Password",type:"text",ph:"••••••••"},{id:"sec",label:"Security",sel:["WPA","WEP","nopass"]},{id:"hid",label:"Hidden network",sel:["No","Yes"]}],
    build:v=>{if(!v.ssid) return ""; const e=s=>s.replace(/([\\;,:"])/g,"\\$1"); return `WIFI:T:${v.sec};S:${e(v.ssid)};${v.sec!=="nopass"?"P:"+e(v.pw)+";":""}${v.hid==="Yes"?"H:true;":""};`;}},
  contact:{label:"Contact", icon:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    fields:[{id:"fn",label:"Full name",ph:"Deepansh Deep"},{id:"tel",label:"Phone",type:"tel",ph:"+91 …"},{id:"em",label:"Email",type:"email",ph:"you@mail.com"},{id:"org",label:"Company / role",ph:"OM&D"},{id:"web",label:"Website",type:"url",ph:"https://…",full:1}],
    build:v=>{if(!v.fn.trim()&&!v.tel.trim()) return ""; const L=["BEGIN:VCARD","VERSION:3.0","N:;"+v.fn.trim()+";;;","FN:"+v.fn.trim()]; if(v.tel.trim())L.push("TEL;TYPE=CELL:"+v.tel.trim()); if(v.em.trim())L.push("EMAIL:"+v.em.trim()); if(v.org.trim())L.push("ORG:"+v.org.trim()); if(v.web.trim())L.push("URL:"+v.web.trim()); L.push("END:VCARD"); return L.join("\n");}},
  email:{label:"Email", icon:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    fields:[{id:"to",label:"To",type:"email",ph:"you@mail.com"},{id:"subj",label:"Subject",ph:"Hello"},{id:"body",label:"Message",ta:1,full:1}],
    build:v=>{if(!v.to.trim()) return ""; const q=[]; if(v.subj.trim())q.push("subject="+encodeURIComponent(v.subj.trim())); if(v.body.trim())q.push("body="+encodeURIComponent(v.body.trim())); return "mailto:"+v.to.trim()+(q.length?"?"+q.join("&"):"");}},
  text:{label:"Text", icon:'<path d="M4 6h16M4 12h16M4 18h10"/>',
    fields:[{id:"tx",label:"Any text",ta:1,full:1,ph:"Type anything"}], build:v=>v.tx.trim()},
};
const vals = {};
function renderTabs(){
  $("tabs").innerHTML = Object.entries(TYPES).map(([k,t])=>`<button class="tab${k===S.type?" on":""}" data-t="${k}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>${t.label}</button>`).join("");
}
function renderFields(){
  const t=TYPES[S.type]; vals[S.type]=vals[S.type]||{};
  const v=vals[S.type];
  $("fields").innerHTML = t.fields.map(f=>{
    if(v[f.id]==null) v[f.id]=f.sel?f.sel[0]:"";
    const val=String(v[f.id]).replace(/"/g,"&quot;");
    let input;
    if(f.sel) input=`<select data-f="${f.id}">${f.sel.map(o=>`<option${o===v[f.id]?" selected":""}>${o}</option>`).join("")}</select>`;
    else if(f.ta) input=`<textarea data-f="${f.id}" placeholder="${f.ph||""}">${v[f.id]}</textarea>`;
    else input=`<input type="${f.type||"text"}" data-f="${f.id}" placeholder="${f.ph||""}" value="${val}">`;
    return `<div class="f${f.full?" full":""}"><label>${f.label}</label>${input}</div>`;
  }).join("");
}
$("tabs").addEventListener("click",e=>{const b=e.target.closest(".tab"); if(!b) return; S.type=b.dataset.t; renderTabs(); renderFields(); update(); const i=$("fields").querySelector("[data-f]"); if(i) i.focus();});
$("fields").addEventListener("input",e=>{const f=e.target.dataset.f; if(!f) return; vals[S.type][f]=e.target.value; update();});
function payload(){const t=TYPES[S.type]; const v=vals[S.type]||{}; const full={}; t.fields.forEach(f=>full[f.id]=v[f.id]??""); return t.build(full);}

/* ---------- segmented controls ---------- */
document.querySelectorAll(".seg").forEach(seg=>seg.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  seg.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
  const k=seg.dataset.k; S[k]= k==="size"?parseInt(b.dataset.v):b.dataset.v; update();
}));
function setSeg(k,v){document.querySelectorAll(`.seg[data-k="${k}"] button`).forEach(x=>x.classList.toggle("on",x.dataset.v===v)); S[k]=v;}

/* ---------- colors ---------- */
const PRESETS=[["#0a0a0c","#ffffff"],["#1b2cc1","#ffffff"],["#0f5132","#f3fbf6"],["#7a1fa2","#fff7ff"],["#c2410c","#fff8f1"],["#ffffff","#0a0a0c"],["#d7ff3a","#0a0a0c"]];
$("presets").innerHTML=PRESETS.map((p,i)=>`<button class="sw${i===0?" on":""}" data-i="${i}" style="background:linear-gradient(135deg,${p[0]} 50%,${p[1]} 50%)" title="Preset"></button>`).join("");
$("presets").addEventListener("click",e=>{const b=e.target.closest(".sw"); if(!b) return; const p=PRESETS[b.dataset.i]; $("fg").value=p[0]; $("bg").value=p[1]; document.querySelectorAll(".sw").forEach(x=>x.classList.toggle("on",x===b)); syncColors(); update();});
function syncColors(){$("fgv").textContent=$("fg").value.toUpperCase();$("bgv").textContent=$("bg").value.toUpperCase();$("fg2v").textContent=$("fg2").value.toUpperCase();}
["fg","bg","fg2"].forEach(id=>$(id).addEventListener("input",()=>{document.querySelectorAll(".sw").forEach(x=>x.classList.remove("on")); syncColors(); update();}));
$("grad").addEventListener("change",()=>{$("g2wrap").style.display=$("grad").checked?"":"none"; update();});
$("ftext").addEventListener("input",update);

/* ---------- images ---------- */
function loadImg(file,cb){const r=new FileReader(); r.onload=()=>{const im=new Image(); im.onload=()=>cb(im,r.result); im.src=r.result;}; r.readAsDataURL(file);}
$("logoIn").addEventListener("change",e=>{const f=e.target.files[0]; if(!f) return; loadImg(f,(im,url)=>{S.logo=im; S.logoUrl=url; $("logoThumb").style.backgroundImage=`url(${url})`; $("logoThumb").innerHTML=""; $("logoTxt").textContent=f.name; $("logoX").style.display=""; if(S.ec==="L"||S.ec==="M") setSeg("ec","H"); update();});});
$("logoX").addEventListener("click",e=>{e.preventDefault();e.stopPropagation(); S.logo=null; S.logoUrl=null; $("logoIn").value=""; $("logoThumb").style.backgroundImage=""; $("logoThumb").innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'; $("logoTxt").textContent="Add your logo in the center (PNG, JPG)"; $("logoX").style.display="none"; update();});
$("photoIn").addEventListener("change",e=>{const f=e.target.files[0]; if(!f) return; loadImg(f,(im,url)=>{S.photo=im; $("photoThumb").style.backgroundImage=`url(${url})`; $("photoThumb").innerHTML=""; $("photoTxt").textContent=f.name; update();});});
$("dot").addEventListener("input",()=>{$("dsv").textContent=$("dot").value+"%"; update();});
$("pcon").addEventListener("input",()=>{$("pcv").textContent=$("pcon").value+"%"; update();});
["ptitle","psub"].forEach(id=>$(id).addEventListener("input",update));
