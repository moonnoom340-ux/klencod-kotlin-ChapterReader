/* © 2026 مهند رضا — جميع الحقوق محفوظة / All rights reserved */
(function(){
var COLORS=["#FFD60A","#FB923C","#F87171","#F472B6","#A78BFA","#60A5FA","#22D3EE","#34D399","#A3E635","#1F2937"];
var WID={hl:[.022,.034,.05],ul:[.003,.0055,.009],pen:[.0025,.0042,.007]},ER=[10,20,34];
var SEP=/[\s\u00A0.,;:!?()\[\]«»"“”'‘’،؛؟\-–—]/;
var LS=null;try{LS=window.localStorage}catch(e){}
function ls(k,v){try{if(v===undefined)return LS.getItem(k);LS.setItem(k,v)}catch(e){}return null}
var pen=false,tool="hl",color=ls("pc")||COLORS[0],size=+ls("ps"),undo=[],redo=[],cur=null,tp=null;
if(!/^#[0-9a-fA-F]{6}$/.test(color))color=COLORS[0];
if(!(size>=0&&size<=2))size=1;
function Bk(){return window.BOOK}
function H(){var b=Bk();if(!b)return null;if(!b.hl)b.hl={ink:{},txt:[]};return b.hl}
function save(){if(window.saveNow)window.saveNow()}
function isText(){return Bk()&&Bk().type==="text"}
function sv(p){return '<svg viewBox="0 0 24 24">'+p+'</svg>'}
function rgba(hex,a){var n=parseInt(hex.slice(1),16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"}
function clone(x){return JSON.parse(JSON.stringify(x))}
function pgEl(k){return document.querySelector('#book .pg[data-u="'+k+'"]')}
var IC={
 hand:'<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5M14 10.5V6.5a1.5 1.5 0 0 1 3 0V15c0 3.5-2.3 6-5.8 6-2.7 0-4.3-1.3-5.5-3.5L4 14.5a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
 hl:'<path d="m5 19 3.5-.8L19 7.7 16.3 5 5.8 15.5z"/><path d="M13.5 7.8 16.2 10.5M3 21.5h8"/>',
 ul:'<path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
 pen:'<path d="m4 20 1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="m14.5 6 3.5 3.5"/>',
 er:'<path d="M20 20H9.5L4 14.5a1.5 1.5 0 0 1 0-2.1l8.5-8.5a1.5 1.5 0 0 1 2.1 0l5.5 5.5a1.5 1.5 0 0 1 0 2.1L13 20"/><path d="M8 11l6 6"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
 redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 trash:'<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'
};
var TOOLS=[["hand","تمرير"],["hl","تظليل"],["ul","تسطير"],["pen","قلم"],["er","ممحاة"]];

/* ---------- styles ---------- */
var css=document.createElement("style");
css.textContent=".pg{position:relative}.ink{position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:multiply;pointer-events:none;z-index:2}"+
"body.penon .ink{pointer-events:auto;touch-action:none}body.penon.hand .ink{pointer-events:none;touch-action:auto}"+
"body.penon.pen-text:not(.hand) #book{touch-action:none;-webkit-user-select:none;user-select:none}body.penon #book{padding-bottom:250px}"+
"#pen{position:fixed;inset:auto 8px calc(8px + env(safe-area-inset-bottom,0px)) 8px;z-index:18;display:none;background:var(--card);border-radius:26px;box-shadow:0 18px 44px -14px rgba(0,0,0,.6);padding:6px 12px 12px}#pen.on{display:block}"+
"#pen .gp{width:44px;height:5px;border-radius:3px;background:var(--line);margin:2px auto 8px;cursor:pointer}"+
"#ptools{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}#pen .tl{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px;border-radius:14px;font-size:12px;line-height:1.2}#pen .tl svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}"+
"#pen .tl.on{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-color:transparent;box-shadow:0 8px 16px -8px rgba(79,70,229,.8)}.pen-text #pen .tl[data-t=pen]{display:none}.pen-text #ptools{grid-template-columns:repeat(4,1fr)}"+
"#pcolors{display:flex;gap:9px;overflow-x:auto;padding:12px 2px 6px;scrollbar-width:none}#pcolors::-webkit-scrollbar{display:none}"+
".cdot{flex:none;width:34px;height:34px;padding:0;border-radius:50%;border:3px solid var(--card);box-shadow:0 0 0 2px var(--line);position:relative}.cdot.on{box-shadow:0 0 0 3px var(--ink)}"+
".cdot.cust{background:conic-gradient(#f87171,#fde047,#4ade80,#22d3ee,#818cf8,#f472b6,#f87171)}.cdot.cust input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}"+
"#prow3{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px}#psizes{display:flex;gap:6px}.pen-text #psizes{visibility:hidden}"+
"#psizes button{width:42px;height:42px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%}#psizes button i{display:block;border-radius:50%;background:currentColor}#psizes button.on{background:var(--ink);color:var(--paper);border-color:transparent}"+
"#pacts{display:flex;gap:6px}#pacts .ib svg,#pen .ib svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}#pacts .ib:disabled{opacity:.35}"+
"#pen.mini #pcolors,#pen.mini #prow3{display:none}"+
"mark.hl{color:inherit;border-radius:3px;padding:0}"+
"#hlpv{position:fixed;inset:0;pointer-events:none;z-index:17}#hlpv div{position:fixed;border-radius:3px}"+
"#hls{max-height:80vh;overflow-y:auto}.hli{display:flex;gap:10px;align-items:center;padding:11px 12px;border-radius:16px;background:var(--card);border:1px solid var(--line);margin-bottom:8px;cursor:pointer}.hli .dt{width:14px;height:14px;border-radius:50%;flex:none}.hli .tx{flex:1;min-width:0}.hli .tx b{display:block;font-size:14px;line-height:1.6;max-height:3.2em;overflow:hidden}.hli .tx small{color:var(--muted);font-size:12px}.hli .ib{width:36px;height:36px;color:#e11d48}.hlg{color:var(--muted);font-size:13px;margin:12px 2px 6px}#hlsum{color:var(--muted);font-size:14px;margin-bottom:10px}"+
"@keyframes hlf{0%,100%{box-shadow:0 0 0 0 transparent}40%{box-shadow:0 0 0 6px rgba(79,70,229,.45)}}.hlfl{animation:hlf 1.1s ease 2}"+
"body:not(.rd) #pen,body:not(.rd) #hlpv{display:none!important}";
document.head.appendChild(css);

/* ---------- toolbar ---------- */
var bar=document.createElement("div");bar.id="pen";
bar.innerHTML='<div class="gp" id="pgrip" aria-label="تصغير / تكبير"></div><div id="ptools"></div><div id="pcolors"></div>'+
'<div id="prow3"><div id="psizes"></div><div id="pacts"><button class="ib" id="pundo" aria-label="تراجع">'+sv(IC.undo)+'</button><button class="ib" id="predo" aria-label="إعادة">'+sv(IC.redo)+'</button><button class="ib" id="plist" aria-label="تظليلاتي">'+sv(IC.list)+'</button><button class="ib" id="pclose" aria-label="إغلاق">'+sv(IC.close)+'</button></div></div>';
document.body.appendChild(bar);
var pv=document.createElement("div");pv.id="hlpv";document.body.appendChild(pv);
var $=function(s){return bar.querySelector(s)};
TOOLS.forEach(function(t){var b=document.createElement("button");b.className="tl";b.setAttribute("data-t",t[0]);b.innerHTML=sv(IC[t[0]])+'<span>'+t[1]+'</span>';b.onclick=function(){tool=t[0];sync()};$("#ptools").appendChild(b)});
COLORS.forEach(function(c){var b=document.createElement("button");b.className="cdot";b.style.background=c;b.setAttribute("data-c",c);b.setAttribute("aria-label","لون");b.onclick=function(){setColor(c)};$("#pcolors").appendChild(b)});
var cu=document.createElement("label");cu.className="cdot cust";cu.setAttribute("aria-label","لون مخصص");cu.innerHTML='<input type="color" id="pcust">';$("#pcolors").appendChild(cu);
[7,11,16].forEach(function(d,i){var b=document.createElement("button");b.setAttribute("data-s",i);b.setAttribute("aria-label","حجم "+(i+1));b.innerHTML='<i style="width:'+d+'px;height:'+d+'px"></i>';b.onclick=function(){size=i;ls("ps",i);sync()};$("#psizes").appendChild(b)});
function setColor(c){color=c.toUpperCase();ls("pc",color);if(tool==="hand"||tool==="er")tool=isText()?"hl":"hl";sync()}
bar.querySelector("#pcust").addEventListener("input",function(e){setColor(e.target.value)});
function sync(){
  bar.querySelectorAll(".tl").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-t")===tool)});
  var known=false;
  bar.querySelectorAll(".cdot[data-c]").forEach(function(b){var on=b.getAttribute("data-c").toUpperCase()===color;if(on)known=true;b.classList.toggle("on",on)});
  cu.classList.toggle("on",!known);if(!known){cu.style.background=color}else cu.style.background="";
  bar.querySelectorAll("#psizes button").forEach(function(b){b.classList.toggle("on",+b.getAttribute("data-s")===size)});
  document.body.classList.toggle("hand",pen&&tool==="hand");
  $("#pundo").disabled=!undo.length;$("#predo").disabled=!redo.length;
}
$("#pgrip").onclick=function(){bar.classList.toggle("mini")};

/* ---------- on/off ---------- */
var oldCA=window.closeAllPanels,oldCS=window.closeSplit,oldSO=window.sheetOpen,oldSV=window.showView;
var S=document.createElement("div");S.id="hls";S.className="sheet";
S.innerHTML='<div class="grip"></div><div class="sh-head"><h3>تظليلاتي</h3><button class="ib" id="hlx" aria-label="إغلاق">'+sv(IC.close)+'</button></div><div id="hlsum"></div><div id="hllist"></div><div class="foot"><button id="hlcopy">نسخ المقتطفات</button><button id="hlclr">مسح الكل</button></div>';
document.body.appendChild(S);
function bd(){return document.getElementById("bd")}
function openList(){fillList();S.classList.add("on");var b=bd();if(b)b.classList.add("on")}
function closeList(){S.classList.remove("on");var b=bd();if(b)b.classList.remove("on")}
function penOn(){
  if(!Bk())return;
  if(oldCA)oldCA();
  pen=true;bar.classList.add("on");
  document.body.classList.add("penon");document.body.classList.toggle("pen-text",isText());
  if(!isText()&&tool==="hand")tool="hl";
  if(isText()&&tool==="pen")tool="hl";
  sync();
}
function penOff(){
  pen=false;bar.classList.remove("on");closeList();
  document.body.classList.remove("penon","hand","pen-text");
  pv.innerHTML="";tp=null;
}
window.closeAllPanels=function(){if(S.classList.contains("on")){closeList();return}if(oldCA)oldCA();if(pen)penOff()};
window.closeSplit=function(){
  if(S.classList.contains("on")){closeList();return true}
  if(pen){penOff();return true}
  return oldCS?oldCS():false;
};
window.sheetOpen=function(){return S.classList.contains("on")||(oldSO?oldSO():false)};
window.showView=function(n){if(n!=="reader"){penOff();undo=[];redo=[];sync()}return oldSV.apply(this,arguments)};
var hb=document.createElement("button");hb.className="ib";hb.id="bpen";hb.setAttribute("aria-label","أقلام التظليل");hb.innerHTML=sv(IC.pen);
hb.onclick=function(){pen?penOff():penOn()};
document.querySelector(".row").appendChild(hb);
$("#pclose").onclick=penOff;
$("#plist").onclick=openList;
document.getElementById("hlx").onclick=closeList;
["bsplit","btr"].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener("click",function(){if(pen)penOff()},true)});
document.addEventListener("touchmove",function(e){
  if(!S.classList.contains("on"))return;
  if(e.target.closest&&e.target.closest("#hls")&&S.scrollHeight>S.clientHeight+1)return;
  if(e.cancelable)e.preventDefault();
},{passive:false});
document.addEventListener("contextmenu",function(e){if(pen&&!(tool==="hand")){e.preventDefault()}},true);

/* ---------- undo / redo ---------- */
function getSt(t,k){var h=H();return clone(t==="ink"?(h.ink[k]||[]):h.txt)}
function setSt(t,k,v){
  var h=H();
  if(t==="ink"){if(v.length)h.ink[k]=v;else delete h.ink[k];var d=pgEl(k);if(d)window.inkRedraw(d)}
  else{h.txt=v;window.hlApply()}
}
function snap(t,k){undo.push({t:t,k:k,prev:getSt(t,k)});if(undo.length>80)undo.shift();redo=[];sync()}
$("#pundo").onclick=function(){var u=undo.pop();if(!u)return;redo.push({t:u.t,k:u.k,prev:getSt(u.t,u.k)});setSt(u.t,u.k,u.prev);sync();save()};
$("#predo").onclick=function(){var u=redo.pop();if(!u)return;undo.push({t:u.t,k:u.k,prev:getSt(u.t,u.k)});setSt(u.t,u.k,u.prev);sync();save()};

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
/* partial eraser: cut every stroke where the eraser touches it */
function eraseStrokes(arr,px,py,R,W,Hh){
  var out=[],changed=false;
  arr.forEach(function(s){
    var pts=[],i;
    for(i=0;i<s.p.length;i++){
      var a=s.p[i];
      if(i){var b=s.p[i-1],dx=(a[0]-b[0])*W,dy=(a[1]-b[1])*Hh,n=Math.ceil(Math.hypot(dx,dy)/(R/2));for(var j=1;j<n;j++)pts.push([b[0]+(a[0]-b[0])*j/n,b[1]+(a[1]-b[1])*j/n])}
      pts.push(a);
    }
    var runs=[],run=[],hit=false;
    pts.forEach(function(q){
      if(Math.hypot(q[0]*W-px,q[1]*Hh-py)<=R){hit=true;if(run.length)runs.push(run);run=[]}else run.push(q);
    });
    if(run.length)runs.push(run);
    if(!hit){out.push(s);return}
    changed=true;
    runs.forEach(function(r){
      if(r.length<2)return;
      out.push({c:s.c,w:s.w,m:s.m,p:r.map(function(p){return[Math.round(p[0]*10000)/10000,Math.round(p[1]*10000)/10000]})});
    });
  });
  return{out:out,changed:changed};
}
function pt(e){return[(e.clientX-cur.r.left)/cur.r.width,(e.clientY-cur.r.top)/cur.r.height]}
function live(){
  var c=cur.c,x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);
  (H().ink[cur.k]||[]).forEach(function(s){drawStroke(x,s,c.width,c.height)});
  if(cur.s)drawStroke(x,cur.s,c.width,c.height);
  if(tool==="er"&&cur.ex!==undefined){
    var k=c.width/cur.r.width;
    x.save();x.beginPath();x.arc((cur.ex-cur.r.left)*k,(cur.ey-cur.r.top)*k,ER[size]*k,0,6.2832);
    x.fillStyle="rgba(120,120,120,.25)";x.fill();x.lineWidth=2;x.strokeStyle="rgba(60,60,60,.7)";x.stroke();x.restore();
  }
}
function eraseAt(e){
  var h=H(),arr=h.ink[cur.k]||[];
  cur.ex=e.clientX;cur.ey=e.clientY;
  if(arr.length){
    var r=eraseStrokes(arr,e.clientX-cur.r.left,e.clientY-cur.r.top,ER[size],cur.r.width,cur.r.height);
    if(r.changed){
      if(!cur.snapped){snap("ink",cur.k);cur.snapped=true}
      if(r.out.length)h.ink[cur.k]=r.out;else delete h.ink[cur.k];
    }
  }
  live();
}
document.addEventListener("pointerdown",function(e){
  if(!pen||isText()||tool==="hand")return;
  var c=e.target.closest&&e.target.closest("canvas.ink");if(!c)return;
  if(!e.isPrimary){cur=null;return}
  var d=c.parentNode;
  cur={d:d,c:c,k:+d.getAttribute("data-u"),r:c.getBoundingClientRect(),snapped:false,s:null};
  try{c.setPointerCapture(e.pointerId)}catch(x){}
  e.preventDefault();
  if(tool==="er")eraseAt(e);
  else{cur.s={c:color,w:WID[tool][size],m:tool,p:[pt(e)]};live()}
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
function endStroke(){
  if(!cur)return;
  var s=cur.s,k=cur.k,h=H(),d=cur.d,wasEr=tool==="er";
  if(wasEr){cur=null;window.inkRedraw(d);save();return}
  if(s&&s.p.length){
    var ys=s.p.map(function(p){return p[1]*cur.r.height}),xs=s.p.map(function(p){return p[0]*cur.r.width});
    var sy=Math.max.apply(null,ys)-Math.min.apply(null,ys),sx=Math.max.apply(null,xs)-Math.min.apply(null,xs);
    if(sx<6&&sy<6&&tool!=="pen"){cur=null;window.inkRedraw(d);return}
    if(tool!=="pen"&&sy<24&&s.p.length>1){
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

/* ---------- text highlights (Word / txt): paint with the finger ---------- */
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
function wStart(t,i){while(i>0&&!SEP.test(t.charAt(i-1)))i--;return i}
function wEnd(t,i){while(i<t.length&&!SEP.test(t.charAt(i)))i++;return i}
function subtract(k,s,e){
  var h=H(),out=[];
  h.txt.forEach(function(x){
    if(x.u!==k||x.e<=s||x.s>=e){out.push(x);return}
    if(x.s<s)out.push({u:k,s:x.s,e:s,c:x.c,m:x.m});
    if(x.e>e)out.push({u:k,s:e,e:x.e,c:x.c,m:x.m});
  });
  h.txt=out;
}
function applyRange(rg){
  var h=H(),book=document.getElementById("book");
  var units=Array.prototype.filter.call(book.querySelectorAll("[data-u]"),function(u){return rg.intersectsNode(u)});
  if(!units.length)return;
  if(rg.collapsed){
    if(tool!=="er")return;
    var u0=units[0],off=offIn(u0,rg.startContainer,rg.startOffset),k0=+u0.getAttribute("data-u");
    var hit=h.txt.filter(function(x){return x.u===k0&&x.s<=off&&off<=x.e});
    if(!hit.length)return;
    snap("txt");h.txt=h.txt.filter(function(x){return hit.indexOf(x)<0});applyUnit(u0);save();return;
  }
  snap("txt");
  units.forEach(function(u,i){
    var T=u.textContent,s=0,e=T.length;
    if(u.contains(rg.startContainer))s=offIn(u,rg.startContainer,rg.startOffset);
    if(u.contains(rg.endContainer))e=offIn(u,rg.endContainer,rg.endOffset);
    if(i===0&&u.contains(rg.startContainer))s=wStart(T,s);
    if(i===units.length-1&&u.contains(rg.endContainer))e=wEnd(T,e);
    if(e<=s)return;
    var k=+u.getAttribute("data-u");
    subtract(k,s,e);
    if(tool!=="er")h.txt.push({u:k,s:s,e:e,c:color,m:tool==="ul"?"ul":"hl"});
    applyUnit(u);
  });
  save();
}
function caretAt(x,y){
  var r=document.caretRangeFromPoint?document.caretRangeFromPoint(x,y):null;
  if(!r||!document.getElementById("book").contains(r.startContainer))return null;
  return{n:r.startContainer,o:r.startOffset};
}
function mkRange(a,b){
  var r1=document.createRange(),r2=document.createRange();
  r1.setStart(a.n,a.o);r1.collapse(true);r2.setStart(b.n,b.o);r2.collapse(true);
  var rg=document.createRange();
  if(r1.compareBoundaryPoints(Range.START_TO_START,r2)<=0){rg.setStart(a.n,a.o);rg.setEnd(b.n,b.o)}
  else{rg.setStart(b.n,b.o);rg.setEnd(a.n,a.o)}
  return rg;
}
function preview(){
  pv.innerHTML="";
  if(!tp||!tp.sc||!tp.ec)return;
  var rg=mkRange(tp.sc,tp.ec),rs=rg.getClientRects();
  for(var i=0;i<rs.length;i++){
    var r=rs[i];if(r.width<1)continue;
    var d=document.createElement("div");
    d.style.left=r.left+"px";d.style.width=r.width+"px";
    if(tool==="ul"){d.style.top=(r.bottom-3)+"px";d.style.height="3px";d.style.background=color}
    else if(tool==="er"){d.style.top=r.top+"px";d.style.height=r.height+"px";d.style.background="rgba(120,120,120,.35)";d.style.border="1px dashed #666"}
    else{d.style.top=r.top+"px";d.style.height=r.height+"px";d.style.background=rgba(color,.45)}
    pv.appendChild(d);
  }
}
function tpUpdate(){var c=caretAt(tp.x,tp.y);if(c){tp.ec=c;preview()}}
document.addEventListener("pointerdown",function(e){
  if(!pen||!isText()||tool==="hand")return;
  if(e.target.closest&&(e.target.closest("#pen")||e.target.closest(".sheet")||e.target.closest("header")))return;
  var book=document.getElementById("book");if(!book.contains(e.target))return;
  if(!e.isPrimary){tp=null;pv.innerHTML="";return}
  var c=caretAt(e.clientX,e.clientY);if(!c)return;
  tp={sc:c,ec:c,x:e.clientX,y:e.clientY,int:setInterval(function(){
    if(!tp)return;
    var top=document.querySelector("header").getBoundingClientRect().bottom+46,bot=bar.getBoundingClientRect().top-24,dy=0;
    if(tp.y<top)dy=-16;else if(tp.y>bot)dy=16;
    if(dy){window.scrollBy(0,dy);tpUpdate()}
  },30)};
  try{book.setPointerCapture(e.pointerId)}catch(x){}
  e.preventDefault();preview();
},true);
document.addEventListener("pointermove",function(e){
  if(!tp||!e.isPrimary)return;
  e.preventDefault();tp.x=e.clientX;tp.y=e.clientY;tpUpdate();
},true);
function tpEnd(apply){
  if(!tp)return;
  clearInterval(tp.int);
  var t=tp;tp=null;pv.innerHTML="";
  if(apply&&t.sc&&t.ec)applyRange(mkRange(t.sc,t.ec));
}
document.addEventListener("pointerup",function(){tpEnd(true)},true);
document.addEventListener("pointercancel",function(){tpEnd(false)},true);

/* ---------- my highlights list ---------- */
function label(u){
  var b=Bk(),t="";
  (b.bounds||[]).forEach(function(x){if(x.s<=u)t=x.colored?x.title:""});
  return t?"الفصل: "+t:"";
}
function copyText(t,btn){
  var done=function(){var o=btn.textContent;btn.textContent="تم النسخ ✓";setTimeout(function(){btn.textContent=o},1600)};
  var fb=function(){var a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();done()};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(fb);else fb();
}
function jump(el,flash){
  if(!el)return;
  closeList();
  window.scrollTo(0,Math.max(0,el.getBoundingClientRect().top+scrollY-170));
  el.classList.add("hlfl");setTimeout(function(){el.classList.remove("hlfl")},2400);
}
function textItems(){
  var h=H();
  return h.txt.slice().sort(function(a,b){return a.u-b.u||a.s-b.s}).map(function(x){
    var u=document.querySelector('#book [data-u="'+x.u+'"]');
    return{x:x,u:u,t:u?u.textContent.slice(x.s,x.e).trim():""};
  }).filter(function(i){return i.t});
}
function pdfLines(k){
  var b=Bk(),it=b.list[k];if(!it)return[];
  var strokes=(H().ink[k]||[]).filter(function(s){return s.m!=="pen"&&s.p.length}),vh=it.p.getViewport({scale:1}).height,idx={};
  strokes.forEach(function(s){
    var ys=s.p.map(function(p){return p[1]}),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
    if(y1-y0>0.08)return;
    it.x.lines.forEach(function(l,i){var f=1-l.y/vh;if(f>=y0-0.012&&f<=y1+0.014)idx[i]=1});
  });
  return it.x.lines.filter(function(l,i){return idx[i]}).map(function(l){return l.t});
}
function fillList(){
  var b=Bk(),h=H(),L=document.getElementById("hllist"),sm=document.getElementById("hlsum");
  L.innerHTML="";if(!b||!h)return;
  if(b.type==="text"){
    var its=textItems(),lastLab=null;
    sm.textContent=its.length?its.length+" مقطع مظلّل":"لا توجد تظليلات بعد. فعّل التظليل واسحب بإصبعك على النص.";
    its.forEach(function(i){
      var lb=label(i.x.u);
      if(lb!==lastLab){lastLab=lb;var g=document.createElement("div");g.className="hlg";g.textContent=lb||"قبل الفصول";L.appendChild(g)}
      var r=document.createElement("div");r.className="hli";
      r.innerHTML='<span class="dt"></span><div class="tx"><b></b><small>'+(i.x.m==="ul"?"تسطير":"تظليل")+'</small></div><button class="ib" aria-label="حذف">'+sv(IC.trash)+'</button>';
      r.querySelector(".dt").style.background=i.x.c;r.querySelector("b").textContent=i.t.length>140?i.t.slice(0,140)+"…":i.t;
      r.onclick=function(){jump(i.u.querySelector("mark.hl")||i.u)};
      r.querySelector("button").onclick=function(ev){ev.stopPropagation();snap("txt");h.txt=h.txt.filter(function(y){return y!==i.x});window.hlApply();save();fillList()};
      L.appendChild(r);
    });
  }else{
    var ks=Object.keys(h.ink).map(Number).sort(function(a,c){return a-c}),tot=0;
    ks.forEach(function(k){tot+=h.ink[k].length});
    sm.textContent=ks.length?tot+" علامة في "+ks.length+" صفحة":"لا توجد علامات بعد. فعّل القلم وارسم على الصفحة.";
    var lastLab2=null;
    ks.forEach(function(k){
      var lb=label(k);
      if(lb!==lastLab2){lastLab2=lb;var g=document.createElement("div");g.className="hlg";g.textContent=lb||"قبل الفصول";L.appendChild(g)}
      var cols=[];h.ink[k].forEach(function(s){if(cols.indexOf(s.c)<0)cols.push(s.c)});
      var r=document.createElement("div");r.className="hli";
      r.innerHTML='<span class="dt"></span><div class="tx"><b>صفحة '+(k+1)+'</b><small>'+h.ink[k].length+' علامة</small></div><button class="ib" aria-label="مسح الصفحة">'+sv(IC.trash)+'</button>';
      r.querySelector(".dt").style.background=cols.length>1?"conic-gradient("+cols.map(function(c,i){return c+" "+(i*100/cols.length)+"% "+((i+1)*100/cols.length)+"%"}).join(",")+")":cols[0];
      r.onclick=function(){jump(pgEl(k))};
      r.querySelector("button").onclick=function(ev){ev.stopPropagation();snap("ink",k);delete h.ink[k];var d=pgEl(k);if(d)window.inkRedraw(d);save();fillList()};
      L.appendChild(r);
    });
  }
}
document.getElementById("hlcopy").onclick=function(){
  var b=Bk(),h=H();if(!b||!h)return;
  var out=[];
  if(b.type==="text"){
    var lastLab=null;
    textItems().forEach(function(i){var lb=label(i.x.u);if(lb!==lastLab){lastLab=lb;out.push("");out.push(lb||"قبل الفصول")}out.push("• "+i.t)});
  }else{
    Object.keys(h.ink).map(Number).sort(function(a,c){return a-c}).forEach(function(k){
      var ls2=pdfLines(k);if(ls2.length){out.push("");out.push("صفحة "+(k+1)+":");ls2.forEach(function(t){out.push("• "+t)})}
    });
  }
  var t=out.join("\n").trim();
  if(!t){this.textContent="لا يوجد نص لنسخه";var s=this;setTimeout(function(){s.textContent="نسخ المقتطفات"},1600);return}
  copyText((b.name||"")+"\n"+t,this);
};
var clr=document.getElementById("hlclr");
clr.onclick=function(){
  var h=H();if(!h)return;
  if(!clr.dataset.c){clr.dataset.c=1;clr.textContent="تأكيد المسح؟";setTimeout(function(){clr.dataset.c="";clr.textContent="مسح الكل"},3000);return}
  clr.dataset.c="";clr.textContent="مسح الكل";
  if(Bk().type==="text"){snap("txt");h.txt=[];window.hlApply()}
  else{Object.keys(h.ink).forEach(function(k){snap("ink",+k);delete h.ink[k];var d=pgEl(+k);if(d)window.inkRedraw(d)})}
  save();fillList();
};
window.__inkPure={eraseStrokes:eraseStrokes,wStart:wStart,wEnd:wEnd};
sync();
})();
