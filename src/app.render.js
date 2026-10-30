/* ---------- renderer ---------- */
function rrPath(g,x,y,w,h,r){r=Math.min(r,w/2,h/2); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();}
function rr(g,x,y,w,h,r){g.beginPath(); rrPath(g,x,y,w,h,r);}
function makeQR(text,ec){const q=qrcode(0,ec); q.addData(text); q.make(); return q;}

/* draws QR block (incl. quiet zone) of size px at (ox,oy) */
function drawQR(g,q,ox,oy,px,o){
  const n=q.getModuleCount(), quiet=o.photo?2:4, tot=n+quiet*2, c=px/tot;
  const X=k=>ox+(k+quiet)*c, Y=r=>oy+(r+quiet)*c;
  if(!o.transparent){g.fillStyle=o.bg; g.fillRect(ox,oy,px,px);}
  let ink=o.fg;
  if(o.grad){const gr=g.createLinearGradient(X(0),Y(0),X(n),Y(n)); gr.addColorStop(0,o.fg); gr.addColorStop(1,o.fg2); ink=gr;}
  const finder=(r,k)=>(r<7&&k<7)||(r<7&&k>=n-7)||(r>=n-7&&k<7);
  // logo hole
  let hole=null;
  if(o.logo&&!o.photo){const ls=Math.round(n*0.22); const s=Math.floor((n-ls)/2); hole={s,e:s+ls};}
  const inHole=(r,k)=>hole&&r>=hole.s&&r<hole.e&&k>=hole.s&&k<hole.e;

  if(o.photo){
    // photo covers code area
    const im=o.photo, a=X(0)-c*0, b=Y(0), w=n*c;
    const sc=Math.max(w/im.width,w/im.height), iw=im.width*sc, ih=im.height*sc;
    g.save(); g.beginPath(); g.rect(a,b,w,w); g.clip();
    g.filter=`contrast(${o.pcon}%) saturate(110%)`;
    g.drawImage(im,a+(w-iw)/2,b+(w-ih)/2,iw,ih); g.filter="none"; g.restore();
    const d=c*o.dot, off=(c-d)/2;
    for(let r=0;r<n;r++)for(let k=0;k<n;k++){
      if(finder(r,k)) continue;
      g.fillStyle=q.isDark(r,k)?o.fg:"#ffffff";
      g.fillRect(X(k)+off,Y(r)+off,d,d);
    }
    // white separators around finders
    g.fillStyle="#ffffff";
    [[0,0],[0,n-8],[n-8,0]].forEach(([r,k])=>g.fillRect(X(Math.max(k,0)),Y(Math.max(r,0)),8*c,8*c));
  } else {
    g.fillStyle=ink; g.beginPath();
    const dk=(r2,k2)=>r2>=0&&k2>=0&&r2<n&&k2<n&&q.isDark(r2,k2)&&!finder(r2,k2)&&!inHole(r2,k2);
    const e=0.6;
    for(let r=0;r<n;r++)for(let k=0;k<n;k++){
      if(!dk(r,k)) continue;
      const x=X(k),y=Y(r);
      if(o.body==="dots"){g.moveTo(x+c/2+c*0.43,y+c/2); g.arc(x+c/2,y+c/2,c*0.43,0,Math.PI*2);}
      else if(o.body==="rounded"){
        const R=c*0.5, t=dk(r-1,k),b2=dk(r+1,k),l=dk(r,k-1),ri=dk(r,k+1);
        const x1=x-(l?e:0), y1=y-(t?e:0), x2=x+c+(ri?e:0), y2=y+c+(b2?e:0);
        g.moveTo(x1+(t||l?0:R),y1);
        g.lineTo(x2-(t||ri?0:R),y1); if(!(t||ri)) g.arcTo(x2,y1,x2,y1+R,R);
        g.lineTo(x2,y2-(b2||ri?0:R)); if(!(b2||ri)) g.arcTo(x2,y2,x2-R,y2,R);
        g.lineTo(x1+(b2||l?0:R),y2); if(!(b2||l)) g.arcTo(x1,y2,x1,y2-R,R);
        g.lineTo(x1,y1+(t||l?0:R)); if(!(t||l)) g.arcTo(x1,y1,x1+R,y1,R);
        g.closePath();
      }
      else g.rect(x-(dk(r,k-1)?e:0),y-(dk(r-1,k)?e:0),c+(dk(r,k-1)?e:0)+(dk(r,k+1)?e:0),c+(dk(r-1,k)?e:0)+(dk(r+1,k)?e:0));
    }
    g.fill("nonzero");
  }
  // eyes: outer ring and centre. The ring is cut with even-odd, so it also works on a transparent background.
  const eyePath=(px2,py2,s,kind)=>{ if(o.eye==="circle"){g.moveTo(px2+s,py2+s/2); g.arc(px2+s/2,py2+s/2,s/2,0,Math.PI*2);} else if(o.eye==="rounded"){rrPath(g,px2,py2,s,s,s*(kind==="in"?0.3:0.32));} else {g.rect(px2,py2,s,s);} };
  [[0,0],[0,n-7],[n-7,0]].forEach(([r,k])=>{
    const x=X(k),y=Y(r);
    if(o.photo){ g.fillStyle="#ffffff"; g.beginPath(); eyePath(x,y,7*c,"out"); g.fill(); }
    g.fillStyle=ink; g.beginPath(); eyePath(x,y,7*c,"out"); eyePath(x+c,y+c,5*c,"mid"); g.fill("evenodd");
    g.beginPath(); eyePath(x+2*c,y+2*c,3*c,"in"); g.fill();
  });
  // logo
  if(hole){
    const s=(hole.e-hole.s)*c, x=X(hole.s), y=Y(hole.s), pad=c*0.6;
    if(!o.transparent){g.fillStyle=o.bg; rr(g,x,y,s,s,c*1.2); g.fill();}
    const im=o.logo, box=s-pad*2, sc=Math.min(box/im.width,box/im.height), iw=im.width*sc, ih=im.height*sc;
    g.save(); rr(g,x+pad,y+pad,box,box,c*0.8); g.clip(); g.drawImage(im,x+pad+(box-iw)/2,y+pad+(box-ih)/2,iw,ih); g.restore();
  }
}
