(function(){
var W_B=/^\s*(كتاب|المبحث|المطلب|الدرس|المجلس|الحلقة|الجزء|القسم|المسألة|مسألة|الخطبة|الموضوع|سورة|السورة|فائدة|باب|فصل|lesson|part|section|book)(\s+|:|-|$)/i;
var PLAIN2=/^\s*(المقدمة|مقدمة|تمهيد|الإهداء|إهداء|تقديم|preface|foreword|introduction|dedication|acknowledg(e)?ments)\s*[:\-]?\s*$/i;
var LABEL={outline:"من فهرس الكتاب المدمج",A:"من عناوين الفصول",B:"من عناوين موسّعة (كتاب، مبحث، درس…)",C:"من شكل العناوين",Aloose:"من أوائل الصفحات",fallback:"تقسيم متساوٍ (لم تُوجد عناوين)"};
var B=null,mark=false;


/* ---------- headings ---------- */
function pdfHead(x,body,tier){
  var ls=x.lines;
  for(var i=0;i<ls.length;i++){
    var l=ls[i],t=l.t,pk;
    if(tier==="Aloose"){if(i>2)break;pk=kindOf(t);if(pk)return{k:pk,t:t};continue}
    if(!body||l.sz<body*(tier==="C"?1.25:1.15))continue;
    pk=kindOf(t);
    if(pk==="plain"||PLAIN2.test(t))return{k:"plain",t:t};
    if(tier==="A"){if(pk==="ch")return{k:"ch",t:t}}
    else if(tier==="B"){if(pk==="ch"||(W_B.test(t)&&!EXC.test(t)&&t.length<60&&!/\.{3,}/.test(t)))return{k:"ch",t:t}}
    else if(tier==="C"){if(t.length>=2&&t.length<70&&!/\.{3,}|…/.test(t)&&!/^[\d٠-٩\s\-–.]+$/.test(t))return{k:"ch",t:t}}
  }
  return null;
}
function textHead(u,tier){
  var t=u.t;if(!t||t.length>=70||/\.{3,}|…/.test(t))return null;
  var pk=kindOf(t);
  if(pk==="plain"||PLAIN2.test(t))return{k:"plain",t:t};
  if(tier==="A")return pk==="ch"?{k:"ch",t:t}:null;
  if(tier==="B")return(pk==="ch"||(W_B.test(t)&&!EXC.test(t)&&t.length<60))?{k:"ch",t:t}:null;
  var n=u.it.node,bold=n.children&&n.children.length===1&&/^(STRONG|B)$/.test(n.firstElementChild.tagName)&&n.firstElementChild.textContent.trim()===t;
  if(/^H[1-4]$/.test(n.tagName)||bold)return t.length>=2?{k:"ch",t:t}:null;
  if(u.it.txt&&t.length<60&&/^\s*([0-9٠-٩]{1,3})\s*[\.\-\)–:]\s*\S/.test(t))return{k:"ch",t:t};
  return null;
}

/* ---------- sectioning ---------- */
function assemble(n,H){
  var out=[],cur=null;
  for(var k=0;k<n;k++){
    var h=H[k],kk=h&&h.k;
    if(!cur||kk==="ch"||(kk==="plain"&&cur.colored)){cur={s:k,colored:kk==="ch",title:kk==="ch"?h.t:""};out.push(cur)}
  }
  return out;
}
function mergePlain(bs){
  var out=[];
  bs.forEach(function(b){var l=out[out.length-1];if(!(l&&!l.colored&&!b.colored))out.push(b)});
  return out;
}
function trimToc(bs){
  bs.forEach(function(b,i){
    if(!b.colored||i===bs.length-1)return;
    var e=bs[i+1].s,n=0;for(var k=b.s;k<e;k++)n+=B.lens[k];
    if(n<250)b.colored=false;
  });
  return mergePlain(bs);
}
function headsFor(tier){
  var H=new Array(B.n),k;
  if(tier==="outline"){
    B.outline.forEach(function(o){if(o.page<B.n&&!H[o.page])H[o.page]={k:(kindOf(o.title)==="plain"||PLAIN2.test(o.title))?"plain":"ch",t:o.title}});
    return H;
  }
  for(k=0;k<B.n;k++)H[k]=B.type==="pdf"?pdfHead(B.list[k].x,B.body,tier):textHead(B.units[k],tier);
  return H;
}
function tierResult(tier){
  var bs=assemble(B.n,headsFor(tier));
  if(B.type==="text")bs=trimToc(bs);
  bs=mergePlain(bs);
  var c=bs.filter(function(b){return b.colored}).length;
  if(c<(tier==="outline"?3:2))return null;
  if(B.totalWt/c<(B.type==="pdf"?1.5:0.6))return null;
  return bs;
}
function byWeight(N,label){
  var out=[],cum=0,last=-1;
  if(!(N>0))N=1;
  for(var k=0;k<B.n;k++){
    var idx=Math.floor(cum/N+1e-9);
    if(idx!==last){out.push({s:k,colored:true,title:label+" "+(out.length+1)});last=idx}
    cum+=B.wt[k];
  }
  return out;
}
function withMarks(bs){
  var map={};bs.forEach(function(b){map[b.s]=b});
  B.split.marks.forEach(function(m){if(m>0&&m<B.n&&!(map[m]&&map[m].colored))map[m]={s:m,colored:true,title:"قسم"}});
  var out=Object.keys(map).map(Number).sort(function(a,b){return a-b}).map(function(k){return map[k]});
  if(!out.length||out[0].s!==0)out.unshift({s:0,colored:true,title:"البداية"});
  return out;
}
function compute(){
  var sp=B.split,res=null,how="";
  if(sp.mode==="auto"){
    var tiers=B.type==="pdf"?["outline","A","B","C","Aloose"]:["A","B","C"];
    for(var i=0;i<tiers.length&&!res;i++){res=tierResult(tiers[i]);if(res)how=LABEL[tiers[i]]}
    if(!res){res=byWeight(Math.min(10,Math.max(1,B.totalWt/6)),"الجزء");how=LABEL.fallback}
  }else if(sp.mode==="pages"){res=byWeight(sp.pn,"الجزء");how="كل "+sp.pn+" صفحة"}
  else if(sp.mode==="days"){res=byWeight(B.totalWt/Math.max(1,sp.dn),"اليوم");how="خطة "+sp.dn+" يوماً"}
  else{res=[{s:0,colored:true,title:"البداية"}];how="يدوي"}
  B.how=how;
  return withMarks(res);
}

/* ---------- rendering ---------- */
function anchor(){
  var us=document.querySelectorAll("#book [data-u]");
  for(var i=0;i<us.length;i++){if(us[i].getBoundingClientRect().bottom>150)return us[i].getAttribute("data-u")}
  return null;
}
function ptNodes(x){
  if(!x.nodes)x.nodes=x.out.map(function(t){var p=document.createElement("p");p.textContent=t;p.dir="auto";return p});
  return x.nodes;
}
function render(){
  var book=el("book"),chips=el("chips"),n=B.n;
  book.innerHTML="";chips.innerHTML="";window.lastAct=-1;
  if(B.io)B.io.disconnect();
  if(B.type==="pdf")B.io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!e.target.done){e.target.done=1;window.paintPage(e.target)}})},{rootMargin:"800px"});
  var ci=0;
  B.bounds.forEach(function(b,i){
    var e=i+1<B.bounds.length?B.bounds[i+1].s:n,s=document.createElement("section"),h=0,k;
    if(b.colored){h=hueOf(ci);s.className="ch";s.id="c"+ci;s.style.setProperty("--h",h)}else s.className="pre";
    if(B.type==="text"){
      var inner=document.createElement("div");inner.className="in";
      for(k=b.s;k<e;k++)inner.appendChild(B.units[k].it.node);
      s.appendChild(inner);
    }else{
      var pt=document.createElement("div"),shown=false;pt.className="in pt";
      for(k=b.s;k<e;k++){
        var it=B.list[k],v=it.p.getViewport({scale:1}),d=document.createElement("div");
        d.className="pg";d.p=it.p;d.setAttribute("data-u",k);d.style.aspectRatio=v.width+"/"+v.height;
        s.appendChild(d);B.io.observe(d);
        ptNodes(it.x).forEach(function(p){pt.appendChild(p);if(p.dataset.tr)shown=true});
      }
      if(shown)pt.className+=" show";
      s.appendChild(pt);
    }
    book.appendChild(s);
    if(b.colored){
      var c=document.createElement("button");c.className="chip";c.style.setProperty("--h",h);
      c.textContent=(ci+1)+". "+(b.title.length>22?b.title.slice(0,22)+"…":b.title);
      c.onclick=function(){s.scrollIntoView({behavior:"smooth"})};
      chips.appendChild(c);ci++;
    }
  });
  B.split.marks.forEach(function(m){var x=document.querySelector('#book [data-u="'+m+'"]');if(x)x.classList.add("mk")});
  B.colored=ci;
}
function recompute(keep){
  var a=keep?anchor():null;
  B.bounds=compute();render();status();
  if(a!==null){var x=document.querySelector('#book [data-u="'+a+'"]');if(x)window.scrollTo(0,Math.max(0,x.getBoundingClientRect().top+scrollY-150))}
  if(keep&&window.saveNow)window.saveNow();
  track();
}

/* ---------- loading ---------- */
function build(spec,ps){
  var b={type:spec.type,name:spec.name,outline:spec.outline||[],body:spec.body||0,
    split:{mode:"auto",pn:10,dn:30,marks:[]}};
  if(ps&&ps.mode){b.split.mode=ps.mode;b.split.pn=ps.pn||10;b.split.dn=ps.dn||30;b.split.marks=(ps.marks||[]).slice()}
  if(spec.type==="text"){
    b.items=spec.items;
    b.units=spec.items.map(function(it,k){var t=(it.node.textContent||"").trim();it.node.setAttribute("data-u",k);return{t:t,it:it}});
    b.lens=b.units.map(function(u){return u.t.length});
    b.wt=b.lens.map(function(l){return l/2500});
  }else{
    b.list=spec.list;
    b.lens=b.list.map(function(l){return l.x.out.join("").length});
    b.wt=b.list.map(function(){return 1});
  }
  b.n=b.lens.length;
  b.totalWt=b.wt.reduce(function(a,c){return a+c},0)||1;
  return b;
}
window.loadBook=function(spec){
  (window.splitReady||Promise.resolve()).then(function(){
    var ps=window.__pendingSplit;window.__pendingSplit=null;
    B=window.BOOK=build(spec,ps);
    B.bounds=compute();render();status();
    el("title").textContent=spec.name;showView("reader");track();
    syncPanel();
  });
};
window.__SplitTest=function(b){B=b;return compute()};

/* ---------- panel ---------- */
var ICON={
  auto:'<svg viewBox="0 0 24 24"><path d="M11 3l1.800 4.700L17.500 9.500l-4.700 1.800L11 16l-1.800-4.700L4.500 9.500l4.700-1.800z"/><path d="M18 14l.8 2.200L21 17l-2.200.8L18 20l-.8-2.200L15 17l2.200-.8z"/></svg>',
  pages:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.500"/><path d="M9 8h6M9 12h6M9 16h3.500"/></svg>',
  days:'<svg viewBox="0 0 24 24"><rect x="3.500" y="5" width="17" height="15" rx="3.500"/><path d="M8 3v4M16 3v4M3.500 10h17"/></svg>',
  manual:'<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.300-6-10a6 6 0 0 1 12 0c0 4.700-6 10-6 10z"/><circle cx="12" cy="11" r="2.200"/></svg>'
};
var P=document.createElement("div");P.id="sp";P.className="sheet";
P.setAttribute("role","dialog");P.setAttribute("aria-label","تقسيم الكتاب");
P.innerHTML='<div class="grip"></div><div class="sh-head"><h3>تقسيم الكتاب</h3><button class="ib" id="sx" aria-label="إغلاق"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
'<div class="seg4" id="sm">'+[["auto","تلقائي"],["pages","بالصفحات"],["days","بالأيام"],["manual","يدوي"]].map(function(m){return '<button data-m="'+m[0]+'">'+ICON[m[0]]+'<span>'+m[1]+'</span></button>'}).join("")+'</div>'+
'<div class="stp" id="sn"><span class="lb" id="sl"></span><button class="ib" id="smn" aria-label="أقل">−</button><b id="sv">10</b><button class="ib" id="spl" aria-label="أكثر">+</button></div>'+
'<div class="pre-chips" id="sq"></div>'+
'<div class="rowcard"><div class="tx"><b>تعليم الأقسام بيدك</b><small>اضغط الفقرة أو الصفحة التي يبدأ منها قسم جديد</small></div><button id="sk">ابدأ</button></div>'+
'<div class="pv" id="spv"></div><div class="sum" id="ss"></div>'+
'<div class="foot"><button id="sc">مسح العلامات</button></div>';
document.body.appendChild(P);
var BD=document.createElement("div");BD.id="bd";document.body.appendChild(BD);
var MK=document.createElement("div");MK.id="mkbar";
MK.style.cssText="position:fixed;inset:auto 12px calc(12px + env(safe-area-inset-bottom,0px)) 12px;z-index:21;background:var(--ink);color:var(--paper);padding:12px 14px;display:none;align-items:center;gap:10px";
MK.innerHTML='<span style="flex:1;font-size:14px;line-height:1.6">وضع التعليم: اضغط الفقرة (أو الصفحة) التي يبدأ منها قسم جديد، واضغطها ثانية لإزالة العلامة.</span><button id="mke">تم</button>';
document.body.appendChild(MK);
function tpEl(){return document.getElementById("tp")}
function syncBd(){var t=tpEl();BD.classList.toggle("on",!!(P.classList.contains("on")||(t&&t.classList.contains("on"))))}
if(typeof MutationObserver!=="undefined"){
  var mo=new MutationObserver(syncBd);
  mo.observe(P,{attributes:true,attributeFilter:["class"]});
  if(tpEl())mo.observe(tpEl(),{attributes:true,attributeFilter:["class"]});
}
BD.onclick=function(){window.closeAllPanels()};

function status(){
  if(!B)return;
  var pv=el("spv");pv.innerHTML="";
  var ci=0,tot=B.totalWt;
  B.bounds.forEach(function(b,i){
    var e=i+1<B.bounds.length?B.bounds[i+1].s:B.n,w=0,k;
    for(k=b.s;k<e;k++)w+=B.wt[k];
    var d=document.createElement("i");
    d.style.flex=Math.max(w,tot*0.004)+" 1 0";
    d.style.background=b.colored?"hsl("+hueOf(ci++)+" 70% 52%)":"var(--line)";
    pv.appendChild(d);
  });
  el("ss").textContent=B.colored+" قسماً ملوّناً · "+B.how+(B.split.marks.length?" · "+B.split.marks.length+" علامة يدوية":"");
}
var PRE={pages:[5,10,20,30],days:[7,15,30,60,90]};
function syncPanel(){
  var m=B.split.mode;
  document.querySelectorAll("#sm button").forEach(function(b){b.classList.toggle("on",b.dataset.m===m)});
  var on=m==="pages"||m==="days";
  el("sn").classList.toggle("on",on);
  var q=el("sq");q.innerHTML="";
  if(on){
    var key=m==="pages"?"pn":"dn",val=B.split[key];
    el("sl").textContent=m==="pages"?"عدد الصفحات في كل قسم":"أنهي الكتاب في (يوم)";
    el("sv").textContent=val;
    PRE[m].forEach(function(n){
      var b=document.createElement("button");b.textContent=n;if(n===val)b.className="on";
      b.onclick=function(){B.split[key]=n;syncPanel();recompute(true)};q.appendChild(b);
    });
  }
}
function setMark(on){
  mark=on;document.body.classList.toggle("mkon",on);MK.style.display=on?"flex":"none";
  if(on)P.classList.remove("on");
}
document.querySelectorAll("#sm button").forEach(function(b){b.onclick=function(){B.split.mode=b.dataset.m;syncPanel();recompute(true)}});
var tmr2=null;
function bump(d){
  var m=B.split.mode;if(m!=="pages"&&m!=="days")return;
  var k=m==="pages"?"pn":"dn",max=m==="pages"?200:365;
  B.split[k]=Math.max(1,Math.min(max,B.split[k]+d));
  syncPanel();clearTimeout(tmr2);tmr2=setTimeout(function(){recompute(true)},250);
}
el("smn").onclick=function(){bump(-1)};
el("spl").onclick=function(){bump(1)};
el("sk").onclick=function(){setMark(true)};
el("mke").onclick=function(){setMark(false);P.classList.add("on")};
el("sc").onclick=function(){B.split.marks=[];recompute(true)};
el("sx").onclick=function(){P.classList.remove("on")};
document.addEventListener("click",function(e){
  if(!mark||!B)return;
  var t=e.target.closest&&e.target.closest("[data-u]");
  if(!t||!el("book").contains(t))return;
  e.preventDefault();e.stopPropagation();
  var u=+t.getAttribute("data-u"),m=B.split.marks,i=m.indexOf(u);
  if(i>=0)m.splice(i,1);else if(u>0)m.push(u);
  recompute(true);
},true);
var btn=document.createElement("button");btn.className="ib";btn.setAttribute("aria-label","تقسيم الكتاب");
btn.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="4" rx="2"/><rect x="3" y="10" width="12" height="4" rx="2"/><rect x="3" y="16" width="15" height="4" rx="2"/></svg>';
btn.onclick=function(){if(B){syncPanel();status();P.classList.toggle("on")}};
document.querySelector(".row").appendChild(btn);
window.closeAllPanels=function(){
  P.classList.remove("on");var t=tpEl();if(t)t.classList.remove("on");setMark(false);
};
window.closeSplit=function(){
  var t=tpEl();
  if(mark){setMark(false);return true}
  if(P.classList.contains("on")||(t&&t.classList.contains("on"))){window.closeAllPanels();return true}
  return false;
};
})();
