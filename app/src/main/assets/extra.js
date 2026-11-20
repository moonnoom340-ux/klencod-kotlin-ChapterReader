(function(){
var LS=null;try{LS=window.localStorage}catch(e){}
var URL_="https://api.anthropic.com/v1/messages",MODEL="claude-sonnet-5-5";
var LANGS=[["العربية","Arabic"],["English","English"],["فارسی","Persian"],["Türkçe","Turkish"],["Français","French"],["اردو","Urdu"]];
var css=document.createElement("style");
css.textContent=".pg{position:relative;background:#fff;margin:0 auto 14px;max-width:46rem;box-shadow:0 1px 6px #0003}.pg canvas{display:block;width:100%}.pg::after{content:'';position:absolute;inset:0;pointer-events:none;background:hsl(var(--h) 85% 60%);mix-blend-mode:multiply;opacity:.28}.pre .pg::after{display:none}.pt{display:none;margin-top:18px}.pt.show{display:block}"+
"#tp{position:fixed;inset:auto 0 0 0;z-index:20;background:var(--paper);color:var(--ink);border-top:1px solid var(--line);padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px));display:none}#tp.on{display:block}#tp .g{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#tp select,#tp input{font:inherit;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink);flex:1;min-width:0}#ts{margin-top:10px;color:var(--muted);min-height:1.5em;line-height:1.6}";
document.head.appendChild(css);

/* ---------- PDF ---------- */
function paras(tc){
  var L=[];
  tc.items.forEach(function(it){
    if(!it.str)return;
    var y=it.transform[5],x=it.transform[4],sz=Math.abs(it.transform[3])||it.height||0,l=null;
    for(var j=L.length-1;j>=0&&j>L.length-8;j--){if(Math.abs(L[j].y-y)<3){l=L[j];break}}
    if(!l){l={y:y,sz:0,its:[]};L.push(l)}
    l.its.push({x:x,s:it.str});if(sz>l.sz)l.sz=sz;
  });
  L.sort(function(a,b){return b.y-a.y});
  var lines=[];
  L.forEach(function(l){
    var raw=l.its.map(function(i){return i.s}).join(""),ar=/[\u0600-\u06FF]/.test(raw);
    l.its.sort(function(a,b){return ar?b.x-a.x:a.x-b.x});
    var t=l.its.map(function(i){return i.s}).join("").replace(/\s+/g," ").trim();
    if(t)lines.push({t:t,sz:l.sz,y:l.y});
  });
  var gaps=[];for(var i=1;i<lines.length;i++){var g=lines[i-1].y-lines[i].y;if(g>2)gaps.push(g)}
  var min=gaps.length?Math.min.apply(null,gaps):0,out=[],cur="";
  lines.forEach(function(l,i){
    if(i>0&&cur&&lines[i-1].y-l.y>min*1.5){out.push(cur);cur=""}
    cur+=(cur?" ":"")+l.t;
  });
  if(cur)out.push(cur);
  return{lines:lines,out:out};
}
function bodySize(list){
  var m={},best=0,bv=0;
  list.forEach(function(it){it.x.lines.forEach(function(l){var k=Math.round(l.sz*2)/2;m[k]=(m[k]||0)+l.t.length})});
  Object.keys(m).forEach(function(k){if(m[k]>bv){bv=m[k];best=+k}});
  return best;
}
function head(x,body,strict){
  var ls=x.lines;
  for(var i=0;i<ls.length;i++){
    if(strict){if(ls[i].sz<body*1.15)continue}else if(i>2)break;
    var k=kindOf(ls[i].t);if(k)return{k:k,t:ls[i].t};
  }
  return null;
}
window.openPdf=function(f,name){
  if(!window.pdfjsLib){el("err").textContent="ملفات مكتبة PDF غير موجودة في مجلد assets.";return}
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  el("err").textContent="جارٍ قراءة الملف…";
  f.arrayBuffer().then(function(b){return pdfjsLib.getDocument({data:b,disableFontFace:true,cMapUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",cMapPacked:true,standardFontDataUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/"}).promise}).then(function(doc){
    var jobs=[];
    for(var i=1;i<=doc.numPages;i++)jobs.push(doc.getPage(i).then(function(p){return p.getTextContent().then(function(tc){return{p:p,x:paras(tc)}})}));
    return Promise.all(jobs).then(function(list){return outlineOf(doc).then(function(o){return{list:list,outline:o}})});
  }).then(function(r){el("err").textContent="";loadBook({type:"pdf",list:r.list,outline:r.outline,body:bodySize(r.list),name:name})})
  .catch(function(){el("err").textContent="تعذّر قراءة ملف PDF هذا."});
};
function paint(d){
  var p=d.p,v0=p.getViewport({scale:1}),w=Math.min(d.clientWidth||600,900),
  v=p.getViewport({scale:Math.min(w/v0.width*(window.devicePixelRatio||1),2000/v0.width)}),c=document.createElement("canvas");
  c.width=v.width;c.height=v.height;d.insertBefore(c,d.firstChild);
  p.render({canvasContext:c.getContext("2d"),viewport:v});
}
window.paintPage=paint;
async function outlineOf(doc){
  try{
    var o=await doc.getOutline();if(!o||!o.length)return[];
    var flat=[];
    async function pageOf(it){
      var d=it.dest;if(!d)return -1;
      if(typeof d==="string")d=await doc.getDestination(d);
      if(!d)return -1;
      var r=d[0];
      return typeof r==="object"?await doc.getPageIndex(r):(typeof r==="number"?r:-1);
    }
    async function walk(arr,depth){
      for(var i=0;i<arr.length;i++){
        var it=arr[i],pg=-1;
        try{pg=await pageOf(it)}catch(x){}
        if(pg>=0)flat.push({page:pg,title:(it.title||"").trim(),depth:depth});
        if(depth<1&&it.items&&it.items.length)await walk(it.items,depth+1);
      }
    }
    await walk(o,0);
    function uniq(a){var seen={},out=[];a.slice().sort(function(x,y){return x.page-y.page}).forEach(function(e){if(!seen[e.page]){seen[e.page]=1;out.push(e)}});return out}
    var all=uniq(flat),top=uniq(flat.filter(function(e){return e.depth===0}));
    return all.length<=doc.numPages/3?all:top;
  }catch(e){return[]}
}
function buildPdf(list,name){
  var body=bodySize(list),secs=[];
  function run(strict){
    secs=[];var cur=null;
    list.forEach(function(it){
      var h=head(it.x,body,strict),k=h&&h.k;
      if(!cur||k==="ch"||(k==="plain"&&cur.colored)){cur={colored:k==="ch",title:k==="ch"?h.t:"",pages:[],paras:[]};secs.push(cur)}
      cur.pages.push(it.p);cur.paras=cur.paras.concat(it.x.out);
    });
    return secs.some(function(s){return s.colored});
  }
  if(!run(true)&&!run(false)){
    secs=[{colored:true,title:"الكتاب",pages:list.map(function(i){return i.p}),paras:[].concat.apply([],list.map(function(i){return i.x.out}))}];
  }
  var book=el("book"),chips=el("chips");book.innerHTML="";chips.innerHTML="";window.lastAct=-1;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!e.target.done){e.target.done=1;paint(e.target)}})},{rootMargin:"800px"});
  var ci=0;
  secs.forEach(function(c){
    var s=document.createElement("section"),h=0;
    if(c.colored){h=hueOf(ci);s.className="ch";s.id="c"+ci;s.style.setProperty("--h",h)}else s.className="pre";
    c.pages.forEach(function(p){
      var v=p.getViewport({scale:1}),d=document.createElement("div");
      d.className="pg";d.p=p;d.style.aspectRatio=v.width+"/"+v.height;s.appendChild(d);io.observe(d);
    });
    var pt=document.createElement("div");pt.className="in pt";
    c.paras.forEach(function(t){var p=document.createElement("p");p.textContent=t;p.dir="auto";pt.appendChild(p)});
    s.appendChild(pt);book.appendChild(s);
    if(c.colored){
      var b=document.createElement("button");b.className="chip";b.style.setProperty("--h",h);
      b.textContent=(ci+1)+". "+(c.title.length>22?c.title.slice(0,22)+"…":c.title);
      b.onclick=function(){s.scrollIntoView({behavior:"smooth"})};chips.appendChild(b);ci++;
    }
  });
  el("title").textContent=name;showView("reader");track();
}

/* ---------- Translation ---------- */
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
async function call(arr,lang,key){
  var sys="You are a professional literary translator. Translate every string of the JSON array the user sends into "+lang+". Be faithful and precise: keep the meaning, tone, names, numbers and paragraph boundaries; never add, omit, summarize or explain anything. Reply with ONLY a JSON array of strings with exactly the same number of items in the same order.";
  for(var a=0;a<3;a++){
    try{
      var r=await fetch(URL_,{method:"POST",headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:MODEL,max_tokens:8000,system:sys,messages:[{role:"user",content:JSON.stringify(arr)}]})});
      if(!r.ok){
        if(r.status===401)throw new Error("FATAL:مفتاح API غير صحيح");
        if(r.status===429||r.status>=500){await sleep(2500*(a+1));continue}
        throw new Error("FATAL:خطأ من الخدمة ("+r.status+")");
      }
      var d=await r.json(),t=d.content.map(function(c){return c.text||""}).join("");
      var out=JSON.parse(t.slice(t.indexOf("["),t.lastIndexOf("]")+1));
      if(Array.isArray(out)&&out.length===arr.length)return out.map(String);
    }catch(err){if(String(err.message).indexOf("FATAL:")===0)throw err}
  }
  if(arr.length>1){var o=[];for(var k=0;k<arr.length;k++)o.push((await call([arr[k]],lang,key))[0]);return o}
  throw new Error("FATAL:فشلت ترجمة فقرة. تحقق من الاتصال وأعد المحاولة.");
}
function nodesOf(sec){
  var box=sec.querySelector(".in.pt")||sec.querySelector(".in");if(!box)return[];
  return Array.prototype.filter.call(box.querySelectorAll("p,h1,h2,h3,h4,li"),function(n){return n.textContent.trim()&&!n.querySelector("p,li")});
}
async function trSec(sec,lang,key,say){
  var nodes=nodesOf(sec),pt=sec.querySelector(".in.pt");if(pt)pt.classList.add("show");
  var i=0,done=0;
  while(i<nodes.length){
    var batch=[],len=0;
    while(i<nodes.length&&batch.length<15&&(len<3500||!batch.length)){
      var n=nodes[i++];if(n.dataset.tr)continue;batch.push(n);len+=n.textContent.length;
    }
    if(!batch.length)continue;
    var src=batch.map(function(n){return n.textContent}),res=await call(src,lang,key);
    batch.forEach(function(n,k){n.dataset.o=src[k];n.dataset.tr=res[k];n.textContent=res[k]});
    done+=batch.length;say(done+" / "+nodes.length);
  }
}
var showTr=true;
function activeIdx(){var c=document.querySelectorAll(".chip"),k=0;c.forEach(function(x,i){if(x.classList.contains("on"))k=i});return k}
function build(){
  var p=document.createElement("div");p.id="tp";
  p.innerHTML='<div class="g"><select id="tl"></select><input id="tk" type="password" placeholder="مفتاح Anthropic API" autocomplete="off"></div>'+
  '<div class="g"><button id="t1">ترجمة الفصل الحالي</button><button id="t2">ترجمة الكتاب كله</button><button id="t3">الأصل / الترجمة</button><button id="t4">إغلاق</button></div><div id="ts"></div>';
  document.body.appendChild(p);
  var sel=p.querySelector("#tl");
  LANGS.forEach(function(l,i){var o=document.createElement("option");o.value=l[1];o.textContent=l[0];sel.appendChild(o)});
  try{if(LS){sel.value=LS.getItem("tl")||"Arabic";p.querySelector("#tk").value=LS.getItem("tk")||""}}catch(e){}
  var busy=false,say=function(t){p.querySelector("#ts").textContent=t};
  async function run(all){
    var key=p.querySelector("#tk").value.trim(),lang=sel.value;
    if(!key){say("أدخل مفتاح API أولاً.");return}
    if(busy)return;busy=true;
    try{if(LS){LS.setItem("tl",lang);LS.setItem("tk",key)}}catch(e){}
    var secs=Array.prototype.slice.call(document.querySelectorAll(".ch")),every=Array.prototype.slice.call(document.querySelectorAll("#book>section"));
    var list=all?every:[secs[activeIdx()]];
    try{
      for(var i=0;i<list.length;i++){
        await trSec(list[i],lang,key,function(t){say((all?(list[i].classList.contains("pre")?"قسم غير ملوّن: ":"الفصل "+(secs.indexOf(list[i])+1)+" من "+secs.length+": "):"")+t)});
      }
      say("اكتملت الترجمة.");showTr=true;
    }catch(e){say(String(e.message).replace("FATAL:",""))}
    busy=false;
  }
  p.querySelector("#t1").onclick=function(){run(false)};
  p.querySelector("#t2").onclick=function(){run(true)};
  p.querySelector("#t3").onclick=function(){
    showTr=!showTr;
    document.querySelectorAll("[data-tr]").forEach(function(n){n.textContent=showTr?n.dataset.tr:n.dataset.o});
  };
  p.querySelector("#t4").onclick=function(){p.classList.remove("on")};
  var b=document.createElement("button");b.textContent="ترجمة";
  b.onclick=function(){p.classList.toggle("on")};
  document.querySelector(".row").insertBefore(b,el("again"));
}
build();
})();
