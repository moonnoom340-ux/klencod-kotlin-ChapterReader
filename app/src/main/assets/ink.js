/* © 2026 مهند رضا — جميع الحقوق محفوظة / All rights reserved */
(function(){
var COLORS=["#FFD60A","#34D399","#F472B6","#60A5FA","#FB923C"];
var LS=null;try{LS=window.localStorage}catch(e){}
var pen=false,tool="hl",color=(LS&&LS.getItem("pc"))||COLORS[0],undo=[],cur=null;
if(COLORS.indexOf(color)<0)color=COLORS[0];
function Bk(){return window.BOOK}
function H(){var b=Bk();if(!b)return null;if(!b.hl)b.hl={ink:{},txt:[]};return b.hl}
function save(){if(window.saveNow)window.saveNow()}
function sv(p){return '<svg viewBox="0 0 24 24">'+p+'</svg>'}
var IC={
 hand:'<path d="M8 13V6.500a1.500 1.500 0 0 1 3 0V11M11 10.500V5a1.500 1.500 0 0 1 3 0v5.500M14 10.500V6.500a1.500 1.500 0 0 1 3 0V15c0 3.500-2.300 6-5.800 6-2.700 0-4.300-1.300-5.500-3.500L4 14.500a1.500 1.500 0 0 1 2.500-1.600L8 15"/>',
 hl:'<path d="m5 19 3.500-.8L19 7.700 16.300 5 5.800 15.500z"/><path d="M13.500 7.800 16.200 10.500M3 21.500h8"/>',
 ul:'<path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
 er:'<path d="M20 20H9.500L4 14.500a1.500 1.500 0 0 1 0-2.100l8.500-8.500a1.500 1.500 0 0 1 2.100 0l5.500 5.500a1.500 1.500 0 0 1 0 2.100L13 20"/><path d="M8 11l6 6"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.500a5.500 5.500 0 0 1 0 11H11"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 pen:'<path d="m4 20 1-4.500L16.500 4a2.100 2.100 0 0 1 3 3L8 18.500z"/><path d="m14.500 6 3.500 3.500"/>'
};
var css=document.createElement("style");
css.textContent=".pg{position:relative}.ink{position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:multiply;pointer-events:none;z-index:2}"+
"body.penon .ink{pointer-events:auto;touch-action:none}body.penon.hand .ink{pointer-events:none;touch-action:auto}"+
"#pen{position:fixed;inset:auto 10px calc(10px + env(safe-area-inset-bottom,0px)) 10px;z-index:18;display:none;flex-direction:column;gap:10px;padding:10px 12px;background:var(--card);border-radius:24px;box-shadow:0 18px 44px -14px rgba(0,0,0,.55)}#pen.on{display:flex}"+
"#pen .r{display:flex;align-items:center;justify-content:space-between;gap:8px}#pen .tg,#pen .cs{display:flex;gap:8px;align-items:center}"+
"#pen .tl.on{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;box-shadow:0 8px 16px -8px rgba(79,70,229,.8)}"+
".pen-text #pen [data-t=hand]{display:none}"+
".cdot{width:32px;height:32px;padding:0;border-radius:50%;border:3px solid var(--card);box-shadow:0 0 0 2px var(--line)}.cdot.on{box-shadow:0 0 0 3px var(--ink)}"+
"#papply{display:none;flex:1;padding:10px 14px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:0;font-weight:700}.pen-text #papply.show{display:block}"+
"mark.hl{color:inherit;border-radius:3px;padding:0}"+
"body:not(.rd) #pen{display:none!important}";
document.head.appendChild(css);

var bar=document.createElement("div");bar.id="pen";
bar.innerHTML='<div class="r"><div class="tg" id="ptools">'+
 ['hand|تمرير','hl|قلم تظليل','ul|قلم تسطير','er|ممحاة'].map(function(x){var a=x.split("|");return '<button class="ib tl" data-t="'+a[0]+'" aria-label="'+a[1]+'">'+sv(IC[a[0]])+'</button>'}).join("")+
 '</div><div class="tg"><button class="ib" id="pundo" aria-label="تراجع">'+sv(IC.undo)+'</button><button class="ib" id="pclose" aria-label="إغلاق">'+sv(IC.close)+'</button></div></div>'+
 '<div class="r"><div class="cs" id="pcolors"></div><button id="papply">طبّق على النص المحدد</button></div>';
document.body.appendChild(bar);
COLORS.forEach(function(c){var b=document.createElement("button");b.className="cdot";b.style.background=c;b.setAttribute("data-c",c);b.setAttribute("aria-label","لون");b.onclick=function(){color=c;try{LS&&LS.setItem("pc",c)}catch(e){}sync()};bar.querySelector("#pcolors").appendChild(b)});
function sync(){
  bar.querySelectorAll(".tl").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-t")===tool)});
  bar.querySelectorAll(".cdot").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-c")===color)});
  document.body.classList.toggle("hand",pen&&tool==="hand");
}
bar.querySelectorAll(".tl").forEach(function(b){b.onclick=function(){tool=b.getAttribute("data-t");sync()}});

/* ---------- on/off ---------- */
var oldCA=window.closeAllPanels,oldCS=window.closeSplit;
function isText(){return Bk()&&Bk().type==="text"}
function penOn(){
  if(!Bk())return;
  if(oldCA)oldCA();
  pen=true;bar.classList.add("on");
  document.body.classList.add("penon");document.body.classList.toggle("pen-text",isText());
  if(isText()&&tool==="hand")tool="hl";
  sync();
}
function penOff(){
  pen=false;bar.classList.remove("on");
  document.body.classList.remove("penon","hand","pen-text");
  var s=window.getSelection&&getSelection();if(s&&s.removeAllRanges)s.removeAllRanges();
  bar.querySelector("#papply").classList.remove("show");
}
window.closeAllPanels=function(){if(oldCA)oldCA();if(pen)penOff()};
window.closeSplit=function(){if(pen){penOff();return true}return oldCS?oldCS():false};
var hb=document.createElement("button");hb.className="ib";hb.id="bpen";hb.setAttribute("aria-label","أقلام التظليل");hb.innerHTML=sv(IC.pen);
hb.onclick=function(){pen?penOff():penOn()};
document.querySelector(".row").appendChild(hb);
bar.querySelector("#pclose").onclick=penOff;
["bsplit","btr"].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener("click",function(){if(pen)penOff()},true)});

/* ---------- undo ---------- */
function snap(type,k){
  var h=H();
  undo.push(type==="ink"?{t:"ink",k:k,prev:JSON.parse(JSON.stringify(h.ink[k]||[]))}:{t:"txt",prev:JSON.parse(JSON.stringify(h.txt))});
  if(undo.length>60)undo.shift();
}
bar.querySelector("#pundo").onclick=function(){
  var u=undo.pop(),h=H();if(!u||!h)return;
  if(u.t==="ink"){
    if(u.prev.length)h.ink[u.k]=u.prev;else delete h.ink[u.k];
    var d=document.querySelector('#book .pg[data-u="'+u.k+'"]');if(d)window.inkRedraw(d);
  }else{h.txt=u.prev;window.hlApply()}
  save();
};

/* ---------- PDF ink ---------- */
function drawStroke(x,s,W,Hh){
  if(!s.p.length)return;
  x.save();x.lineCap="round";x.lineJoin="round";x.strokeStyle=s.c;x.lineWidth=s.w*W;x.globalAlpha=s.m==="hl"?0.5:1;
  x.beginPath();x.moveTo(s.p[0][0]*W,s.p[0][1]*Hh);
  if(s.p.length===1)x.lineTo(s.p[0][0]*W+.1,s.p[0][1]*Hh);
  for(var i=1;i<s.p.length;i++)x.lineTo(s.p[i][0]*W,s.p[i][1]*Hh);
  x.stroke();x.restore();
}
function inkCanvas(d){
  var c=d.querySelector("canvas.ink");
  if(!c){c=document.createElement("canvas");c.className="ink";d.appendChild(c)}
  var dp=Math.min(window.devicePixelRatio||1,2),w=Math.round(d.clientWidth*dp),h=Math.round(d.clientHeight*dp);
  if(w&&h&&(c.width!==w||c.height!==h)){c.width=w;c.height=h}
  return c;
}
window.inkRedraw=function(d){
  var h=H();if(!h)return;
  var k=+d.getAttribute("data-u"),c=inkCanvas(d),x=c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  (h.ink[k]||[]).forEach(function(s){drawStroke(x,s,c.width,c.height)});
};
function pt(e){return[(e.clientX-cur.r.left)/cur.r.width,(e.clientY-cur.r.top)/cur.r.height]}
function distSeg(px,py,a,b){
  var ax=a[0]*cur.r.width,ay=a[1]*cur.r.height,bx=b[0]*cur.r.width,by=b[1]*cur.r.height,dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;
  return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
}
function eraseAt(e){
  var h=H(),arr=h.ink[cur.k]||[],px=e.clientX-cur.r.left,py=e.clientY-cur.r.top;
  var keep=arr.filter(function(s){
    for(var i=0;i<s.p.length;i++){var d=i?distSeg(px,py,s.p[i-1],s.p[i]):distSeg(px,py,s.p[0],s.p[0]);if(d<18)return false}
    return true;
  });
  if(keep.length!==arr.length){
    if(!cur.snapped){snap("ink",cur.k);cur.snapped=true}
    if(keep.length)h.ink[cur.k]=keep;else delete h.ink[cur.k];
    window.inkRedraw(cur.d);
  }
}
function live(){
  var c=cur.c,x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);
  (H().ink[cur.k]||[]).forEach(function(s){drawStroke(x,s,c.width,c.height)});
  drawStroke(x,cur.s,c.width,c.height);
}
document.addEventListener("pointerdown",function(e){
  if(!pen||isText()||tool==="hand")return;
  var c=e.target.closest&&e.target.closest("canvas.ink");if(!c)return;
  if(!e.isPrimary){cur=null;return}
  var d=c.parentNode;
  cur={d:d,c:c,k:+d.getAttribute("data-u"),r:c.getBoundingClientRect(),snapped:false,s:{c:color,w:tool==="hl"?0.034:0.0055,m:tool,p:[]}};
  try{c.setPointerCapture(e.pointerId)}catch(x){}
  e.preventDefault();
  if(tool==="er")eraseAt(e);else{cur.s.p.push(pt(e));live()}
},true);
document.addEventListener("pointermove",function(e){
  if(!cur||!e.isPrimary)return;
  e.preventDefault();
  if(tool==="er"){eraseAt(e);return}
  var p=pt(e),l=cur.s.p[cur.s.p.length-1];
  if(Math.hypot((p[0]-l[0])*cur.r.width,(p[1]-l[1])*cur.r.height)<2)return;
  cur.s.p.push(p);
  if(!cur.raf)cur.raf=requestAnimationFrame(function(){cur.raf=0;if(cur)live()});
},true);
function endStroke(e){
  if(!cur)return;
  var s=cur.s,k=cur.k,h=H(),d=cur.d;
  if(tool==="er"){cur=null;save();return}
  if(s.p.length){
    var ys=s.p.map(function(p){return p[1]*cur.r.height}),xs=s.p.map(function(p){return p[0]*cur.r.width});
    var sy=Math.max.apply(null,ys)-Math.min.apply(null,ys),sx=Math.max.apply(null,xs)-Math.min.apply(null,xs);
    if(sx<6&&sy<6){cur=null;window.inkRedraw(d);return}
    if(sy<24&&s.p.length>1){
      var ay=s.p.reduce(function(a,p){return a+p[1]},0)/s.p.length,f=s.p[0],l=s.p[s.p.length-1];
      s.p=[[f[0],ay],[l[0],ay]];
    }
    s.p=s.p.map(function(p){return[Math.round(p[0]*10000)/10000,Math.round(p[1]*10000)/10000]});
    snap("ink",k);
    (h.ink[k]=h.ink[k]||[]).push(s);
    save();
  }
  cur=null;window.inkRedraw(d);
}
document.addEventListener("pointerup",endStroke,true);
document.addEventListener("pointercancel",function(){if(cur){var d=cur.d;cur=null;window.inkRedraw(d)}},true);

/* ---------- text highlights (Word / txt) ---------- */
function rgba(hex,a){var n=parseInt(hex.slice(1),16);return"rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"}
function unwrap(u){
  u.querySelectorAll("mark.hl").forEach(function(m){var p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m)});
  u.normalize();
}
function wrapRange(u,s,e,c,mode){
  var tw=document.createTreeWalker(u,NodeFilter.SHOW_TEXT,null),nodes=[],pos=0,n;
  while((n=tw.nextNode())){nodes.push({n:n,a:pos,b:pos+n.nodeValue.length});pos+=n.nodeValue.length}
  nodes.forEach(function(o){
    var ss=Math.max(s,o.a),ee=Math.min(e,o.b);if(ee<=ss)return;
    var tn=o.n,len=o.b-o.a,rs=ss-o.a,re=ee-o.a;
    if(re<len)tn.splitText(re);
    if(rs>0)tn=tn.splitText(rs);
    var m=document.createElement("mark");m.className="hl";
    if(mode==="ul"){m.style.background="transparent";m.style.textDecoration="underline";m.style.textDecorationColor=c;m.style.textDecorationThickness="3px";m.style.textUnderlineOffset="5px"}
    else m.style.background=rgba(c,.5);
    tn.parentNode.insertBefore(m,tn);m.appendChild(tn);
  });
}
function applyUnit(u){
  var h=H(),k=+u.getAttribute("data-u");
  unwrap(u);
  h.txt.filter(function(x){return x.u===k}).sort(function(a,b){return a.s-b.s}).forEach(function(x){wrapRange(u,x.s,x.e,x.c,x.m)});
}
window.hlApply=function(){
  var b=Bk(),h=H();if(!b||!h||b.type!=="text")return;
  document.querySelectorAll("#book [data-u]").forEach(function(u){
    var k=+u.getAttribute("data-u");
    if(u.querySelector("mark.hl")||h.txt.some(function(x){return x.u===k}))applyUnit(u);
  });
};
function offIn(u,node,off){var r=document.createRange();r.selectNodeContents(u);r.setEnd(node,off);return r.toString().length}
function subtract(k,s,e){
  var h=H(),out=[];
  h.txt.forEach(function(x){
    if(x.u!==k||x.e<=s||x.s>=e){out.push(x);return}
    if(x.s<s)out.push({u:k,s:x.s,e:s,c:x.c,m:x.m});
    if(x.e>e)out.push({u:k,s:e,e:x.e,c:x.c,m:x.m});
  });
  h.txt=out;
}
function applySel(){
  var sel=getSelection(),h=H();
  if(!pen||!isText()||!h||!sel||sel.isCollapsed||!sel.rangeCount)return;
  var rg=sel.getRangeAt(0),book=document.getElementById("book");
  if(!book.contains(rg.commonAncestorContainer))return;
  snap("txt");
  Array.prototype.filter.call(book.querySelectorAll("[data-u]"),function(u){return rg.intersectsNode(u)}).forEach(function(u){
    var s=0,e=u.textContent.length;
    if(u.contains(rg.startContainer))s=offIn(u,rg.startContainer,rg.startOffset);
    if(u.contains(rg.endContainer))e=offIn(u,rg.endContainer,rg.endOffset);
    if(e<=s)return;
    var k=+u.getAttribute("data-u");
    subtract(k,s,e);
    if(tool!=="er")h.txt.push({u:k,s:s,e:e,c:color,m:tool==="ul"?"ul":"hl"});
    applyUnit(u);
  });
  sel.removeAllRanges();bar.querySelector("#papply").classList.remove("show");
  save();
}
var ap=bar.querySelector("#papply");
ap.addEventListener("pointerdown",function(e){e.preventDefault();applySel()});
document.addEventListener("selectionchange",function(){
  if(!pen||!isText())return;
  var s=getSelection(),ok=!!(s&&!s.isCollapsed&&s.rangeCount&&document.getElementById("book").contains(s.getRangeAt(0).commonAncestorContainer));
  ap.classList.toggle("show",ok);
  ap.textContent=tool==="er"?"امسح التظليل من المحدد":"طبّق على النص المحدد";
});
/* eraser tap on a highlighted text */
document.addEventListener("click",function(e){
  if(!pen||!isText()||tool!=="er")return;
  var m=e.target.closest&&e.target.closest("mark.hl");if(!m)return;
  var u=m.closest("[data-u]"),rg=document.caretRangeFromPoint&&document.caretRangeFromPoint(e.clientX,e.clientY);
  if(!u||!rg)return;
  var off=offIn(u,rg.startContainer,rg.startOffset),k=+u.getAttribute("data-u"),h=H();
  var hit=h.txt.filter(function(x){return x.u===k&&x.s<=off&&off<=x.e});
  if(!hit.length)return;
  snap("txt");
  h.txt=h.txt.filter(function(x){return hit.indexOf(x)<0});
  applyUnit(u);save();e.preventDefault();e.stopPropagation();
},true);
})();
