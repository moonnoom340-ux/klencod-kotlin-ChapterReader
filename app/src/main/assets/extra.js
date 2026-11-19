(function(){
var LS=null;try{LS=window.localStorage}catch(e){}
var URL_="https://api.anthropic.com/v1/messages",MODEL="claude-sonnet-5-5";
var LANGS=[["العربية","Arabic"],["English","English"],["فارسی","Persian"],["Türkçe","Turkish"],["Français","French"],["اردو","Urdu"]];
var css=document.createElement("style");
css.textContent=".pg{position:relative;background:#fff;margin:0 auto 14px;max-width:46rem;box-shadow:0 1px 6px #0003}.pg canvas{display:block;width:100%}.pg::after{content:'';position:absolute;inset:0;pointer-events:none;background:hsl(var(--h) 85% 60%);mix-blend-mode:multiply;opacity:.28}.pt{display:none;margin-top:18px}.pt.show{display:block}"+
"#tp{position:fixed;inset:auto 0 0 0;z-index:20;background:var(--paper);color:var(--ink);border-top:1px solid var(--line);padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px));display:none}#tp.on{display:block}#tp .g{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#tp select,#tp input{font:inherit;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink);flex:1;min-width:0}#ts{margin-top:10px;color:var(--muted);min-height:1.5em;line-height:1.6}";
document.head.appendChild(css);

/* ---------- PDF ---------- */
function paras(tc){
  var lines=[],last=null;
  tc.items.forEach(function(it){
    if(!it.str)return;
    var y=it.transform[5];
    if(last&&Math.abs(last.y-y)<3)last.t+=it.str;else{last={y:y,t:it.str};lines.push(last)}
  });
  var gaps=[];for(var i=1;i<lines.length;i++){var g=Math.abs(lines[i-1].y-lines[i].y);if(g>2)gaps.push(g)}
  var min=gaps.length?Math.min.apply(null,gaps):0,out=[],cur="";
  lines.forEach(function(l,i){
    var t=l.t.trim();if(!t)return;
    if(i>0&&cur&&Math.abs(lines[i-1].y-l.y)>min*1.5){out.push(cur);cur=""}
    cur+=(cur?" ":"")+t;
  });
  if(cur)out.push(cur);
  return{lines:lines.map(function(l){return l.t.trim()}).filter(Boolean),out:out};
}
window.openPdf=function(f,name){
  if(!window.pdfjsLib){el("err").textContent="ملفات مكتبة PDF غير موجودة في مجلد assets.";return}
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  el("err").textContent="جارٍ قراءة الملف…";
  f.arrayBuffer().then(function(b){return pdfjsLib.getDocument({data:b}).promise}).then(function(doc){
    var jobs=[];
    for(var i=1;i<=doc.numPages;i++)jobs.push(doc.getPage(i).then(function(p){return p.getTextContent().then(function(tc){return{p:p,x:paras(tc)}})}));
    return Promise.all(jobs);
  }).then(function(list){el("err").textContent="";buildPdf(list,name)})
  .catch(function(){el("err").textContent="تعذّر قراءة ملف PDF هذا."});
};
function paint(d){
  var p=d.p,v0=p.getViewport({scale:1}),w=Math.min(d.clientWidth||600,900),
  v=p.getViewport({scale:w/v0.width*(window.devicePixelRatio||1)}),c=document.createElement("canvas");
  c.width=v.width;c.height=v.height;d.insertBefore(c,d.firstChild);
  p.render({canvasContext:c.getContext("2d"),viewport:v});
}
function buildPdf(list,name){
  var chs=[],cur=null;
  list.forEach(function(it){
    var t=it.x.lines.slice(0,3).filter(isTitle)[0];
    if(t||!cur){cur={title:t||"البداية",pages:[],paras:[]};chs.push(cur)}
    cur.pages.push(it.p);cur.paras=cur.paras.concat(it.x.out);
  });
  if(chs.length>1&&chs[0].title==="البداية"&&chs[0].pages.length<2){var f=chs.shift();chs[0].pages=f.pages.concat(chs[0].pages);chs[0].paras=f.paras.concat(chs[0].paras)}
  var book=el("book"),chips=el("chips");book.innerHTML="";chips.innerHTML="";
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&!e.target.done){e.target.done=1;paint(e.target)}})},{rootMargin:"800px"});
  chs.forEach(function(c,i){
    var h=HUES[i%HUES.length],s=document.createElement("section");
    s.className="ch";s.id="c"+i;s.style.setProperty("--h",h);
    c.pages.forEach(function(p){
      var v=p.getViewport({scale:1}),d=document.createElement("div");
      d.className="pg";d.p=p;d.style.aspectRatio=v.width+"/"+v.height;s.appendChild(d);io.observe(d);
    });
    var pt=document.createElement("div");pt.className="in pt";
    c.paras.forEach(function(t){var p=document.createElement("p");p.textContent=t;p.dir="auto";pt.appendChild(p)});
    s.appendChild(pt);book.appendChild(s);
    var b=document.createElement("button");b.className="chip";b.style.setProperty("--h",h);
    b.textContent=(i+1)+". "+(c.title.length>22?c.title.slice(0,22)+"…":c.title);
    b.onclick=function(){s.scrollIntoView({behavior:"smooth"})};chips.appendChild(b);
  });
  el("title").textContent=name;el("start").style.display="none";el("reader").style.display="block";
  window.scrollTo(0,0);track();
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
    var secs=Array.prototype.slice.call(document.querySelectorAll(".ch"));
    var list=all?secs:[secs[activeIdx()]];
    try{
      for(var i=0;i<list.length;i++){
        await trSec(list[i],lang,key,function(t){say((all?"الفصل "+(secs.indexOf(list[i])+1)+" من "+secs.length+": ":"")+t)});
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
